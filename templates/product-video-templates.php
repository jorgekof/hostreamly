<?php
/**
 * Hostreamly Product Video Templates
 * 
 * Predefined templates for e-commerce product videos
 *
 * @package Hostreamly
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * Product Video Templates Manager
 */
class Hostreamly_Product_Video_Templates {

    /**
     * Available templates
     *
     * @var array
     */
    private static $templates = [];

    /**
     * Initialize templates
     */
    public static function init() {
        self::register_default_templates();
        add_action('wp_ajax_hostreamly_get_templates', [__CLASS__, 'ajax_get_templates']);
        add_action('wp_ajax_hostreamly_apply_template', [__CLASS__, 'ajax_apply_template']);
        add_action('wp_ajax_hostreamly_save_custom_template', [__CLASS__, 'ajax_save_custom_template']);
    }

    /**
     * Register default templates
     */
    private static function register_default_templates() {
        
        // Product Showcase Template
        self::register_template('product-showcase', [
            'name' => __('Product Showcase', 'hostreamly'),
            'description' => __('Clean product presentation with title, price, and description overlay', 'hostreamly'),
            'category' => 'showcase',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-showcase.jpg',
            'settings' => [
                'layout' => 'overlay',
                'show_title' => true,
                'show_price' => true,
                'show_description' => true,
                'show_add_to_cart' => true,
                'autoplay' => false,
                'controls' => true,
                'loop' => true,
                'muted' => true,
                'aspect_ratio' => '16:9',
                'overlay_position' => 'bottom-left',
                'overlay_style' => 'gradient',
                'text_color' => '#ffffff',
                'accent_color' => '#71d7f7',
                'animation' => 'fade-in'
            ],
            'css' => self::get_template_css('product-showcase'),
            'html' => self::get_template_html('product-showcase')
        ]);

        // Product Demo Template
        self::register_template('product-demo', [
            'name' => __('Product Demo', 'hostreamly'),
            'description' => __('Interactive demo with step-by-step product features', 'hostreamly'),
            'category' => 'demo',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-demo.jpg',
            'settings' => [
                'layout' => 'sidebar',
                'show_title' => true,
                'show_features' => true,
                'show_specifications' => true,
                'show_add_to_cart' => true,
                'autoplay' => true,
                'controls' => false,
                'loop' => true,
                'muted' => true,
                'aspect_ratio' => '4:3',
                'sidebar_position' => 'right',
                'features_style' => 'checklist',
                'text_color' => '#333333',
                'accent_color' => '#28a745',
                'animation' => 'slide-in'
            ],
            'css' => self::get_template_css('product-demo'),
            'html' => self::get_template_html('product-demo')
        ]);

        // Product Gallery Template
        self::register_template('product-gallery', [
            'name' => __('Product Gallery', 'hostreamly'),
            'description' => __('Multiple product videos in an elegant gallery layout', 'hostreamly'),
            'category' => 'gallery',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-gallery.jpg',
            'settings' => [
                'layout' => 'grid',
                'columns' => 3,
                'show_thumbnails' => true,
                'show_title' => true,
                'show_price' => true,
                'show_quick_view' => true,
                'autoplay_on_hover' => true,
                'controls' => false,
                'loop' => true,
                'muted' => true,
                'aspect_ratio' => '1:1',
                'grid_gap' => '20px',
                'hover_effect' => 'zoom',
                'text_color' => '#333333',
                'accent_color' => '#dc3545',
                'animation' => 'scale-up'
            ],
            'css' => self::get_template_css('product-gallery'),
            'html' => self::get_template_html('product-gallery')
        ]);

        // Product Comparison Template
        self::register_template('product-comparison', [
            'name' => __('Product Comparison', 'hostreamly'),
            'description' => __('Side-by-side product comparison with synchronized videos', 'hostreamly'),
            'category' => 'comparison',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-comparison.jpg',
            'settings' => [
                'layout' => 'split',
                'products_count' => 2,
                'show_title' => true,
                'show_price' => true,
                'show_features' => true,
                'show_rating' => true,
                'sync_playback' => true,
                'autoplay' => false,
                'controls' => true,
                'loop' => false,
                'muted' => false,
                'aspect_ratio' => '16:9',
                'comparison_style' => 'table',
                'text_color' => '#333333',
                'accent_color' => '#ffc107',
                'animation' => 'slide-in-opposite'
            ],
            'css' => self::get_template_css('product-comparison'),
            'html' => self::get_template_html('product-comparison')
        ]);

        // Product Hero Template
        self::register_template('product-hero', [
            'name' => __('Product Hero', 'hostreamly'),
            'description' => __('Full-width hero section with prominent product video', 'hostreamly'),
            'category' => 'hero',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-hero.jpg',
            'settings' => [
                'layout' => 'fullwidth',
                'height' => '70vh',
                'show_title' => true,
                'show_subtitle' => true,
                'show_cta' => true,
                'show_scroll_indicator' => true,
                'autoplay' => true,
                'controls' => false,
                'loop' => true,
                'muted' => true,
                'aspect_ratio' => '21:9',
                'overlay_style' => 'dark',
                'text_alignment' => 'center',
                'text_color' => '#ffffff',
                'accent_color' => '#6f42c1',
                'animation' => 'fade-in-up'
            ],
            'css' => self::get_template_css('product-hero'),
            'html' => self::get_template_html('product-hero')
        ]);

        // Product Testimonial Template
        self::register_template('product-testimonial', [
            'name' => __('Product Testimonial', 'hostreamly'),
            'description' => __('Customer testimonial videos with product information', 'hostreamly'),
            'category' => 'testimonial',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-testimonial.jpg',
            'settings' => [
                'layout' => 'card',
                'show_customer_info' => true,
                'show_rating' => true,
                'show_product_info' => true,
                'show_quote' => true,
                'autoplay' => false,
                'controls' => true,
                'loop' => false,
                'muted' => false,
                'aspect_ratio' => '4:3',
                'card_style' => 'elevated',
                'quote_style' => 'blockquote',
                'text_color' => '#333333',
                'accent_color' => '#17a2b8',
                'animation' => 'fade-in-scale'
            ],
            'css' => self::get_template_css('product-testimonial'),
            'html' => self::get_template_html('product-testimonial')
        ]);

        // Product Tutorial Template
        self::register_template('product-tutorial', [
            'name' => __('Product Tutorial', 'hostreamly'),
            'description' => __('Step-by-step tutorial with interactive chapters', 'hostreamly'),
            'category' => 'tutorial',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-tutorial.jpg',
            'settings' => [
                'layout' => 'chapters',
                'show_chapters' => true,
                'show_progress' => true,
                'show_transcript' => true,
                'show_resources' => true,
                'autoplay' => false,
                'controls' => true,
                'loop' => false,
                'muted' => false,
                'aspect_ratio' => '16:9',
                'chapters_position' => 'bottom',
                'progress_style' => 'bar',
                'text_color' => '#333333',
                'accent_color' => '#fd7e14',
                'animation' => 'slide-in-right'
            ],
            'css' => self::get_template_css('product-tutorial'),
            'html' => self::get_template_html('product-tutorial')
        ]);

        // Product 360 Template
        self::register_template('product-360', [
            'name' => __('Product 360°', 'hostreamly'),
            'description' => __('Interactive 360-degree product view with hotspots', 'hostreamly'),
            'category' => '360',
            'preview' => HOSTREAMLY_URL . 'assets/images/templates/product-360.jpg',
            'settings' => [
                'layout' => 'interactive',
                'show_hotspots' => true,
                'show_controls' => true,
                'show_zoom' => true,
                'show_fullscreen' => true,
                'autoplay' => true,
                'auto_rotate' => true,
                'loop' => true,
                'muted' => true,
                'aspect_ratio' => '1:1',
                'rotation_speed' => 'medium',
                'hotspot_style' => 'pulse',
                'text_color' => '#333333',
                'accent_color' => '#20c997',
                'animation' => 'rotate-in'
            ],
            'css' => self::get_template_css('product-360'),
            'html' => self::get_template_html('product-360')
        ]);

        // Apply filters to allow custom templates
        self::$templates = apply_filters('hostreamly_product_video_templates', self::$templates);
    }

