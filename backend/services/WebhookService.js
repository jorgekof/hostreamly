const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');
const axios = require('axios');

/**
 * WebhookService - Servicio para manejo automático de webhooks
 * 
 * Este servicio se encarga de:
 * - Disparar webhooks automáticamente cuando ocurren eventos
 * - Manejar reintentos automáticos
 * - Procesar webhooks en cola para mejor rendimiento
 * - Integración con eventos del sistema
 */
class WebhookService {
  constructor() {
    this.retryQueue = [];
    this.isProcessingRetries = false;
    
    // Iniciar procesamiento de reintentos cada 5 minutos
    setInterval(() => {
      this.processRetryQueue();
    }, 5 * 60 * 1000);
  }

  /**
   * Disparar webhooks para un evento específico
   * @param {string} userId - ID del usuario
   * @param {string} eventType - Tipo de evento
   * @param {object} eventData - Datos del evento
   * @param {object} options - Opciones adicionales
   */
  async triggerEvent(userId, eventType, eventData, options = {}) {
    try {
      // Obtener webhooks activos que escuchan este evento
      const webhooks = await sequelize.query(`
        SELECT id, name, url, events, secret, headers, retry_count, timeout_seconds
        FROM webhooks 
        WHERE user_id = ? AND is_active = true 
        AND JSON_CONTAINS(events, ?)
      `, {
        replacements: [userId, JSON.stringify(eventType)],
        type: sequelize.QueryTypes.SELECT
      });

      if (webhooks.length === 0) {
        logger.debug('No active webhooks found for event', {
          userId,
          eventType
        });
        return;
      }

      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: {
          ...eventData,
          user_id: userId
        },
        ...options.additionalData
      };

      // Procesar webhooks en paralelo
      const deliveryPromises = webhooks.map(webhook => 
        this.deliverWebhook(webhook, payload)
      );

      const results = await Promise.allSettled(deliveryPromises);
      
      // Log resultados
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info('Webhooks triggered', {
        userId,
        eventType,
        total: webhooks.length,
        successful,
        failed
      });

      return {
        triggered: webhooks.length,
        successful,
        failed
      };

    } catch (error) {
      logger.error('Failed to trigger webhooks', {
        userId,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Entregar webhook individual
   * @param {object} webhook - Configuración del webhook
   * @param {object} payload - Payload a enviar
   * @param {string} existingDeliveryId - ID de entrega existente (para reintentos)
   */
  async deliverWebhook(webhook, payload, existingDeliveryId = null) {
    const deliveryId = existingDeliveryId || crypto.randomUUID();
    const timestamp = new Date();
    const timeout = (webhook.timeout_seconds || 30) * 1000;

    try {
      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Hostreamly-Webhooks/1.0',
        'X-Webhook-Timestamp': timestamp.toISOString(),
        'X-Webhook-ID': deliveryId,
        'X-Webhook-Event': payload.event,
        ...JSON.parse(webhook.headers || '{}')
      };

      // Agregar firma HMAC si hay secret
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      // Realizar petición HTTP
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout,
        validateStatus: (status) => status < 500, // No lanzar error en 4xx
        maxRedirects: 3
      });

      const isSuccess = response.status >= 200 && response.status < 300;
      const deliveryData = {
        id: deliveryId,
        webhook_id: webhook.id,
        event_type: payload.event,
        status: isSuccess ? 'success' : 'failed',
        response_status: response.status,
        response_body: this.truncateResponse(response.data),
        attempt_count: existingDeliveryId ? 'attempt_count + 1' : 1,
        delivered_at: timestamp,
        payload: JSON.stringify(payload)
      };

      // Guardar resultado en base de datos
      await this.saveDeliveryResult(deliveryData, existingDeliveryId);

      // Actualizar último disparo del webhook
      await sequelize.query(`
        UPDATE webhooks SET last_triggered_at = ? WHERE id = ?
      `, {
        replacements: [timestamp, webhook.id]
      });

      logger.info('Webhook delivered', {
        webhookId: webhook.id,
        deliveryId,
        status: response.status,
        eventType: payload.event,
        success: isSuccess
      });

      return deliveryData;

    } catch (error) {
      const deliveryData = {
        id: deliveryId,
        webhook_id: webhook.id,
        event_type: payload.event,
        status: 'failed',
        response_status: error.response?.status || 0,
        response_body: this.truncateResponse(error.message),
        attempt_count: existingDeliveryId ? 'attempt_count + 1' : 1,
        delivered_at: timestamp,
        payload: JSON.stringify(payload)
      };

      await this.saveDeliveryResult(deliveryData, existingDeliveryId);

      // Agregar a cola de reintentos si es elegible
      if (this.shouldRetry(error, webhook)) {
        this.scheduleRetry(webhook, payload, deliveryId);
      }

      logger.error('Webhook delivery failed', {
        webhookId: webhook.id,
        deliveryId,
        error: error.message,
        eventType: payload.event
      });

      return deliveryData;
    }
  }

