# Hostreamly Video Player - Plugin de WordPress

🎬 **Plugin oficial de Hostreamly para WordPress** - Integra fácilmente videos de Hostreamly en tu sitio web mediante shortcodes, iframes y bloques de Gutenberg.

## 🚀 Características

- ✅ **Shortcode simple**: `[hostreamly id="tu-video-id"]`
- ✅ **Videos responsive** con aspect ratio 16:9
- ✅ **Botón integrado** en el editor de WordPress
- ✅ **Soporte para Gutenberg** (Block Editor)
- ✅ **Configuración avanzada**: autoplay, muted, loop, dimensiones personalizadas
- ✅ **Optimizado para móviles** con breakpoints responsive
- ✅ **Estilos modernos** con animaciones y efectos hover
- ✅ **Compatible con oEmbed** para URLs directas
- ✅ **Interfaz intuitiva** con modal de configuración

## 📦 Instalación

### Método 1: Instalación Manual

1. **Descarga** todos los archivos del plugin
2. **Sube** la carpeta `hostreamly-video-plugin` a `/wp-content/plugins/`
3. **Activa** el plugin desde el panel de administración de WordPress
4. ¡Listo! Ya puedes usar el shortcode `[hostreamly]`

### Método 2: Instalación por FTP

```bash
# Subir archivos vía FTP
ftp tu-servidor.com
cd public_html/wp-content/plugins/
mkdir hostreamly-video-plugin
cd hostreamly-video-plugin
# Subir todos los archivos del plugin
```

## 🎯 Uso Básico

### Shortcode Simple

```php
// Video responsive básico
[hostreamly id="abc123"]

// Video con dimensiones específicas
[hostreamly id="abc123" width="800" height="450" responsive="false"]

// Video con autoplay (silenciado automáticamente)
[hostreamly id="abc123" autoplay="true" muted="true"]

// Video en bucle
[hostreamly id="abc123" loop="true"]
```

### Usando el Editor Visual

1. **Abre** el editor de posts/páginas
2. **Haz clic** en el botón "🎬 Agregar Video Hostreamly"
3. **Ingresa** el ID de tu video
4. **Configura** las opciones (responsive, autoplay, etc.)
5. **Haz clic** en "Insertar Video"

### Usando Gutenberg (Block Editor)

1. **Agrega** un nuevo bloque
2. **Busca** "Hostreamly Video"
3. **Configura** el video en el panel lateral
4. **Publica** tu contenido

## ⚙️ Parámetros del Shortcode

| Parámetro | Tipo | Valor por Defecto | Descripción |
|-----------|------|-------------------|-------------|
| `id` | string | **requerido** | ID único del video en Hostreamly |
| `responsive` | boolean | `true` | Video responsive (16:9) |
| `width` | string | `100%` | Ancho del video (si responsive=false) |
| `height` | string | `400` | Alto del video (si responsive=false) |
| `autoplay` | boolean | `false` | Reproducción automática |
| `muted` | boolean | `false` | Video silenciado |
| `controls` | boolean | `true` | Mostrar controles del reproductor |
| `loop` | boolean | `false` | Reproducir en bucle |
| `class` | string | `hostreamly-video` | Clase CSS personalizada |

## 🎨 Personalización CSS

### Estilos Básicos

```css
/* Personalizar contenedor responsive */
.hostreamly-responsive {
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

/* Personalizar videos con dimensiones fijas */
.hostreamly-fixed iframe {
    border: 3px solid #667eea;
}

/* Hover effects personalizados */
.hostreamly-responsive:hover {
    transform: scale(1.02);
}
```

### Temas Personalizados

```css
/* Tema oscuro */
.dark-theme .hostreamly-responsive {
    background: #1a1a1a;
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
}

/* Tema minimalista */
.minimal-theme .hostreamly-responsive {
    border-radius: 0;
    box-shadow: none;
    border: 1px solid #e1e5e9;
}
```

## 🔧 Configuración Avanzada

### Hooks y Filtros

```php
// Modificar parámetros por defecto
add_filter('hostreamly_default_atts', function($atts) {
    $atts['responsive'] = 'false';
    $atts['width'] = '800';
    return $atts;
});

// Modificar HTML generado
add_filter('hostreamly_video_html', function($html, $atts) {
    // Agregar wrapper personalizado
    return '<div class="mi-wrapper-personalizado">' . $html . '</div>';
}, 10, 2);

// Ejecutar acción después de insertar video
add_action('hostreamly_video_inserted', function($video_id, $post_id) {
    // Registrar estadística, enviar notificación, etc.
    error_log("Video {$video_id} insertado en post {$post_id}");
}, 10, 2);
```

