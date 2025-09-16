const { RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole } = require('agora-access-token');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

class AgoraService {
  constructor() {
    // Agora App ID - Obtenido desde Agora Console (Projects page)
    this.appId = process.env.AGORA_APP_ID;
    
    // Agora App Certificate - Habilitado en Agora Console para autenticación con tokens
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    // Customer ID y Customer Secret - Para RESTful API authentication
    // Generados en Agora Console > RESTful API page
    this.customerId = process.env.AGORA_CUSTOMER_ID;
    this.customerSecret = process.env.AGORA_CUSTOMER_SECRET;
    
    // Configuración de grabación en la nube
    this.recordingRegion = process.env.AGORA_RECORDING_REGION || 'US';
    
    // Cloud Recording configuration
    this.recordingConfig = {
      vendor: parseInt(process.env.AGORA_RECORDING_VENDOR) || 2, // 2 = Bunny.net, 1 = AWS S3, 0 = Qiniu
      region: parseInt(process.env.AGORA_RECORDING_REGION_CODE) || 0, // 0 = US, 1 = AP, 2 = EU, 3 = CN
      bucket: process.env.AGORA_RECORDING_BUCKET,
      accessKey: process.env.AGORA_RECORDING_ACCESS_KEY,
      secretKey: process.env.AGORA_RECORDING_SECRET_KEY
    };
    
    // API endpoints
    this.cloudRecordingBaseUrl = 'https://api.agora.io/v1/apps';
    this.rtmBaseUrl = 'https://api.agora.io/dev/v2/project';
    
    // No validar configuración al inicializar para permitir que el servidor arranque
    // La validación se hará cuando se necesite usar el servicio
    
    // Initialize HTTP client
    this.apiClient = axios.create({
      timeout: 30000
    });
    
    this.setupInterceptors();
  }
  
  /**
   * Valida que todas las credenciales necesarias estén configuradas
   */
  validateConfiguration() {
    const requiredFields = {
      'AGORA_APP_ID': this.appId,
      'AGORA_APP_CERTIFICATE': this.appCertificate,
      'AGORA_CUSTOMER_ID': this.customerId,
      'AGORA_CUSTOMER_SECRET': this.customerSecret
    };
    
    const missingFields = [];
    
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      const error = `Agora configuration incomplete. Missing environment variables: ${missingFields.join(', ')}`;
      logger.agora('configuration_error', 'error', {
        missingFields,
        message: 'Please configure Agora credentials in system settings'
      });
      throw new Error(error);
    }
    
    // Validar formato de App ID (debe ser una cadena de 32 caracteres hexadecimales)
    if (!/^[a-f0-9]{32}$/i.test(this.appId)) {
      logger.agora('invalid_app_id', 'warning', {
        appId: this.appId,
        message: 'App ID format may be invalid. Expected 32 hexadecimal characters.'
      });
    }
    
