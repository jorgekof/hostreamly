// Configuración para DigitalOcean Services
// Recomendación: DigitalOcean Spaces para almacenamiento de archivos web

const AWS = require('aws-sdk');
const credentials = require('./digitalocean-credentials');

// Configuración de DigitalOcean Spaces (compatible con S3)
const s3 = new AWS.S3({
  endpoint: credentials.endpoint,
  accessKeyId: credentials.accessKeyId,
  secretAccessKey: credentials.secretAccessKey,
  region: credentials.region,
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

// Configuración del bucket de Spaces
const SPACES_CONFIG = {
  bucketName: process.env.DO_SPACES_BUCKET || 'hostreamly-storage',
  region: 'nyc3',
  cdnEndpoint: `https://${process.env.DO_SPACES_BUCKET}.nyc3.cdn.digitaloceanspaces.com`,
  // Configuración de precios y límites
  pricing: {
    baseCost: 5, // $5/mes base
    storageIncluded: 250, // 250 GiB incluidos
    transferIncluded: 1024, // 1 TiB de transferencia incluida
    additionalStorageCost: 0.02, // $0.02 por GiB adicional
    additionalTransferCost: 0.01 // $0.01 por GiB adicional
  }
};

// Funciones para gestión de archivos
class DigitalOceanSpaces {
  constructor() {
    this.s3 = s3;
    this.bucketName = SPACES_CONFIG.bucketName;
  }

  // Subir archivo a Spaces
  async uploadFile(file, key, options = {}) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ACL: options.public ? 'public-read' : 'private',
      ContentType: options.contentType || 'application/octet-stream',
      CacheControl: options.cacheControl || 'max-age=31536000'
    };

    try {
      const result = await this.s3.upload(params).promise();
      return {
        success: true,
        url: result.Location,
        cdnUrl: `${SPACES_CONFIG.cdnEndpoint}/${key}`,
        key: key
      };
    } catch (error) {
      console.error('Error uploading to Spaces:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener archivo de Spaces
  async getFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      const result = await this.s3.getObject(params).promise();
      return { success: true, data: result.Body };
    } catch (error) {
      console.error('Error getting file from Spaces:', error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar archivo de Spaces
  async deleteFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      await this.s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Error deleting file from Spaces:', error);
      return { success: false, error: error.message };
    }
  }

  // Generar URL firmada para acceso temporal
  generateSignedUrl(key, expiresIn = 3600) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  // Listar archivos en el bucket
  async listFiles(prefix = '', maxKeys = 1000) {
    const params = {
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys
    };

    try {
      const result = await this.s3.listObjectsV2(params).promise();
      return {
        success: true,
        files: result.Contents.map(item => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          url: `${SPACES_CONFIG.cdnEndpoint}/${item.Key}`
        }))
      };
    } catch (error) {
      console.error('Error listing files from Spaces:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  DigitalOceanSpaces,
  SPACES_CONFIG,
  s3
};