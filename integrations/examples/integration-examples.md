# 🚀 Ejemplos de Integración de Hostreamly

Esta guía proporciona ejemplos prácticos de cómo integrar Hostreamly en diferentes plataformas y frameworks.

> 📋 **Análisis Completo**: Para ver un análisis detallado de integraciones adicionales y roadmap futuro, consulta [INTEGRATION_ANALYSIS.md](../INTEGRATION_ANALYSIS.md)

## 📑 Índice de Integraciones

- [WordPress](#wordpress) - Plugin con shortcodes e iframe
- [Shopify](#shopify) - Liquid templates y apps
- [JavaScript/React](#javascript--react) - Componentes y SDK
- [Próximas Integraciones](#próximas-integraciones) - WooCommerce, LMS, Mobile

## WordPress

### 🔌 Plugin de WordPress para Hostreamly

Integración completa con shortcodes, editor visual y soporte para Gutenberg.

#### Instalación del Plugin

1. **Descarga** los archivos del plugin desde `/integrations/wordpress/`
2. **Sube** la carpeta completa a `/wp-content/plugins/hostreamly-video/`
3. **Activa** el plugin desde el panel de administración
4. **Configura** las opciones en Configuración > Hostreamly

#### Shortcode Básico

```php
// Uso más simple
[hostreamly id="your-video-id"]

// Con opciones personalizadas
[hostreamly id="abc123" width="800" height="450" autoplay="true" muted="true"]

// Video responsivo (recomendado)
[hostreamly id="abc123" responsive="true" autoplay="false"]
```

#### Parámetros del Shortcode

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `id` | string | **requerido** | ID único del video en Hostreamly |
| `width` | integer | 800 | Ancho del video en píxeles |
| `height` | integer | 450 | Alto del video en píxeles |
| `responsive` | boolean | true | Hace el video responsivo |
| `autoplay` | boolean | false | Reproducción automática |
| `muted` | boolean | false | Video silenciado por defecto |
| `loop` | boolean | false | Reproducción en bucle |
| `controls` | boolean | true | Mostrar controles del reproductor |
| `class` | string | '' | Clase CSS personalizada |

#### Ejemplos Avanzados

```php
<!-- Video de producto para WooCommerce -->
[hostreamly id="product-demo-123" responsive="true" class="product-video"]

<!-- Video de testimonio con autoplay silenciado -->
[hostreamly id="testimonial-456" autoplay="true" muted="true" loop="true"]

<!-- Video de tutorial con dimensiones fijas -->
[hostreamly id="tutorial-789" width="1200" height="675" controls="true"]

<!-- Video de fondo para hero section -->
[hostreamly id="hero-bg-001" autoplay="true" muted="true" loop="true" controls="false"]
```

#### Integración con Editor Gutenberg

El plugin incluye un bloque nativo para Gutenberg:

1. **Agrega** un nuevo bloque
2. **Busca** "Hostreamly Video"
3. **Ingresa** el ID del video
4. **Configura** las opciones visuales
5. **Publica** o actualiza la página

#### Integración con Editor Clásico

1. **Haz clic** en el botón "Agregar Video Hostreamly" en la barra de herramientas
2. **Completa** el formulario modal:
   - ID del video
   - Opciones de reproducción
   - Dimensiones
3. **Inserta** el shortcode automáticamente

#### Iframe Directo (Alternativa)

Si prefieres usar iframes directamente:

```html
<!-- Iframe básico -->
<iframe 
  src="https://hostreamly.com/embed/your-video-id" 
  width="800" 
  height="450" 
  frameborder="0" 
  allowfullscreen>
</iframe>

<!-- Iframe responsivo con CSS -->
<div class="hostreamly-responsive">
  <iframe 
    src="https://hostreamly.com/embed/your-video-id?autoplay=1&muted=1" 
    frameborder="0" 
    allowfullscreen>
  </iframe>
</div>

<style>
.hostreamly-responsive {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}

.hostreamly-responsive iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
```

#### Personalización CSS

```css
/* Estilos para el contenedor del video */
.hostreamly-video-container {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Estilos para videos responsivos */
.hostreamly-responsive {
  background: #000;
  transition: all 0.3s ease;
}

.hostreamly-responsive:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Estilos para diferentes tamaños */
.hostreamly-small { max-width: 400px; }
.hostreamly-medium { max-width: 800px; }
.hostreamly-large { max-width: 1200px; }
.hostreamly-full { width: 100%; }
```

#### Hooks y Filtros para Desarrolladores

```php
// Modificar parámetros por defecto
add_filter('hostreamly_default_params', function($params) {
    $params['autoplay'] = false;
    $params['muted'] = true;
    return $params;
});

// Personalizar HTML del embed
add_filter('hostreamly_embed_html', function($html, $video_id, $params) {
    // Agregar tracking analytics
    $html .= '<script>gtag("event", "video_view", {"video_id": "' . $video_id . '"});</script>';
    return $html;
}, 10, 3);

// Acción después de insertar video
add_action('hostreamly_video_inserted', function($video_id, $post_id) {
    // Log para analytics
    error_log("Video {$video_id} insertado en post {$post_id}");
}, 10, 2);
```

#### Casos de Uso Comunes

**1. Página de Producto (WooCommerce)**
```php
// En single-product.php
echo do_shortcode('[hostreamly id="' . get_post_meta(get_the_ID(), 'product_video_id', true) . '" responsive="true" class="product-demo"]');
```

**2. Testimonios de Clientes**
```php
// En testimonials.php
$testimonials = get_posts(['post_type' => 'testimonial']);
foreach($testimonials as $testimonial) {
    $video_id = get_post_meta($testimonial->ID, 'video_id', true);
    if($video_id) {
        echo do_shortcode('[hostreamly id="' . $video_id . '" width="400" height="300"]');
    }
}
```

**3. Cursos Online (LearnDash)**
```php
// En course-content.php
add_action('learndash_lesson_content_end', function($lesson_id) {
    $video_id = get_post_meta($lesson_id, 'lesson_video', true);
    if($video_id) {
        echo do_shortcode('[hostreamly id="' . $video_id . '" responsive="true" controls="true"]');
    }
});
```

---

## Table of Contents

1. [JavaScript/HTML](#javascript-html)
2. [PHP](#php)
3. [Python](#python)
4. [Node.js](#nodejs)
5. [React](#react)
6. [Vue.js](#vuejs)
7. [Angular](#angular)
8. [Shopify](#shopify)
10. [Webflow](#webflow)
11. [Next.js](#nextjs)

---

## JavaScript/HTML

### Basic Embed

```html
<!DOCTYPE html>
<html>
<head>
    <title>Hostreamly Video Example</title>
    <script src="https://api.hostreamly.com/js/hostreamly-player.js"></script>
</head>
<body>
    <!-- Basic iframe embed -->
    <iframe 
        src="https://api.hostreamly.com/embed/player/your-video-id?width=640&height=360&controls=1" 
        width="640" 
        height="360" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay; encrypted-media">
    </iframe>

    <!-- Using JavaScript SDK -->
    <div id="hostreamly-player"></div>
    
    <script>
        const player = new HostreamlyPlayer({
            container: '#hostreamly-player',
            videoId: 'your-video-id',
            width: 640,
            height: 360,
            autoplay: false,
            controls: true,
            responsive: true
        });
        
        // Event listeners
        player.on('ready', () => {
            console.log('Player is ready');
        });
        
        player.on('play', () => {
            console.log('Video started playing');
        });
        
        player.on('ended', () => {
            console.log('Video ended');
        });
    </script>
</body>
</html>
```

### Responsive Embed

```html
<style>
.hostreamly-responsive {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
}

.hostreamly-responsive iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>

<div class="hostreamly-responsive">
    <iframe 
        src="https://api.hostreamly.com/embed/player/your-video-id" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay; encrypted-media">
    </iframe>
</div>
```

---

## PHP

### Basic Integration

```php
<?php
class HostreamlyAPI {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'https://api.hostreamly.com') {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
    }
    
    /**
     * Generate embed code for a video
     */
    public function generateEmbed($videoId, $options = []) {
        $defaults = [
            'width' => 640,
            'height' => 360,
            'autoplay' => false,
            'controls' => true,
            'responsive' => true
        ];
        
        $options = array_merge($defaults, $options);
        
        $url = $this->baseUrl . '/api/embed/generate';
        $data = [
            'videoId' => $videoId,
            'type' => 'iframe',
            'options' => $options
        ];
        
        $response = $this->makeRequest('POST', $url, $data);
        
        if ($response && $response['success']) {
            return $response['data']['embedCode'];
        }
        
        return false;
    }
    
    /**
     * Get video information
     */
    public function getVideoInfo($videoId) {
        $url = $this->baseUrl . '/api/videos/' . $videoId;
        $response = $this->makeRequest('GET', $url);
        
        if ($response && $response['success']) {
            return $response['data'];
        }
        
        return false;
    }
    
    /**
     * Get sharing URL for a video
     */
    public function getSharingUrl($videoId, $platform = null) {
        $url = $this->baseUrl . '/watch/' . $videoId;
        
        if ($platform) {
            $url .= '?utm_source=' . $platform;
        }
        
        return $url;
    }
    
    /**
     * Make HTTP request
     */
    private function makeRequest($method, $url, $data = null) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
                'User-Agent: Hostreamly-PHP-SDK/1.0'
            ]
        ]);
        
        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return json_decode($response, true);
        }
        
        return false;
    }
}

// Usage example
$hostreamly = new HostreamlyAPI('your-api-key');

// Generate embed code
$embedCode = $hostreamly->generateEmbed('your-video-id', [
    'width' => 800,
    'height' => 450,
    'autoplay' => false,
    'responsive' => true
]);

if ($embedCode) {
    echo $embedCode;
} else {
    echo 'Failed to generate embed code';
}

// Get video info
$videoInfo = $hostreamly->getVideoInfo('your-video-id');
if ($videoInfo) {
    echo '<h2>' . htmlspecialchars($videoInfo['title']) . '</h2>';
    echo '<p>' . htmlspecialchars($videoInfo['description']) . '</p>';
}
?>
```

---

## Python

### Using requests library

```python
import requests
import json
from typing import Dict, Optional, Any

class HostreamlyAPI:
    def __init__(self, api_key: str, base_url: str = 'https://api.hostreamly.com'):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'Hostreamly-Python-SDK/1.0'
        })
    
    def generate_embed(self, video_id: str, options: Optional[Dict] = None) -> Optional[str]:
        """Generate embed code for a video"""
        defaults = {
            'width': 640,
            'height': 360,
            'autoplay': False,
            'controls': True,
            'responsive': True
        }
        
        if options:
            defaults.update(options)
        
        url = f'{self.base_url}/api/embed/generate'
        data = {
            'videoId': video_id,
            'type': 'iframe',
            'options': defaults
        }
        
        try:
            response = self.session.post(url, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                return result['data']['embedCode']
        except requests.RequestException as e:
            print(f'Error generating embed: {e}')
        
        return None
    
    def get_video_info(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get video information"""
        url = f'{self.base_url}/api/videos/{video_id}'
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                return result['data']
        except requests.RequestException as e:
            print(f'Error fetching video info: {e}')
        
        return None
    
    def get_sharing_url(self, video_id: str, platform: Optional[str] = None) -> str:
        """Get sharing URL for a video"""
        url = f'{self.base_url}/watch/{video_id}'
        
        if platform:
            url += f'?utm_source={platform}'
        
        return url
    
    def get_thumbnail_url(self, video_id: str, size: str = 'medium') -> Optional[str]:
        """Get thumbnail URL for a video"""
        video_info = self.get_video_info(video_id)
        
        if video_info and 'thumbnails' in video_info:
            thumbnails = video_info['thumbnails']
            if size in thumbnails:
                return thumbnails[size]['url']
        
        return None

# Usage example
if __name__ == '__main__':
    # Initialize API client
    hostreamly = HostreamlyAPI('your-api-key')
    
    # Generate embed code
    embed_code = hostreamly.generate_embed('your-video-id', {
        'width': 800,
        'height': 450,
        'autoplay': False,
        'responsive': True
    })
    
    if embed_code:
        print('Embed code generated:')
        print(embed_code)
    else:
        print('Failed to generate embed code')
    
    # Get video information
    video_info = hostreamly.get_video_info('your-video-id')
    if video_info:
        print(f"Title: {video_info.get('title', 'N/A')}")
        print(f"Duration: {video_info.get('duration', 'N/A')} seconds")
        print(f"Views: {video_info.get('views', 0)}")
    
    # Get sharing URL
    sharing_url = hostreamly.get_sharing_url('your-video-id', 'twitter')
    print(f'Sharing URL: {sharing_url}')
```

---

## Node.js

### Using axios

```javascript
const axios = require('axios');

class HostreamlyAPI {
    constructor(apiKey, baseUrl = 'https://api.hostreamly.com') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, '');
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Hostreamly-Node-SDK/1.0'
            }
        });
    }
    
    /**
     * Generate embed code for a video
     */
    async generateEmbed(videoId, options = {}) {
        const defaults = {
            width: 640,
            height: 360,
            autoplay: false,
            controls: true,
            responsive: true
        };
        
        const mergedOptions = { ...defaults, ...options };
        
        try {
            const response = await this.client.post('/api/embed/generate', {
                videoId,
                type: 'iframe',
                options: mergedOptions
            });
            
            if (response.data.success) {
                return response.data.data.embedCode;
            }
        } catch (error) {
            console.error('Error generating embed:', error.message);
        }
        
        return null;
    }
    
    /**
     * Get video information
     */
    async getVideoInfo(videoId) {
        try {
            const response = await this.client.get(`/api/videos/${videoId}`);
            
            if (response.data.success) {
                return response.data.data;
            }
        } catch (error) {
            console.error('Error fetching video info:', error.message);
        }
        
        return null;
    }
    
    /**
     * Get sharing URL for a video
     */
    getSharingUrl(videoId, platform = null) {
        let url = `${this.baseUrl}/watch/${videoId}`;
        
        if (platform) {
            url += `?utm_source=${platform}`;
        }
        
        return url;
    }
    
    /**
     * Generate social media sharing URLs
     */
    generateSocialUrls(videoId, title = '', description = '') {
        const shareUrl = this.getSharingUrl(videoId);
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(title);
        const encodedDescription = encodeURIComponent(description);
        
        return {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
            email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
        };
    }
}

// Usage example
(async () => {
    const hostreamly = new HostreamlyAPI('your-api-key');
    
    try {
        // Generate embed code
        const embedCode = await hostreamly.generateEmbed('your-video-id', {
            width: 800,
            height: 450,
            autoplay: false,
            responsive: true
        });
        
        if (embedCode) {
            console.log('Embed code generated:');
            console.log(embedCode);
        }
        
        // Get video information
        const videoInfo = await hostreamly.getVideoInfo('your-video-id');
        if (videoInfo) {
            console.log(`Title: ${videoInfo.title || 'N/A'}`);
            console.log(`Duration: ${videoInfo.duration || 'N/A'} seconds`);
            console.log(`Views: ${videoInfo.views || 0}`);
        }
        
        // Generate social sharing URLs
        const socialUrls = hostreamly.generateSocialUrls(
            'your-video-id',
            'Check out this video!',
            'Amazing video content from Hostreamly'
        );
        
        console.log('Social sharing URLs:', socialUrls);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

module.exports = HostreamlyAPI;
```

---

## React

### React Component

```jsx
import React, { useEffect, useRef, useState } from 'react';

const HostreamlyPlayer = ({ 
    videoId, 
    width = 640, 
    height = 360, 
    autoplay = false, 
    controls = true, 
    responsive = true,
    onReady = () => {},
    onPlay = () => {},
    onPause = () => {},
    onEnded = () => {}
}) => {
    const playerRef = useRef(null);
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        // Load Hostreamly SDK
        const loadSDK = () => {
            return new Promise((resolve, reject) => {
                if (window.HostreamlyPlayer) {
                    resolve(window.HostreamlyPlayer);
                    return;
                }
                
                const script = document.createElement('script');
                script.src = 'https://api.hostreamly.com/js/hostreamly-player.js';
                script.onload = () => resolve(window.HostreamlyPlayer);
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };
        
        loadSDK()
            .then((HostreamlyPlayerClass) => {
                if (playerRef.current) {
                    const playerInstance = new HostreamlyPlayerClass({
                        container: playerRef.current,
                        videoId,
                        width,
                        height,
                        autoplay,
                        controls,
                        responsive
                    });
                    
                    // Set up event listeners
                    playerInstance.on('ready', () => {
                        setLoading(false);
                        onReady();
                    });
                    
                    playerInstance.on('play', onPlay);
                    playerInstance.on('pause', onPause);
                    playerInstance.on('ended', onEnded);
                    
                    playerInstance.on('error', (error) => {
                        setError(error.message);
                        setLoading(false);
                    });
                    
                    setPlayer(playerInstance);
                }
            })
            .catch((err) => {
                setError('Failed to load Hostreamly player');
                setLoading(false);
            });
        
        return () => {
            if (player) {
                player.destroy();
            }
        };
    }, [videoId]);
    
    if (error) {
        return (
            <div className="hostreamly-error" style={{ 
                width: responsive ? '100%' : width, 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f0f0f0',
                color: '#666',
                border: '1px solid #ddd'
            }}>
                Error: {error}
            </div>
        );
    }
    
    return (
        <div className={`hostreamly-container ${responsive ? 'responsive' : ''}`}>
            {loading && (
                <div className="hostreamly-loading" style={{
                    width: responsive ? '100%' : width,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0'
                }}>
                    Loading...
                </div>
            )}
            <div 
                ref={playerRef} 
                style={{ 
                    width: responsive ? '100%' : width, 
                    height: responsive ? 'auto' : height 
                }}
            />
        </div>
    );
};

// Usage example
const App = () => {
    const handlePlayerReady = () => {
        console.log('Player is ready!');
    };
    
    const handlePlay = () => {
        console.log('Video started playing');
    };
    
    const handleEnded = () => {
        console.log('Video ended');
    };
    
    return (
        <div className="App">
            <h1>My Video</h1>
            <HostreamlyPlayer
                videoId="your-video-id"
                width={800}
                height={450}
                responsive={true}
                autoplay={false}
                controls={true}
                onReady={handlePlayerReady}
                onPlay={handlePlay}
                onEnded={handleEnded}
            />
        </div>
    );
};

export default HostreamlyPlayer;
```

---

## Vue.js

### Vue Component

```vue
<template>
  <div class="hostreamly-container" :class="{ responsive: responsive }">
    <div v-if="loading" class="hostreamly-loading" :style="loadingStyle">
      Loading...
    </div>
    <div v-else-if="error" class="hostreamly-error" :style="errorStyle">
      Error: {{ error }}
    </div>
    <div ref="playerContainer" :style="containerStyle"></div>
  </div>
</template>

<script>
export default {
  name: 'HostreamlyPlayer',
  props: {
    videoId: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      default: 640
    },
    height: {
      type: Number,
      default: 360
    },
    autoplay: {
      type: Boolean,
      default: false
    },
    controls: {
      type: Boolean,
      default: true
    },
    responsive: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      player: null,
      loading: true,
      error: null
    };
  },
  computed: {
    containerStyle() {
      return {
        width: this.responsive ? '100%' : `${this.width}px`,
        height: this.responsive ? 'auto' : `${this.height}px`
      };
    },
    loadingStyle() {
      return {
        width: this.responsive ? '100%' : `${this.width}px`,
        height: `${this.height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0'
      };
    },
    errorStyle() {
      return {
        ...this.loadingStyle,
        color: '#666',
        border: '1px solid #ddd'
      };
    }
  },
  async mounted() {
    try {
      await this.loadSDK();
      this.initializePlayer();
    } catch (err) {
      this.error = 'Failed to load Hostreamly player';
      this.loading = false;
    }
  },
  beforeUnmount() {
    if (this.player) {
      this.player.destroy();
    }
  },
  methods: {
    loadSDK() {
      return new Promise((resolve, reject) => {
        if (window.HostreamlyPlayer) {
          resolve(window.HostreamlyPlayer);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://api.hostreamly.com/js/hostreamly-player.js';
        script.onload = () => resolve(window.HostreamlyPlayer);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },
    initializePlayer() {
      if (this.$refs.playerContainer) {
        this.player = new window.HostreamlyPlayer({
          container: this.$refs.playerContainer,
          videoId: this.videoId,
          width: this.width,
          height: this.height,
          autoplay: this.autoplay,
          controls: this.controls,
          responsive: this.responsive
        });
        
        // Set up event listeners
        this.player.on('ready', () => {
          this.loading = false;
          this.$emit('ready');
        });
        
        this.player.on('play', () => {
          this.$emit('play');
        });
        
        this.player.on('pause', () => {
          this.$emit('pause');
        });
        
        this.player.on('ended', () => {
          this.$emit('ended');
        });
        
        this.player.on('error', (error) => {
          this.error = error.message;
          this.loading = false;
          this.$emit('error', error);
        });
      }
    }
  }
};
</script>

<style scoped>
.hostreamly-container.responsive {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}

.hostreamly-container.responsive > div {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hostreamly-loading,
.hostreamly-error {
  border-radius: 4px;
  font-family: Arial, sans-serif;
}
</style>
```

---

## Angular

### Angular Component

```typescript
// hostreamly-player.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';

declare global {
  interface Window {
    HostreamlyPlayer: any;
  }
}

@Component({
  selector: 'app-hostreamly-player',
  template: `
    <div class="hostreamly-container" [class.responsive]="responsive">
      <div *ngIf="loading" class="hostreamly-loading" [ngStyle]="loadingStyle">
        Loading...
      </div>
      <div *ngIf="error" class="hostreamly-error" [ngStyle]="errorStyle">
        Error: {{ error }}
      </div>
      <div #playerContainer [ngStyle]="containerStyle"></div>
    </div>
  `,
  styles: [`
    .hostreamly-container.responsive {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
    }
    
    .hostreamly-container.responsive > div {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .hostreamly-loading,
    .hostreamly-error {
      border-radius: 4px;
      font-family: Arial, sans-serif;
    }
  `]
})
export class HostreamlyPlayerComponent implements OnInit, OnDestroy {
  @Input() videoId!: string;
  @Input() width: number = 640;
  @Input() height: number = 360;
  @Input() autoplay: boolean = false;
  @Input() controls: boolean = true;
  @Input() responsive: boolean = true;
  
  @Output() ready = new EventEmitter<void>();
  @Output() play = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() ended = new EventEmitter<void>();
  @Output() errorEvent = new EventEmitter<any>();
  
  @ViewChild('playerContainer', { static: true }) playerContainer!: ElementRef;
  
  player: any = null;
  loading: boolean = true;
  error: string | null = null;
  
  get containerStyle() {
    return {
      width: this.responsive ? '100%' : `${this.width}px`,
      height: this.responsive ? 'auto' : `${this.height}px`
    };
  }
  
  get loadingStyle() {
    return {
      width: this.responsive ? '100%' : `${this.width}px`,
      height: `${this.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0'
    };
  }
  
  get errorStyle() {
    return {
      ...this.loadingStyle,
      color: '#666',
      border: '1px solid #ddd'
    };
  }
  
  async ngOnInit() {
    try {
      await this.loadSDK();
      this.initializePlayer();
    } catch (err) {
      this.error = 'Failed to load Hostreamly player';
      this.loading = false;
    }
  }
  
  ngOnDestroy() {
    if (this.player) {
      this.player.destroy();
    }
  }
  
  private loadSDK(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (window.HostreamlyPlayer) {
        resolve(window.HostreamlyPlayer);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://api.hostreamly.com/js/hostreamly-player.js';
      script.onload = () => resolve(window.HostreamlyPlayer);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  private initializePlayer() {
    if (this.playerContainer?.nativeElement) {
      this.player = new window.HostreamlyPlayer({
        container: this.playerContainer.nativeElement,
        videoId: this.videoId,
        width: this.width,
        height: this.height,
        autoplay: this.autoplay,
        controls: this.controls,
        responsive: this.responsive
      });
      
      // Set up event listeners
      this.player.on('ready', () => {
        this.loading = false;
        this.ready.emit();
      });
      
      this.player.on('play', () => {
        this.play.emit();
      });
      
      this.player.on('pause', () => {
        this.pause.emit();
      });
      
      this.player.on('ended', () => {
        this.ended.emit();
      });
      
      this.player.on('error', (error: any) => {
        this.error = error.message;
        this.loading = false;
        this.errorEvent.emit(error);
      });
    }
  }
}
```

---





---

## Próximas Integraciones

### 🚀 En Desarrollo

Basado en nuestro [análisis de integraciones](../INTEGRATION_ANALYSIS.md), estas son las próximas integraciones planificadas:

#### 🛒 **WooCommerce** (Q1 2024)
- Shortcodes específicos para productos
- Widget de galería de videos
- Integración automática con SKU
- Mejora de conversiones hasta 35%

#### 🎨 **Elementor/Divi** (Q1 2024)
- Widget drag-and-drop nativo
- Plantillas prediseñadas
- Backgrounds de video responsivos
- Soporte para 6M+ sitios

#### 📚 **LMS Platforms** (Q2 2024)
- Moodle plugin completo
- LearnDash integration
- Tracking de progreso de video
- Certificaciones con multimedia

#### 📱 **Mobile SDKs** (Q3 2024)
- React Native components
- Flutter plugin
- Offline playback
- Mejor UX nativa

#### 🔗 **Automation** (Q3 2024)
- Zapier integration
- Make.com workflows
- Auto-upload desde cloud
- CRM synchronization

### 💡 Solicitar Nueva Integración

¿Necesitas una integración específica? 

1. **Abre un issue** en nuestro repositorio
2. **Describe** tu caso de uso
3. **Incluye** ejemplos de implementación
4. **Vota** por integraciones existentes

### 🤝 Contribuir

¿Quieres desarrollar una integración?

1. **Revisa** nuestro [análisis de integraciones](../INTEGRATION_ANALYSIS.md)
2. **Contacta** al equipo de desarrollo
3. **Sigue** nuestras guías de contribución
4. **Comparte** tu integración con la comunidad

---

## Shopify

### Liquid Template Integration

```liquid
<!-- In your product template or page -->
<div class="hostreamly-video-section">
  <h3>Product Video</h3>
  
  {% if product.metafields.custom.hostreamly_video_id %}
    <div class="hostreamly-responsive">
      <iframe 
        src="https://api.hostreamly.com/embed/player/{{ product.metafields.custom.hostreamly_video_id }}?controls=1&responsive=1" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay; encrypted-media">
      </iframe>
    </div>
  {% endif %}
</div>

<style>
.hostreamly-responsive {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  margin: 20px 0;
}

.hostreamly-responsive iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.hostreamly-video-section {
  margin: 30px 0;
}

@media (max-width: 768px) {
  .hostreamly-video-section {
    margin: 20px 0;
  }
}
</style>

<script>
// Optional: Add analytics tracking
document.addEventListener('DOMContentLoaded', function() {
  const videoIframes = document.querySelectorAll('.hostreamly-responsive iframe');
  
  videoIframes.forEach(function(iframe) {
    iframe.addEventListener('load', function() {
      // Track video load event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'video_load', {
          'event_category': 'Video',
          'event_label': 'Hostreamly Video Loaded'
        });
      }
    });
  });
});
</script>
```

---

## Webflow

### Custom Code Integration

```html
<!-- Add this to your page's custom code section -->
<div class="hostreamly-video-wrapper">
  <div id="hostreamly-player-1"></div>
</div>

<script src="https://api.hostreamly.com/js/hostreamly-player.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Hostreamly player
  const player = new HostreamlyPlayer({
    container: '#hostreamly-player-1',
    videoId: 'your-video-id', // Replace with your video ID
    width: 800,
    height: 450,
    autoplay: false,
    controls: true,
    responsive: true
  });
  
  // Optional: Add event listeners
  player.on('ready', function() {
    console.log('Hostreamly player is ready');
  });
  
  player.on('play', function() {
    // Track play event in Webflow analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'video_play', {
        'event_category': 'Video',
        'event_label': 'Hostreamly Video Play'
      });
    }
  });
});
</script>

<style>
.hostreamly-video-wrapper {
  max-width: 100%;
  margin: 2rem 0;
}

/* Responsive video container */
@media (max-width: 768px) {
  .hostreamly-video-wrapper {
    margin: 1rem 0;
  }
}
</style>
```

---

## Next.js

### Next.js Component with SSR Support

```jsx
// components/HostreamlyPlayer.js
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const HostreamlyPlayer = ({ 
    videoId, 
    width = 640, 
    height = 360, 
    autoplay = false, 
    controls = true, 
    responsive = true,
    onReady,
    onPlay,
    onPause,
    onEnded
}) => {
    const playerRef = useRef(null);
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        let mounted = true;
        
        const loadPlayer = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const { default: loadHostreamlySDK } = await import('../utils/hostreamly-sdk');
                const HostreamlyPlayerClass = await loadHostreamlySDK();
                
                if (!mounted) return;
                
                if (playerRef.current) {
                    const playerInstance = new HostreamlyPlayerClass({
                        container: playerRef.current,
                        videoId,
                        width,
                        height,
                        autoplay,
                        controls,
                        responsive
                    });
                    
                    playerInstance.on('ready', () => {
                        if (mounted) {
                            setLoading(false);
                            onReady?.();
                        }
                    });
                    
                    playerInstance.on('play', () => onPlay?.());
                    playerInstance.on('pause', () => onPause?.());
                    playerInstance.on('ended', () => onEnded?.());
                    
                    playerInstance.on('error', (error) => {
                        if (mounted) {
                            setError(error.message);
                            setLoading(false);
                        }
                    });
                    
                    setPlayer(playerInstance);
                }
            } catch (err) {
                if (mounted) {
                    setError('Failed to load Hostreamly player');
                    setLoading(false);
                }
            }
        };
        
        loadPlayer();
        
        return () => {
            mounted = false;
            if (player) {
                player.destroy();
            }
        };
    }, [videoId]);
    
    if (error) {
        return (
            <div className="hostreamly-error">
                Error: {error}
            </div>
        );
    }
    
    return (
        <div className={`hostreamly-container ${responsive ? 'responsive' : ''}`}>
            {loading && (
                <div className="hostreamly-loading">
                    Loading...
                </div>
            )}
            <div ref={playerRef} />
        </div>
    );
};

// Export as dynamic component to prevent SSR issues
export default dynamic(() => Promise.resolve(HostreamlyPlayer), {
    ssr: false,
    loading: () => <div className="hostreamly-loading">Loading player...</div>
});
```

```javascript
// utils/hostreamly-sdk.js
let sdkPromise = null;

const loadHostreamlySDK = () => {
    if (sdkPromise) {
        return sdkPromise;
    }
    
    sdkPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('SDK can only be loaded in browser environment'));
            return;
        }
        
        if (window.HostreamlyPlayer) {
            resolve(window.HostreamlyPlayer);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://api.hostreamly.com/js/hostreamly-player.js';
        script.async = true;
        
        script.onload = () => {
            if (window.HostreamlyPlayer) {
                resolve(window.HostreamlyPlayer);
            } else {
                reject(new Error('Hostreamly SDK failed to load'));
            }
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Hostreamly SDK'));
        };
        
        document.head.appendChild(script);
    });
    
    return sdkPromise;
};

export default loadHostreamlySDK;
```

---

## Additional Resources

### CSS for Responsive Videos

```css
/* Universal responsive video styles */
.hostreamly-responsive {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
    max-width: 100%;
}

.hostreamly-responsive iframe,
.hostreamly-responsive video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* Different aspect ratios */
.hostreamly-responsive.ratio-4-3 {
    padding-bottom: 75%; /* 4:3 aspect ratio */
}

.hostreamly-responsive.ratio-1-1 {
    padding-bottom: 100%; /* 1:1 aspect ratio */
}

.hostreamly-responsive.ratio-21-9 {
    padding-bottom: 42.86%; /* 21:9 aspect ratio */
}
```

### Error Handling Best Practices

```javascript
// Universal error handling for Hostreamly integrations
const handleHostreamlyError = (error, videoId) => {
    console.error('Hostreamly Error:', error);
    
    // Log to analytics service
    if (typeof gtag !== 'undefined') {
        gtag('event', 'video_error', {
            'event_category': 'Video',
            'event_label': `Error: ${error.message}`,
            'custom_parameter_1': videoId
        });
    }
    
    // Show user-friendly error message
    const errorContainer = document.querySelector('.hostreamly-error');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <h4>Video Unavailable</h4>
                <p>Sorry, this video cannot be played right now. Please try again later.</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
};
```

This comprehensive guide provides integration examples for the most popular platforms and frameworks. Each example includes proper error handling, responsive design, and best practices for production use.