    /**
     * Register a template
     *
     * @param string $id Template ID
     * @param array $template Template data
     */
    public static function register_template($id, $template) {
        self::$templates[$id] = wp_parse_args($template, [
            'name' => '',
            'description' => '',
            'category' => 'general',
            'preview' => '',
            'settings' => [],
            'css' => '',
            'html' => '',
            'js' => '',
            'pro' => false
        ]);
    }

    /**
     * Get all templates
     *
     * @return array
     */
    public static function get_templates() {
        return self::$templates;
    }

    /**
     * Get template by ID
     *
     * @param string $id Template ID
     * @return array|null
     */
    public static function get_template($id) {
        return isset(self::$templates[$id]) ? self::$templates[$id] : null;
    }

    /**
     * Get templates by category
     *
     * @param string $category Category name
     * @return array
     */
    public static function get_templates_by_category($category) {
        $category = sanitize_text_field($category);
        if (empty($category) || !is_array(self::$templates)) {
            return [];
        }
        
        return array_filter(self::$templates, function($template) use ($category) {
            return isset($template['category']) && $template['category'] === $category;
        });
    }

    /**
     * Get template categories
     *
     * @return array
     */
    public static function get_categories() {
        $categories = [];
        if (!is_array(self::$templates)) {
            return $categories;
        }
        
        foreach (self::$templates as $template) {
            if (isset($template['category']) && !empty($template['category']) && !in_array($template['category'], $categories)) {
                $categories[] = sanitize_text_field($template['category']);
            }
        }
        return $categories;
    }

