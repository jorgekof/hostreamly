// Middleware para gestión de almacenamiento con DigitalOcean Spaces
const multer = require('multer');
const { DigitalOceanSpaces } = require('../../config/digitalocean');
const path = require('path');

// Inicializar DigitalOcean Spaces
const doSpaces = new DigitalOceanSpaces();

// Configuración de multer para manejo de archivos en memoria
const storage = multer.memoryStorage();

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos para streaming
  const allowedTypes = {
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
  };

  const allAllowedTypes = [...allowedTypes.video, ...allowedTypes.image, ...allowedTypes.audio];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB por defecto
  }
});

// Middleware para subir archivo a DigitalOcean Spaces
const uploadToSpaces = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const originalName = path.parse(req.file.originalname).name;
    const extension = path.extname(req.file.originalname);
    const fileName = `${originalName}-${timestamp}${extension}`;
    
    // Determinar carpeta según tipo de archivo
    let folder = 'misc';
    if (req.file.mimetype.startsWith('video/')) folder = 'videos';
    else if (req.file.mimetype.startsWith('image/')) folder = 'images';
    else if (req.file.mimetype.startsWith('audio/')) folder = 'audio';
    
    const key = `${folder}/${fileName}`;

    // Subir archivo a Spaces
    const uploadResult = await doSpaces.uploadFile(req.file.buffer, key, {
      public: true,
      contentType: req.file.mimetype,
      cacheControl: 'max-age=31536000' // Cache por 1 año
    });

    if (uploadResult.success) {
      // Agregar información del archivo subido al request
      req.uploadedFile = {
        originalName: req.file.originalname,
        fileName: fileName,
        key: key,
        url: uploadResult.url,
        cdnUrl: uploadResult.cdnUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        folder: folder
      };
      
      console.log(`Archivo subido exitosamente a Spaces: ${uploadResult.cdnUrl}`);
      next();
    } else {
      throw new Error(uploadResult.error);
    }
  } catch (error) {
    console.error('Error subiendo archivo a Spaces:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo archivo al almacenamiento',
      error: error.message
    });
  }
};

// Middleware para eliminar archivo de Spaces
const deleteFromSpaces = async (key) => {
  try {
    const result = await doSpaces.deleteFile(key);
    if (result.success) {
      console.log(`Archivo eliminado de Spaces: ${key}`);
      return true;
    } else {
      console.error(`Error eliminando archivo de Spaces: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error('Error eliminando archivo de Spaces:', error);
    return false;
  }
};

// Middleware para generar URL firmada
const generateSignedUrl = (key, expiresIn = 3600) => {
  try {
    return doSpaces.generateSignedUrl(key, expiresIn);
  } catch (error) {
    console.error('Error generando URL firmada:', error);
    return null;
  }
};

// Middleware para listar archivos
const listFiles = async (prefix = '', maxKeys = 100) => {
  try {
    const result = await doSpaces.listFiles(prefix, maxKeys);
    return result;
  } catch (error) {
    console.error('Error listando archivos de Spaces:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  upload,
  uploadToSpaces,
  deleteFromSpaces,
  generateSignedUrl,
  listFiles,
  doSpaces
};