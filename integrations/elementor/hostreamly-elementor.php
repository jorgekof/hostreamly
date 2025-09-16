<?php
/**
 * Plugin Name: Hostreamly Elementor Integration
 * Description: Elementor widgets for Hostreamly video platform
 * Version: 1.0.0
 * Author: Hostreamly Team
 * Text Domain: hostreamly-elementor
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Elementor tested up to: 3.18
 * Elementor Pro tested up to: 3.18
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Include WordPress function stubs for IDE support
if (defined('WP_DEBUG') && WP_DEBUG && !function_exists('add_action')) {
    require_once __DIR__ . '/includes/wordpress-stubs.php';
}

// Define plugin constants
define('HOSTREAMLY_ELEMENTOR_VERSION', '1.0.0');
define('HOSTREAMLY_ELEMENTOR_FILE', __FILE__);
define('HOSTREAMLY_ELEMENTOR_PATH', plugin_dir_path(__FILE__));
define('HOSTREAMLY_ELEMENTOR_URL', plugin_dir_url(__FILE__));
define('HOSTREAMLY_ELEMENTOR_ASSETS', HOSTREAMLY_ELEMENTOR_URL . 'assets/');

/**
 * Main Hostreamly Elementor Class
 */
final class Hostreamly_Elementor {
    
    /**
     * Instance
     *
     * @since 1.0.0
     * @access private
     * @static
     * @var Hostreamly_Elementor The single instance of the class.
     */
    private static $_instance = null;
    
    /**
     * Minimum Elementor Version
     */
    const MINIMUM_ELEMENTOR_VERSION = '3.0.0';
    
    /**
     * Minimum PHP Version
     */
    const MINIMUM_PHP_VERSION = '7.4';
    
    /**
     * Constructor
     */
    public function __construct() {
        // Load plugin textdomain
        add_action('plugins_loaded', [$this, 'load_textdomain']);
        
        // Initialize plugin
        add_action('plugins_loaded', [$this, 'init']);
    }
    
    /**
     * Instance
     *
     * Ensures only one instance of the class is loaded or can be loaded.
     *
     * @since 1.0.0
     * @access public
     * @static
     * @return Hostreamly_Elementor An instance of the class.
     */
    public static function instance() {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain('hostreamly-elementor', false, dirname(plugin_basename(__FILE__)) . '/languages/');
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Check if Elementor is installed and activated
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', [$this, 'admin_notice_missing_elementor']);
            return;
        }
        
        // Check for required Elementor version
        if (!version_compare(ELEMENTOR_VERSION, self::MINIMUM_ELEMENTOR_VERSION, '>=')) {
            add_action('admin_notices', [$this, 'admin_notice_minimum_elementor_version']);
            return;
        }
        
        // Check for required PHP version
        if (version_compare(PHP_VERSION, self::MINIMUM_PHP_VERSION, '<')) {
            add_action('admin_notices', [$this, 'admin_notice_minimum_php_version']);
            return;
        }
        
