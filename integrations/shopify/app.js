const express = require('express');
const { Shopify } = require('@shopify/shopify-api');
const { ApiVersion } = require('@shopify/shopify-api');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');

/**
 * Hostreamly Shopify App
 * 
 * Aplicación básica de Shopify para integrar videos de Hostreamly
 * en tiendas de Shopify como videos de productos
 */

const app = express();
const PORT = process.env.SHOPIFY_APP_PORT || 3001;

// Configuración de Shopify
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: ['read_products', 'write_products', 'read_content', 'write_content'],
  HOST_NAME: process.env.SHOPIFY_APP_URL || 'localhost:3001',
  API_VERSION: ApiVersion.October23,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage()
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Hostreamly
const HOSTREAMLY_API_BASE = process.env.HOSTREAMLY_API_BASE || 'http://localhost:5000/api';
const HOSTREAMLY_API_KEY = process.env.HOSTREAMLY_API_KEY;

/**
 * Verificar webhook de Shopify
 */
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

/**
 * Cliente para API de Hostreamly
 */
class HostreamlyClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = HOSTREAMLY_API_BASE;
  }

  async getVideos(userId, page = 1, limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/enhanced-videos`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: { page, limit, userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching videos from Hostreamly:', error.message);
      throw error;
    }
  }

  async getVideo(videoId) {
    try {
      const response = await axios.get(`${this.baseURL}/enhanced-videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching video from Hostreamly:', error.message);
      throw error;
    }
  }

  async generateEmbedCode(videoId, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/embed/generate`, {
        videoId,
        options: {
          width: options.width || '100%',
          height: options.height || '400px',
          autoplay: options.autoplay || false,
          controls: options.controls !== false,
          responsive: options.responsive !== false,
          ...options
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating embed code:', error.message);
      throw error;
    }
  }
}

const hostreamlyClient = new HostreamlyClient(HOSTREAMLY_API_KEY);

/**
 * Ruta de instalación de la app
 */
app.get('/auth', async (req, res) => {
  try {
    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      req.query.shop,
      '/auth/callback',
      false
    );
    return res.redirect(authRoute);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

/**
 * Callback de autenticación
 */
app.get('/auth/callback', async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query
    );
    
    // Guardar sesión
    await Shopify.Utils.storeSession(session);
    
    // Redirigir a la app
    res.redirect(`/?shop=${session.shop}&host=${req.query.host}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication callback failed');
  }
});

/**
 * Página principal de la app
 */
app.get('/', (req, res) => {
  const { shop, host } = req.query;
  
  if (!shop || !host) {
    return res.status(400).send('Missing shop or host parameter');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hostreamly Video Integration</title>
      <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
      <script src="https://unpkg.com/@shopify/app-bridge-utils@3"></script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f6f6f7;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 1px solid #e1e3e5;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .video-card {
          border: 1px solid #e1e3e5;
          border-radius: 8px;
          padding: 16px;
          background: #fafbfb;
        }
        .video-thumbnail {
          width: 100%;
          height: 180px;
          background: #000;
          border-radius: 4px;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
        }
        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .video-title {
          font-weight: 600;
          margin-bottom: 8px;
          color: #202223;
        }
        .video-duration {
          color: #6d7175;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .btn {
          background: #008060;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-right: 8px;
        }
        .btn:hover {
          background: #006b4f;
        }
        .btn-secondary {
          background: #f6f6f7;
          color: #202223;
          border: 1px solid #c9cccf;
        }
        .btn-secondary:hover {
          background: #f1f2f3;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: #6d7175;
        }
        .search-bar {
          margin-bottom: 20px;
        }
        .search-bar input {
          width: 100%;
          padding: 12px;
          border: 1px solid #c9cccf;
          border-radius: 4px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Hostreamly Video Integration</h1>
          <p>Selecciona videos de Hostreamly para agregar a tus productos</p>
        </div>
        
        <div class="search-bar">
          <input type="text" id="searchInput" placeholder="Buscar videos..." onkeyup="searchVideos()">
        </div>
        
        <div id="videoList" class="loading">
          Cargando videos...
        </div>
      </div>
      
      <script>
        const app = createApp({
          apiKey: '${process.env.SHOPIFY_API_KEY}',
          host: '${host}',
          forceRedirect: true
        });
        
        let allVideos = [];
        
        // Cargar videos de Hostreamly
        async function loadVideos() {
          try {
            const response = await fetch('/api/videos');
            const data = await response.json();
            
            if (data.success) {
              allVideos = data.videos || [];
              displayVideos(allVideos);
            } else {
              document.getElementById('videoList').innerHTML = 
                '<p>Error al cargar videos: ' + (data.message || 'Error desconocido') + '</p>';
            }
          } catch (error) {
            console.error('Error loading videos:', error);
            document.getElementById('videoList').innerHTML = 
              '<p>Error al conectar con Hostreamly</p>';
          }
        }
        
        // Mostrar videos
        function displayVideos(videos) {
          const videoList = document.getElementById('videoList');
          
          if (videos.length === 0) {
            videoList.innerHTML = '<p>No se encontraron videos</p>';
            return;
          }
          
          const videoGrid = videos.map(video => \`
            <div class="video-card">
              <div class="video-thumbnail">
                <img src="\${video.thumbnail_url || '/placeholder-video.jpg'}" alt="\${video.title}">
              </div>
              <div class="video-title">\${video.title}</div>
              <div class="video-duration">\${formatDuration(video.duration)}</div>
              <button class="btn" onclick="selectVideo('\${video.id}', '\${video.title}')">Seleccionar</button>
              <button class="btn btn-secondary" onclick="previewVideo('\${video.id}')">Vista previa</button>
            </div>
          \`).join('');
          
          videoList.innerHTML = \`<div class="video-grid">\${videoGrid}</div>\`;
        }
        
        // Buscar videos
        function searchVideos() {
          const searchTerm = document.getElementById('searchInput').value.toLowerCase();
          const filteredVideos = allVideos.filter(video => 
            video.title.toLowerCase().includes(searchTerm) ||
            (video.description && video.description.toLowerCase().includes(searchTerm))
          );
          displayVideos(filteredVideos);
        }
        
        // Seleccionar video para producto
        async function selectVideo(videoId, videoTitle) {
          try {
            const response = await fetch('/api/embed-code', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ videoId })
            });
            
            const data = await response.json();
            
            if (data.success) {
              // Usar Shopify App Bridge para comunicarse con el admin
              const redirect = Redirect.create(app);
              const embedCode = encodeURIComponent(data.embedCode);
              const title = encodeURIComponent(videoTitle);
              
              // Redirigir a la página de productos con el código embed
              redirect.dispatch(Redirect.Action.ADMIN_PATH, {
                path: \`/admin/products?embed_code=\${embedCode}&video_title=\${title}\`
              });
            } else {
              alert('Error al generar código de incrustación: ' + data.message);
            }
          } catch (error) {
            console.error('Error selecting video:', error);
            alert('Error al seleccionar video');
          }
        }
        
        // Vista previa de video
        function previewVideo(videoId) {
          window.open(\`/preview/\${videoId}\`, '_blank', 'width=800,height=600');
        }
        
        // Formatear duración
        function formatDuration(seconds) {
          if (!seconds) return '0:00';
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
        }
        
        // Cargar videos al iniciar
        loadVideos();
      </script>
    </body>
    </html>
  `);
});

/**
 * API para obtener videos de Hostreamly
 */
app.get('/api/videos', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    // En una implementación real, obtendríamos el userId de la sesión de Shopify
    const userId = req.session?.userId || 'demo-user';
    
    const videos = await hostreamlyClient.getVideos(userId, page, limit);
    
    res.json({
      success: true,
      videos: videos.data || [],
      pagination: videos.pagination || {}
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener videos'
    });
  }
});

