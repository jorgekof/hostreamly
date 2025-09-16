# BunnyVault WooCommerce Integration

Integración completa de BunnyVault con WooCommerce que permite agregar videos a productos, crear galerías de videos y mejorar las conversiones mediante contenido multimedia atractivo.

## 🚀 Características Principales

### Videos en Productos
- **Video Principal**: Agrega un video destacado a cualquier producto
- **Galería de Videos**: Múltiples videos por producto con ordenamiento drag-and-drop
- **Posicionamiento Flexible**: Videos antes/después de imágenes, descripción o tabs
- **Reproducción Automática**: Control inteligente basado en visibilidad
- **Diseño Responsivo**: Adaptación automática a todos los dispositivos

### Shortcodes Especializados
- `[bunnyvault-product]` - Videos específicos de productos
- `[bunnyvault-gallery]` - Galerías de videos de productos
- `[bunnyvault-category]` - Videos por categoría de productos
- `[bunnyvault-testimonial]` - Videos de testimonios de clientes
- `[bunnyvault-auto]` - Inserción automática basada en SKU/ID

### Analytics y Conversiones
- **Seguimiento de Visualizaciones**: Métricas detalladas por video y producto
- **Análisis de Conversiones**: Correlación entre videos y ventas
- **Dashboard de Analytics**: Reportes visuales en tiempo real
- **Integración con GA/Facebook Pixel**: Eventos personalizados

### Optimización de Rendimiento
- **Lazy Loading**: Carga diferida para mejorar velocidad
- **CDN Optimizado**: Entrega rápida desde BunnyVault
- **Caché Inteligente**: Reducción de llamadas API
- **Compresión Automática**: Videos optimizados por dispositivo

## 📦 Instalación

### Requisitos
- WordPress 5.0+
- WooCommerce 4.0+
- PHP 7.4+
- Cuenta activa de BunnyVault

### Instalación Manual

1. **Descarga los archivos**:
   ```bash
   # Copia la carpeta woocommerce a tu directorio de plugins
   cp -r integrations/woocommerce /wp-content/plugins/bunnyvault-woocommerce/
   ```

2. **Activa el plugin**:
   - Ve a `Plugins > Plugins Instalados`
   - Busca "BunnyVault WooCommerce"
   - Haz clic en "Activar"

3. **Configura la API**:
   - Ve a `WooCommerce > BunnyVault Settings`
   - Ingresa tu API Key de BunnyVault
   - Configura la URL de tu biblioteca de medios
   - Guarda los cambios

### Instalación vía FTP

1. Sube la carpeta `woocommerce` a `/wp-content/plugins/bunnyvault-woocommerce/`
2. Activa el plugin desde el panel de WordPress
3. Configura las credenciales de API

## 🎯 Uso Básico

### Agregar Videos a Productos

1. **Edita un producto** en WooCommerce
2. **Busca el metabox "BunnyVault Videos"** en la página de edición
3. **Selecciona un video principal**:
   - Haz clic en "Seleccionar Video"
   - Elige de tu biblioteca de BunnyVault
   - Configura opciones (autoplay, muted, etc.)

4. **Agrega videos a la galería**:
   - Haz clic en "Agregar a Galería"
   - Selecciona múltiples videos
   - Arrastra para reordenar

5. **Configura la posición**:
   - Antes de las imágenes del producto
   - Después de las imágenes
   - En la descripción
   - En un tab personalizado

### Usando Shortcodes

#### Video de Producto Específico
```php
// Video básico
[bunnyvault-product id="123" video="abc123"]

// Con opciones avanzadas
[bunnyvault-product id="123" video="abc123" autoplay="true" responsive="true" class="mi-video-personalizado"]
```

#### Galería de Videos
```php
// Galería automática (usa videos del producto)
[bunnyvault-gallery product="123"]

// Galería personalizada
[bunnyvault-gallery videos="abc123,def456,ghi789" columns="3"]

// Galería por categoría
[bunnyvault-gallery category="electronics" limit="6"]
```

#### Videos por Categoría
```php
// Videos de una categoría específica
[bunnyvault-category slug="smartphones" limit="4"]

// Con filtros adicionales
[bunnyvault-category slug="laptops" orderby="popularity" order="desc"]
```

