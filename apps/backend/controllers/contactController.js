const { ContactForm, ContactSubmission, Video, User } = require('../models');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { getClientIp } = require('../utils/ipUtils');

// Configuración de multer para upload de videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.env.UPLOAD_PATH || './uploads', 'contact-videos');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 100 * 1024 * 1024, // 100MB por defecto
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten videos.'), false);
    }
  }
});

// Configuración de email
const createEmailTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP no configurado para notificaciones de formularios de contacto');
    return null;
  }
  
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Crear formulario de contacto
exports.createContactForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const {
      form_name,
      title,
      description,
      fields,
      video_upload_enabled,
      video_upload_config,
      email_notifications,
      webhook_url,
      require_auth,
      allowed_domains,
      rate_limit,
      auto_response,
      custom_css,
      success_message,
      redirect_url
    } = req.body;

    // Verificar que no existe un formulario con el mismo nombre
    const existingForm = await ContactForm.findByFormName(form_name, req.user.id);
    if (existingForm) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un formulario con ese nombre'
      });
    }

    const contactForm = await ContactForm.create({
      form_name,
      title,
      description,
      fields,
      video_upload_enabled,
      video_upload_config,
      email_notifications,
      webhook_url,
      require_auth,
      allowed_domains,
      rate_limit,
      auto_response,
      custom_css,
      success_message,
      redirect_url,
      user_id: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Formulario de contacto creado exitosamente',
      data: {
        form: contactForm,
        embed_code: contactForm.getEmbedCode(process.env.BASE_URL || 'http://localhost:3000')
      }
    });
  } catch (error) {
    console.error('Error creando formulario de contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener formularios de contacto del usuario
exports.getContactForms = async (req, res) => {
  try {
    const { page = 1, limit = 10, active_only = 'true' } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };
    if (active_only === 'true') {
      where.is_active = true;
    }

    const { rows: forms, count } = await ContactForm.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ContactSubmission,
          as: 'submissions',
          attributes: ['id', 'status', 'createdAt'],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        forms,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo formularios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener formulario específico
exports.getContactForm = async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await ContactForm.findOne({
      where: {
        id: formId,
        user_id: req.user.id
      },
      include: [
        {
          model: ContactSubmission,
          as: 'submissions',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        form,
        embed_code: form.getEmbedCode(process.env.BASE_URL || 'http://localhost:3000')
      }
    });
  } catch (error) {
    console.error('Error obteniendo formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar formulario de contacto
exports.updateContactForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { formId } = req.params;
    const form = await ContactForm.findOne({
      where: {
        id: formId,
        user_id: req.user.id
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    await form.update(req.body);

    res.json({
      success: true,
      message: 'Formulario actualizado exitosamente',
      data: { form }
    });
  } catch (error) {
    console.error('Error actualizando formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar formulario de contacto
exports.deleteContactForm = async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await ContactForm.findOne({
      where: {
        id: formId,
        user_id: req.user.id
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    await form.destroy();

    res.json({
      success: true,
      message: 'Formulario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Enviar formulario de contacto (endpoint público)
exports.submitContactForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const clientIp = getClientIp(req);
    const userAgent = req.get('User-Agent');
    const referrer = req.get('Referer');

    // Buscar el formulario
    const form = await ContactForm.findOne({
      where: {
        id: formId,
        is_active: true
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado o inactivo'
      });
    }

    // Validar dominio si está configurado
    if (referrer) {
      const domain = new URL(referrer).hostname;
      if (!form.validateDomain(domain)) {
        return res.status(403).json({
          success: false,
          message: 'Dominio no autorizado'
        });
      }
    }

    // Verificar autenticación si es requerida
    if (form.require_auth && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    const { submission_data } = req.body;
    let videoId = null;

    // Manejar upload de video si está habilitado
    if (form.video_upload_enabled && req.file) {
      try {
        // Crear registro de video
        const video = await Video.create({
          title: `Video de contacto - ${form.title}`,
          filename: req.file.filename,
          original_filename: req.file.originalname,
          file_path: req.file.path,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          user_id: req.user ? req.user.id : null,
          status: 'uploaded',
          is_public: false
        });
        
        videoId = video.id;
      } catch (videoError) {
        console.error('Error creando video:', videoError);
        // Continuar sin video si hay error
      }
    }

    // Crear envío
    const submission = await ContactSubmission.create({
      contact_form_id: formId,
      submission_data,
      video_id: videoId,
      user_id: req.user ? req.user.id : null,
      ip_address: clientIp,
      user_agent: userAgent,
      referrer
    });

    // Incrementar contador del formulario
    await form.incrementSubmissionCount();

    // Enviar notificaciones
    await sendNotifications(form, submission);

    res.status(201).json({
      success: true,
      message: form.success_message || 'Formulario enviado exitosamente',
      data: {
        submission_id: submission.id,
        redirect_url: form.redirect_url
      }
    });
  } catch (error) {
    console.error('Error enviando formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener envíos de un formulario
exports.getFormSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 20, status, priority } = req.query;
    const offset = (page - 1) * limit;

    // Verificar que el formulario pertenece al usuario
    const form = await ContactForm.findOne({
      where: {
        id: formId,
        user_id: req.user.id
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const { rows: submissions, count } = await ContactSubmission.getByFormId(formId, {
      status,
      priority,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo envíos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de un formulario
exports.getFormStats = async (req, res) => {
  try {
    const { formId } = req.params;
    const { days = 30 } = req.query;

    // Verificar que el formulario pertenece al usuario
    const form = await ContactForm.findOne({
      where: {
        id: formId,
        user_id: req.user.id
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const stats = await ContactSubmission.getStatsByFormId(formId, parseInt(days));

    res.json({
      success: true,
      data: {
        form_info: {
          id: form.id,
          name: form.form_name,
          title: form.title,
          total_submissions: form.submission_count,
          last_submission: form.last_submission_at
        },
        stats
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar estado de envío
exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, priority, notes, tags } = req.body;

    const submission = await ContactSubmission.findOne({
      where: { id: submissionId },
      include: [
        {
          model: ContactForm,
          as: 'contactForm',
          where: { user_id: req.user.id }
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Envío no encontrado'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;

    await submission.update(updateData);

    // Marcar como leído si cambia de pending
    if (status && status !== 'pending' && submission.status === 'pending') {
      await submission.markAsRead();
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: { submission }
    });
  } catch (error) {
    console.error('Error actualizando envío:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función auxiliar para enviar notificaciones
async function sendNotifications(form, submission) {
  try {
    // Enviar email si está configurado
    if (form.email_notifications && form.email_notifications.enabled) {
      const transporter = createEmailTransporter();
      if (transporter) {
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: form.email_notifications.recipients || form.user.email,
          subject: `Nuevo envío en formulario: ${form.title}`,
          html: generateEmailTemplate(form, submission)
        };

        await transporter.sendMail(mailOptions);
        await submission.update({ email_sent: true });
      }
    }

    // Enviar webhook si está configurado
    if (form.webhook_url) {
      try {
        await axios.post(form.webhook_url, {
          form_id: form.id,
          form_name: form.form_name,
          submission_id: submission.id,
          submission_data: submission.submission_data,
          created_at: submission.createdAt
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Hostreamly-ContactForm/1.0'
          }
        });
        
        await submission.update({ webhook_sent: true });
      } catch (webhookError) {
        console.error('Error enviando webhook:', webhookError);
      }
    }

    // Enviar respuesta automática si está configurada
    if (form.auto_response && form.auto_response.enabled) {
      const transporter = createEmailTransporter();
      if (transporter && submission.submission_data.email) {
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: submission.submission_data.email,
          subject: form.auto_response.subject || 'Gracias por contactarnos',
          html: form.auto_response.message || 'Hemos recibido tu mensaje y te responderemos pronto.'
        };

        await transporter.sendMail(mailOptions);
        await submission.update({ auto_response_sent: true });
      }
    }
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
  }
}

// Generar template de email
function generateEmailTemplate(form, submission) {
  let html = `
    <h2>Nuevo envío en formulario: ${form.title}</h2>
    <p><strong>Formulario:</strong> ${form.form_name}</p>
    <p><strong>Fecha:</strong> ${submission.createdAt.toLocaleString()}</p>
    <p><strong>IP:</strong> ${submission.ip_address}</p>
    
    <h3>Datos del formulario:</h3>
    <table border="1" cellpadding="5" cellspacing="0">
  `;
  
  Object.keys(submission.submission_data).forEach(key => {
    html += `
      <tr>
        <td><strong>${key}:</strong></td>
        <td>${submission.submission_data[key]}</td>
      </tr>
    `;
  });
  
  html += `
    </table>
    
    ${submission.video_id ? '<p><strong>Video adjunto:</strong> Sí</p>' : ''}
  `;
  
  return html;
}

// Middleware de upload
exports.uploadMiddleware = upload.single('video');

module.exports = exports;