# BunnyVault Moodle/LearnDash Integration

Integración completa de BunnyVault con sistemas de gestión de aprendizaje (LMS) Moodle y LearnDash, proporcionando seguimiento avanzado de progreso de videos y completación automática de lecciones.

## 🚀 Características Principales

### ✅ Seguimiento de Progreso
- **Tracking en tiempo real** del progreso de visualización de videos
- **Integración nativa** con el sistema de completación de LearnDash
- **Persistencia de datos** en base de datos personalizada
- **Métricas detalladas** de engagement y tiempo de visualización

### 🎯 Completación Automática
- **Configuración flexible** de porcentaje mínimo requerido
- **Actualización automática** del progreso de lecciones
- **Notificaciones visuales** de completación
- **Integración con certificados** y badges de LearnDash

### 📊 Analytics Avanzados
- **Dashboard de estadísticas** por curso y lección
- **Reportes de engagement** por estudiante
- **Métricas de retención** y abandono
- **Exportación de datos** para análisis externos

### 🎨 Interfaz Moderna
- **Diseño responsive** optimizado para móviles
- **Animaciones suaves** y feedback visual
- **Modo oscuro** automático
- **Accesibilidad completa** (WCAG 2.1)

## 📦 Instalación

### Requisitos Previos
- WordPress 5.0+
- PHP 7.4+
- LearnDash 3.0+ (opcional pero recomendado)
- BunnyVault Plugin Base

### Instalación Manual

1. **Descargar archivos**
   ```bash
   # Copiar la carpeta completa a tu instalación de WordPress
   cp -r integrations/moodle /wp-content/plugins/bunnyvault/integrations/
   ```

2. **Activar la integración**
   ```php
   // En tu functions.php o plugin principal
   require_once BUNNYVAULT_PATH . 'integrations/moodle/bunnyvault-moodle.php';
   ```

3. **Configurar base de datos**
   ```php
   // La tabla se crea automáticamente en la activación
   // Verificar en: wp_bunnyvault_lms_progress
   ```

## 🛠️ Configuración

### Configuración Básica

```php
// Configurar en wp-config.php o settings
define('BUNNYVAULT_LMS_MIN_PROGRESS', 80); // Porcentaje mínimo para completar
define('BUNNYVAULT_LMS_UPDATE_INTERVAL', 5000); // Intervalo de actualización (ms)
define('BUNNYVAULT_LMS_AUTO_ADVANCE', true); // Auto-avance a siguiente lección
```

### Configuración Avanzada

```php
// Personalizar comportamiento
add_filter('bunnyvault_lms_required_progress', function($progress, $lesson_id) {
    // Diferentes requisitos por lección
    $custom_requirements = [
        123 => 90, // Lección crítica requiere 90%
        456 => 60, // Lección introductoria requiere 60%
    ];
    
    return $custom_requirements[$lesson_id] ?? $progress;
}, 10, 2);

// Personalizar eventos de completación
add_action('bunnyvault_lesson_completed', function($video_id, $lesson_id, $user_id) {
    // Lógica personalizada al completar lección
    // Ej: enviar email, otorgar puntos, etc.
}, 10, 3);
```

## 📝 Uso de Shortcodes

### Shortcode Principal

```php
[bunnyvault_lms video_id="12345" lesson_id="67890"]
```

**Parámetros disponibles:**
- `video_id` (requerido): ID del video en BunnyVault
- `lesson_id` (requerido): ID de la lección en LearnDash
- `required` (opcional): Porcentaje mínimo requerido (default: 80)
- `width` (opcional): Ancho del video (default: 100%)
- `height` (opcional): Alto del video (default: auto)
- `autoplay` (opcional): Reproducción automática (default: false)
- `show_info` (opcional): Mostrar información del video (default: true)
- `show_progress` (opcional): Mostrar barra de progreso (default: true)
- `auto_advance` (opcional): Avanzar automáticamente (default: false)

### Ejemplos Avanzados

