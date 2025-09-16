const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// Configuración de DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('https://sfo3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: 'DO00WBENZMAW6MK9F2FU',
  secretAccessKey: 'ry8YjODcKpv/leqbHcUj1lYP5C4G+UtLc6tPOGOtGqg',
  region: 'sfo3'
});

const bucketName = 'hostreamly';
const distPath = './dist';

// Función para subir archivos recursivamente
async function uploadDirectory(dirPath, prefix = '') {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await uploadDirectory(filePath, prefix + file + '/');
    } else {
      const key = prefix + file;
      const fileContent = fs.readFileSync(filePath);
      const contentType = mime.lookup(filePath) || 'application/octet-stream';
      
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ACL: 'public-read',
        ContentType: contentType,
        CacheControl: file.includes('.') && !file.endsWith('.html') ? 'max-age=31536000' : 'max-age=0'
      };
      
      try {
        await s3.upload(params).promise();
        console.log(`✅ Subido: ${key}`);
      } catch (error) {
        console.error(`❌ Error subiendo ${key}:`, error.message);
      }
    }
  }
}

// Función principal
async function deployStatic() {
  console.log('🚀 Iniciando despliegue estático a DigitalOcean Spaces...');
  
  try {
    // Verificar que existe el directorio dist
    if (!fs.existsSync(distPath)) {
      console.error('❌ No se encontró el directorio dist. Ejecuta: npm run build');
      process.exit(1);
    }
    
    // Subir archivos
    await uploadDirectory(distPath);
    
    console.log('\n🎉 ¡Despliegue completado!');
    console.log('🌐 Tu sitio web está disponible en:');
    console.log(`   https://${bucketName}.sfo3.digitaloceanspaces.com/index.html`);
    console.log(`   https://${bucketName}.sfo3.cdn.digitaloceanspaces.com/index.html`);
    
  } catch (error) {
    console.error('❌ Error durante el despliegue:', error.message);
    process.exit(1);
  }
}

// Ejecutar despliegue
deployStatic();