/**
 * API para generar código de incrustación
 */
app.post('/api/embed-code', async (req, res) => {
  try {
    const { videoId, options = {} } = req.body;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'videoId es requerido'
      });
    }
    
    const embedData = await hostreamlyClient.generateEmbedCode(videoId, {
      width: '100%',
      height: '400px',
      responsive: true,
      controls: true,
      ...options
    });
    
    res.json({
      success: true,
      embedCode: embedData.embedCode,
      previewUrl: embedData.previewUrl
    });
  } catch (error) {
    console.error('Error generating embed code:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar código de incrustación'
    });
  }
});

/**
 * Vista previa de video
 */
app.get('/preview/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await hostreamlyClient.getVideo(videoId);
    
    if (!video.success) {
      return res.status(404).send('Video no encontrado');
    }
    
    const embedData = await hostreamlyClient.generateEmbedCode(videoId, {
      width: '100%',
      height: '100%',
      autoplay: true,
      controls: true
    });
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vista previa: ${video.data.title}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .container { max-width: 800px; margin: 0 auto; }
          .video-container { margin-bottom: 20px; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${video.data.title}</h1>
          <div class="video-container">
            ${embedData.embedCode}
          </div>
          <p><strong>Duración:</strong> ${Math.floor(video.data.duration / 60)}:${(video.data.duration % 60).toString().padStart(2, '0')}</p>
          <p><strong>Descripción:</strong> ${video.data.description || 'Sin descripción'}</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in preview:', error);
    res.status(500).send('Error al cargar vista previa');
  }
});

/**
 * Webhook para eventos de productos de Shopify
 */
app.post('/webhooks/products/create', express.raw({ type: 'application/json' }), (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  
  if (!verifyShopifyWebhook(body, hmac)) {
    return res.status(401).send('Unauthorized');
  }
  
  const product = JSON.parse(body.toString());
  console.log('New product created:', product.title);
  
  // Aquí podrías implementar lógica para sugerir videos automáticamente
  // basándose en el título o descripción del producto
  
  res.status(200).send('OK');
});

/**
 * Webhook para eventos de productos actualizados
 */
app.post('/webhooks/products/update', express.raw({ type: 'application/json' }), (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  
  if (!verifyShopifyWebhook(body, hmac)) {
    return res.status(401).send('Unauthorized');
  }
  
  const product = JSON.parse(body.toString());
  console.log('Product updated:', product.title);
  
  res.status(200).send('OK');
});

/**
 * Manejo de errores
 */
app.use((error, req, res, next) => {
  console.error('App error:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Hostreamly Shopify App running on port ${PORT}`);
  console.log(`App URL: http://localhost:${PORT}`);
});

module.exports = app;