### Configuración de Seguridad

```php
// Restringir uso del shortcode por rol
add_filter('hostreamly_can_use_shortcode', function($can_use) {
    return current_user_can('edit_posts');
});

// Validar IDs de video
add_filter('hostreamly_validate_video_id', function($is_valid, $video_id) {
    // Implementar validación personalizada
    return preg_match('/^[a-zA-Z0-9_-]{6,20}$/', $video_id);
}, 10, 2);
```

## 🌐 Soporte para oEmbed

El plugin también soporta URLs directas de Hostreamly:

```
// Simplemente pega la URL en una línea nueva
https://api.hostreamly.com/embed/player/abc123

// WordPress automáticamente la convertirá en un video
```

## 📱 Responsive Design

El plugin incluye breakpoints optimizados:

- **Desktop**: Efectos hover y sombras completas
- **Tablet** (≤768px): Bordes redondeados reducidos
- **Mobile** (≤480px): Diseño completamente optimizado

## 🔍 Troubleshooting

### Problemas Comunes

**❌ El video no se muestra**
- Verifica que el ID del video sea correcto
- Asegúrate de que el video esté publicado en Hostreamly
- Revisa la consola del navegador para errores

**❌ El autoplay no funciona**
- Los navegadores requieren que el video esté silenciado para autoplay
- Usa `autoplay="true" muted="true"`

**❌ Problemas de responsive**
- Verifica que tu tema no tenga CSS conflictivo
- Usa `responsive="true"` explícitamente

**❌ El botón no aparece en el editor**
- Desactiva y reactiva el plugin
- Limpia la caché del navegador
- Verifica que no haya conflictos con otros plugins

### Debug Mode

```php
// Activar modo debug en wp-config.php
define('HOSTREAMLY_DEBUG', true);

// Ver logs en wp-content/debug.log
```

## 🔄 Migración desde Versiones Anteriores

Si tienes una versión anterior del plugin:

1. **Desactiva** el plugin anterior
2. **Elimina** los archivos antiguos
3. **Instala** la nueva versión
4. **Reactiva** el plugin
5. Los shortcodes existentes seguirán funcionando

## 🚀 Rendimiento

- **Lazy Loading**: Los iframes se cargan solo cuando son visibles
- **CSS Optimizado**: Estilos minificados y comprimidos
- **JavaScript Asíncrono**: Scripts cargados sin bloquear la página
- **CDN Ready**: Compatible con CDNs y caching

## 🛡️ Seguridad

- **Sanitización**: Todos los inputs son sanitizados
- **Validación**: IDs de video validados con regex
- **Nonces**: Protección CSRF en formularios AJAX
- **Escape**: Output escapado para prevenir XSS

## 📊 Analytics

El plugin puede integrarse con Google Analytics:

```javascript
// Tracking automático de eventos
gtag('event', 'video_play', {
  'video_id': 'abc123',
  'video_title': 'Mi Video',
  'page_location': window.location.href
});
```

## 🤝 Soporte

- **Documentación**: [docs.hostreamly.com](https://docs.hostreamly.com)
- **Soporte**: [support@hostreamly.com](mailto:support@hostreamly.com)
- **GitHub**: [github.com/hostreamly/wordpress-plugin](https://github.com/hostreamly/wordpress-plugin)

## 📝 Changelog

### v2.0.0 (2024-01-15)
- ✅ Reescritura completa del plugin
- ✅ Soporte para Gutenberg
- ✅ Interfaz moderna con modal
- ✅ Mejor responsive design
- ✅ Hooks y filtros para desarrolladores

### v1.0.0 (2023-12-01)
- ✅ Versión inicial
- ✅ Shortcode básico
- ✅ Soporte responsive

## 📄 Licencia

GPL v2 or later - [Ver licencia completa](https://www.gnu.org/licenses/gpl-2.0.html)

---

**¿Te gusta el plugin?** ⭐ ¡Déjanos una reseña en WordPress.org!

**¿Necesitas ayuda?** 💬 Contáctanos en [support@hostreamly.com](mailto:support@hostreamly.com)