        // Initialize plugin components
        $this->includes();
        $this->init_hooks();
    }
    
    /**
     * Include required files
     */
    private function includes() {
        // Include widget classes
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/class-widgets-manager.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-player.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-gallery.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-carousel.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-grid.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-testimonials.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-background.php';
        
        // Include controls
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/controls/class-video-selector.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/controls/class-playlist-selector.php';
        
        // Include extensions
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/extensions/class-section-video-background.php';
        require_once HOSTREAMLY_ELEMENTOR_PATH . 'includes/extensions/class-column-video-background.php';
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Register widgets
        add_action('elementor/widgets/register', [$this, 'register_widgets']);
        
        // Register controls
        add_action('elementor/controls/register', [$this, 'register_controls']);
        
        // Register widget categories
        add_action('elementor/elements/categories_registered', [$this, 'register_widget_categories']);
        
        // Enqueue scripts and styles
        add_action('elementor/frontend/after_enqueue_styles', [$this, 'enqueue_frontend_styles']);
        add_action('elementor/frontend/after_register_scripts', [$this, 'enqueue_frontend_scripts']);
        add_action('elementor/editor/after_enqueue_styles', [$this, 'enqueue_editor_styles']);
        add_action('elementor/editor/after_enqueue_scripts', [$this, 'enqueue_editor_scripts']);
        
        // AJAX handlers
        add_action('wp_ajax_hostreamly_get_videos', [$this, 'ajax_get_videos']);
        add_action('wp_ajax_hostreamly_get_playlists', [$this, 'ajax_get_playlists']);
        add_action('wp_ajax_hostreamly_search_videos', [$this, 'ajax_search_videos']);
        add_action('wp_ajax_nopriv_hostreamly_search_videos', [$this, 'ajax_search_videos']);
        
        // Add custom CSS to Elementor
        add_action('elementor/css-file/post/enqueue', [$this, 'add_custom_css']);
        
        // Register dynamic tags
        add_action('elementor/dynamic_tags/register', [$this, 'register_dynamic_tags']);
    }
    
    /**
     * Register widgets
     */
    public function register_widgets($widgets_manager) {
        // Check if widget files exist before registering
        $widget_files = [
            'Video_Player' => HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-player.php',
            'Video_Gallery' => HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-gallery.php',
            'Video_Carousel' => HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-carousel.php',
            'Video_Grid' => HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-grid.php',
            'Video_Testimonials' => HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-testimonials.php',
            'Video_Background' => HOSTREAMLY_ELEMENTOR_PATH . 'includes/widgets/class-video-background.php'
        ];
        
        foreach ($widget_files as $widget_class => $widget_file) {
            if (file_exists($widget_file)) {
                require_once $widget_file;
                $full_class_name = '\\Hostreamly_Elementor\\Widgets\\' . $widget_class;
                if (class_exists($full_class_name)) {
                    $widgets_manager->register(new $full_class_name());
                }
            }
        }
    }
    
    /**
     * Register controls
     */
    public function register_controls($controls_manager) {
        $controls_manager->register(new \Hostreamly_Elementor\Controls\Video_Selector());
        $controls_manager->register(new \Hostreamly_Elementor\Controls\Playlist_Selector());
    }
    
    /**
     * Register widget categories
     */
    public function register_widget_categories($elements_manager) {
        $elements_manager->add_category(
            'hostreamly',
            [
                'title' => esc_html__('Hostreamly', 'hostreamly-elementor'),
                'icon' => 'eicon-video-camera',
            ]
        );
    }
    
    /**
     * Enqueue frontend styles
     */
    public function enqueue_frontend_styles() {
        wp_enqueue_style(
            'hostreamly-elementor-frontend',
            HOSTREAMLY_ELEMENTOR_ASSETS . 'css/frontend.css',
            [],
            HOSTREAMLY_ELEMENTOR_VERSION
        );
    }
    
    /**
     * Enqueue frontend scripts
     */
    public function enqueue_frontend_scripts() {
        wp_enqueue_script(
            'hostreamly-elementor-frontend',
            HOSTREAMLY_ELEMENTOR_ASSETS . 'js/frontend.js',
            ['jquery', 'elementor-frontend'],
            HOSTREAMLY_ELEMENTOR_VERSION,
            true
        );
        
        // Localize script
        wp_localize_script('hostreamly-elementor-frontend', 'hostreamlyElementor', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('hostreamly_elementor_nonce'),
            'strings' => [
                'loading' => esc_html__('Loading...', 'hostreamly-elementor'),
                'error' => esc_html__('Error loading video', 'hostreamly-elementor'),
                'noVideos' => esc_html__('No videos found', 'hostreamly-elementor'),
            ]
        ]);
    }
    
    /**
     * Enqueue editor styles
     */
    public function enqueue_editor_styles() {
        wp_enqueue_style(
            'hostreamly-elementor-editor',
            HOSTREAMLY_ELEMENTOR_ASSETS . 'css/editor.css',
            [],
            HOSTREAMLY_ELEMENTOR_VERSION
        );
    }
    
    /**
     * Enqueue editor scripts
     */
    public function enqueue_editor_scripts() {
        wp_enqueue_script(
            'hostreamly-elementor-editor',
            HOSTREAMLY_ELEMENTOR_ASSETS . 'js/editor.js',
            ['jquery', 'elementor-editor'],
            HOSTREAMLY_ELEMENTOR_VERSION,
            true
        );
        
        // Localize script
        wp_localize_script('hostreamly-elementor-editor', 'hostreamlyElementorEditor', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('hostreamly_elementor_nonce'),
            'mediaLibraryUrl' => admin_url('admin.php?page=hostreamly-media'),
        ]);
    }
    
    /**
     * AJAX: Get videos
     */
    public function ajax_get_videos() {
        check_ajax_referer('hostreamly_elementor_nonce', 'nonce');
        
        $page = intval($_POST['page'] ?? 1);
        $per_page = intval($_POST['per_page'] ?? 12);
        $search = sanitize_text_field($_POST['search'] ?? '');
        $category = sanitize_text_field($_POST['category'] ?? '');
        
        // Get videos from Hostreamly API or database
        $videos = [];
        
        // Check if Hostreamly main plugin is active
        if (class_exists('Hostreamly')) {
            // Get videos from Hostreamly
            $hostreamly = new Hostreamly();
            $videos = $hostreamly->get_videos([
                'page' => $page,
                'per_page' => $per_page,
                'search' => $search,
                'category' => $category
            ]);
        } else {
            // Fallback mock data
            $videos = [
                [
                    'id' => 1,
                    'title' => 'Product Demo Video',
                    'thumbnail' => 'https://via.placeholder.com/300x200',
                    'duration' => '2:30',
                    'url' => 'https://example.com/video1.mp4',
                    'type' => 'mp4'
                ],
                [
                    'id' => 2,
                    'title' => 'Customer Testimonial',
                    'thumbnail' => 'https://via.placeholder.com/300x200',
                    'duration' => '1:45',
                    'url' => 'https://example.com/video2.mp4',
                    'type' => 'mp4'
                ]
            ];
        }
        
        wp_send_json_success([
            'videos' => $videos,
            'total' => count($videos),
            'pages' => ceil(count($videos) / $per_page)
        ]);
    }
    
    /**
     * AJAX: Get playlists
     */
    public function ajax_get_playlists() {
        check_ajax_referer('hostreamly_elementor_nonce', 'nonce');
        
        // Get playlists from Hostreamly API or database
        $playlists = [];
        
        // Check if Hostreamly main plugin is active
        if (class_exists('Hostreamly')) {
            // Get playlists from Hostreamly
            $hostreamly = new Hostreamly();
            $playlists = $hostreamly->get_playlists();
        } else {
            // Fallback mock data
            $playlists = [
                [
                    'id' => 1,
                    'title' => 'Product Demos',
                    'description' => 'Collection of product demonstration videos',
                    'video_count' => 5,
                    'thumbnail' => 'https://via.placeholder.com/300x200'
                ],
                [
                    'id' => 2,
                    'title' => 'Customer Stories',
                    'description' => 'Real customer testimonials and success stories',
                    'video_count' => 8,
                    'thumbnail' => 'https://via.placeholder.com/300x200'
                ]
            ];
        }
        
        wp_send_json_success($playlists);
    }
    
    /**
     * AJAX: Search videos
     */
    public function ajax_search_videos() {
        check_ajax_referer('hostreamly_elementor_nonce', 'nonce');
        
        $query = sanitize_text_field($_POST['query'] ?? '');
        
        if (empty($query)) {
            wp_send_json_error('Search term is required');
            return;
        }
        
        // Search videos from Hostreamly API or database
        $results = [];
        
        // Check if Hostreamly main plugin is active
        if (class_exists('Hostreamly')) {
            // Search videos from Hostreamly
            $hostreamly = new Hostreamly();
            $results = $hostreamly->search_videos($query);
        } else {
            // Fallback mock search results
            $results = [
                [
                    'id' => 1,
                    'title' => 'Product Demo Video - ' . $query,
                    'thumbnail' => 'https://via.placeholder.com/150x100',
                    'url' => 'https://example.com/search1.mp4',
                    'duration' => '3:15'
                ],
                [
                    'id' => 2,
                    'title' => 'Search Result Video - ' . $query,
                    'thumbnail' => 'https://via.placeholder.com/150x100',
                    'url' => 'https://example.com/search2.mp4',
                    'duration' => '2:45'
                ]
            ];
        }
        
        wp_send_json_success([
            'videos' => $results,
            'search_term' => $query,
            'total' => count($results)
        ]);
    }
    
    /**
     * Add custom CSS
     */
    public function add_custom_css($post_css_file) {
        // Add any custom CSS rules here
    }
    
    /**
     * Register dynamic tags
     */
    public function register_dynamic_tags($dynamic_tags_manager) {
        // Register custom dynamic tags if needed
    }
    
    /**
     * Admin notice - Missing Elementor
     */
    public function admin_notice_missing_elementor() {
        $message = sprintf(
            esc_html__('Hostreamly Elementor requires Elementor to be installed and activated. %1$sInstall Elementor%2$s', 'hostreamly-elementor'),
            '<a href="' . esc_url(admin_url('plugin-install.php?s=elementor&tab=search&type=term')) . '">',
            '</a>'
        );
        
        printf('<div class="notice notice-warning is-dismissible"><p>%s</p></div>', $message);
    }
    
    /**
     * Admin notice - Minimum Elementor version
     */
    public function admin_notice_minimum_elementor_version() {
        $message = sprintf(
            esc_html__('Hostreamly Elementor requires Elementor version %1$s or greater. Please update Elementor.', 'hostreamly-elementor'),
            self::MINIMUM_ELEMENTOR_VERSION
        );
        
        printf('<div class="notice notice-warning is-dismissible"><p>%s</p></div>', $message);
    }
    
    /**
     * Admin notice - Minimum PHP version
     */
    public function admin_notice_minimum_php_version() {
        $message = sprintf(
            esc_html__('Hostreamly Elementor requires PHP version %1$s or greater. Please update PHP.', 'hostreamly-elementor'),
            self::MINIMUM_PHP_VERSION
        );
        
        printf('<div class="notice notice-warning is-dismissible"><p>%s</p></div>', $message);
    }
}

/**
 * Initialize plugin
 */
Hostreamly_Elementor::instance();

/**
 * Plugin activation hook
 */
register_activation_hook(__FILE__, function() {
    // Check requirements on activation
    if (!did_action('elementor/loaded')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(
            esc_html__('Hostreamly Elementor requires Elementor to be installed and activated.', 'hostreamly-elementor'),
            esc_html__('Plugin Activation Error', 'hostreamly-elementor'),
            ['back_link' => true]
        );
    }
});

/**
 * Plugin deactivation hook
 */
register_deactivation_hook(__FILE__, function() {
    // Cleanup if needed
});