#### Videos de Testimonios
```php
// Testimonios básicos
[bunnyvault-testimonial limit="3"]

// Testimonios con filtros
[bunnyvault-testimonial category="reviews" featured="true"]
```

#### Inserción Automática
```php
// Por SKU del producto
[bunnyvault-auto sku="PROD-001"]

// Por ID del producto
[bunnyvault-auto product_id="123"]

// Con fallback
[bunnyvault-auto sku="PROD-001" fallback="default-video-id"]
```

## ⚙️ Parámetros de Shortcodes

### Parámetros Comunes
| Parámetro | Tipo | Descripción | Defecto |
|-----------|------|-------------|----------|
| `responsive` | boolean | Video responsivo | `true` |
| `autoplay` | boolean | Reproducción automática | `false` |
| `muted` | boolean | Iniciar silenciado | `false` |
| `loop` | boolean | Reproducción en bucle | `false` |
| `controls` | boolean | Mostrar controles | `true` |
| `width` | integer | Ancho fijo (px) | - |
| `height` | integer | Alto fijo (px) | - |
| `class` | string | Clase CSS personalizada | - |
| `style` | string | Estilos CSS inline | - |

### Parámetros Específicos

#### bunnyvault-product
| Parámetro | Descripción |
|-----------|-------------|
| `id` | ID del producto WooCommerce |
| `video` | ID específico del video |
| `position` | Posición del video (`before_images`, `after_images`, `description`, `tab`) |

#### bunnyvault-gallery
| Parámetro | Descripción |
|-----------|-------------|
| `product` | ID del producto |
| `videos` | Lista de IDs de videos (separados por coma) |
| `category` | Slug de categoría |
| `columns` | Número de columnas (1-6) |
| `limit` | Máximo número de videos |
| `orderby` | Ordenar por (`date`, `title`, `views`, `random`) |
| `order` | Orden (`asc`, `desc`) |

#### bunnyvault-category
| Parámetro | Descripción |
|-----------|-------------|
| `slug` | Slug de la categoría |
| `include` | IDs de categorías a incluir |
| `exclude` | IDs de categorías a excluir |
| `featured` | Solo productos destacados |

## 🎨 Personalización CSS

### Clases CSS Disponibles

```css
/* Contenedor principal */
.bunnyvault-wc-container {
    /* Estilos del contenedor */
}

/* Video individual */
.bunnyvault-wc-video {
    /* Estilos del video */
}

/* Galería de videos */
.bunnyvault-wc-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

/* Item de galería */
.bunnyvault-wc-gallery-item {
    /* Estilos del item */
}

/* Video responsivo */
.bunnyvault-wc-responsive {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; /* 16:9 */
}

.bunnyvault-wc-responsive iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* Estados de carga */
.bunnyvault-wc-loading {
    /* Estilos de carga */
}

.bunnyvault-wc-error {
    /* Estilos de error */
}
```

### Personalización por Tema

#### Storefront
```css
.storefront .bunnyvault-wc-container {
    margin: 2em 0;
}

.storefront .bunnyvault-wc-gallery {
    grid-template-columns: repeat(2, 1fr);
}
```

#### Astra
```css
.ast-theme .bunnyvault-wc-video {
    border-radius: 8px;
    overflow: hidden;
}
```

#### OceanWP
```css
.oceanwp-theme .bunnyvault-wc-gallery-item {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```

## 🔧 Configuración Avanzada

### Hooks y Filtros

#### Filtros Disponibles

```php
// Modificar configuración de video
add_filter('bunnyvault_wc_video_config', function($config, $product_id) {
    if ($product_id === 123) {
        $config['autoplay'] = true;
    }
    return $config;
}, 10, 2);

// Personalizar HTML del video
add_filter('bunnyvault_wc_video_html', function($html, $video_id, $config) {
    // Modificar HTML antes de mostrar
    return $html;
}, 10, 3);

// Modificar posición del video
add_filter('bunnyvault_wc_video_position', function($position, $product_id) {
    // Cambiar posición basada en categoría del producto
    $product = wc_get_product($product_id);
    if ($product->get_category_ids() && in_array(15, $product->get_category_ids())) {
        return 'before_images';
    }
    return $position;
}, 10, 2);

// Personalizar consulta de galería
add_filter('bunnyvault_wc_gallery_query', function($args, $atts) {
    // Modificar argumentos de consulta
    return $args;
}, 10, 2);
```

