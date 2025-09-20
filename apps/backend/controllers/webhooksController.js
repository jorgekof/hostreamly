const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Webhooks Controller for Enterprise Features
 * 
 * Handles CRUD operations for user-defined webhooks,
 * delivery management, and retry logic.
 */
class WebhooksController {
  
  /**
   * Get all webhooks for authenticated user
   * @route GET /api/webhooks
   */
  async getWebhooks(req, res, next) {
    try {
      const { page = 1, limit = 10, active } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = { user_id: req.user.id };
      if (active !== undefined) {
        whereClause.active = active === 'true';
      }
      
      const [webhooks, totalCount] = await Promise.all([
        sequelize.query(`
          SELECT id, name, url, events, secret, active, 
                 created_at, updated_at, last_triggered_at,
                 (SELECT COUNT(*) FROM webhook_deliveries wd 
                  WHERE wd.webhook_id = w.id AND wd.status = 'success') as successful_deliveries,
                 (SELECT COUNT(*) FROM webhook_deliveries wd 
                  WHERE wd.webhook_id = w.id AND wd.status = 'failed') as failed_deliveries
          FROM webhooks w 
          WHERE user_id = ? ${active !== undefined ? 'AND active = ?' : ''}
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `, {
          replacements: active !== undefined ? 
            [req.user.id, active === 'true', parseInt(limit), offset] :
            [req.user.id, parseInt(limit), offset],
          type: sequelize.QueryTypes.SELECT
        }),
        
        sequelize.query(`
          SELECT COUNT(*) as count FROM webhooks 
          WHERE user_id = ? ${active !== undefined ? 'AND active = ?' : ''}
        `, {
          replacements: active !== undefined ? 
            [req.user.id, active === 'true'] : [req.user.id],
          type: sequelize.QueryTypes.SELECT
        })
      ]);
      
      // Parse events JSON for each webhook
      const parsedWebhooks = webhooks.map(webhook => ({
        ...webhook,
        events: JSON.parse(webhook.events || '[]'),
        secret: webhook.secret ? '***masked***' : null
      }));
      
      res.json({
        success: true,
        data: {
          webhooks: parsedWebhooks,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount[0].count,
            pages: Math.ceil(totalCount[0].count / limit)
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to fetch webhooks', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Get specific webhook by ID
   * @route GET /api/webhooks/:id
   */
  async getWebhook(req, res, next) {
    try {
      const [webhook] = await sequelize.query(`
        SELECT * FROM webhooks 
        WHERE id = ? AND user_id = ?
      `, {
        replacements: [req.params.id, req.user.id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (!webhook) {
        return res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
      }
      
      webhook.events = JSON.parse(webhook.events || '[]');
      webhook.secret = webhook.secret ? '***masked***' : null;
      
      res.json({
        success: true,
        data: { webhook }
      });
      
    } catch (error) {
      logger.error('Failed to fetch webhook', {
        webhookId: req.params.id,
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Create new webhook
   * @route POST /api/webhooks
   */
  async createWebhook(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const { name, url, events, secret, headers } = req.body;
      const webhookId = crypto.randomUUID();
      
      // Validate events
      const validEvents = [
        'video.created', 'video.updated', 'video.deleted', 'video.processed',
        'video.encoding.started', 'video.encoding.completed', 'video.encoding.failed',
        'livestream.started', 'livestream.ended', 'livestream.recorded',
        'analytics.milestone', 'user.plan.changed', 'storage.limit.reached'
      ];
      
      const invalidEvents = events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid events',
          details: { invalidEvents, validEvents }
        });
      }
      
      await sequelize.query(`
        INSERT INTO webhooks (
          id, user_id, name, url, events, secret, headers, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          webhookId,
          req.user.id,
          name,
          url,
          JSON.stringify(events),
          secret || null,
          JSON.stringify(headers || {}),
          true
        ]
      });
      
      logger.info('Webhook created', {
        webhookId,
        userId: req.user.id,
        name,
        url,
        events
      });
      
      res.status(201).json({
        success: true,
        data: {
          webhook: {
            id: webhookId,
            name,
            url,
            events,
            active: true,
            created_at: new Date().toISOString()
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to create webhook', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Update webhook
   * @route PUT /api/webhooks/:id
   */
  async updateWebhook(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      const { name, url, events, secret, headers, active } = req.body;
      
      // Check if webhook exists and belongs to user
      const [existingWebhook] = await sequelize.query(`
        SELECT id FROM webhooks WHERE id = ? AND user_id = ?
      `, {
        replacements: [req.params.id, req.user.id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (!existingWebhook) {
        return res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
      }
      
      const updateFields = [];
      const replacements = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        replacements.push(name);
      }
      if (url !== undefined) {
        updateFields.push('url = ?');
        replacements.push(url);
      }
      if (events !== undefined) {
        updateFields.push('events = ?');
        replacements.push(JSON.stringify(events));
      }
      if (secret !== undefined) {
        updateFields.push('secret = ?');
        replacements.push(secret);
      }
      if (headers !== undefined) {
        updateFields.push('headers = ?');
        replacements.push(JSON.stringify(headers));
      }
      if (active !== undefined) {
        updateFields.push('active = ?');
        replacements.push(active);
      }
      
      updateFields.push('updated_at = NOW()');
      replacements.push(req.params.id, req.user.id);
      
      await sequelize.query(`
        UPDATE webhooks SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `, { replacements });
      
      logger.info('Webhook updated', {
        webhookId: req.params.id,
        userId: req.user.id,
        updates: { name, url, events, active }
      });
      
      res.json({
        success: true,
        data: { message: 'Webhook updated successfully' }
      });
      
    } catch (error) {
      logger.error('Failed to update webhook', {
        webhookId: req.params.id,
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Delete webhook
   * @route DELETE /api/webhooks/:id
   */
  async deleteWebhook(req, res, next) {
    try {
      const result = await sequelize.query(`
        DELETE FROM webhooks WHERE id = ? AND user_id = ?
      `, {
        replacements: [req.params.id, req.user.id]
      });
      
      if (result[1].affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
      }
      
      logger.info('Webhook deleted', {
        webhookId: req.params.id,
        userId: req.user.id
      });
      
      res.json({
        success: true,
        data: { message: 'Webhook deleted successfully' }
      });
      
    } catch (error) {
      logger.error('Failed to delete webhook', {
        webhookId: req.params.id,
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Test webhook by sending a test payload
   * @route POST /api/webhooks/:id/test
   */
  async testWebhook(req, res, next) {
    try {
      const [webhook] = await sequelize.query(`
        SELECT * FROM webhooks WHERE id = ? AND user_id = ?
      `, {
        replacements: [req.params.id, req.user.id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (!webhook) {
        return res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
      }
      
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          webhook_id: webhook.id,
          message: 'This is a test webhook delivery'
        }
      };
      
      const deliveryResult = await this.deliverWebhook(webhook, testPayload);
      
      res.json({
        success: true,
        data: {
          delivery: deliveryResult,
          message: 'Test webhook sent'
        }
      });
      
    } catch (error) {
      logger.error('Failed to test webhook', {
        webhookId: req.params.id,
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Get webhook deliveries
   * @route GET /api/webhooks/:id/deliveries
   */
  async getWebhookDeliveries(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;
      
      // Verify webhook ownership
      const [webhook] = await sequelize.query(`
        SELECT id FROM webhooks WHERE id = ? AND user_id = ?
      `, {
        replacements: [req.params.id, req.user.id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (!webhook) {
        return res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
      }
      
      let whereClause = 'webhook_id = ?';
      let replacements = [req.params.id];
      
      if (status) {
        whereClause += ' AND status = ?';
        replacements.push(status);
      }
      
      const [deliveries, totalCount] = await Promise.all([
        sequelize.query(`
          SELECT id, event_type, status, response_status, response_body,
                 attempt_count, delivered_at, created_at, payload
          FROM webhook_deliveries 
          WHERE ${whereClause}
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `, {
          replacements: [...replacements, parseInt(limit), offset],
          type: sequelize.QueryTypes.SELECT
        }),
        
        sequelize.query(`
          SELECT COUNT(*) as count FROM webhook_deliveries 
          WHERE ${whereClause}
        `, {
          replacements,
          type: sequelize.QueryTypes.SELECT
        })
      ]);
      
      // Parse payload JSON
      const parsedDeliveries = deliveries.map(delivery => ({
        ...delivery,
        payload: JSON.parse(delivery.payload || '{}')
      }));
      
      res.json({
        success: true,
        data: {
          deliveries: parsedDeliveries,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount[0].count,
            pages: Math.ceil(totalCount[0].count / limit)
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to fetch webhook deliveries', {
        webhookId: req.params.id,
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Retry failed webhook delivery
   * @route POST /api/webhooks/deliveries/:deliveryId/retry
   */
  async retryWebhookDelivery(req, res, next) {
    try {
      const [delivery] = await sequelize.query(`
        SELECT wd.*, w.user_id, w.url, w.secret, w.headers
        FROM webhook_deliveries wd
        JOIN webhooks w ON wd.webhook_id = w.id
        WHERE wd.id = ? AND w.user_id = ?
      `, {
        replacements: [req.params.deliveryId, req.user.id],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (!delivery) {
        return res.status(404).json({
          success: false,
          error: 'Delivery not found'
        });
      }
      
      if (delivery.status === 'success') {
        return res.status(400).json({
          success: false,
          error: 'Cannot retry successful delivery'
        });
      }
      
      const webhook = {
        id: delivery.webhook_id,
        url: delivery.url,
        secret: delivery.secret,
        headers: JSON.parse(delivery.headers || '{}')
      };
      
      const payload = JSON.parse(delivery.payload);
      const retryResult = await this.deliverWebhook(webhook, payload, delivery.id);
      
      res.json({
        success: true,
        data: {
          delivery: retryResult,
          message: 'Webhook delivery retried'
        }
      });
      
    } catch (error) {
      logger.error('Failed to retry webhook delivery', {
        deliveryId: req.params.deliveryId,
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }
  
  /**
   * Internal method to deliver webhook
   */
  async deliverWebhook(webhook, payload, existingDeliveryId = null) {
    const deliveryId = existingDeliveryId || crypto.randomUUID();
    const timestamp = new Date();
    
    try {
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Hostreamly-Webhooks/1.0',
        'X-Webhook-Timestamp': timestamp.toISOString(),
        'X-Webhook-ID': deliveryId,
        ...JSON.parse(webhook.headers || '{}')
      };
      
      // Add signature if secret is provided
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }
      
      // Make HTTP request
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 30000, // 30 seconds
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });
      
      const deliveryData = {
        id: deliveryId,
        webhook_id: webhook.id,
        event_type: payload.event || 'unknown',
        status: response.status < 400 ? 'success' : 'failed',
        response_status: response.status,
        response_body: JSON.stringify(response.data).substring(0, 1000),
        attempt_count: existingDeliveryId ? 'attempt_count + 1' : 1,
        delivered_at: timestamp,
        payload: JSON.stringify(payload)
      };
      
      if (existingDeliveryId) {
        // Update existing delivery
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
            deliveryId
          ]
        });
      } else {
        // Create new delivery record
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
      
      // Update webhook last_triggered_at
      await sequelize.query(`
        UPDATE webhooks SET last_triggered_at = ? WHERE id = ?
      `, {
        replacements: [timestamp, webhook.id]
      });
      
      logger.info('Webhook delivered successfully', {
        webhookId: webhook.id,
        deliveryId,
        status: response.status,
        eventType: payload.event
      });
      
      return deliveryData;
      
    } catch (error) {
      const deliveryData = {
        id: deliveryId,
        webhook_id: webhook.id,
        event_type: payload.event || 'unknown',
        status: 'failed',
        response_status: error.response?.status || 0,
        response_body: error.message.substring(0, 1000),
        attempt_count: existingDeliveryId ? 'attempt_count + 1' : 1,
        delivered_at: timestamp,
        payload: JSON.stringify(payload)
      };
      
      if (existingDeliveryId) {
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
            deliveryId
          ]
        });
      } else {
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
   * Trigger webhooks for a specific event
   * This method is called internally by other services
   */
  async triggerWebhooks(userId, eventType, eventData) {
    try {
      const webhooks = await sequelize.query(`
        SELECT * FROM webhooks 
        WHERE user_id = ? AND active = true 
        AND JSON_CONTAINS(events, ?)
      `, {
        replacements: [userId, JSON.stringify(eventType)],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (webhooks.length === 0) {
        return;
      }
      
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: eventData
      };
      
      // Deliver webhooks in parallel
      const deliveryPromises = webhooks.map(webhook => 
        this.deliverWebhook(webhook, payload).catch(error => {
          logger.error('Webhook delivery failed in batch', {
            webhookId: webhook.id,
            eventType,
            error: error.message
          });
        })
      );
      
      await Promise.allSettled(deliveryPromises);
      
      logger.info('Webhooks triggered', {
        userId,
        eventType,
        webhookCount: webhooks.length
      });
      
    } catch (error) {
      logger.error('Failed to trigger webhooks', {
        userId,
        eventType,
        error: error.message
      });
    }
  }
}

module.exports = new WebhooksController();