<?php
/**
 * Plugin Name: Hostreamly Video Player
 * Plugin URI: https://hostreamly.com
 * Description: Integra videos de Hostreamly en WordPress mediante shortcodes e iframes. Permite insertar videos fácilmente en posts y páginas.
 * Version: 2.0.0
 * Author: Hostreamly Team
 * License: GPL v2 or later
 * Text Domain: hostreamly-video
 */

// Prevenir acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes del plugin
define('HOSTREAMLY_PLUGIN_VERSION', '1.2.0');
define('HOSTREAMLY_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HOSTREAMLY_PLUGIN_PATH', plugin_dir_path(__FILE__));

/**
 * Clase principal del plugin Hostreamly
 */
class HostreamlyVideoPlugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
        add_action('media_buttons', array($this, 'add_media_button'));
        add_action('wp_ajax_bunnyvault_insert_video', array($this, 'ajax_insert_video'));
    }
    
    /**
     * Inicializar el plugin
     */
    public function init() {
        // Registrar shortcode
        add_shortcode('hostreamly', array($this, 'render_video_shortcode'));
        
        // Agregar soporte para oEmbed
        wp_embed_register_handler('bunnyvault', '#https?://api\.bunnyvault\.com/embed/player/([a-zA-Z0-9_-]+)#i', array($this, 'oembed_handler'));
    }
    
    /**
     * Cargar scripts del frontend
     */
    public function enqueue_scripts() {
        wp_enqueue_style('bunnyvault-video-style', plugin_dir_url(__FILE__) . 'assets/bunnyvault-video.css', array(), '2.0.0');
    }
    
    /**
     * Cargar scripts del admin
     */
    public function admin_enqueue_scripts($hook) {
        if ($hook == 'post.php' || $hook == 'post-new.php') {
            wp_enqueue_script('bunnyvault-admin-js', plugin_dir_url(__FILE__) . 'assets/bunnyvault-admin.js', array('jquery'), '2.0.0', true);
            wp_localize_script('bunnyvault-admin-js', 'bunnyvault_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('bunnyvault_nonce')
            ));
        }
    }
    
    /**
     * Agregar botón en el editor
     */
    public function add_media_button() {
        echo '<button type="button" class="button bunnyvault-media-button" data-editor="content">';
        echo '<span class="wp-media-buttons-icon dashicons dashicons-video-alt3"></span> Agregar Video BunnyVault';
        echo '</button>';
    }
    
    /**
     * Shortcode principal [hostreamly]
     */
    public function render_video_shortcode($atts, $content = null) {
        $atts = shortcode_atts(array(
            'id' => '',
            'width' => '100%',
            'height' => '400',
            'responsive' => 'true',
            'autoplay' => 'false',
            'muted' => 'false',
            'controls' => 'true',
            'loop' => 'false',
            'poster' => '',
            'class' => 'bunnyvault-video'
        ), $atts, 'bunnyvault');
        
        if (empty($atts['id'])) {
            return '<p style="color: red;">Error: ID de video requerido para el shortcode [hostreamly]</p>';
        }
        
        return $this->generate_video_html($atts);
    }
    
    /**
     * Generar HTML del video
     */
    private function generate_video_html($atts) {
        $video_id = sanitize_text_field($atts['id']);
        $width = sanitize_text_field($atts['width']);
        $height = sanitize_text_field($atts['height']);
        $responsive = filter_var($atts['responsive'], FILTER_VALIDATE_BOOLEAN);
        $autoplay = filter_var($atts['autoplay'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
        $muted = filter_var($atts['muted'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
        $controls = filter_var($atts['controls'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
        $loop = filter_var($atts['loop'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
        $class = sanitize_html_class($atts['class']);
        
        // Construir URL del iframe
        $iframe_url = "https://hostreamly.com/embed/{$video_id}?";
        $params = array(
            'controls' => $controls,
            'autoplay' => $autoplay,
            'muted' => $muted,
            'loop' => $loop
        );
        $iframe_url .= http_build_query($params);
        
        if ($responsive) {
            return $this->generate_responsive_html($iframe_url, $class);
        } else {
            return $this->generate_fixed_html($iframe_url, $width, $height, $class);
        }
    }
    
    /**
     * Generar HTML responsive
     */
    private function generate_responsive_html($iframe_url, $class) {
        return sprintf(
            '<div class="%s bunnyvault-responsive">' .
            '<iframe src="%s" frameborder="0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>' .
            '</div>',
            esc_attr($class),
            esc_url($iframe_url)
        );
    }
    
    /**
     * Generar HTML con dimensiones fijas
     */
    private function generate_fixed_html($iframe_url, $width, $height, $class) {
        return sprintf(
            '<div class="%s bunnyvault-fixed" style="text-align: center; margin: 20px 0;">' .
            '<iframe src="%s" width="%s" height="%s" frameborder="0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>' .
            '</div>',
            esc_attr($class),
            esc_url($iframe_url),
            esc_attr($width),
            esc_attr($height)
        );
    }
    
    /**
     * Handler para oEmbed
     */
    public function oembed_handler($matches, $attr, $url, $rawattr) {
        $video_id = $matches[1];
        return $this->render_video_shortcode(array('id' => $video_id));
    }
    
    /**
     * AJAX para insertar video desde el editor
     */
    public function ajax_insert_video() {
        check_ajax_referer('bunnyvault_nonce', 'nonce');
        
        $video_id = sanitize_text_field($_POST['video_id']);
        $responsive = isset($_POST['responsive']) ? 'true' : 'false';
        $autoplay = isset($_POST['autoplay']) ? 'true' : 'false';
        $muted = isset($_POST['muted']) ? 'true' : 'false';
        $width = sanitize_text_field($_POST['width']) ?: '640';
        $height = sanitize_text_field($_POST['height']) ?: '360';
        
        if (empty($video_id)) {
            wp_die('ID de video requerido');
        }
        
        $shortcode = sprintf(
            '[hostreamly id="%s" responsive="%s" autoplay="%s" muted="%s" width="%s" height="%s"]',
            $video_id,
            $responsive,
            $autoplay,
            $muted,
            $width,
            $height
        );
        
        wp_send_json_success(array('shortcode' => $shortcode));
    }
}

// Inicializar el plugin
new HostreamlyVideoPlugin();

/**
 * Función de activación
 */
register_activation_hook(__FILE__, 'bunnyvault_activate');
function bunnyvault_activate() {
    // Crear tabla para estadísticas si es necesario
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'bunnyvault_stats';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        video_id varchar(100) NOT NULL,
        post_id bigint(20) NOT NULL,
        views bigint(20) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY video_id (video_id),
        KEY post_id (post_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

/**
 * Función de desactivación
 */
register_deactivation_hook(__FILE__, 'bunnyvault_deactivate');
function bunnyvault_deactivate() {
    // Limpiar cache si es necesario
    wp_cache_flush();
}
?>