#### Acciones Disponibles

```php
// Antes de mostrar video
add_action('bunnyvault_wc_before_video', function($video_id, $product_id) {
    // Código personalizado
}, 10, 2);

// Después de mostrar video
add_action('bunnyvault_wc_after_video', function($video_id, $product_id) {
    // Código personalizado
}, 10, 2);

// Al cargar galería
add_action('bunnyvault_wc_gallery_loaded', function($videos, $product_id) {
    // Procesar videos cargados
}, 10, 2);

// Al trackear visualización
add_action('bunnyvault_wc_video_viewed', function($video_id, $product_id, $user_id) {
    // Lógica personalizada de tracking
}, 10, 3);
```

### Integración con Otros Plugins

#### YITH WooCommerce Wishlist
```php
add_action('yith_wcwl_after_wishlist_form', function($product_id) {
    echo do_shortcode('[bunnyvault-product id="' . $product_id . '"]');
});
```

#### WooCommerce Product Add-ons
```php
add_filter('woocommerce_product_addons_show_grand_total', function($show_grand_total, $product_id) {
    // Mostrar video junto con add-ons
    echo do_shortcode('[bunnyvault-product id="' . $product_id . '"]');
    return $show_grand_total;
}, 10, 2);
```

## 📊 Analytics y Seguimiento

### Dashboard de Analytics

Accede a `WooCommerce > BunnyVault Analytics` para ver:

- **Métricas Generales**:
  - Total de visualizaciones
  - Tiempo total de visualización
  - Tasa de conversión
  - Revenue atribuido a videos

- **Videos Más Populares**:
  - Ranking por visualizaciones
  - Tiempo promedio de visualización
  - Tasa de engagement

- **Productos con Mejor Rendimiento**:
  - Productos con más conversiones
  - ROI por video
  - Comparativa con/sin video

### Eventos de Tracking

El plugin trackea automáticamente:

- `video_view` - Visualización de video
- `video_play` - Inicio de reproducción
- `video_engagement` - Engagement durante reproducción
- `add_to_cart_with_video` - Agregar al carrito después de ver video
- `purchase_with_video` - Compra después de ver video

### Integración con Google Analytics

```javascript
// Los eventos se envían automáticamente si GA está presente
gtag('event', 'video_view', {
  'custom_map': {'dimension1': 'bunnyvault_wc'},
  'video_id': 'abc123',
  'product_id': '456',
  'page_type': 'product'
});
```

### Integración con Facebook Pixel

```javascript
// Eventos personalizados para Facebook
fbq('trackCustom', 'BunnyVault_VideoView', {
  video_id: 'abc123',
  product_id: '456',
  value: 29.99,
  currency: 'USD'
});
```

## 🛠️ Solución de Problemas

### Problemas Comunes

#### Videos no se cargan
1. **Verifica la API Key**:
   - Ve a `WooCommerce > BunnyVault Settings`
   - Confirma que la API Key es correcta
   - Prueba la conexión

2. **Revisa los permisos**:
   - Asegúrate de que el usuario tenga permisos para ver videos
   - Verifica la configuración de privacidad en BunnyVault

3. **Comprueba la conectividad**:
   ```bash
   # Prueba la conexión desde el servidor
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.bunnyvault.com/videos
   ```

#### Videos se cargan lentamente
1. **Habilita lazy loading**:
   ```php
   add_filter('bunnyvault_wc_lazy_load', '__return_true');
   ```

2. **Optimiza el caché**:
   - Configura un plugin de caché compatible
   - Habilita compresión GZIP
   - Usa un CDN

3. **Reduce la calidad inicial**:
   ```php
   add_filter('bunnyvault_wc_default_quality', function() {
       return '720p';
   });
   ```

#### Problemas de responsive
1. **Verifica el CSS del tema**:
   ```css
   .bunnyvault-wc-responsive {
       max-width: 100% !important;
   }
   ```