```php
// Video con requisitos personalizados
[bunnyvault_lms video_id="12345" lesson_id="67890" required="90" auto_advance="true"]

// Video sin información adicional
[bunnyvault_lms video_id="12345" lesson_id="67890" show_info="false" show_progress="false"]

// Video con dimensiones específicas
[bunnyvault_lms video_id="12345" lesson_id="67890" width="800" height="450"]
```

### Shortcode de Galería

```php
[bunnyvault_lms_gallery course_id="123" columns="3"]
```

**Parámetros:**
- `course_id` (opcional): ID del curso para filtrar
- `columns` (opcional): Número de columnas (default: 3)
- `limit` (opcional): Número máximo de videos (default: 12)
- `orderby` (opcional): Ordenar por (date, title, progress)
- `order` (opcional): Orden (ASC, DESC)

### Shortcode de Progreso

```php
[bunnyvault_course_progress course_id="123"]
```

## 🔧 API y Hooks

### Hooks de Acción

```php
// Cuando se actualiza el progreso
add_action('bunnyvault_progress_updated', function($video_id, $lesson_id, $progress, $user_id) {
    // Tu código aquí
});

// Cuando se completa una lección
add_action('bunnyvault_lesson_completed', function($video_id, $lesson_id, $user_id) {
    // Tu código aquí
});

// Antes de marcar como completado
add_action('bunnyvault_before_completion', function($video_id, $lesson_id, $user_id) {
    // Tu código aquí
});
```

### Hooks de Filtro

```php
// Modificar progreso requerido
add_filter('bunnyvault_lms_required_progress', function($progress, $lesson_id) {
    return $progress;
}, 10, 2);

// Personalizar HTML del video
add_filter('bunnyvault_lms_video_html', function($html, $video_id, $lesson_id) {
    return $html;
}, 10, 3);

// Modificar datos de progreso
add_filter('bunnyvault_lms_progress_data', function($data, $video_id, $lesson_id) {
    return $data;
}, 10, 3);
```

### Funciones de API

```php
// Obtener progreso de un usuario
$progress = bunnyvault_get_user_progress($user_id, $video_id, $lesson_id);

// Marcar lección como completada manualmente
bunnyvault_complete_lesson($user_id, $lesson_id, $video_id);

// Obtener estadísticas de curso
$stats = bunnyvault_get_course_stats($course_id);

// Resetear progreso de usuario
bunnyvault_reset_user_progress($user_id, $lesson_id);
```

## 📊 Base de Datos

### Tabla: wp_bunnyvault_lms_progress

```sql
CREATE TABLE wp_bunnyvault_lms_progress (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    user_id bigint(20) NOT NULL,
    video_id varchar(100) NOT NULL,
    lesson_id bigint(20) NOT NULL,
    progress decimal(5,2) NOT NULL DEFAULT 0.00,
    duration int(11) DEFAULT NULL,
    completed tinyint(1) DEFAULT 0,
    first_view datetime DEFAULT NULL,
    last_update datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completion_date datetime DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_progress (user_id, video_id, lesson_id),
    KEY idx_user_lesson (user_id, lesson_id),
    KEY idx_video (video_id),
    KEY idx_completed (completed)
);
```

### Consultas Útiles

```sql
-- Progreso por curso
SELECT 
    u.display_name,
    COUNT(*) as total_lessons,
    SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
    AVG(p.progress) as avg_progress
FROM wp_bunnyvault_lms_progress p
JOIN wp_users u ON p.user_id = u.ID
JOIN wp_postmeta pm ON p.lesson_id = pm.post_id
WHERE pm.meta_key = 'course_id' AND pm.meta_value = '123'
GROUP BY p.user_id;

-- Videos más vistos
SELECT 
    video_id,
    COUNT(DISTINCT user_id) as unique_viewers,
    AVG(progress) as avg_progress,
    SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completions
FROM wp_bunnyvault_lms_progress
GROUP BY video_id
ORDER BY unique_viewers DESC;
```

## 🎨 Personalización CSS

### Variables CSS Personalizables

