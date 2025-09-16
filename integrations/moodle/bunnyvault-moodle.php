<?php
/**
 * Plugin Name: Hostreamly Moodle Integration
 * Plugin URI: https://hostreamly.com/integrations/moodle
 * Description: Integración completa de Hostreamly con Moodle para lecciones en video, seguimiento de progreso y evaluaciones interactivas.
 * Version: 1.0.0
 * Author: Hostreamly Team
 * Author URI: https://hostreamly.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: hostreamly-moodle
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HOSTREAMLY_MOODLE_VERSION', '1.0.0');
define('HOSTREAMLY_MOODLE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HOSTREAMLY_MOODLE_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('HOSTREAMLY_MOODLE_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main Hostreamly Moodle Integration Class
 */
class Hostreamly_Moodle {
    
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
        add_action('plugins_loaded', array($this, 'check_dependencies'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain
        load_plugin_textdomain('bunnyvault-moodle', false, dirname(BUNNYVAULT_MOODLE_PLUGIN_BASENAME) . '/languages');
        
        // Initialize components
        $this->init_hooks();
        $this->init_shortcodes();
        $this->init_admin();
        $this->init_frontend();
        $this->init_progress_tracking();
    }
    
    /**
     * Check dependencies
     */
    public function check_dependencies() {
        if (!class_exists('LearnDash_Settings_Section') && !function_exists('learndash_get_course_id')) {
            add_action('admin_notices', array($this, 'dependency_notice'));
            return;
        }
    }
    
    /**
     * Dependency notice
     */
    public function dependency_notice() {
        echo '<div class="notice notice-error"><p>';
        echo __('Hostreamly Moodle Integration requiere LearnDash o un LMS compatible.', 'hostreamly-moodle');
        echo '</p></div>';
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // LearnDash hooks
        add_action('learndash_lesson_content_tabs', array($this, 'add_video_tab'), 10, 3);
        add_action('learndash_topic_content_tabs', array($this, 'add_video_tab'), 10, 3);
        
        // Progress tracking hooks
        add_action('wp_ajax_bunnyvault_track_progress', array($this, 'ajax_track_progress'));
        add_action('wp_ajax_nopriv_bunnyvault_track_progress', array($this, 'ajax_track_progress'));
        
        // Quiz integration hooks
        add_action('learndash_quiz_completed', array($this, 'quiz_completed'), 10, 2);
        
        // Certificate hooks
        add_filter('learndash_certificate_content', array($this, 'add_certificate_video'), 10, 2);
        
        // Admin hooks
        add_action('add_meta_boxes', array($this, 'add_lesson_video_metabox'));
        add_action('save_post', array($this, 'save_lesson_video_meta'));
    }
    
    /**
     * Initialize shortcodes
     */
    private function init_shortcodes() {
        add_shortcode('hostreamly-lesson', array($this, 'lesson_video_shortcode'));
        add_shortcode('hostreamly-quiz', array($this, 'quiz_video_shortcode'));
        add_shortcode('hostreamly-certificate', array($this, 'certificate_video_shortcode'));
        add_shortcode('hostreamly-course-intro', array($this, 'course_intro_shortcode'));
        add_shortcode('hostreamly-progress', array($this, 'progress_video_shortcode'));
    }
    
    /**
     * Lesson video shortcode with progress tracking
     * [hostreamly-lesson id="123" track_progress="true" required_watch="80%"]
     */
    public function lesson_video_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'lesson_id' => get_the_ID(),
            'track_progress' => 'true',
            'required_watch' => '80',
            'autoplay' => 'false',
            'controls' => 'true',
            'responsive' => 'true',
            'show_transcript' => 'false',
            'show_notes' => 'false',
            'class' => 'hostreamly-lesson-video'
        ), $atts, 'hostreamly-lesson');
        
        if (empty($atts['id'])) {
            return '';
        }
        
        $user_id = get_current_user_id();
        $progress = $this->get_video_progress($user_id, $atts['id'], $atts['lesson_id']);
        $required_percentage = intval($atts['required_watch']);
        
        $output = '<div class="hostreamly-lms-container ' . esc_attr($atts['class']) . '" data-video-id="' . esc_attr($atts['id']) . '" data-lesson-id="' . esc_attr($atts['lesson_id']) . '" data-required="' . $required_percentage . '">';
        
        // Progress indicator
        if ($atts['track_progress'] === 'true') {
            $output .= '<div class="hostreamly-progress-indicator">';
            $output .= '<div class="progress-bar">';
            $output .= '<div class="progress-fill" style="width: ' . $progress . '%"></div>';
            $output .= '</div>';
            $output .= '<span class="progress-text">'$output .= sprintf(__('Progreso: %d%%', 'hostreamly-moodle'), $progress) . '</span>';
            $output .= '</div>';
        }
        
        // Video player
        $output .= $this->generate_video_html($atts['id'], $atts);
        
        // Completion status
        if ($progress >= $required_percentage) {
            $output .= '<div class="hostreamly-completion-status completed">';
            $output .= '<i class="dashicons dashicons-yes-alt"></i> ' . __('Lección completada', 'hostreamly-moodle');
            $output .= '</div>';
        } else {
            $remaining = $required_percentage - $progress;
            $output .= '<div class="hostreamly-completion-status pending">';
            $output .= sprintf(__('Necesitas ver %d%% más para completar esta lección', 'hostreamly-moodle'), $remaining);
            $output .= '</div>';
        }
        
        // Additional content
        if ($atts['show_transcript'] === 'true') {
            $transcript = get_post_meta($atts['lesson_id'], '_bunnyvault_transcript', true);
            if ($transcript) {
                $output .= '<div class="hostreamly-transcript">';
                $output .= '<h4>' . __('Transcripción', 'hostreamly-moodle') . '</h4>';
                $output .= '<div class="transcript-content">' . wp_kses_post($transcript) . '</div>';
                $output .= '</div>';
            }
        }
        
        if ($atts['show_notes'] === 'true') {
            $notes = get_post_meta($atts['lesson_id'], '_bunnyvault_notes', true);
            if ($notes) {
                $output .= '<div class="hostreamly-notes">';
                $output .= '<h4>' . __('Notas de la lección', 'hostreamly-moodle') . '</h4>';
                $output .= '<div class="notes-content">' . wp_kses_post($notes) . '</div>';
                $output .= '</div>';
            }
        }
        
        $output .= '</div>';
        
        // Enqueue tracking script
        if ($atts['track_progress'] === 'true') {
            wp_enqueue_script('hostreamly-progress-tracker');
        }
        
        return $output;
    }
    
    /**
     * Quiz video shortcode
     * [hostreamly-quiz id="456" quiz_id="789" intro="true"]
     */
    public function quiz_video_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'quiz_id' => '',
            'intro' => 'true',
            'show_before_quiz' => 'true',
            'autoplay' => 'false',
            'class' => 'hostreamly-quiz-video'
        ), $atts, 'hostreamly-quiz');
        
        if (empty($atts['id'])) {
            return '';
        }
        
        $output = '<div class="hostreamly-quiz-container ' . esc_attr($atts['class']) . '">';
        
        if ($atts['intro'] === 'true') {
            $output .= '<div class="quiz-intro">';
            $output .= '<h4>' . __('Video introductorio del quiz', 'hostreamly-moodle') . '</h4>';
            $output .= $this->generate_video_html($atts['id'], $atts);
            $output .= '</div>';
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Generate video HTML
     */
    private function generate_video_html($video_id, $options = array()) {
        $defaults = array(
            'width' => '100%',
            'height' => '400',
            'responsive' => 'true',
            'autoplay' => 'false',
            'controls' => 'true',
            'muted' => 'false'
        );
        
        $options = wp_parse_args($options, $defaults);
        
        $iframe_src = 'https://hostreamly.com/embed/' . esc_attr($video_id);
        $iframe_src .= '?autoplay=' . ($options['autoplay'] === 'true' ? '1' : '0');
        $iframe_src .= '&controls=' . ($options['controls'] === 'true' ? '1' : '0');
        $iframe_src .= '&muted=' . ($options['muted'] === 'true' ? '1' : '0');
        
        $html = '<div class="hostreamly-video-wrapper"';
        if ($options['responsive'] === 'true') {
            $html .= ' style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"';
        }
        $html .= '>';
        
        $html .= '<iframe src="' . esc_url($iframe_src) . '"';
        if ($options['responsive'] === 'true') {
            $html .= ' style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"';
        } else {
            $html .= ' width="' . esc_attr($options['width']) . '" height="' . esc_attr($options['height']) . '"';
        }
        $html .= ' frameborder="0" allowfullscreen></iframe>';
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Track video progress
     */
    public function ajax_track_progress() {
        check_ajax_referer('hostreamly_progress_nonce', 'nonce');
        
        $user_id = get_current_user_id();
        $video_id = sanitize_text_field($_POST['video_id']);
        $lesson_id = intval($_POST['lesson_id']);
        $progress = floatval($_POST['progress']);
        $duration = floatval($_POST['duration']);
        
        if (!$user_id || !$video_id || !$lesson_id) {
            wp_die('Invalid parameters');
        }
        
        // Save progress to database
        $this->save_video_progress($user_id, $video_id, $lesson_id, $progress, $duration);
        
        // Check if lesson should be marked as complete
        $required_progress = get_post_meta($lesson_id, '_bunnyvault_required_progress', true) ?: 80;
        
        if ($progress >= $required_progress) {
            // Mark lesson as complete in LearnDash
            if (function_exists('learndash_process_mark_complete')) {
                learndash_process_mark_complete($user_id, $lesson_id);
            }
        }
        
        wp_send_json_success(array(
            'progress' => $progress,
            'completed' => $progress >= $required_progress
        ));
    }
    
    /**
     * Save video progress to database
     */
    private function save_video_progress($user_id, $video_id, $lesson_id, $progress, $duration) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'hostreamly_progress';
        
        $wpdb->replace(
            $table_name,
            array(
                'user_id' => $user_id,
                'video_id' => $video_id,
                'lesson_id' => $lesson_id,
                'progress' => $progress,
                'duration' => $duration,
                'last_watched' => current_time('mysql')
            ),
            array('%d', '%s', '%d', '%f', '%f', '%s')
        );
    }
    
    /**
     * Get video progress
     */
    private function get_video_progress($user_id, $video_id, $lesson_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'hostreamly_progress';
        
        $progress = $wpdb->get_var($wpdb->prepare(
            "SELECT progress FROM {$table_name} WHERE user_id = %d AND video_id = %s AND lesson_id = %d",
            $user_id, $video_id, $lesson_id
        ));
        
        return $progress ? floatval($progress) : 0;
    }
    
    /**
     * Initialize frontend scripts
     */
    private function init_frontend() {
        if (!is_admin()) {
            add_action('wp_enqueue_scripts', array($this, 'frontend_scripts'));
        }
    }
    
    /**
     * Enqueue frontend scripts
     */
    public function frontend_scripts() {
        wp_enqueue_script(
            'hostreamly-progress-tracker',
            HOSTREAMLY_MOODLE_PLUGIN_URL . 'assets/progress-tracker.js',
            array('jquery'),
            HOSTREAMLY_MOODLE_VERSION,
            true
        );
        
        wp_localize_script('hostreamly-progress-tracker', 'hostreamly_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('hostreamly_progress_nonce')
        ));
        
        wp_enqueue_style(
            'hostreamly-moodle-styles',
            HOSTREAMLY_MOODLE_PLUGIN_URL . 'assets/moodle-styles.css',
            array(),
            HOSTREAMLY_MOODLE_VERSION
        );
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        $this->create_progress_table();
        flush_rewrite_rules();
    }
    
    /**
     * Create progress tracking table
     */
    private function create_progress_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'hostreamly_progress';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE {$table_name} (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            video_id varchar(255) NOT NULL,
            lesson_id bigint(20) NOT NULL,
            progress float NOT NULL DEFAULT 0,
            duration float NOT NULL DEFAULT 0,
            last_watched datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_video_lesson (user_id, video_id, lesson_id),
            KEY user_id (user_id),
            KEY lesson_id (lesson_id)
        ) {$charset_collate};";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        flush_rewrite_rules();
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
     * Initialize progress tracking
     */
    private function init_progress_tracking() {
        // Additional progress tracking initialization
    }
}

// Initialize the plugin
Hostreamly_Moodle::get_instance();

?>