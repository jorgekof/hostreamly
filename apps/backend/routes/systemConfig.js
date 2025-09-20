const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');
const AgoraService = require('../services/AgoraService');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

/**
 * Validaciones para la configuración de Agora
 */
const validateAgoraConfig = [
  body('appId')
    .optional()
    .matches(/^[a-f0-9]{32}$/i)
    .withMessage('App ID debe ser una cadena de 32 caracteres hexadecimales'),
  body('appCertificate')
    .optional()
    .isLength({ min: 32 })
    .withMessage('App Certificate debe tener al menos 32 caracteres'),
  body('customerKey')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Customer Key es requerido'),
  body('customerSecret')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Customer Secret es requerido'),
  body('recordingRegion')
    .optional()
    .isIn(['US', 'EU', 'AP', 'CN'])
    .withMessage('Región de grabación inválida'),
  body('recordingProvider')
    .optional()
    .isIn(['qiniu', 'aws', 'bunny'])
    .withMessage('Proveedor de grabación inválido'),
  body('recordingBucket')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Bucket de grabación es requerido'),
  body('recordingAccessKey')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Access Key de grabación es requerido'),
  body('recordingSecretKey')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Secret Key de grabación es requerido')
];

/**
 * @route   GET /api/system-config/agora
 * @desc    Obtener configuración actual de Agora
 * @access  Private (Admin)
 */
router.get('/agora', requireAdmin, async (req, res) => {
  try {
    const configStatus = AgoraService.getConfigurationStatus();
    
    res.json({
      success: true,
      data: {
        ...configStatus,
        // Información adicional para el panel de administración
        limits: {
          maxMonthlyHours: 50,
          maxConcurrentViewers: 100,
          availableForPlan: 'enterprise'
        },
        documentation: {
          appIdHelp: 'Obtenido desde Agora Console > Projects page',
          appCertificateHelp: 'Habilitado en Agora Console para autenticación con tokens',
          customerCredentialsHelp: 'Generados en Agora Console > RESTful API page',
          recordingHelp: 'Configuración para grabación en la nube (opcional)'
        }
      }
    });
    
  } catch (error) {
    logger.error('Error getting Agora configuration', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración de Agora',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/system-config/agora
 * @desc    Actualizar configuración de Agora
 * @access  Private (Admin)
 */
router.put('/agora', requireAdmin, validateAgoraConfig, async (req, res) => {
  try {
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de configuración inválidos',
        details: errors.array()
      });
    }
    
    const {
      enabled,
      appId,
      appCertificate,
      customerKey,
      customerSecret,
      recordingRegion,
      recordingProvider,
      recordingBucket,
      recordingAccessKey,
      recordingSecretKey
    } = req.body;
    
    // Preparar variables de entorno para actualizar
    const envUpdates = {};
    
    if (appId !== undefined) envUpdates.AGORA_APP_ID = appId;
    if (appCertificate !== undefined) envUpdates.AGORA_APP_CERTIFICATE = appCertificate;
    if (customerKey !== undefined) envUpdates.AGORA_CUSTOMER_ID = customerKey;
    if (customerSecret !== undefined) envUpdates.AGORA_CUSTOMER_SECRET = customerSecret;
    if (recordingRegion !== undefined) envUpdates.AGORA_RECORDING_REGION = recordingRegion;
    if (recordingBucket !== undefined) envUpdates.AGORA_RECORDING_BUCKET = recordingBucket;
    if (recordingAccessKey !== undefined) envUpdates.AGORA_RECORDING_ACCESS_KEY = recordingAccessKey;
    if (recordingSecretKey !== undefined) envUpdates.AGORA_RECORDING_SECRET_KEY = recordingSecretKey;
    
    // Mapear proveedor a código numérico
    if (recordingProvider !== undefined) {
      const providerMap = {
        'qiniu': '0',
        'aws': '1',
        'bunny': '2'
      };
      envUpdates.AGORA_RECORDING_VENDOR = providerMap[recordingProvider] || '2';
    }
    
    // Actualizar variables de entorno en el proceso actual
    Object.assign(process.env, envUpdates);
    
    // Intentar validar la nueva configuración
    try {
      // Crear una instancia temporal para validar
      const tempService = new (require('../services/AgoraService').constructor)();
      tempService.validateConfiguration();
    } catch (validationError) {
      // Revertir cambios si la validación falla
      for (const key of Object.keys(envUpdates)) {
        delete process.env[key];
      }
      
      return res.status(400).json({
        success: false,
        error: 'Configuración inválida',
        message: validationError.message
      });
    }
    
    // Log de la actualización
    logger.system('agora_config_updated', 'success', {
      userId: req.user.id,
      updatedFields: Object.keys(envUpdates),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Obtener estado actualizado
    const updatedStatus = AgoraService.getConfigurationStatus();
    
    res.json({
      success: true,
      message: 'Configuración de Agora actualizada exitosamente',
      data: updatedStatus
    });
    
  } catch (error) {
    logger.error('Error updating Agora configuration', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración de Agora',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/system-config/agora/test
 * @desc    Probar conexión con Agora
 * @access  Private (Admin)
 */
router.post('/agora/test', requireAdmin, async (req, res) => {
  try {
    // Verificar configuración básica
    if (!AgoraService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Agora no está configurado correctamente',
        message: 'Por favor, configure todas las credenciales necesarias'
      });
    }
    
    // Generar un token de prueba
    const testChannelName = `test_${Date.now()}`;
    const testUid = Math.floor(Math.random() * 1000000);
    
    const tokenResult = AgoraService.generateRtcToken(
      testChannelName,
      testUid,
      'publisher',
      300 // 5 minutos
    );
    
    logger.system('agora_test_successful', 'success', {
      userId: req.user.id,
      testChannelName,
      testUid
    });
    
    res.json({
      success: true,
      message: 'Conexión con Agora exitosa',
      data: {
        configured: true,
        tokenGenerated: !!tokenResult.token,
        appId: tokenResult.appId,
        testChannel: testChannelName,
        testUid: testUid
      }
    });
    
  } catch (error) {
    logger.error('Agora test failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Error al probar conexión con Agora',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/system-config/agora/limits
 * @desc    Obtener límites de live streaming para plan empresarial
 * @access  Private (Admin)
 */
router.get('/agora/limits', requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        enterprise: {
          maxMonthlyHours: 50,
          maxConcurrentViewers: 100,
          maxConcurrentStreams: 10,
          recordingEnabled: true,
          chatEnabled: true,
          customBranding: true
        },
        professional: {
          available: false,
          message: 'Live streaming no disponible en plan Profesional'
        },
        starter: {
          available: false,
          message: 'Live streaming no disponible en plan Básico'
        }
      }
    });
    
  } catch (error) {
    logger.error('Error getting streaming limits', {
      error: error.message,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Error al obtener límites de streaming'
    });
  }
});

module.exports = router;