2. **Ajusta breakpoints**:
   ```php
   add_filter('bunnyvault_wc_responsive_breakpoints', function($breakpoints) {
       return [
           'mobile' => '480px',
           'tablet' => '768px',
           'desktop' => '1024px'
       ];
   });
   ```

### Modo Debug

Habilita el modo debug para obtener información detallada:

```php
// En wp-config.php
define('BUNNYVAULT_WC_DEBUG', true);

// O usando filtro
add_filter('bunnyvault_wc_debug_mode', '__return_true');
```

Esto habilitará:
- Logs detallados en `/wp-content/debug.log`
- Información de debug en la consola del navegador
- Métricas de rendimiento

### Logs y Monitoreo

```php
// Ver logs de BunnyVault
$logs = get_option('bunnyvault_wc_logs', []);
foreach ($logs as $log) {
    echo $log['timestamp'] . ': ' . $log['message'] . "\n";
}

// Limpiar logs antiguos
delete_option('bunnyvault_wc_logs');
```

## 🔄 Migración y Actualizaciones

### Migración desde Otros Plugins

#### Desde Video Plugins Genéricos
```php
// Script de migración (ejecutar una vez)
function migrate_from_generic_video_plugin() {
    $products = get_posts([
        'post_type' => 'product',
        'meta_query' => [
            [
                'key' => '_generic_video_url',
                'compare' => 'EXISTS'
            ]
        ]
    ]);
    
    foreach ($products as $product) {
        $old_url = get_post_meta($product->ID, '_generic_video_url', true);
        // Convertir URL a ID de BunnyVault
        $bunnyvault_id = convert_url_to_bunnyvault_id($old_url);
        update_post_meta($product->ID, '_bunnyvault_main_video_id', $bunnyvault_id);
    }
}
```

### Actualizaciones Automáticas

El plugin se actualiza automáticamente cuando:
- Hay nuevas versiones disponibles
- Se detectan cambios en la API de BunnyVault
- Se publican parches de seguridad

### Backup y Restauración

```php
// Backup de configuración
function backup_bunnyvault_wc_settings() {
    $settings = [
        'api_key' => get_option('bunnyvault_wc_api_key'),
        'library_url' => get_option('bunnyvault_wc_library_url'),
        'video_settings' => get_option('bunnyvault_wc_video_settings'),
        'analytics_data' => get_option('bunnyvault_wc_analytics')
    ];
    
    file_put_contents(
        WP_CONTENT_DIR . '/bunnyvault-wc-backup.json',
        json_encode($settings, JSON_PRETTY_PRINT)
    );
}

// Restaurar configuración
function restore_bunnyvault_wc_settings() {
    $backup = json_decode(
        file_get_contents(WP_CONTENT_DIR . '/bunnyvault-wc-backup.json'),
        true
    );
    
    foreach ($backup as $key => $value) {
        update_option('bunnyvault_wc_' . $key, $value);
    }
}
```

## 🚀 Rendimiento y Optimización

### Optimizaciones Automáticas

- **Lazy Loading**: Videos se cargan solo cuando son visibles
- **Preload Inteligente**: Precarga basada en comportamiento del usuario
- **Compresión Adaptiva**: Calidad ajustada según conexión
- **Caché de Metadatos**: Información de videos almacenada localmente

### Configuraciones de Rendimiento

```php
// Configurar caché de videos
add_filter('bunnyvault_wc_cache_duration', function() {
    return 3600; // 1 hora
});

// Limitar videos simultáneos
add_filter('bunnyvault_wc_max_concurrent_videos', function() {
    return 3;
});

// Configurar preload
add_filter('bunnyvault_wc_preload_strategy', function() {
    return 'metadata'; // 'none', 'metadata', 'auto'
});
```

### Monitoreo de Rendimiento

```php
// Métricas de rendimiento
$metrics = get_option('bunnyvault_wc_performance_metrics', []);
echo "Tiempo promedio de carga: " . $metrics['avg_load_time'] . "ms\n";
echo "Videos en caché: " . $metrics['cached_videos'] . "\n";
echo "Tasa de error: " . $metrics['error_rate'] . "%\n";
```

## 🔒 Seguridad

### Medidas de Seguridad Implementadas