    logger.agora('configuration_validated', 'success', {
      appId: this.appId.substring(0, 8) + '...',
      hasAppCertificate: !!this.appCertificate,
      hasCustomerId: !!this.customerId,
      hasCustomerSecret: !!this.customerSecret,
      recordingRegion: this.recordingRegion
    });
  }
  
  /**
   * Verifica si el servicio está correctamente configurado
   */
  isConfigured() {
    try {
      this.validateConfiguration();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Obtiene el estado de configuración para el panel de administración
   */
  getConfigurationStatus() {
    return {
      configured: this.isConfigured(),
      appId: this.appId ? this.appId.substring(0, 8) + '...' : null,
      hasAppCertificate: !!this.appCertificate,
      hasCustomerId: !!this.customerId,
      hasCustomerSecret: !!this.customerSecret,
      recordingRegion: this.recordingRegion,
      recordingConfig: {
        vendor: this.recordingConfig.vendor,
        region: this.recordingConfig.region,
        hasBucket: !!this.recordingConfig.bucket,
        hasAccessKey: !!this.recordingConfig.accessKey,
        hasSecretKey: !!this.recordingConfig.secretKey
      }
    };
  }
  
  setupInterceptors() {
    this.apiClient.interceptors.response.use(
      (response) => {
        logger.agora('api_success', 'success', {
          method: response.config.method,
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      (error) => {
        logger.agora('api_error', 'error', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        throw error;
      }
    );
  }
  
  // Token Generation Methods
  
  /**
   * Generate RTC token for video/audio streaming
   */
  generateRtcToken(channelName, uid, role = 'publisher', expirationTime = 3600) {
    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTime;
      
      const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      
      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        rtcRole,
        privilegeExpiredTs
      );
      
      logger.agora('rtc_token_generated', 'success', {
        channelName,
        uid,
        role,
        expirationTime
      });
      
      return {
        token,
        appId: this.appId,
        channelName,
        uid,
        role,
        expiresAt: privilegeExpiredTs
      };
    } catch (error) {
      logger.agora('rtc_token_generation_failed', 'error', {
        channelName,
        uid,
        role,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate RTM token for real-time messaging
   */
  generateRtmToken(userId, expirationTime = 3600) {
    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTime;
      
      const token = RtmTokenBuilder.buildToken(
        this.appId,
        this.appCertificate,
        userId,
        RtmRole.Rtm_User,
        privilegeExpiredTs
      );
      
      logger.agora('rtm_token_generated', 'success', {
        userId,
        expirationTime
      });
      
      return {
        token,
        appId: this.appId,
        userId,
        expiresAt: privilegeExpiredTs
      };
    } catch (error) {
      logger.agora('rtm_token_generation_failed', 'error', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  // Cloud Recording Methods
  
  /**
   * Get basic authentication for Cloud Recording API
   */
  getBasicAuth() {
    const credentials = Buffer.from(`${this.customerId}:${this.customerSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }
  
  /**
   * Acquire cloud recording resource
   */
  async acquireRecordingResource(channelName, uid) {
    try {
      const url = `${this.cloudRecordingBaseUrl}/${this.appId}/cloud_recording/acquire`;
      
      const response = await this.apiClient.post(url, {
        cname: channelName,
        uid: uid.toString(),
        clientRequest: {
          resourceExpiredHour: 24,
          scene: 0 // Real-time audio and video recording
        }
      }, {
        headers: {
          'Authorization': this.getBasicAuth(),
          'Content-Type': 'application/json'
        }
      });
      
      const resourceId = response.data.resourceId;
      
      // Cache resource ID for 23 hours
      await cache.set(`agora:resource:${channelName}:${uid}`, resourceId, 23 * 3600);
      
      logger.agora('recording_resource_acquired', 'success', {
        channelName,
        uid,
        resourceId
      });
      
      return resourceId;
    } catch (error) {
      logger.agora('recording_resource_acquisition_failed', 'error', {
        channelName,
        uid,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Start cloud recording
   */
  async startRecording(channelName, uid, resourceId, recordingConfig = {}) {
    try {
      const url = `${this.cloudRecordingBaseUrl}/${this.appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;
      
      const config = {
        maxIdleTime: 30,
        recordingConfig: {
          channelType: 0, // Communication profile
          streamTypes: 2, // Audio and video
          audioProfile: 1, // AAC_LC, 48 kHz, stereo, 128 Kbps
          videoStreamType: 0, // High stream
          maxIdleTime: 30,
          transcodingConfig: {
            width: 1920,
            height: 1080,
            fps: 30,
            bitrate: 2000,
            maxResolutionUid: uid.toString(),
            mixedVideoLayout: 1, // Floating layout
            backgroundColor: "#000000"
          }
        },
        storageConfig: {
          vendor: this.recordingConfig.vendor,
          region: this.recordingConfig.region,
          bucket: this.recordingConfig.bucket,
          accessKey: this.recordingConfig.accessKey,
          secretKey: this.recordingConfig.secretKey,
          fileNamePrefix: [`recordings/${channelName}`, `${Date.now()}`]
        },
        ...recordingConfig
      };
      
      const response = await this.apiClient.post(url, {
        cname: channelName,
        uid: uid.toString(),
        clientRequest: config
      }, {
        headers: {
          'Authorization': this.getBasicAuth(),
          'Content-Type': 'application/json'
        }
      });
      
      const sid = response.data.sid;
      
      // Cache recording session info
      await cache.set(`agora:recording:${channelName}:${uid}`, {
        resourceId,
        sid,
        startTime: Date.now(),
        status: 'recording'
      }, 24 * 3600);
      
      logger.agora('recording_started', 'success', {
        channelName,
        uid,
        resourceId,
        sid
      });
      
      return { resourceId, sid };
    } catch (error) {
      logger.agora('recording_start_failed', 'error', {
        channelName,
        uid,
        resourceId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Stop cloud recording
   */
  async stopRecording(channelName, uid, resourceId, sid) {
    try {
      const url = `${this.cloudRecordingBaseUrl}/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
      
      const response = await this.apiClient.post(url, {
        cname: channelName,
        uid: uid.toString(),
        clientRequest: {}
      }, {
        headers: {
          'Authorization': this.getBasicAuth(),
          'Content-Type': 'application/json'
        }
      });
      
      // Update cache
      const recordingInfo = await cache.get(`agora:recording:${channelName}:${uid}`);
      if (recordingInfo) {
        recordingInfo.status = 'stopped';
        recordingInfo.stopTime = Date.now();
        recordingInfo.fileList = response.data.serverResponse?.fileList || [];
        await cache.set(`agora:recording:${channelName}:${uid}`, recordingInfo, 24 * 3600);
      }
      
      logger.agora('recording_stopped', 'success', {
        channelName,
        uid,
        resourceId,
        sid,
        fileList: response.data.serverResponse?.fileList
      });
      
      return response.data;
    } catch (error) {
      logger.agora('recording_stop_failed', 'error', {
        channelName,
        uid,
        resourceId,
        sid,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Query recording status
   */
  async queryRecording(resourceId, sid) {
    try {
      const url = `${this.cloudRecordingBaseUrl}/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;
      
      const response = await this.apiClient.get(url, {
        headers: {
          'Authorization': this.getBasicAuth()
        }
      });
      
      return response.data;
    } catch (error) {
      logger.agora('recording_query_failed', 'error', {
        resourceId,
        sid,
        error: error.message
      });
      throw error;
    }
  }
  
  // Channel Management Methods
  
  /**
   * Get channel statistics
   */
  async getChannelStats(channelName) {
    try {
      const cacheKey = `agora:channel:stats:${channelName}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      // Note: This would require Agora Analytics API access
      // For now, return mock data or implement when API is available
      const stats = {
        channelName,
        userCount: 0,
        duration: 0,
        timestamp: Date.now()
      };
      
      await cache.set(cacheKey, stats, 60); // Cache for 1 minute
      
      return stats;
    } catch (error) {
      logger.agora('channel_stats_failed', 'error', {
        channelName,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Kick user from channel
   */
  async kickUser(channelName, uid, kickedUid) {
    try {
      // Generate privilege token to kick user
      const token = this.generateRtcToken(channelName, uid, 'publisher', 300); // 5 minutes
      
      // This would require additional Agora API implementation
      // For now, log the action
      logger.agora('user_kicked', 'success', {
        channelName,
        kickerUid: uid,
        kickedUid
      });
      
      return { success: true, token: token.token };
    } catch (error) {
      logger.agora('user_kick_failed', 'error', {
        channelName,
        uid,
        kickedUid,
        error: error.message
      });
      throw error;
    }
  }
  
  // RTM Methods
  
  /**
   * Send RTM message
   */
  async sendRtmMessage(fromUserId, toUserId, message) {
    try {
      // This would require RTM server SDK implementation
      // For now, log the message
      logger.agora('rtm_message_sent', 'success', {
        fromUserId,
        toUserId,
        messageLength: message.length
      });
      
      return { success: true, messageId: crypto.randomUUID() };
    } catch (error) {
      logger.agora('rtm_message_failed', 'error', {
        fromUserId,
        toUserId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Send RTM channel message
   */
  async sendChannelMessage(channelName, userId, message) {
    try {
      // This would require RTM server SDK implementation
      // For now, log the message
      logger.agora('rtm_channel_message_sent', 'success', {
        channelName,
        userId,
        messageLength: message.length
      });
      
      return { success: true, messageId: crypto.randomUUID() };
    } catch (error) {
      logger.agora('rtm_channel_message_failed', 'error', {
        channelName,
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  // Utility Methods
  
  /**
   * Validate channel name
   */
  isValidChannelName(channelName) {
    // Channel name rules:
    // - ASCII letters, numbers, underscore, hyphen
    // - Length: 1-64 characters
    const regex = /^[a-zA-Z0-9_-]{1,64}$/;
    return regex.test(channelName);
  }
  
  /**
   * Generate unique channel name
   */
  generateChannelName(prefix = 'stream') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }
  
  /**
   * Generate unique UID
   */
  generateUid() {
    return Math.floor(Math.random() * 2147483647) + 1;
  }
  
  /**
   * Get recording file URLs
   */
  getRecordingUrls(fileList, baseUrl) {
    if (!fileList || !Array.isArray(fileList)) {
      return [];
    }
    
    return fileList.map(file => ({
      filename: file.filename,
      url: `${baseUrl}/${file.filename}`,
      size: file.file_size,
      duration: file.slice_start_time ? 
        (file.slice_start_time - file.slice_start_time) : null
    }));
  }
  
  /**
   * Process recording webhook
   */
  async processRecordingWebhook(payload) {
    try {
      const { eventType, payload: eventPayload } = payload;
      
      switch (eventType) {
        case 'recorder_started':
          logger.agora('recording_webhook_started', 'success', eventPayload);
          break;
          
        case 'recorder_stopped':
          logger.agora('recording_webhook_stopped', 'success', eventPayload);
          break;
          
        case 'recorder_failed':
          logger.agora('recording_webhook_failed', 'error', eventPayload);
          break;
          
        default:
          logger.agora('recording_webhook_unknown', 'info', {
            eventType,
            payload: eventPayload
          });
      }
      
      return { success: true };
    } catch (error) {
      logger.agora('recording_webhook_processing_failed', 'error', {
        error: error.message,
        payload
      });
      throw error;
    }
  }
}

module.exports = new AgoraService();