```css
:root {
    --bunnyvault-primary-color: #3b82f6;
    --bunnyvault-success-color: #10b981;
    --bunnyvault-warning-color: #f59e0b;
    --bunnyvault-border-radius: 12px;
    --bunnyvault-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    --bunnyvault-transition: all 0.3s ease;
}
```

### Clases CSS Principales

```css
.bunnyvault-lms-container { /* Contenedor principal */ }
.bunnyvault-video-wrapper { /* Wrapper del video */ }
.bunnyvault-progress-container { /* Contenedor de progreso */ }
.bunnyvault-completion-status { /* Estado de completación */ }
.bunnyvault-success-message { /* Mensajes de éxito */ }
```

## 🔍 Troubleshooting

### Problemas Comunes

**1. El progreso no se actualiza**
```php
// Verificar que AJAX esté funcionando
console.log(bunnyvault_ajax); // Debe mostrar objeto con ajax_url y nonce

// Verificar permisos de base de datos
// La tabla wp_bunnyvault_lms_progress debe existir
```

**2. Videos no se muestran**
```php
// Verificar que el video_id sea válido
// Verificar que BunnyVault API esté respondiendo
// Revisar console del navegador para errores JavaScript
```

**3. Completación no funciona con LearnDash**
```php
// Verificar que LearnDash esté activo
if (!class_exists('SFWD_LMS')) {
    // LearnDash no está instalado
}

// Verificar que lesson_id sea válido
$lesson = get_post($lesson_id);
if (!$lesson || $lesson->post_type !== 'sfwd-lessons') {
    // ID de lección inválido
}
```

### Debug Mode

```php
// Activar debug en wp-config.php
define('BUNNYVAULT_LMS_DEBUG', true);

// Logs se guardan en: wp-content/debug.log
```

## 📈 Métricas y Analytics

### Dashboard de Estadísticas

Accede a **WordPress Admin > BunnyVault > LMS Analytics** para ver:

- 📊 Progreso general por curso
- 👥 Engagement por estudiante
- 🎥 Videos más populares
- ⏱️ Tiempo promedio de visualización
- 📈 Tasas de completación
- 📉 Puntos de abandono

### Exportar Datos

```php
// Exportar progreso de curso
$data = bunnyvault_export_course_progress($course_id);

// Exportar en CSV
bunnyvault_export_csv($data, 'course-progress.csv');
```

## 🚀 Roadmap

### Próximas Características

- [ ] **Gamificación**: Sistema de puntos y badges
- [ ] **Certificados**: Generación automática de certificados
- [ ] **Quizzes**: Integración con preguntas en video
- [ ] **Live Streaming**: Soporte para clases en vivo
- [ ] **Mobile App**: Aplicación nativa para estudiantes
- [ ] **AI Analytics**: Análisis predictivo con IA

### Integraciones Planificadas

- [ ] **Moodle Nativo**: Plugin directo para Moodle
- [ ] **Canvas LMS**: Integración con Canvas
- [ ] **Blackboard**: Soporte para Blackboard Learn
- [ ] **Google Classroom**: Integración con Google for Education

## 🤝 Contribuir

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/bunnyvault/integrations.git

# Instalar dependencias
cd integrations/moodle
npm install

# Desarrollo con watch
npm run dev

# Build para producción
npm run build
```

### Reportar Bugs

1. Usar el [Issue Tracker](https://github.com/bunnyvault/integrations/issues)
2. Incluir información del sistema
3. Pasos para reproducir el problema
4. Screenshots si es relevante

## 📄 Licencia

Este proyecto está licenciado bajo GPL v3 - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- 📧 **Email**: support@bunnyvault.com
- 💬 **Chat**: [Discord Community](https://discord.gg/bunnyvault)
- 📚 **Documentación**: [docs.bunnyvault.com](https://docs.bunnyvault.com)
- 🎥 **Tutoriales**: [YouTube Channel](https://youtube.com/bunnyvault)

---

**Desarrollado con ❤️ por el equipo de BunnyVault**