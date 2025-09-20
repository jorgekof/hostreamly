const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const contactController = require('../controllers/contactController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactForm:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del formulario
 *         form_name:
 *           type: string
 *           description: Nombre único del formulario
 *         title:
 *           type: string
 *           description: Título del formulario
 *         description:
 *           type: string
 *           description: Descripción del formulario
 *         fields:
 *           type: array
 *           description: Configuración de campos del formulario
 *         video_upload_enabled:
 *           type: boolean
 *           description: Si permite upload de videos
 *         video_upload_config:
 *           type: object
 *           description: Configuración para upload de videos
 *         email_notifications:
 *           type: object
 *           description: Configuración de notificaciones por email
 *         webhook_url:
 *           type: string
 *           description: URL de webhook para notificaciones
 *         is_active:
 *           type: boolean
 *           description: Si el formulario está activo
 *         require_auth:
 *           type: boolean
 *           description: Si requiere autenticación
 *         allowed_domains:
 *           type: array
 *           items:
 *             type: string
 *           description: Dominios permitidos
 *         rate_limit:
 *           type: integer
 *           description: Límite de envíos por hora
 *         auto_response:
 *           type: object
 *           description: Configuración de respuesta automática
 *         custom_css:
 *           type: string
 *           description: CSS personalizado
 *         success_message:
 *           type: string
 *           description: Mensaje de éxito
 *         redirect_url:
 *           type: string
 *           description: URL de redirección
 *         submission_count:
 *           type: integer
 *           description: Contador de envíos
 *         last_submission_at:
 *           type: string
 *           format: date-time
 *           description: Fecha del último envío
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ContactSubmission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del envío
 *         contact_form_id:
 *           type: string
 *           format: uuid
 *           description: ID del formulario
 *         submission_data:
 *           type: object
 *           description: Datos del formulario enviado
 *         video_id:
 *           type: string
 *           format: uuid
 *           description: ID del video adjunto
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario (si está autenticado)
 *         ip_address:
 *           type: string
 *           description: Dirección IP del remitente
 *         user_agent:
 *           type: string
 *           description: User agent del navegador
 *         referrer:
 *           type: string
 *           description: URL de referencia
 *         status:
 *           type: string
 *           enum: [pending, read, replied, archived, spam]
 *           description: Estado del envío
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           description: Prioridad del envío
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Etiquetas
 *         notes:
 *           type: string
 *           description: Notas internas
 *         email_sent:
 *           type: boolean
 *           description: Si se envió notificación por email
 *         webhook_sent:
 *           type: boolean
 *           description: Si se envió webhook
 *         auto_response_sent:
 *           type: boolean
 *           description: Si se envió respuesta automática
 *         read_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de lectura
 *         replied_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de respuesta
 *         archived_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de archivo
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateContactFormRequest:
 *       type: object
 *       required:
 *         - form_name
 *         - title
 *         - fields
 *       properties:
 *         form_name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Nombre único del formulario
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: Título del formulario
 *         description:
 *           type: string
 *           description: Descripción del formulario
 *         fields:
 *           type: array
 *           minItems: 1
 *           description: Configuración de campos del formulario
 *         video_upload_enabled:
 *           type: boolean
 *           default: false
 *           description: Si permite upload de videos
 *         video_upload_config:
 *           type: object
 *           description: Configuración para upload de videos
 *         email_notifications:
 *           type: object
 *           description: Configuración de notificaciones por email
 *         webhook_url:
 *           type: string
 *           format: uri
 *           description: URL de webhook para notificaciones
 *         require_auth:
 *           type: boolean
 *           default: false
 *           description: Si requiere autenticación
 *         allowed_domains:
 *           type: array
 *           items:
 *             type: string
 *           description: Dominios permitidos
 *         rate_limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           description: Límite de envíos por hora
 *         auto_response:
 *           type: object
 *           description: Configuración de respuesta automática
 *         custom_css:
 *           type: string
 *           description: CSS personalizado
 *         success_message:
 *           type: string
 *           description: Mensaje de éxito
 *         redirect_url:
 *           type: string
 *           format: uri
 *           description: URL de redirección
 */

// Rate limiters
const createFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 formularios por ventana
  message: {
    success: false,
    message: 'Demasiados formularios creados. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const submitFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 envíos por hora por IP
  message: {
    success: false,
    message: 'Demasiados envíos. Intenta de nuevo en una hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const managementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 operaciones de gestión por ventana
  message: {
    success: false,
    message: 'Demasiadas operaciones. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/contact/forms:
 *   post:
 *     summary: Crear un nuevo formulario de contacto
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContactFormRequest'
 *     responses:
 *       201:
 *         description: Formulario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     form:
 *                       $ref: '#/components/schemas/ContactForm'
 *                     embed_code:
 *                       type: string
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: Ya existe un formulario con ese nombre
 */
router.post('/forms',
  createFormLimiter,
  authMiddleware,
  [
    body('form_name')
      .isLength({ min: 1, max: 100 })
      .withMessage('El nombre del formulario debe tener entre 1 y 100 caracteres')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('El nombre solo puede contener letras, números, guiones y guiones bajos'),
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('El título debe tener entre 1 y 200 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('fields')
      .isArray({ min: 1 })
      .withMessage('Debe incluir al menos un campo'),
    body('video_upload_enabled')
      .optional()
      .isBoolean()
      .withMessage('video_upload_enabled debe ser un booleano'),
    body('require_auth')
      .optional()
      .isBoolean()
      .withMessage('require_auth debe ser un booleano'),
    body('rate_limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('rate_limit debe ser un entero entre 1 y 100'),
    body('webhook_url')
      .optional()
      .isURL()
      .withMessage('webhook_url debe ser una URL válida'),
    body('redirect_url')
      .optional()
      .isURL()
      .withMessage('redirect_url debe ser una URL válida')
  ],
  contactController.createContactForm
);

/**
 * @swagger
 * /api/contact/forms:
 *   get:
 *     summary: Obtener formularios de contacto del usuario
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Solo formularios activos
 *     responses:
 *       200:
 *         description: Lista de formularios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     forms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContactForm'
 *                     pagination:
 *                       type: object
 */
router.get('/forms',
  managementLimiter,
  authMiddleware,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('limit debe ser un entero entre 1 y 50'),
    query('active_only')
      .optional()
      .isBoolean()
      .withMessage('active_only debe ser un booleano')
  ],
  contactController.getContactForms
);

/**
 * @swagger
 * /api/contact/forms/{formId}:
 *   get:
 *     summary: Obtener un formulario específico
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del formulario
 *     responses:
 *       200:
 *         description: Detalles del formulario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     form:
 *                       $ref: '#/components/schemas/ContactForm'
 *                     embed_code:
 *                       type: string
 *       404:
 *         description: Formulario no encontrado
 */
router.get('/forms/:formId',
  managementLimiter,
  authMiddleware,
  [
    param('formId')
      .isUUID()
      .withMessage('formId debe ser un UUID válido')
  ],
  contactController.getContactForm
);

/**
 * @swagger
 * /api/contact/forms/{formId}:
 *   put:
 *     summary: Actualizar un formulario de contacto
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del formulario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContactFormRequest'
 *     responses:
 *       200:
 *         description: Formulario actualizado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Formulario no encontrado
 */
router.put('/forms/:formId',
  managementLimiter,
  authMiddleware,
  [
    param('formId')
      .isUUID()
      .withMessage('formId debe ser un UUID válido'),
    body('form_name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('El nombre del formulario debe tener entre 1 y 100 caracteres'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('El título debe tener entre 1 y 200 caracteres'),
    body('webhook_url')
      .optional()
      .isURL()
      .withMessage('webhook_url debe ser una URL válida')
  ],
  contactController.updateContactForm
);

/**
 * @swagger
 * /api/contact/forms/{formId}:
 *   delete:
 *     summary: Eliminar un formulario de contacto
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del formulario
 *     responses:
 *       200:
 *         description: Formulario eliminado exitosamente
 *       404:
 *         description: Formulario no encontrado
 */
router.delete('/forms/:formId',
  managementLimiter,
  authMiddleware,
  [
    param('formId')
      .isUUID()
      .withMessage('formId debe ser un UUID válido')
  ],
  contactController.deleteContactForm
);

/**
 * @swagger
 * /api/contact/submit/{formId}:
 *   post:
 *     summary: Enviar un formulario de contacto (endpoint público)
 *     tags: [Contact Forms]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del formulario
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               submission_data:
 *                 type: string
 *                 description: Datos del formulario en formato JSON
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video adjunto (opcional)
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               submission_data:
 *                 type: object
 *                 description: Datos del formulario
 *     responses:
 *       201:
 *         description: Formulario enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     submission_id:
 *                       type: string
 *                       format: uuid
 *                     redirect_url:
 *                       type: string
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Dominio no autorizado
 *       404:
 *         description: Formulario no encontrado
 */
router.post('/submit/:formId',
  submitFormLimiter,
  optionalAuth,
  contactController.uploadMiddleware,
  [
    param('formId')
      .isUUID()
      .withMessage('formId debe ser un UUID válido')
  ],
  contactController.submitContactForm
);

/**
 * @swagger
 * /api/contact/forms/{formId}/submissions:
 *   get:
 *     summary: Obtener envíos de un formulario
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del formulario
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Elementos por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, read, replied, archived, spam]
 *         description: Filtrar por estado
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filtrar por prioridad
 *     responses:
 *       200:
 *         description: Lista de envíos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContactSubmission'
 *                     pagination:
 *                       type: object
 */
router.get('/forms/:formId/submissions',
  managementLimiter,
  authMiddleware,
  [
    param('formId')
      .isUUID()
      .withMessage('formId debe ser un UUID válido'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit debe ser un entero entre 1 y 100'),
    query('status')
      .optional()
      .isIn(['pending', 'read', 'replied', 'archived', 'spam'])
      .withMessage('status debe ser uno de: pending, read, replied, archived, spam'),
    query('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('priority debe ser uno de: low, normal, high, urgent')
  ],
  contactController.getFormSubmissions
);

/**
 * @swagger
 * /api/contact/forms/{formId}/stats:
 *   get:
 *     summary: Obtener estadísticas de un formulario
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del formulario
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Días para las estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas del formulario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     form_info:
 *                       type: object
 *                     stats:
 *                       type: object
 */
router.get('/forms/:formId/stats',
  managementLimiter,
  authMiddleware,
  [
    param('formId')
      .isUUID()
      .withMessage('formId debe ser un UUID válido'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('days debe ser un entero entre 1 y 365')
  ],
  contactController.getFormStats
);

/**
 * @swagger
 * /api/contact/submissions/{submissionId}:
 *   put:
 *     summary: Actualizar estado de un envío
 *     tags: [Contact Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del envío
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, read, replied, archived, spam]
 *                 description: Nuevo estado
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 description: Nueva prioridad
 *               notes:
 *                 type: string
 *                 description: Notas internas
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Etiquetas
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       404:
 *         description: Envío no encontrado
 */
router.put('/submissions/:submissionId',
  managementLimiter,
  authMiddleware,
  [
    param('submissionId')
      .isUUID()
      .withMessage('submissionId debe ser un UUID válido'),
    body('status')
      .optional()
      .isIn(['pending', 'read', 'replied', 'archived', 'spam'])
      .withMessage('status debe ser uno de: pending, read, replied, archived, spam'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('priority debe ser uno de: low, normal, high, urgent'),
    body('notes')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('notes no puede exceder 2000 caracteres'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('tags debe ser un array')
  ],
  contactController.updateSubmissionStatus
);

// Manejo de errores
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande'
      });
    }
  }
  
  if (error.message === 'Tipo de archivo no permitido. Solo se permiten videos.') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;