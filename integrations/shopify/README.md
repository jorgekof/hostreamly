# Hostreamly Shopify App

Aplicación de Shopify para integrar videos de Hostreamly directamente en tu tienda, permitiendo mostrar videos de productos de manera profesional y optimizada.

## 🚀 Características

- **Integración directa**: Conecta tu cuenta de Hostreamly con Shopify
- **Selección de videos**: Navega y selecciona videos desde tu biblioteca de Hostreamly
- **Códigos de incrustación**: Genera automáticamente códigos embed optimizados
- **Responsive**: Videos que se adaptan a cualquier dispositivo
- **Vista previa**: Previsualiza videos antes de agregarlos a productos
- **Búsqueda**: Encuentra rápidamente videos por título o descripción

## 📋 Requisitos

- Node.js 16.0.0 o superior
- Cuenta de Shopify Partner
- Cuenta de Hostreamly con API key
- Tienda de desarrollo de Shopify

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/hostreamly/shopify-app.git
cd shopify-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Configuración de Shopify
SHOPIFY_API_KEY=tu_api_key_de_shopify
SHOPIFY_API_SECRET=tu_api_secret_de_shopify
SHOPIFY_WEBHOOK_SECRET=tu_webhook_secret
SHOPIFY_APP_URL=https://tu-dominio-de-app.com

# Configuración de Hostreamly
HOSTREAMLY_API_BASE=http://localhost:5000/api
HOSTREAMLY_API_KEY=tu_api_key_de_hostreamly
```

### 4. Crear aplicación en Shopify Partners

1. Ve a [Shopify Partners](https://partners.shopify.com/)
2. Crea una nueva aplicación
3. Configura la URL de la aplicación: `https://tu-dominio.com`
4. Configura la URL de redirección: `https://tu-dominio.com/auth/callback`
5. Copia el API Key y API Secret al archivo `.env`

### 5. Configurar webhooks

En el panel de Shopify Partners, configura los siguientes webhooks:

- **products/create**: `https://tu-dominio.com/webhooks/products/create`
- **products/update**: `https://tu-dominio.com/webhooks/products/update`
- **app/uninstalled**: `https://tu-dominio.com/webhooks/app/uninstalled`

### 6. Ejecutar la aplicación

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🔧 Configuración de Hostreamly

### Obtener API Key

1. Inicia sesión en tu cuenta de Hostreamly
2. Ve a **Configuración** > **API Keys**
3. Genera una nueva API key con permisos de lectura de videos
4. Copia la API key al archivo `.env`

### Configurar webhooks (opcional)

Para recibir notificaciones en tiempo real:

1. En Hostreamly, ve a **Configuración** > **Webhooks**
2. Agrega un nuevo webhook: `https://tu-dominio.com/webhooks/hostreamly`
3. Selecciona los eventos: `video.created`, `video.processed`, `video.updated`

## 📱 Uso de la aplicación

### Para comerciantes

1. **Instalar la app**: Busca "Hostreamly Video Integration" en la Shopify App Store
2. **Conectar cuenta**: Autoriza la conexión con tu cuenta de Hostreamly
3. **Seleccionar videos**: Navega por tu biblioteca de videos
4. **Agregar a productos**: Selecciona videos y agrégalos a tus productos
5. **Personalizar**: Ajusta el tamaño y configuración de reproducción

### Para desarrolladores

#### Estructura de archivos

```
shopify/
├── app.js                 # Aplicación principal
├── package.json          # Dependencias
├── shopify.app.toml     # Configuración de Shopify
├── .env.example         # Variables de entorno de ejemplo
├── README.md            # Documentación
├── public/              # Archivos estáticos
├── views/               # Plantillas (si usas un motor de plantillas)
└── tests/               # Pruebas unitarias
```

#### API Endpoints

- `GET /` - Página principal de la app
- `GET /auth` - Iniciar autenticación OAuth
- `GET /auth/callback` - Callback de autenticación
- `GET /api/videos` - Obtener videos de Hostreamly
- `POST /api/embed-code` - Generar código de incrustación
- `GET /preview/:videoId` - Vista previa de video
- `POST /webhooks/products/create` - Webhook de producto creado
- `POST /webhooks/products/update` - Webhook de producto actualizado

## 🔒 Seguridad

### Verificación de webhooks

Todos los webhooks de Shopify son verificados usando HMAC SHA256:

```javascript
function verifyShopifyWebhook(data, hmacHeader) {
  const calculated_hmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(data, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(calculated_hmac),
    Buffer.from(hmacHeader)
  );
}
```

### Rate limiting

La aplicación incluye rate limiting para prevenir abuso:

- **API general**: 100 requests por minuto
- **Webhooks**: 200 requests por minuto
- **Autenticación**: 10 requests por minuto

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con cobertura
npm run test:coverage
```

## 📦 Despliegue

### Heroku

```bash
# Crear aplicación
heroku create tu-app-name

# Configurar variables de entorno
heroku config:set SHOPIFY_API_KEY=tu_api_key
heroku config:set SHOPIFY_API_SECRET=tu_api_secret
heroku config:set HOSTREAMLY_API_KEY=tu_hostreamly_key

# Desplegar
git push heroku main
```

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en el dashboard de Vercel
```

### Docker

```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

## 🐛 Solución de problemas

### Error de autenticación

- Verifica que el API Key y Secret sean correctos
- Asegúrate de que la URL de redirección esté configurada correctamente
- Revisa que los scopes sean los necesarios

### Videos no se cargan

- Verifica la API key de Hostreamly
- Comprueba que la URL base de la API sea correcta
- Revisa los logs para errores de conexión

### Webhooks no funcionan

- Verifica que la URL del webhook sea accesible públicamente
- Comprueba que el webhook secret sea correcto
- Revisa los logs de Shopify para errores de entrega

## 📞 Soporte

- **Documentación**: [docs.hostreamly.com](https://docs.hostreamly.com)
- **Email**: support@hostreamly.com
- **GitHub Issues**: [github.com/hostreamly/shopify-app/issues](https://github.com/hostreamly/shopify-app/issues)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📈 Roadmap

- [ ] Soporte para múltiples videos por producto
- [ ] Integración con Shopify Flow
- [ ] Analytics avanzados
- [ ] Personalización de player
- [ ] Soporte para livestreams
- [ ] Integración con Shopify POS