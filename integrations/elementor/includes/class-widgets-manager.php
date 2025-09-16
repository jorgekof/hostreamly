<?php
/**
 * BunnyVault Elementor Widgets Manager
 * 
 * @package BunnyVault_Elementor
 * @since 2.0.0
 */

namespace BunnyVault_Elementor;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Widgets Manager Class
 */
class Widgets_Manager {
    
    /**
     * Widget categories
     */
    const WIDGET_CATEGORIES = [
        'bunnyvault' => [
            'title' => 'BunnyVault',
            'icon' => 'eicon-video-camera'
        ],
        'bunnyvault-pro' => [
            'title' => 'BunnyVault Pro',
            'icon' => 'eicon-video-playlist'
        ]
    ];
    
    /**
     * Available widgets
     */
    const WIDGETS = [
        'video-player' => [
            'class' => 'Video_Player',
            'file' => 'class-video-player.php',
            'pro' => false
        ],
        'video-gallery' => [
            'class' => 'Video_Gallery',
            'file' => 'class-video-gallery.php',
            'pro' => false
        ],
        'video-carousel' => [
            'class' => 'Video_Carousel',
            'file' => 'class-video-carousel.php',
            'pro' => false
        ],
        'video-grid' => [
            'class' => 'Video_Grid',
            'file' => 'class-video-grid.php',
            'pro' => false
        ],
        'video-testimonials' => [
            'class' => 'Video_Testimonials',
            'file' => 'class-video-testimonials.php',
            'pro' => true
        ],
        'video-background' => [
            'class' => 'Video_Background',
            'file' => 'class-video-background.php',
            'pro' => true
        ]
    ];
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('elementor/widgets/register', [$this, 'register_widgets']);
        add_action('elementor/elements/categories_registered', [$this, 'register_categories']);
    }
    
    /**
     * Register widget categories
     */
    public function register_categories($elements_manager) {
        if (!$elements_manager || !method_exists($elements_manager, 'add_category')) {
            return;
        }
        
        foreach (self::WIDGET_CATEGORIES as $category_id => $category_data) {
            if (!is_string($category_id) || !is_array($category_data)) {
                continue;
            }
            
            $elements_manager->add_category(sanitize_key($category_id), [
                'title' => esc_html__($category_data['title'] ?? 'BunnyVault', 'bunnyvault-elementor'),
                'icon' => sanitize_html_class($category_data['icon'] ?? 'eicon-video-camera')
            ]);
        }
    }
    
    /**
     * Register widgets
     */
    public function register_widgets($widgets_manager) {
        if (!$widgets_manager || !method_exists($widgets_manager, 'register')) {
            return;
        }
        
        if (!defined('BUNNYVAULT_ELEMENTOR_PATH')) {
            error_log('BunnyVault Elementor: BUNNYVAULT_ELEMENTOR_PATH not defined');
            return;
        }
        
        foreach (self::WIDGETS as $widget_id => $widget_data) {
            if (!is_string($widget_id) || !is_array($widget_data)) {
                continue;
            }
            
            // Skip pro widgets if not available
            if (!empty($widget_data['pro']) && !$this->is_pro_available()) {
                continue;
            }
            
            $widget_file = BUNNYVAULT_ELEMENTOR_PATH . 'includes/widgets/' . sanitize_file_name($widget_data['file'] ?? '');
            
            if (file_exists($widget_file)) {
                require_once $widget_file;
                
                $widget_class = '\\BunnyVault_Elementor\\Widgets\\' . sanitize_html_class($widget_data['class'] ?? '');
                
                if (class_exists($widget_class)) {
                    try {
                        $widget_instance = new $widget_class();
                        if (method_exists($widget_instance, 'get_name')) {
                            $widgets_manager->register($widget_instance);
                        }
                    } catch (Exception $e) {
                        error_log('BunnyVault Elementor: Failed to register widget ' . sanitize_text_field($widget_id) . ': ' . $e->getMessage());
                    }
                } else {
                    error_log('BunnyVault Elementor: Widget class not found: ' . sanitize_text_field($widget_class));
                }
            } else {
                error_log('BunnyVault Elementor: Widget file not found: ' . sanitize_text_field($widget_file));
            }
        }
    }
    
    /**
     * Check if pro version is available
     */
    private function is_pro_available() {
        // Check if BunnyVault Pro is active
        return defined('BUNNYVAULT_PRO_VERSION');
    }
    
    /**
     * Get widget icon
     */
    public static function get_widget_icon($widget_type) {
        if (!is_string($widget_type)) {
            return 'eicon-video-camera';
        }
        
        $widget_type = sanitize_key($widget_type);
        
        $icons = [
            'video-player' => 'eicon-video-camera',
            'video-gallery' => 'eicon-gallery-grid',
            'video-carousel' => 'eicon-media-carousel',
            'video-grid' => 'eicon-posts-grid',
            'video-testimonials' => 'eicon-testimonial',
            'video-background' => 'eicon-background'
        ];
        
        return sanitize_html_class($icons[$widget_type] ?? 'eicon-video-camera');
    }
    
    /**
     * Get common widget controls
     */
    public static function get_common_controls() {
        return [
            // Video Selection
            'video_selection_section' => [
                'label' => esc_html__('Video Selection', 'bunnyvault-elementor'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
                'controls' => [
                    'video_source' => [
                        'label' => esc_html__('Video Source', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SELECT,
                        'default' => 'library',
                        'options' => [
                            'library' => esc_html__('Media Library', 'bunnyvault-elementor'),
                            'url' => esc_html__('External URL', 'bunnyvault-elementor'),
                            'bunnyvault' => esc_html__('BunnyVault', 'bunnyvault-elementor')
                        ]
                    ],
                    'video_url' => [
                        'label' => esc_html__('Video URL', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::URL,
                        'condition' => [
                            'video_source' => 'url'
                        ]
                    ],
                    'bunnyvault_video' => [
                        'label' => esc_html__('Select Video', 'bunnyvault-elementor'),
                        'type' => 'bunnyvault_video_selector',
                        'condition' => [
                            'video_source' => 'bunnyvault'
                        ]
                    ]
                ]
            ],
            
            // Player Settings
            'player_settings_section' => [
                'label' => esc_html__('Player Settings', 'bunnyvault-elementor'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
                'controls' => [
                    'autoplay' => [
                        'label' => esc_html__('Autoplay', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SWITCHER,
                        'default' => 'no'
                    ],
                    'muted' => [
                        'label' => esc_html__('Muted', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SWITCHER,
                        'default' => 'no'
                    ],
                    'loop' => [
                        'label' => esc_html__('Loop', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SWITCHER,
                        'default' => 'no'
                    ],
                    'controls' => [
                        'label' => esc_html__('Show Controls', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SWITCHER,
                        'default' => 'yes'
                    ],
                    'poster' => [
                        'label' => esc_html__('Poster Image', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::MEDIA
                    ]
                ]
            ],
            
            // Layout Settings
            'layout_section' => [
                'label' => esc_html__('Layout', 'bunnyvault-elementor'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
                'controls' => [
                    'aspect_ratio' => [
                        'label' => esc_html__('Aspect Ratio', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SELECT,
                        'default' => '16:9',
                        'options' => [
                            '16:9' => '16:9',
                            '4:3' => '4:3',
                            '1:1' => '1:1',
                            '9:16' => '9:16 (Vertical)',
                            'custom' => esc_html__('Custom', 'bunnyvault-elementor')
                        ]
                    ],
                    'custom_aspect_ratio' => [
                        'label' => esc_html__('Custom Aspect Ratio', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::TEXT,
                        'placeholder' => '16:9',
                        'condition' => [
                            'aspect_ratio' => 'custom'
                        ]
                    ]
                ]
            ]
        ];
    }
    
    /**
     * Get common style controls
     */
    public static function get_common_style_controls() {
        return [
            // Video Style
            'video_style_section' => [
                'label' => esc_html__('Video', 'bunnyvault-elementor'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
                'controls' => [
                    'video_border_radius' => [
                        'label' => esc_html__('Border Radius', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::DIMENSIONS,
                        'size_units' => ['px', '%'],
                        'selectors' => [
                            '{{WRAPPER}} .bunnyvault-video-player video' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
                        ]
                    ],
                    'video_box_shadow' => [
                        'label' => esc_html__('Box Shadow', 'bunnyvault-elementor'),
                        'type' => \Elementor\Group_Control_Box_Shadow::get_type(),
                        'selector' => '{{WRAPPER}} .bunnyvault-video-player'
                    ]
                ]
            ],
            
            // Overlay Style
            'overlay_style_section' => [
                'label' => esc_html__('Overlay', 'bunnyvault-elementor'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
                'controls' => [
                    'show_play_button' => [
                        'label' => esc_html__('Show Play Button', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SWITCHER,
                        'default' => 'yes'
                    ],
                    'play_button_size' => [
                        'label' => esc_html__('Play Button Size', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::SLIDER,
                        'range' => [
                            'px' => [
                                'min' => 20,
                                'max' => 200
                            ]
                        ],
                        'default' => [
                            'size' => 60
                        ],
                        'selectors' => [
                            '{{WRAPPER}} .bunnyvault-play-button' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};'
                        ],
                        'condition' => [
                            'show_play_button' => 'yes'
                        ]
                    ],
                    'play_button_color' => [
                        'label' => esc_html__('Play Button Color', 'bunnyvault-elementor'),
                        'type' => \Elementor\Controls_Manager::COLOR,
                        'default' => '#ffffff',
                        'selectors' => [
                            '{{WRAPPER}} .bunnyvault-play-button' => 'color: {{VALUE}};'
                        ],
                        'condition' => [
                            'show_play_button' => 'yes'
                        ]
                    ],
                    'overlay_background' => [
                        'label' => esc_html__('Overlay Background', 'bunnyvault-elementor'),
                        'type' => \Elementor\Group_Control_Background::get_type(),
                        'selector' => '{{WRAPPER}} .bunnyvault-video-overlay'
                    ]
                ]
            ]
        ];
    }
    
    /**
     * Render video player HTML
     */
    public static function render_video_player($settings, $widget_id = '') {
        if (!is_array($settings)) {
            return '<div class="bunnyvault-error">Invalid settings provided</div>';
        }
        
        $video_source = sanitize_key($settings['video_source'] ?? 'library');
        $autoplay = ($settings['autoplay'] ?? 'no') === 'yes';
        $muted = ($settings['muted'] ?? 'no') === 'yes';
        $loop = ($settings['loop'] ?? 'no') === 'yes';
        $controls = ($settings['controls'] ?? 'yes') === 'yes';
        $aspect_ratio = sanitize_text_field($settings['aspect_ratio'] ?? '16:9');
        
        // Generate unique ID
        $widget_id = sanitize_html_class($widget_id);
        $player_id = 'bunnyvault-player-' . ($widget_id ?: wp_unique_id());
        
        // Build video attributes
        $video_attrs = [
            'id' => sanitize_html_class($player_id),
            'class' => 'bunnyvault-video-element',
            'playsinline' => 'true'
        ];
        
        if ($autoplay) $video_attrs['autoplay'] = 'autoplay';
        if ($muted) $video_attrs['muted'] = 'muted';
        if ($loop) $video_attrs['loop'] = 'loop';
        if ($controls) $video_attrs['controls'] = 'controls';
        
        // Add poster if available
        if (!empty($settings['poster']['url']) && filter_var($settings['poster']['url'], FILTER_VALIDATE_URL)) {
            $video_attrs['poster'] = esc_url($settings['poster']['url']);
        }
        
        // Get video URL based on source
        $video_url = '';
        switch ($video_source) {
            case 'url':
                $url = $settings['video_url']['url'] ?? '';
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $video_url = esc_url($url);
                }
                break;
            case 'bunnyvault':
                $video_id = sanitize_text_field($settings['bunnyvault_video'] ?? '');
                $video_url = self::get_bunnyvault_video_url($video_id);
                break;
            case 'library':
            default:
                $url = $settings['video_library']['url'] ?? '';
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $video_url = esc_url($url);
                }
                break;
        }
        
        // Calculate aspect ratio
        $aspect_ratio_style = '';
        if ($aspect_ratio === 'custom' && !empty($settings['custom_aspect_ratio'])) {
            $custom_ratio = sanitize_text_field($settings['custom_aspect_ratio']);
            $ratio_parts = explode(':', $custom_ratio);
            if (count($ratio_parts) === 2 && is_numeric($ratio_parts[0]) && is_numeric($ratio_parts[1])) {
                $width = floatval($ratio_parts[0]);
                $height = floatval($ratio_parts[1]);
                if ($width > 0 && $height > 0) {
                    $ratio = ($height / $width) * 100;
                    $aspect_ratio_style = 'padding-bottom: ' . esc_attr($ratio) . '%;';
                }
            }
        } else {
            $ratios = [
                '16:9' => 56.25,
                '4:3' => 75,
                '1:1' => 100,
                '9:16' => 177.78
            ];
            $ratio = $ratios[$aspect_ratio] ?? 56.25;
            $aspect_ratio_style = 'padding-bottom: ' . esc_attr($ratio) . '%;';
        }
        
        // Build attributes string
        $attrs_string = '';
        foreach ($video_attrs as $attr => $value) {
            if (is_string($attr) && is_string($value)) {
                $attrs_string .= esc_attr($attr) . '="' . esc_attr($value) . '" ';
            }
        }
        
        // Render HTML
        ob_start();
        ?>
        <div class="bunnyvault-video-player" data-aspect-ratio="<?php echo esc_attr($aspect_ratio); ?>">
            <div class="bunnyvault-video-wrapper" style="<?php echo esc_attr($aspect_ratio_style); ?>">
                <?php if (!empty($video_url)): ?>
                    <video <?php echo wp_kses_post($attrs_string); ?>>
                        <source src="<?php echo esc_url($video_url); ?>" type="video/mp4">
                        <?php esc_html_e('Your browser does not support the video tag.', 'bunnyvault-elementor'); ?>
                    </video>
                <?php else: ?>
                    <div class="bunnyvault-video-placeholder">
                        <div class="bunnyvault-placeholder-icon">
                            <i class="eicon-video-camera"></i>
                        </div>
                        <p><?php esc_html_e('Please select a video', 'bunnyvault-elementor'); ?></p>
                    </div>
                <?php endif; ?>
                
                <?php if (($settings['show_play_button'] ?? 'yes') === 'yes' && !$autoplay): ?>
                    <div class="bunnyvault-video-overlay">
                        <button class="bunnyvault-play-button" aria-label="<?php esc_attr_e('Play video', 'bunnyvault-elementor'); ?>">
                            <i class="eicon-play"></i>
                        </button>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Get BunnyVault video URL
     */
    private static function get_bunnyvault_video_url($video_id) {
        if (empty($video_id) || !is_string($video_id)) {
            return '';
        }
        
        $video_id = sanitize_text_field($video_id);
        
        // This would integrate with BunnyVault API
        // For now, return a placeholder with proper validation
        if (preg_match('/^[a-zA-Z0-9_-]+$/', $video_id)) {
            return esc_url("https://bunnyvault.example.com/video/{$video_id}.mp4");
        }
        
        return '';
    }
    
    /**
     * Get video thumbnail
     */
    public static function get_video_thumbnail($video_source, $video_data) {
        if (!is_string($video_source) || empty($video_data)) {
            return '';
        }
        
        $video_source = sanitize_key($video_source);
        
        switch ($video_source) {
            case 'bunnyvault':
                return self::get_bunnyvault_thumbnail($video_data);
            case 'url':
                return self::extract_thumbnail_from_url($video_data);
            default:
                return '';
        }
    }
    
    /**
     * Get BunnyVault thumbnail
     */
    private static function get_bunnyvault_thumbnail($video_id) {
        if (empty($video_id) || !is_string($video_id)) {
            return '';
        }
        
        $video_id = sanitize_text_field($video_id);
        
        // This would integrate with BunnyVault API
        if (preg_match('/^[a-zA-Z0-9_-]+$/', $video_id)) {
            return esc_url("https://bunnyvault.example.com/thumbnails/{$video_id}.jpg");
        }
        
        return '';
    }
    
    /**
     * Extract thumbnail from video URL
     */
    private static function extract_thumbnail_from_url($url) {
        if (empty($url) || !is_string($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return '';
        }
        
        $url = esc_url_raw($url);
        
        // Basic implementation - could be enhanced
        if (strpos($url, 'youtube.com') !== false || strpos($url, 'youtu.be') !== false) {
            // Extract YouTube video ID and return thumbnail
            preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/', $url, $matches);
            if (!empty($matches[1]) && preg_match('/^[a-zA-Z0-9_-]+$/', $matches[1])) {
                $video_id = sanitize_text_field($matches[1]);
                return esc_url("https://img.youtube.com/vi/{$video_id}/maxresdefault.jpg");
            }
        }
        
        return '';
    }
}