  /**
   * Guardar resultado de entrega en base de datos
   */
  async saveDeliveryResult(deliveryData, existingDeliveryId) {
    if (existingDeliveryId) {
      // Actualizar entrega existente
      await sequelize.query(`
        UPDATE webhook_deliveries SET
          status = ?, response_status = ?, response_body = ?,
          attempt_count = attempt_count + 1, delivered_at = ?
        WHERE id = ?
      `, {
        replacements: [
          deliveryData.status,
          deliveryData.response_status,
          deliveryData.response_body,
          deliveryData.delivered_at,
          deliveryData.id
        ]
      });
    } else {
      // Crear nueva entrega
      await sequelize.query(`
        INSERT INTO webhook_deliveries (
          id, webhook_id, event_type, status, response_status, response_body,
          attempt_count, delivered_at, created_at, payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, {
        replacements: [
          deliveryData.id,
          deliveryData.webhook_id,
          deliveryData.event_type,
          deliveryData.status,
          deliveryData.response_status,
          deliveryData.response_body,
          deliveryData.attempt_count,
          deliveryData.delivered_at,
          deliveryData.payload
        ]
      });
    }
  }

  /**
   * Determinar si se debe reintentar una entrega fallida
   */
  shouldRetry(error, webhook) {
    // No reintentar errores 4xx (errores del cliente)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Reintentar errores de red, timeouts y 5xx
    return true;
  }

  /**
   * Programar reintento de webhook
   */
  scheduleRetry(webhook, payload, deliveryId) {
    const retryItem = {
      webhook,
      payload,
      deliveryId,
      scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
      attempts: 1
    };

    this.retryQueue.push(retryItem);
  }

  /**
   * Procesar cola de reintentos
   */
  async processRetryQueue() {
    if (this.isProcessingRetries || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessingRetries = true;
    const now = new Date();
    
    try {
      const itemsToRetry = this.retryQueue.filter(item => 
        item.scheduledFor <= now && item.attempts < (item.webhook.retry_count || 3)
      );

      for (const item of itemsToRetry) {
        try {
          await this.deliverWebhook(item.webhook, item.payload, item.deliveryId);
          
          // Remover de la cola si fue exitoso
          const index = this.retryQueue.indexOf(item);
          if (index > -1) {
            this.retryQueue.splice(index, 1);
          }
        } catch (error) {
          // Incrementar intentos y reprogramar
          item.attempts++;
          item.scheduledFor = new Date(Date.now() + Math.pow(2, item.attempts) * 60 * 1000); // Backoff exponencial
          
          // Remover si se agotaron los intentos
          if (item.attempts >= (item.webhook.retry_count || 3)) {
            const index = this.retryQueue.indexOf(item);
            if (index > -1) {
              this.retryQueue.splice(index, 1);
            }
          }
        }
      }

      // Limpiar elementos vencidos
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      this.retryQueue = this.retryQueue.filter(item => 
        (now - item.scheduledFor) < maxAge
      );

    } finally {
      this.isProcessingRetries = false;
    }
  }

  /**
   * Truncar respuesta para almacenamiento
   */
  truncateResponse(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return str.length > 1000 ? str.substring(0, 1000) + '...' : str;
  }

  /**
   * Métodos de conveniencia para eventos comunes
   */
  async onVideoCreated(userId, videoData) {
    return this.triggerEvent(userId, 'video.created', {
      video_id: videoData.id,
      title: videoData.title,
      duration: videoData.duration,
      size: videoData.size,
      format: videoData.format
    });
  }

  async onVideoProcessed(userId, videoData) {
    return this.triggerEvent(userId, 'video.processed', {
      video_id: videoData.id,
      processing_time: videoData.processing_time,
      qualities: videoData.qualities,
      status: 'ready'
    });
  }

  async onVideoEncodingStarted(userId, videoData) {
    return this.triggerEvent(userId, 'video.encoding.started', {
      video_id: videoData.id,
      encoding_profile: videoData.encoding_profile || 'standard'
    });
  }

  async onVideoEncodingCompleted(userId, videoData) {
    return this.triggerEvent(userId, 'video.encoding.completed', {
      video_id: videoData.id,
      encoding_time: videoData.encoding_time,
      output_qualities: videoData.output_qualities
    });
  }

  async onVideoEncodingFailed(userId, videoData, error) {
    return this.triggerEvent(userId, 'video.encoding.failed', {
      video_id: videoData.id,
      error: error.message || 'Unknown encoding error'
    });
  }

  async onVideoUpdated(userId, videoData, changes) {
    return this.triggerEvent(userId, 'video.updated', {
      video_id: videoData.id,
      changes: changes
    });
  }

  async onVideoDeleted(userId, videoId) {
    return this.triggerEvent(userId, 'video.deleted', {
      video_id: videoId
    });
  }

  async onLivestreamStarted(userId, streamData) {
    return this.triggerEvent(userId, 'livestream.started', {
      stream_id: streamData.id,
      title: streamData.title,
      stream_key: streamData.stream_key
    });
  }

  async onLivestreamEnded(userId, streamData) {
    return this.triggerEvent(userId, 'livestream.ended', {
      stream_id: streamData.id,
      duration: streamData.duration,
      peak_viewers: streamData.peak_viewers
    });
  }

  async onAnalyticsMilestone(userId, milestoneData) {
    return this.triggerEvent(userId, 'analytics.milestone', {
      milestone_type: milestoneData.type,
      milestone_value: milestoneData.value,
      video_id: milestoneData.video_id
    });
  }

  async onStorageLimitReached(userId, storageData) {
    return this.triggerEvent(userId, 'storage.limit.reached', {
      current_usage: storageData.current_usage,
      limit: storageData.limit,
      percentage: storageData.percentage
    });
  }

  /**
   * Obtener estadísticas de webhooks
   */
  async getWebhookStats(userId, webhookId = null) {
    const whereClause = webhookId 
      ? 'w.user_id = ? AND w.id = ?'
      : 'w.user_id = ?';
    const replacements = webhookId 
      ? [userId, webhookId]
      : [userId];

    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT w.id) as total_webhooks,
        COUNT(wd.id) as total_deliveries,
        SUM(CASE WHEN wd.status = 'success' THEN 1 ELSE 0 END) as successful_deliveries,
        SUM(CASE WHEN wd.status = 'failed' THEN 1 ELSE 0 END) as failed_deliveries,
        SUM(CASE WHEN wd.status = 'pending' THEN 1 ELSE 0 END) as pending_deliveries,
        ROUND(
          (SUM(CASE WHEN wd.status = 'success' THEN 1 ELSE 0 END) * 100.0) / 
          NULLIF(COUNT(wd.id), 0), 2
        ) as success_rate
      FROM webhooks w
      LEFT JOIN webhook_deliveries wd ON w.id = wd.webhook_id
      WHERE ${whereClause}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return stats;
  }
}

module.exports = new WebhookService();