    /**
     * Apply template to video
     *
     * @param string $template_id Template ID
     * @param array $video_data Video data
     * @param array $custom_settings Custom settings
     * @return string Rendered HTML
     */
    public static function apply_template($template_id, $video_data, $custom_settings = []) {
        $template_id = sanitize_key($template_id);
        $template = self::get_template($template_id);
        if (!$template || !is_array($template)) {
            return '';
        }

        // Validate and sanitize video data
        if (!is_array($video_data)) {
            $video_data = [];
        }
        
        // Validate and sanitize custom settings
        if (!is_array($custom_settings)) {
            $custom_settings = [];
        }

        // Merge settings
        $settings = wp_parse_args($custom_settings, isset($template['settings']) ? $template['settings'] : []);
        
        // Prepare template variables
        $variables = [
            'video' => $video_data,
            'settings' => $settings,
            'template_id' => $template_id
        ];

        // Render template safely without eval
        $html = '';
        if (isset($template['html']) && !empty($template['html'])) {
            // Use include instead of eval for security
            $temp_file = tempnam(sys_get_temp_dir(), 'hostreamly_template_');
            if ($temp_file) {
                file_put_contents($temp_file, $template['html']);
                ob_start();
                extract($variables);
                include $temp_file;
                $html = ob_get_clean();
                unlink($temp_file);
            }
        }

        // Add CSS and JS
        $html = self::wrap_template_output($html, $template, $settings);

        return $html;
    }

    /**
     * Wrap template output with CSS and JS
     *
     * @param string $html Template HTML
     * @param array $template Template data
     * @param array $settings Template settings
     * @return string
     */
    private static function wrap_template_output($html, $template, $settings) {
        if (!is_array($template) || !is_array($settings)) {
            return $html;
        }
        
        $wrapper_id = 'hostreamly-template-' . uniqid();
        $category = isset($template['category']) ? sanitize_html_class($template['category']) : 'general';
        
        $output = '<div id="' . esc_attr($wrapper_id) . '" class="hostreamly-product-video-template hostreamly-template-' . esc_attr($category) . '">';
        
        // Add CSS
        if (isset($template['css']) && !empty($template['css'])) {
            $css = self::process_template_css($template['css'], $settings, $wrapper_id);
            $output .= '<style>' . wp_strip_all_tags($css) . '</style>';
        }
        
        // Add HTML
        $output .= wp_kses_post($html);
        
        // Add JS
        if (isset($template['js']) && !empty($template['js'])) {
            $js = self::process_template_js($template['js'], $settings, $wrapper_id);
            $output .= '<script>' . esc_js($js) . '</script>';
        }
        
        $output .= '</div>';
        
        return $output;
    }

