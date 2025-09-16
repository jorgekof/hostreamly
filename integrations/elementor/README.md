# Hostreamly Elementor Integration

## Descripción

Este plugin proporciona widgets nativos de Elementor para la gestión de medios Hostreamly con funcionalidad de arrastrar y soltar.

## Archivos Creados para Resolver Errores de Intelephense

### 1. WordPress Function Stubs
- **Archivo**: `includes/wordpress-stubs.php`
- **Propósito**: Proporciona definiciones de funciones de WordPress para soporte de IDE
- **Resuelve**: Errores de "función no definida" para funciones como `plugin_dir_path`, `add_action`, etc.

### 2. Configuración de Intelephense
- **Archivo**: `.intelephense`
- **Propósito**: Configura el analizador PHP Intelephense
- **Incluye**: Stubs de WordPress, rutas de inclusión y exclusiones de archivos

### 3. Configuración de PHP CodeSniffer
- **Archivo**: `phpcs.xml`
- **Propósito**: Define estándares de codificación para el proyecto
- **Incluye**: Reglas de WordPress Coding Standards con exclusiones apropiadas

## Widgets Implementados

### Widgets Principales
1. **Video Player** - `class-video-player.php`
2. **Video Gallery** - `class-video-gallery.php`
3. **Video Carousel** - `class-video-carousel.php`
4. **Video Grid** - `class-video-grid.php` ✨ *Nuevo*
5. **Video Testimonials** - `class-video-testimonials.php` ✨ *Nuevo*
6. **Video Background** - `class-video-background.php` ✨ *Nuevo*

### Controles Personalizados
1. **Video Selector** - `class-video-selector.php`
2. **Playlist Selector** - `class-playlist-selector.php` ✨ *Nuevo*

### Extensiones
1. **Section Video Background** - `class-section-video-background.php` ✨ *Nuevo*
2. **Column Video Background** - `class-column-video-background.php` ✨ *Nuevo*

## Errores Resueltos

### ✅ Funciones WordPress No Definidas
- `plugin_dir_path()`
- `plugin_dir_url()`
- `add_action()`
- `did_action()`
- `version_compare()`
- `load_plugin_textdomain()`
- `plugin_basename()`
- Y muchas más...

### ✅ Constantes No Definidas
- `ELEMENTOR_VERSION`
- `ABSPATH`
- `PHP_VERSION`

### ✅ Archivos Faltantes
- Todos los widgets referenciados en el código principal
- Controles personalizados
- Extensiones para secciones y columnas

### ✅ Clases Elementor No Definidas
- `Widget_Base`
- `Controls_Manager`
- `Repeater`
- `Element_Base`

## Instalación y Uso

1. **Activar el Plugin**: Coloca la carpeta en `/wp-content/plugins/` y activa desde el admin de WordPress
2. **Verificar Elementor**: Asegúrate de que Elementor esté instalado y activado
3. **Usar Widgets**: Los widgets aparecerán en la categoría "Hostreamly" en Elementor

## Desarrollo

### Requisitos
- WordPress 5.0+
- Elementor 3.0.0+
- PHP 7.4+

### Estructura de Archivos
```
hostreamly-elementor/
├── hostreamly-elementor.php     # Archivo principal del plugin
├── includes/
│   ├── wordpress-stubs.php      # Stubs para IDE
│   ├── class-widgets-manager.php
│   ├── widgets/                 # Widgets de Elementor
│   ├── controls/               # Controles personalizados
│   └── extensions/             # Extensiones para elementos
├── assets/                     # CSS, JS, imágenes
├── languages/                  # Archivos de traducción
├── .intelephense              # Configuración IDE
├── phpcs.xml                  # Estándares de código
└── README.md                  # Este archivo
```

### Notas para Desarrolladores

1. **Stubs de WordPress**: El archivo `wordpress-stubs.php` solo se carga en modo debug cuando las funciones de WordPress no están disponibles
2. **Configuración IDE**: El archivo `.intelephense` mejora el soporte del IDE para el desarrollo
3. **Estándares de Código**: Usa `phpcs.xml` para mantener consistencia en el código
4. **Widgets Extensibles**: Todos los widgets siguen el patrón estándar de Elementor para fácil extensión

## Contribuir

Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Sigue los estándares de código definidos en `phpcs.xml`
4. Envía un pull request

## Licencia

MIT License - Ver archivo LICENSE para más detalles.