- **Sanitización de Datos**: Todos los inputs son sanitizados
- **Validación de Nonces**: Protección CSRF en formularios
- **Escape de Salida**: Todo el output es escapado apropiadamente
- **Validación de Permisos**: Verificación de capacidades de usuario
- **Rate Limiting**: Límites en llamadas API

### Configuración de Seguridad

```php
// Restringir acceso por rol
add_filter('bunnyvault_wc_user_can_view_video', function($can_view, $video_id, $user_id) {
    $user = get_user_by('id', $user_id);
    return in_array('customer', $user->roles) || in_array('administrator', $user->roles);
}, 10, 3);

// Configurar rate limiting
add_filter('bunnyvault_wc_rate_limit', function() {
    return [
        'requests_per_minute' => 60,
        'requests_per_hour' => 1000
    ];
});
```

### Auditoría y Logs

```php
// Log de acciones importantes
add_action('bunnyvault_wc_video_viewed', function($video_id, $product_id, $user_id) {
    error_log(sprintf(
        'BunnyVault: User %d viewed video %s for product %d',
        $user_id,
        $video_id,
        $product_id
    ));
});
```

## 📈 Casos de Uso Avanzados

### E-commerce de Moda
```php
// Videos de productos por temporada
add_filter('bunnyvault_wc_seasonal_videos', function($video_id, $product_id) {
    $season = get_current_season();
    $seasonal_video = get_post_meta($product_id, '_bunnyvault_video_' . $season, true);
    return $seasonal_video ?: $video_id;
}, 10, 2);
```

### Productos Técnicos
```php
// Videos de instalación/tutorial
add_action('woocommerce_single_product_summary', function() {
    global $product;
    if ($product->get_attribute('requires_installation')) {
        echo do_shortcode('[bunnyvault-product id="' . $product->get_id() . '" type="tutorial"]');
    }
}, 25);
```

### Marketplace Multi-vendor
```php
// Videos por vendor
add_filter('bunnyvault_wc_vendor_videos', function($videos, $vendor_id) {
    return get_user_meta($vendor_id, 'bunnyvault_videos', true) ?: [];
}, 10, 2);
```

## 🤝 Soporte y Comunidad

### Obtener Ayuda

- **Documentación**: [docs.bunnyvault.com/woocommerce](https://docs.bunnyvault.com/woocommerce)
- **Foro de Soporte**: [community.bunnyvault.com](https://community.bunnyvault.com)
- **Email**: support@bunnyvault.com
- **Chat en Vivo**: Disponible en el dashboard de BunnyVault

### Reportar Bugs

1. Ve a [GitHub Issues](https://github.com/bunnyvault/woocommerce-integration/issues)
2. Busca si el problema ya fue reportado
3. Crea un nuevo issue con:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Información del entorno (WordPress, WooCommerce, PHP versions)
   - Screenshots o videos si es aplicable

### Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📝 Changelog

### v2.0.0 (2024-01-15)
- ✨ Nueva integración completa con WooCommerce
- 🚀 Shortcodes especializados para e-commerce
- 📊 Dashboard de analytics avanzado
- 🎨 Interfaz de administración renovada
- ⚡ Optimizaciones de rendimiento
- 🔒 Mejoras de seguridad

### v1.5.0 (2023-12-01)
- 🎯 Lazy loading inteligente
- 📱 Mejoras en responsive design
- 🔧 Nuevos hooks y filtros
- 🐛 Corrección de bugs menores

### v1.0.0 (2023-10-15)
- 🎉 Lanzamiento inicial
- 📹 Soporte básico para videos en productos
- 🛒 Integración con carrito de compras
- 📈 Tracking básico de conversiones

## 📄 Licencia

Este plugin está licenciado bajo la [GPL v3 License](LICENSE).

## 🙏 Agradecimientos

- Equipo de WooCommerce por la excelente plataforma
- Comunidad de WordPress por el ecosistema
- Beta testers y early adopters
- Todos los contribuidores del proyecto

---

**¿Necesitas ayuda?** Contacta nuestro equipo de soporte en support@bunnyvault.com o visita nuestra [documentación completa](https://docs.bunnyvault.com/woocommerce).

**¿Te gusta el plugin?** ¡Déjanos una reseña de 5 estrellas en WordPress.org! ⭐⭐⭐⭐⭐