    /**
     * Process template CSS with variables
     *
     * @param string $css Template CSS
     * @param array $settings Template settings
     * @param string $wrapper_id Wrapper ID
     * @return string
     */
    private static function process_template_css($css, $settings, $wrapper_id) {
        if (!is_string($css) || !is_array($settings) || !is_string($wrapper_id)) {
            return '';
        }
        
        // Sanitize wrapper ID
        $wrapper_id = sanitize_html_class($wrapper_id);
        
        // Replace variables with sanitized values
        $variables = [
            '{{wrapper_id}}' => '#' . $wrapper_id,
            '{{text_color}}' => isset($settings['text_color']) ? sanitize_hex_color($settings['text_color']) : '#333333',
            '{{accent_color}}' => isset($settings['accent_color']) ? sanitize_hex_color($settings['accent_color']) : '#71d7f7',
            '{{aspect_ratio}}' => isset($settings['aspect_ratio']) ? sanitize_text_field($settings['aspect_ratio']) : '16:9',
            '{{grid_gap}}' => isset($settings['grid_gap']) ? sanitize_text_field($settings['grid_gap']) : '20px',
            '{{height}}' => isset($settings['height']) ? sanitize_text_field($settings['height']) : 'auto'
        ];

        return str_replace(array_keys($variables), array_values($variables), $css);
    }

    /**
     * Process template JS with variables
     *
     * @param string $js Template JS
     * @param array $settings Template settings
     * @param string $wrapper_id Wrapper ID
     * @return string
     */
    private static function process_template_js($js, $settings, $wrapper_id) {
        if (!is_string($js) || !is_array($settings) || !is_string($wrapper_id)) {
            return '';
        }
        
        // Sanitize wrapper ID
        $wrapper_id = sanitize_html_class($wrapper_id);
        
        // Replace variables with sanitized values
        $variables = [
            '{{wrapper_id}}' => $wrapper_id,
            '{{settings}}' => wp_json_encode($settings)
        ];

        return str_replace(array_keys($variables), array_values($variables), $js);
    }

    /**
     * AJAX: Get templates
     */
    public static function ajax_get_templates() {
        if (!check_ajax_referer('hostreamly_nonce', 'nonce', false)) {
            wp_send_json_error(__('Security check failed', 'hostreamly'));
        }
        
        $category = isset($_POST['category']) ? sanitize_text_field($_POST['category']) : '';
        $templates = !empty($category) ? self::get_templates_by_category($category) : self::get_templates();
        
        if (!is_array($templates)) {
            $templates = [];
        }
        
        wp_send_json_success($templates);
    }

    /**
     * AJAX: Apply template
     */
    public static function ajax_apply_template() {
        if (!check_ajax_referer('hostreamly_nonce', 'nonce', false)) {
            wp_send_json_error(__('Security check failed', 'hostreamly'));
        }
        
        $template_id = isset($_POST['template_id']) ? sanitize_text_field($_POST['template_id']) : '';
        $video_data = isset($_POST['video_data']) && is_array($_POST['video_data']) ? $_POST['video_data'] : [];
        $custom_settings = isset($_POST['custom_settings']) && is_array($_POST['custom_settings']) ? $_POST['custom_settings'] : [];
        
        if (empty($template_id)) {
            wp_send_json_error(__('Template ID is required', 'hostreamly'));
        }
        
        // Sanitize video data
        $video_data = array_map('sanitize_text_field', $video_data);
        
        // Sanitize custom settings
        $custom_settings = array_map('sanitize_text_field', $custom_settings);
        
        $html = self::apply_template($template_id, $video_data, $custom_settings);
        
        if (!empty($html)) {
            wp_send_json_success(['html' => $html]);
        } else {
            wp_send_json_error(__('Template not found or could not be rendered', 'hostreamly'));
        }
    }

