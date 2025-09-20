// 🌊 Configuración de Credenciales de DigitalOcean Spaces
// Reemplaza los valores de ejemplo con tus credenciales reales

module.exports = {
  // 🔑 Credenciales de DigitalOcean Spaces
  // Obtén estas credenciales desde: https://cloud.digitalocean.com/account/api/spaces
  
  // Tu Access Key ID de DigitalOcean Spaces
  accessKeyId: 'DO00WBENZMAW6MK9F2FU',
  
  // Tu Secret Access Key de DigitalOcean Spaces
  secretAccessKey: 'ry8YjODcKpv/leqbHcUj1lYP5C4G+UtLc6tPOGOtGqg',
  
  // Nombre de tu Space (bucket)
  spaceName: 'hostreamly',
  
  // Región donde creaste tu Space
  // Ejemplos: 'nyc3', 'ams3', 'sgp1', 'fra1', 'sfo3', 'tor1', 'blr1'
  region: 'sfo3',
  
  // URL del endpoint (se genera automáticamente basado en la región)
  // Formato: https://[region].digitaloceanspaces.com
  get endpoint() {
    return `https://hostreamly.sfo3.digitaloceanspaces.com`;
  },
  
  // URL pública de tu Space (opcional, para acceso directo a archivos)
  // Formato: https://[spaceName].[region].digitaloceanspaces.com
  get publicUrl() {
    return `https://hostreamly.sfo3.digitaloceanspaces.com`;
  }
};

// 📝 INSTRUCCIONES:
// 1. Reemplaza 'TU_ACCESS_KEY_ID_AQUI' con tu Access Key ID real
// 2. Reemplaza 'TU_SECRET_ACCESS_KEY_AQUI' con tu Secret Access Key real
// 3. Reemplaza 'TU_SPACE_NAME_AQUI' con el nombre de tu Space
// 4. Reemplaza 'TU_REGION_AQUI' con la región de tu Space (ej: 'nyc3')
// 5. Guarda el archivo después de hacer los cambios
// 6. Reinicia el servidor con: npm run dev

// ⚠️ IMPORTANTE: 
// - NO compartas este archivo en repositorios públicos
// - Añade este archivo a .gitignore si usas control de versiones
// - Mantén tus credenciales seguras y privadas

// 🔍 Para verificar que todo funciona:
// - Ve a http://localhost:8080/
// - Busca la sección de DigitalOcean en el dashboard
// - Prueba subir un archivo de prueba