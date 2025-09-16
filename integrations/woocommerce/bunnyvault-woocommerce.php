<?php
/**
 * Plugin Name: Hostreamly WooCommerce Integration
 * Plugin URI: https://hostreamly.com/integrations/woocommerce
 * Description: Integración completa de Hostreamly con WooCommerce para videos de productos, galerías y conversiones mejoradas.
 * Version: 1.0.0
 * Author: Hostreamly Team
 * Author URI: https://hostreamly.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: hostreamly-woocommerce
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.5
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HOSTREAMLY_WC_VERSION', '1.0.0');
define('HOSTREAMLY_WC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HOSTREAMLY_WC_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('HOSTREAMLY_WC_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main Hostreamly WooCommerce Integration Class
 */
class Hostreamly_WooCommerce {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * Get single instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        add_action('init', array($this, 'init'));
        add_action('plugins_loaded', array($this, 'check_woocommerce'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain
        load_plugin_textdomain('hostreamly-woocommerce', false, dirname(HOSTREAMLY_WC_PLUGIN_BASENAME) . '/languages');
        
        // Initialize components
        $this->init_hooks();
        $this->init_shortcodes();
        $this->init_admin();
        $this->init_frontend();
    }
    
    /**
     * Check if WooCommerce is active
     */
    public function check_woocommerce() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return;
        }
    }
    
    /**
     * WooCommerce missing notice
     */
    public function woocommerce_missing_notice() {
        echo '<div class="notice notice-error"><p>';
        echo __('Hostreamly WooCommerce Integration requiere que WooCommerce esté instalado y activado.', 'hostreamly-woocommerce');
        echo '</p></div>';
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Product page hooks
        add_action('woocommerce_single_product_summary', array($this, 'display_product_video'), 25);
        add_action('woocommerce_product_thumbnails', array($this, 'add_video_thumbnail'));
        
        // Shop page hooks
        add_action('woocommerce_before_shop_loop_item_title', array($this, 'display_shop_video'), 15);
        
        // Cart and checkout hooks
        add_filter('woocommerce_cart_item_thumbnail', array($this, 'cart_item_video_thumbnail'), 10, 3);
        
        // Admin hooks
        add_action('add_meta_boxes', array($this, 'add_product_video_metabox'));
        add_action('save_post', array($this, 'save_product_video_meta'));
        
        // AJAX hooks
        add_action('wp_ajax_bunnyvault_wc_get_video', array($this, 'ajax_get_video'));
        add_action('wp_ajax_nopriv_bunnyvault_wc_get_video', array($this, 'ajax_get_video'));
        
        // Analytics hooks
        add_action('woocommerce_thankyou', array($this, 'track_conversion'));
    }
    
    /**
     * Initialize shortcodes
     */
    private function init_shortcodes() {
        add_shortcode('hostreamly-product', array($this, 'product_video_shortcode'));
        add_shortcode('hostreamly-gallery', array($this, 'product_gallery_shortcode'));
        add_shortcode('hostreamly-category', array($this, 'category_videos_shortcode'));
        add_shortcode('hostreamly-testimonial', array($this, 'testimonial_video_shortcode'));
        add_shortcode('hostreamly-auto', array($this, 'auto_video_shortcode'));
    }
    
    /**
     * Initialize admin features
     */
    private function init_admin() {
        if (is_admin()) {
            add_action('admin_enqueue_scripts', array($this, 'admin_scripts'));
            add_action('admin_menu', array($this, 'add_admin_menu'));
        }
    }
    
    /**
     * Initialize frontend features
     */
    private function init_frontend() {
        if (!is_admin()) {
            add_action('wp_enqueue_scripts', array($this, 'frontend_scripts'));
        }
    }
    
    /**
     * Product video shortcode
     * [hostreamly-product id="123" product_id="456" size="large"]
     */
    public function product_video_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'product_id' => get_the_ID(),
            'size' => 'medium',
            'autoplay' => 'false',
            'muted' => 'true',
            'controls' => 'true',
            'responsive' => 'true',
            'class' => 'hostreamly-product-video',
            'show_title' => 'false',
            'show_price' => 'false',
            'show_cart_button' => 'false'
        ), $atts, 'hostreamly-product');
        
        // Get video ID from product meta if not provided
        if (empty($atts['id']) && !empty($atts['product_id'])) {
            $atts['id'] = get_post_meta($atts['product_id'], '_hostreamly_video_id', true);
        }
        
        if (empty($atts['id'])) {
            return '';
        }
        
        $product = wc_get_product($atts['product_id']);
        if (!$product) {
            return '';
        }
        
        $video_html = $this->generate_video_html($atts['id'], $atts);
        
        $output = '<div class="hostreamly-wc-product-container ' . esc_attr($atts['class']) . '">';
        $output .= $video_html;
        
        // Add product info if requested
        if ($atts['show_title'] === 'true') {
            $output .= '<h3 class="hostreamly-product-title">' . $product->get_name() . '</h3>';
        }
        
        if ($atts['show_price'] === 'true') {
            $output .= '<div class="hostreamly-product-price">' . $product->get_price_html() . '</div>';
        }
        
        if ($atts['show_cart_button'] === 'true') {
            $output .= '<div class="hostreamly-add-to-cart">';
            $output .= do_shortcode('[add_to_cart id="' . $product->get_id() . '"]');
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        // Track video view
        $this->track_video_view($atts['id'], $atts['product_id']);
        
        return $output;
    }
    
    /**
     * Product gallery shortcode
     * [hostreamly-gallery category="electronics" limit="6" columns="3"]
     */
    public function product_gallery_shortcode($atts) {
        $atts = shortcode_atts(array(
            'category' => '',
            'tag' => '',
            'limit' => 12,
            'columns' => 3,
            'orderby' => 'date',
            'order' => 'DESC',
            'show_title' => 'true',
            'show_price' => 'true',
            'autoplay' => 'false',
            'muted' => 'true',
            'class' => 'hostreamly-product-gallery'
        ), $atts, 'hostreamly-gallery');
        
        // Validate and sanitize parameters
        $limit = max(1, min(50, intval($atts['limit'])));
        $columns = max(1, min(6, intval($atts['columns'])));
        $orderby = in_array($atts['orderby'], array('date', 'title', 'menu_order', 'rand')) ? $atts['orderby'] : 'date';
        $order = in_array(strtoupper($atts['order']), array('ASC', 'DESC')) ? strtoupper($atts['order']) : 'DESC';
        
        // Query products with videos
        $args = array(
            'post_type' => 'product',
            'posts_per_page' => $limit,
            'orderby' => $orderby,
            'order' => $order,
            'post_status' => 'publish',
            'meta_query' => array(
                array(
                    'key' => '_hostreamly_video_id',
                    'value' => '',
                    'compare' => '!='
                )
            )
        );
        
        // Add category filter with validation
        if (!empty($atts['category'])) {
            $categories = array_map('sanitize_text_field', explode(',', $atts['category']));
            $args['tax_query'] = array(
                array(
                    'taxonomy' => 'product_cat',
                    'field' => 'slug',
                    'terms' => $categories
                )
            );
        }
        
        // Add tag filter with validation
        if (!empty($atts['tag'])) {
            $tags = array_map('sanitize_text_field', explode(',', $atts['tag']));
            if (!isset($args['tax_query'])) {
                $args['tax_query'] = array();
            }
            $args['tax_query'][] = array(
                'taxonomy' => 'product_tag',
                'field' => 'slug',
                'terms' => $tags
            );
        }
        
        $products = get_posts($args);
        
        if (empty($products)) {
            return '<p class="hostreamly-no-videos">' . __('No se encontraron productos con videos.', 'hostreamly-woocommerce') . '</p>';
        }
        
        $output = '<div class="hostreamly-wc-gallery ' . esc_attr($atts['class']) . '" data-columns="' . $columns . '">';
        
        foreach ($products as $product_post) {
            $product = wc_get_product($product_post->ID);
            $video_id = get_post_meta($product_post->ID, '_hostreamly_video_id', true);
            
            if (!$video_id || !$product || !$product->is_visible()) continue;
            
            $output .= '<div class="hostreamly-gallery-item">';
            $output .= '<div class="hostreamly-video-wrapper">';
            $output .= $this->generate_video_html($video_id, array(
                'responsive' => 'true',
                'autoplay' => $atts['autoplay'],
                'muted' => $atts['muted'],
                'controls' => 'true',
                'class' => 'hostreamly-gallery-video'
            ));
            $output .= '</div>';
            
            if ($atts['show_title'] === 'true') {
                $output .= '<h4 class="hostreamly-gallery-title"><a href="' . esc_url(get_permalink($product_post->ID)) . '">' . esc_html($product->get_name()) . '</a></h4>';
            }
            
            if ($atts['show_price'] === 'true') {
                $output .= '<div class="hostreamly-gallery-price">' . $product->get_price_html() . '</div>';
            }
            
            $output .= '<div class="hostreamly-gallery-actions">';
            $output .= '<a href="' . esc_url(get_permalink($product_post->ID)) . '" class="button hostreamly-view-product">' . __('Ver Producto', 'hostreamly-woocommerce') . '</a>';
            $output .= '</div>';
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Auto video shortcode based on SKU
     * [hostreamly-auto sku="PROD-001" fallback="default-video-id"]
     */
    public function auto_video_shortcode($atts) {
        $atts = shortcode_atts(array(
            'sku' => '',
            'product_id' => '',
            'fallback' => '',
            'responsive' => 'true',
            'autoplay' => 'false',
            'muted' => 'true',
            'controls' => 'true',
            'class' => 'hostreamly-auto-video'
        ), $atts, 'hostreamly-auto');
        
        $video_id = '';
        $product = null;
        
        // Get video ID by SKU with validation
        if (!empty($atts['sku'])) {
            $sku = sanitize_text_field($atts['sku']);
            $product_id = wc_get_product_id_by_sku($sku);
            if ($product_id) {
                $product = wc_get_product($product_id);
                if ($product && $product->exists() && $product->get_status() === 'publish' && $product->is_visible()) {
                    $video_id = get_post_meta($product_id, '_hostreamly_video_id', true);
                }
            }
        }
        
        // Get video ID by product ID with validation
        if (empty($video_id) && !empty($atts['product_id'])) {
            $product_id = intval($atts['product_id']);
            if ($product_id > 0) {
                $product = wc_get_product($product_id);
                if ($product && $product->exists() && $product->get_status() === 'publish' && $product->is_visible()) {
                    $video_id = get_post_meta($product_id, '_hostreamly_video_id', true);
                }
            }
        }
        
        // Use fallback if no video found
        if (empty($video_id) && !empty($atts['fallback'])) {
            $video_id = sanitize_text_field($atts['fallback']);
        }
        
        if (empty($video_id)) {
            return '<p class="hostreamly-no-video">' . __('No video available for this product.', 'hostreamly-woocommerce') . '</p>';
        }
        
        return $this->generate_video_html($video_id, $atts);
    }
    
    /**
     * Generate video HTML
     */
    private function generate_video_html($video_id, $atts = array()) {
        // Validate video ID
        if (empty($video_id) || !is_string($video_id)) {
            return '<p class="bunnyvault-error">Invalid video ID.</p>';
        }
        
        // Sanitize video ID to prevent XSS
        $video_id = sanitize_text_field($video_id);
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $video_id)) {
            return '<p class="hostreamly-error">Invalid video ID format.</p>';
        }
        
        $defaults = array(
            'width' => 800,
            'height' => 450,
            'responsive' => 'true',
            'autoplay' => 'false',
            'muted' => 'true',
            'controls' => 'true',
            'loop' => 'false',
            'class' => 'hostreamly-video'
        );
        
        $atts = wp_parse_args($atts, $defaults);
        
        // Build iframe URL with proper validation
        $base_url = 'https://hostreamly.com/embed/';
        $iframe_url = $base_url . urlencode($video_id);
        
        // Validate the constructed URL
        if (!filter_var($iframe_url, FILTER_VALIDATE_URL)) {
            return '<p class="hostreamly-error">Invalid video URL.</p>';
        }
        
        $url_params = array();
        
        if ($atts['autoplay'] === 'true') $url_params[] = 'autoplay=1';
        if ($atts['muted'] === 'true') $url_params[] = 'muted=1';
        if ($atts['loop'] === 'true') $url_params[] = 'loop=1';
        if ($atts['controls'] === 'false') $url_params[] = 'controls=0';
        
        if (!empty($url_params)) {
            $iframe_url .= '?' . implode('&', $url_params);
        }
        
        // Validate and sanitize dimensions
        $width = $this->sanitize_dimension($atts['width']);
        $height = $this->sanitize_dimension($atts['height']);
        
        $container_class = 'hostreamly-video-container ' . esc_attr($atts['class']);
        if ($atts['responsive'] === 'true') {
            $container_class .= ' hostreamly-responsive';
        }
        
        $html = '<div class="' . $container_class . '" data-video-id="' . esc_attr($video_id) . '">';
        
        if ($atts['responsive'] === 'true') {
            $html .= '<iframe src="' . esc_url($iframe_url) . '" ';
            $html .= 'title="Hostreamly Video" ';
            $html .= 'frameborder="0" ';
            $html .= 'allowfullscreen ';
            $html .= 'loading="lazy">';
            $html .= '</iframe>';
        } else {
            $html .= '<iframe src="' . esc_url($iframe_url) . '" ';
            $html .= 'width="' . esc_attr($width) . '" ';
            $html .= 'height="' . esc_attr($height) . '" ';
            $html .= 'title="Hostreamly Video" ';
            $html .= 'frameborder="0" ';
            $html .= 'allowfullscreen ';
            $html .= 'loading="lazy">';
            $html .= '</iframe>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Sanitize dimension values
     */
    private function sanitize_dimension($dimension) {
        // Allow percentage, pixels, and other valid CSS units
        if (is_string($dimension) && preg_match('/^\d+(%|px|em|rem|vh|vw)$/', $dimension)) {
            return $dimension;
        }
        
        // If it's just a number, assume pixels and validate range
        if (is_numeric($dimension)) {
            $num = intval($dimension);
            // Reasonable limits for video dimensions
            if ($num >= 100 && $num <= 2000) {
                return $num . 'px';
            }
        }
        
        // Default fallback based on context
        return is_numeric($dimension) ? '400px' : '100%';
    }
    
    /**
     * Display product video on single product page
     */
    public function display_product_video() {
        global $product;
        
        if (!$product) return;
        
        $video_id = get_post_meta($product->get_id(), '_hostreamly_video_id', true);
        $video_position = get_post_meta($product->get_id(), '_hostreamly_video_position', true);
        
        if (empty($video_id) || $video_position === 'manual') return;
        
        echo '<div class="hostreamly-wc-single-product-video">';
        echo do_shortcode('[hostreamly-product id="' . esc_attr($video_id) . '" product_id="' . $product->get_id() . '"]');
        echo '</div>';
    }
    
    /**
     * Add product video metabox
     */
    public function add_product_video_metabox() {
        add_meta_box(
            'hostreamly-wc-video',
            __('Video de Producto Hostreamly', 'hostreamly-woocommerce'),
            array($this, 'product_video_metabox_callback'),
            'product',
            'normal',
            'high'
        );
    }
    
    /**
     * Product video metabox callback
     */
    public function product_video_metabox_callback($post) {
        wp_nonce_field('hostreamly_wc_video_nonce', 'hostreamly_wc_video_nonce');
        
        $video_id = get_post_meta($post->ID, '_hostreamly_video_id', true);
        $video_position = get_post_meta($post->ID, '_hostreamly_video_position', true);
        $video_autoplay = get_post_meta($post->ID, '_hostreamly_video_autoplay', true);
        
        echo '<table class="form-table">';
        echo '<tr>';
        echo '<th><label for="hostreamly_video_id">' . __('ID del Video', 'hostreamly-woocommerce') . '</label></th>';
        echo '<td><input type="text" id="hostreamly_video_id" name="hostreamly_video_id" value="' . esc_attr($video_id) . '" class="regular-text" />';
        echo '<p class="description">' . __('Ingresa el ID del video de Hostreamly para este producto.', 'hostreamly-woocommerce') . '</p></td>';
        echo '</tr>';
        
        echo '<tr>';
        echo '<th><label for="hostreamly_video_position">' . __('Posición del Video', 'hostreamly-woocommerce') . '</label></th>';
        echo '<td><select id="hostreamly_video_position" name="hostreamly_video_position">';
        echo '<option value="auto"' . selected($video_position, 'auto', false) . '>' . __('Automática (después del precio)', 'hostreamly-woocommerce') . '</option>';
        echo '<option value="manual"' . selected($video_position, 'manual', false) . '>' . __('Manual (usar shortcode)', 'hostreamly-woocommerce') . '</option>';
        echo '</select>';
        echo '<p class="description">' . __('Selecciona dónde mostrar el video en la página del producto.', 'hostreamly-woocommerce') . '</p></td>';
        echo '</tr>';
        
        echo '<tr>';
        echo '<th><label for="hostreamly_video_autoplay">' . __('Reproducción Automática', 'hostreamly-woocommerce') . '</label></th>';
        echo '<td><input type="checkbox" id="hostreamly_video_autoplay" name="hostreamly_video_autoplay" value="1"' . checked($video_autoplay, '1', false) . ' />';
        echo '<p class="description">' . __('Reproducir automáticamente el video (silenciado).', 'hostreamly-woocommerce') . '</p></td>';
        echo '</tr>';
        echo '</table>';
        
        if (!empty($video_id)) {
            echo '<div class="hostreamly-video-preview">';
            echo '<h4>' . __('Vista Previa del Video', 'hostreamly-woocommerce') . '</h4>';
            echo do_shortcode('[hostreamly id="' . esc_attr($video_id) . '" width="400" height="225"]');
            echo '</div>';
        }
    }
    
    /**
     * Save product video meta
     */
    public function save_product_video_meta($post_id) {
        if (!isset($_POST['hostreamly_wc_video_nonce']) || !wp_verify_nonce($_POST['hostreamly_wc_video_nonce'], 'hostreamly_wc_video_nonce')) {
            return;
        }
        
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        // Save video ID
        if (isset($_POST['hostreamly_video_id'])) {
            update_post_meta($post_id, '_hostreamly_video_id', sanitize_text_field($_POST['hostreamly_video_id']));
        }
        
        // Save video position
        if (isset($_POST['hostreamly_video_position'])) {
            update_post_meta($post_id, '_hostreamly_video_position', sanitize_text_field($_POST['hostreamly_video_position']));
        }
        
        // Save autoplay setting
        $autoplay = isset($_POST['hostreamly_video_autoplay']) ? '1' : '0';
        update_post_meta($post_id, '_hostreamly_video_autoplay', $autoplay);
    }
    
    /**
     * Track video view
     */
    private function track_video_view($video_id, $product_id) {
        // Track in database
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'hostreamly_wc_stats';
        
        $wpdb->insert(
            $table_name,
            array(
                'video_id' => $video_id,
                'product_id' => $product_id,
                'event_type' => 'view',
                'user_id' => get_current_user_id(),
                'session_id' => session_id(),
                'ip_address' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'],
                'created_at' => current_time('mysql')
            ),
            array('%s', '%d', '%s', '%d', '%s', '%s', '%s', '%s')
        );
        
        // Fire action for external tracking
        do_action('hostreamly_wc_video_viewed', $video_id, $product_id);
    }
    
    /**
     * Track conversion
     */
    public function track_conversion($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $video_id = get_post_meta($product_id, '_hostreamly_video_id', true);
            
            if ($video_id) {
                global $wpdb;
                $table_name = $wpdb->prefix . 'hostreamly_wc_stats';
                
                $wpdb->insert(
                    $table_name,
                    array(
                        'video_id' => $video_id,
                        'product_id' => $product_id,
                        'event_type' => 'conversion',
                        'order_id' => $order_id,
                        'revenue' => $item->get_total(),
                        'user_id' => $order->get_user_id(),
                        'created_at' => current_time('mysql')
                    ),
                    array('%s', '%d', '%s', '%d', '%f', '%d', '%s')
                );
                
                do_action('hostreamly_wc_conversion', $video_id, $product_id, $order_id, $item->get_total());
            }
        }
    }
    
    /**
     * Enqueue admin scripts
     */
    public function admin_scripts($hook) {
        if ($hook === 'post.php' || $hook === 'post-new.php') {
            global $post_type;
            if ($post_type === 'product') {
                wp_enqueue_script('hostreamly-wc-admin', HOSTREAMLY_WC_PLUGIN_URL . 'assets/admin.js', array('jquery'), HOSTREAMLY_WC_VERSION, true);
                wp_enqueue_style('hostreamly-wc-admin', HOSTREAMLY_WC_PLUGIN_URL . 'assets/admin.css', array(), HOSTREAMLY_WC_VERSION);
            }
        }
    }
    
    /**
     * Enqueue frontend scripts
     */
    public function frontend_scripts() {
        if (is_woocommerce() || is_cart() || is_checkout()) {
            wp_enqueue_style('hostreamly-wc-frontend', HOSTREAMLY_WC_PLUGIN_URL . 'assets/frontend.css', array(), HOSTREAMLY_WC_VERSION);
            wp_enqueue_script('hostreamly-wc-frontend', HOSTREAMLY_WC_PLUGIN_URL . 'assets/frontend.js', array('jquery'), HOSTREAMLY_WC_VERSION, true);
            
            wp_localize_script('hostreamly-wc-frontend', 'hostreamly_wc', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('hostreamly_wc_nonce')
            ));
        }
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create stats table
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'hostreamly_wc_stats';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            video_id varchar(255) NOT NULL,
            product_id bigint(20) NOT NULL,
            event_type varchar(50) NOT NULL,
            order_id bigint(20) DEFAULT NULL,
            revenue decimal(10,2) DEFAULT NULL,
            user_id bigint(20) DEFAULT NULL,
            session_id varchar(255) DEFAULT NULL,
            ip_address varchar(45) DEFAULT NULL,
            user_agent text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY video_id (video_id),
            KEY product_id (product_id),
            KEY event_type (event_type),
            KEY created_at (created_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Set default options
        add_option('hostreamly_wc_version', HOSTREAMLY_WC_VERSION);
        add_option('hostreamly_wc_auto_display', 'yes');
        add_option('hostreamly_wc_default_autoplay', 'no');
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up if needed
    }
}

// Initialize the plugin
Hostreamly_WooCommerce::get_instance();

?>