    /**
     * AJAX: Save custom template
     */
    public static function ajax_save_custom_template() {
        if (!check_ajax_referer('hostreamly_nonce', 'nonce', false)) {
            wp_send_json_error(__('Security check failed', 'hostreamly'));
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Insufficient permissions', 'hostreamly'));
        }
        
        $template_data = isset($_POST['template_data']) && is_array($_POST['template_data']) ? $_POST['template_data'] : [];
        $template_id = isset($template_data['id']) ? sanitize_key($template_data['id']) : '';
        
        if (empty($template_id)) {
            wp_send_json_error(__('Template ID is required', 'hostreamly'));
        }
        
        // Sanitize template data
        $sanitized_data = [
            'id' => $template_id,
            'name' => isset($template_data['name']) ? sanitize_text_field($template_data['name']) : '',
            'description' => isset($template_data['description']) ? sanitize_textarea_field($template_data['description']) : '',
            'category' => isset($template_data['category']) ? sanitize_text_field($template_data['category']) : 'custom',
            'settings' => isset($template_data['settings']) && is_array($template_data['settings']) ? array_map('sanitize_text_field', $template_data['settings']) : [],
            'css' => isset($template_data['css']) ? wp_strip_all_tags($template_data['css']) : '',
            'html' => isset($template_data['html']) ? wp_kses_post($template_data['html']) : '',
            'js' => isset($template_data['js']) ? esc_js($template_data['js']) : ''
        ];
        
        // Save to database
        $custom_templates = get_option('hostreamly_custom_templates', []);
        if (!is_array($custom_templates)) {
            $custom_templates = [];
        }
        $custom_templates[$template_id] = $sanitized_data;
        
        $result = update_option('hostreamly_custom_templates', $custom_templates);
        
        if ($result) {
            wp_send_json_success(__('Template saved successfully', 'hostreamly'));
        } else {
            wp_send_json_error(__('Failed to save template', 'hostreamly'));
        }
    }

    /**
     * Get template CSS content
     *
     * @param string $template_id Template ID
     * @return string
     */
    private static function get_template_css($template_id) {
        $template_id = sanitize_file_name($template_id);
        if (empty($template_id) || !defined('HOSTREAMLY_PATH')) {
            return '';
        }
        
        $css_file = HOSTREAMLY_PATH . 'templates/css/' . $template_id . '.css';
        
        // Validate file path to prevent directory traversal
        $real_path = realpath($css_file);
        $base_path = realpath(HOSTREAMLY_PATH . 'templates/css/');
        
        if ($real_path && $base_path && strpos($real_path, $base_path) === 0 && file_exists($css_file)) {
            return file_get_contents($css_file);
        }
        
        return '';
    }

    /**
     * Get template HTML content
     *
     * @param string $template_id Template ID
     * @return string
     */
    private static function get_template_html($template_id) {
        $template_id = sanitize_file_name($template_id);
        if (empty($template_id) || !defined('HOSTREAMLY_PATH')) {
            return '';
        }
        
        $html_file = HOSTREAMLY_PATH . 'templates/html/' . $template_id . '.php';
        
        // Validate file path to prevent directory traversal
        $real_path = realpath($html_file);
        $base_path = realpath(HOSTREAMLY_PATH . 'templates/html/');
        
        if ($real_path && $base_path && strpos($real_path, $base_path) === 0 && file_exists($html_file)) {
            return file_get_contents($html_file);
        }
        
        return '';
    }

    /**
     * Get template JS content
     *
     * @param string $template_id Template ID
     * @return string
     */
    private static function get_template_js($template_id) {
        $template_id = sanitize_file_name($template_id);
        if (empty($template_id) || !defined('HOSTREAMLY_PATH')) {
            return '';
        }
        
        $js_file = HOSTREAMLY_PATH . 'templates/js/' . $template_id . '.js';
        
        // Validate file path to prevent directory traversal
        $real_path = realpath($js_file);
        $base_path = realpath(HOSTREAMLY_PATH . 'templates/js/');
        
        if ($real_path && $base_path && strpos($real_path, $base_path) === 0 && file_exists($js_file)) {
            return file_get_contents($js_file);
        }
        
        return '';
    }
}

// Initialize templates
Hostreamly_Product_Video_Templates::init();