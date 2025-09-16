const webhookService = require('../services/WebhookService');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

/**
 * Webhook Handler Controller
 * 
 * Maneja webhooks entrantes de servicios externos (Bunny.net, etc.)
 * y dispara webhooks salientes a los usuarios
 */
class WebhookHandlerController {

  /**
   * Manejar webhook de Bunny Stream para procesamiento completado
   * @route POST /webhooks/bunny/stream
   */
  async handleBunnyStreamWebhook(req, res) {
    try {
      const { videoId, status, userId, processingTime, qualities, error } = req.body;
      
      if (!videoId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: videoId, userId'
        });
      }

      logger.info('Bunny Stream webhook received', {
        videoId,
        userId,
        status,
        processingTime
      });

      switch (status) {
        case 'processed':
        case 'ready':
          // Video procesado exitosamente
          try {
            await webhookService.onVideoEncodingCompleted(userId, {
              id: videoId,
              encoding_time: processingTime || 0,
              output_qualities: qualities || ['720p']
            });
            
            await webhookService.onVideoProcessed(userId, {
              id: videoId,
              processing_time: processingTime || 0,
              qualities: qualities || ['720p']
            });
          } catch (webhookError) {
            logger.warn('Failed to trigger video processing webhooks', {
              userId,
              videoId,
              error: webhookError.message
            });
          }
          break;

        case 'failed':
        case 'error':
          // Error en el procesamiento
          try {
            await webhookService.onVideoEncodingFailed(userId, {
              id: videoId
            }, new Error(error || 'Video processing failed'));
          } catch (webhookError) {
            logger.warn('Failed to trigger video encoding failed webhook', {
              userId,
              videoId,
              error: webhookError.message
            });
          }
          break;

        default:
          logger.warn('Unknown Bunny Stream webhook status', {
            videoId,
            userId,
            status
          });
      }

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      logger.error('Failed to process Bunny Stream webhook', {
        error: error.message,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook'
      });
    }
  }

  /**
   * Manejar eventos de analíticas para milestones
   * @route POST /webhooks/analytics/milestone
   */
  async handleAnalyticsMilestone(req, res) {
    try {
      const { userId, videoId, milestoneType, milestoneValue } = req.body;
      
      if (!userId || !videoId || !milestoneType || !milestoneValue) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Disparar webhook de milestone alcanzado
      try {
        await webhookService.onAnalyticsMilestone(userId, {
          type: milestoneType,
          value: milestoneValue,
          video_id: videoId
        });
      } catch (webhookError) {
        logger.warn('Failed to trigger analytics milestone webhook', {
          userId,
          videoId,
          milestoneType,
          milestoneValue,
          error: webhookError.message
        });
      }

      logger.info('Analytics milestone webhook processed', {
        userId,
        videoId,
        milestoneType,
        milestoneValue
      });

      res.json({
        success: true,
        message: 'Milestone webhook processed successfully'
      });

    } catch (error) {
      logger.error('Failed to process analytics milestone webhook', {
        error: error.message,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to process milestone webhook'
      });
    }
  }

  /**
   * Manejar eventos de límites de almacenamiento
   * @route POST /webhooks/storage/limit
   */
  async handleStorageLimit(req, res) {
    try {
      const { userId, currentUsage, limit, percentage } = req.body;
      
      if (!userId || currentUsage === undefined || !limit) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Solo disparar si se alcanzó el 80% o más
      if (percentage >= 80) {
        try {
          await webhookService.onStorageLimitReached(userId, {
            current_usage: currentUsage,
            limit: limit,
            percentage: percentage
          });
        } catch (webhookError) {
          logger.warn('Failed to trigger storage limit webhook', {
            userId,
            currentUsage,
            limit,
            percentage,
            error: webhookError.message
          });
        }
      }

      logger.info('Storage limit webhook processed', {
        userId,
        currentUsage,
        limit,
        percentage
      });

      res.json({
        success: true,
        message: 'Storage limit webhook processed successfully'
      });

    } catch (error) {
      logger.error('Failed to process storage limit webhook', {
        error: error.message,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to process storage limit webhook'
      });
    }
  }

  /**
   * Manejar eventos de livestream
   * @route POST /webhooks/livestream/:event
   */
  async handleLivestreamEvent(req, res) {
    try {
      const { event } = req.params;
      const { userId, streamId, title, duration, peakViewers, recordingId } = req.body;
      
      if (!userId || !streamId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, streamId'
        });
      }

      switch (event) {
        case 'started':
          try {
            await webhookService.onLivestreamStarted(userId, {
              id: streamId,
              title: title || 'Untitled Stream',
              stream_key: 'hidden'
            });
          } catch (webhookError) {
            logger.warn('Failed to trigger livestream started webhook', {
              userId,
              streamId,
              error: webhookError.message
            });
          }
          break;

        case 'ended':
          try {
            await webhookService.onLivestreamEnded(userId, {
              id: streamId,
              duration: duration || 0,
              peak_viewers: peakViewers || 0
            });
          } catch (webhookError) {
            logger.warn('Failed to trigger livestream ended webhook', {
              userId,
              streamId,
              error: webhookError.message
            });
          }
          break;

        case 'recorded':
          if (recordingId) {
            try {
              await webhookService.triggerEvent(userId, 'livestream.recorded', {
                stream_id: streamId,
                recording_id: recordingId,
                duration: duration || 0
              });
            } catch (webhookError) {
              logger.warn('Failed to trigger livestream recorded webhook', {
                userId,
                streamId,
                recordingId,
                error: webhookError.message
              });
            }
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: `Unknown livestream event: ${event}`
          });
      }

      logger.info('Livestream webhook processed', {
        userId,
        streamId,
        event
      });

      res.json({
        success: true,
        message: 'Livestream webhook processed successfully'
      });

    } catch (error) {
      logger.error('Failed to process livestream webhook', {
        error: error.message,
        event: req.params.event,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to process livestream webhook'
      });
    }
  }

  /**
   * Endpoint para testing de webhooks
   * @route POST /webhooks/test
   */
  async testWebhook(req, res) {
    try {
      const { userId, eventType, eventData } = req.body;
      
      if (!userId || !eventType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, eventType'
        });
      }

      // Disparar webhook de prueba
      const result = await webhookService.triggerEvent(userId, eventType, {
        ...eventData,
        test: true,
        timestamp: new Date().toISOString()
      });

      logger.info('Test webhook triggered', {
        userId,
        eventType,
        result
      });

      res.json({
        success: true,
        message: 'Test webhook triggered successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to trigger test webhook', {
        error: error.message,
        body: req.body
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to trigger test webhook'
      });
    }
  }

  /**
   * Obtener estadísticas de webhooks
   * @route GET /webhooks/stats/:userId
   */
  async getWebhookStats(req, res) {
    try {
      const { userId } = req.params;
      const { webhookId } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing userId parameter'
        });
      }

      const stats = await webhookService.getWebhookStats(userId, webhookId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Failed to get webhook stats', {
        error: error.message,
        userId: req.params.userId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get webhook stats'
      });
    }
  }

  /**
   * Verificar firma de webhook (para webhooks entrantes)
   */
  verifyWebhookSignature(secret, payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

module.exports = new WebhookHandlerController();