<?php
/**
 * Hostreamly Video Player Widget for Elementor
 *
 * @package Hostreamly_Elementor\Widgets
 * @since 2.0.0
 */

namespace Hostreamly_Elementor\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Utils;
use Hostreamly_Elementor\Widgets_Manager;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Video Player Widget Class
 */
class Video_Player extends Widget_Base {
    
    /**
     * Get widget name
     */
    public function get_name() {
        return 'hostreamly-video-player';
    }
    
    /**
     * Get widget title
     */
    public function get_title() {
        return esc_html__('Video Player', 'hostreamly-elementor');
    }
    
    /**
     * Get widget icon
     */
    public function get_icon() {
        return 'eicon-video-camera';
    }
    
    /**
     * Get widget categories
     */
    public function get_categories() {
        return ['hostreamly'];
    }
    
    /**
     * Get widget keywords
     */
    public function get_keywords() {
        return ['video', 'player', 'media', 'hostreamly', 'mp4'];
    }
    
    /**
     * Register widget controls
     */
    protected function register_controls() {
        
        // Content Tab
        $this->register_content_controls();
        
        // Style Tab
        $this->register_style_controls();
        
        // Advanced Tab
        $this->register_advanced_controls();
    }
    
    /**
     * Register content controls
     */
    private function register_content_controls() {
        
        // Video Selection Section
        $this->start_controls_section(
            'video_selection_section',
            [
                'label' => esc_html__('Video Selection', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'video_source',
            [
                'label' => esc_html__('Video Source', 'hostreamly-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'library',
                'options' => [
                    'library' => esc_html__('Media Library', 'hostreamly-elementor'),
                    'url' => esc_html__('External URL', 'hostreamly-elementor'),
                    'hostreamly' => esc_html__('Hostreamly', 'hostreamly-elementor'),
                    'youtube' => esc_html__('YouTube', 'hostreamly-elementor'),
                    'vimeo' => esc_html__('Vimeo', 'hostreamly-elementor')
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'video_library',
            [
                'label' => esc_html__('Choose Video', 'hostreamly-elementor'),
                'type' => Controls_Manager::MEDIA,
                'media_types' => ['video'],
                'condition' => [
                    'video_source' => 'library'
                ],
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->add_control(
            'video_url',
            [
                'label' => esc_html__('Video URL', 'hostreamly-elementor'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'https://example.com/video.mp4',
                'condition' => [
                    'video_source' => 'url'
                ],
                'sanitize_callback' => 'esc_url_raw'
            ]
        );
        
        $this->add_control(
            'hostreamly_video_id',
            [
                'label' => esc_html__('Hostreamly Video ID', 'hostreamly-elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => 'Enter video ID',
                'condition' => [
                    'video_source' => 'hostreamly'
                ],
                'sanitize_callback' => 'sanitize_text_field'
            ]
        );
        
        $this->add_control(
            'youtube_url',
            [
                'label' => esc_html__('YouTube URL', 'hostreamly-elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => 'https://www.youtube.com/watch?v=...',
                'condition' => [
                    'video_source' => 'youtube'
                ],
                'sanitize_callback' => 'esc_url_raw'
            ]
        );
        
        $this->add_control(
            'vimeo_url',
            [
                'label' => esc_html__('Vimeo URL', 'hostreamly-elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => 'https://vimeo.com/...',
                'condition' => [
                    'video_source' => 'vimeo'
                ],
                'sanitize_callback' => 'esc_url_raw'
            ]
        );
        
        $this->end_controls_section();
        
        // Player Settings Section
        $this->start_controls_section(
            'player_settings_section',
            [
                'label' => esc_html__('Player Settings', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'aspect_ratio',
            [
                'label' => esc_html__('Aspect Ratio', 'hostreamly-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '16:9',
                'options' => [
                    '16:9' => '16:9 (Widescreen)',
                    '4:3' => '4:3 (Standard)',
                    '1:1' => '1:1 (Square)',
                    '9:16' => '9:16 (Vertical)',
                    '21:9' => '21:9 (Ultrawide)',
                    'custom' => esc_html__('Custom', 'hostreamly-elementor')
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'custom_aspect_ratio',
            [
                'label' => esc_html__('Custom Aspect Ratio', 'hostreamly-elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => '16:9',
                'description' => esc_html__('Enter aspect ratio in format width:height (e.g., 16:9)', 'hostreamly-elementor'),
                'condition' => [
                    'aspect_ratio' => 'custom'
                ],
                'sanitize_callback' => 'sanitize_text_field'
            ]
        );
        
        $this->add_control(
            'autoplay',
            [
                'label' => esc_html__('Autoplay', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'description' => esc_html__('Note: Most browsers block autoplay with sound', 'hostreamly-elementor'),
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'muted',
            [
                'label' => esc_html__('Muted', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'loop',
            [
                'label' => esc_html__('Loop', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'controls',
            [
                'label' => esc_html__('Show Controls', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'preload',
            [
                'label' => esc_html__('Preload', 'hostreamly-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'metadata',
                'options' => [
                    'none' => esc_html__('None', 'hostreamly-elementor'),
                    'metadata' => esc_html__('Metadata', 'hostreamly-elementor'),
                    'auto' => esc_html__('Auto', 'hostreamly-elementor')
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->end_controls_section();
        
        // Poster Section
        $this->start_controls_section(
            'poster_section',
            [
                'label' => esc_html__('Poster Image', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'poster_image',
            [
                'label' => esc_html__('Poster Image', 'hostreamly-elementor'),
                'type' => Controls_Manager::MEDIA,
                'media_types' => ['image'],
                'description' => esc_html__('Image shown before video starts playing', 'hostreamly-elementor'),
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->add_control(
            'show_play_button',
            [
                'label' => esc_html__('Show Play Button', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->end_controls_section();
        
        // Video Info Section
        $this->start_controls_section(
            'video_info_section',
            [
                'label' => esc_html__('Video Information', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'show_title',
            [
                'label' => esc_html__('Show Title', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'video_title',
            [
                'label' => esc_html__('Video Title', 'hostreamly-elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__('Enter video title', 'hostreamly-elementor'),
                'condition' => [
                    'show_title' => 'yes'
                ],
                'sanitize_callback' => 'sanitize_text_field'
            ]
        );
        
        $this->add_control(
            'show_description',
            [
                'label' => esc_html__('Show Description', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'video_description',
            [
                'label' => esc_html__('Video Description', 'hostreamly-elementor'),
                'type' => Controls_Manager::TEXTAREA,
                'placeholder' => esc_html__('Enter video description', 'hostreamly-elementor'),
                'condition' => [
                    'show_description' => 'yes'
                ],
                'sanitize_callback' => 'wp_kses_post'
            ]
        );
        
        $this->end_controls_section();
    }
    
    /**
     * Register style controls
     */
    private function register_style_controls() {
        
        // Video Container Style
        $this->start_controls_section(
            'video_container_style',
            [
                'label' => esc_html__('Video Container', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'container_background',
                'selector' => '{{WRAPPER}} .hostreamly-video-player',
            ]
        );
        
        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'container_border',
                'selector' => '{{WRAPPER}} .hostreamly-video-player',
            ]
        );
        
        $this->add_control(
            'container_border_radius',
            [
                'label' => esc_html__('Border Radius', 'hostreamly-elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-video-player' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .hostreamly-video-player video' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
                ],
            ]
        );
        
        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'container_box_shadow',
                'selector' => '{{WRAPPER}} .hostreamly-video-player',
            ]
        );
        
        $this->add_responsive_control(
            'container_padding',
            [
                'label' => esc_html__('Padding', 'hostreamly-elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-video-player' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        
        $this->end_controls_section();
        
        // Play Button Style
        $this->start_controls_section(
            'play_button_style',
            [
                'label' => esc_html__('Play Button', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_play_button' => 'yes'
                ]
            ]
        );
        
        $this->add_responsive_control(
            'play_button_size',
            [
                'label' => esc_html__('Size', 'hostreamly-elementor'),
                'type' => Controls_Manager::SLIDER,
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
                    '{{WRAPPER}} .hostreamly-play-button' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}}; font-size: calc({{SIZE}}{{UNIT}} / 3);'
                ]
            ]
        );
        
        $this->start_controls_tabs('play_button_tabs');
        
        $this->start_controls_tab(
            'play_button_normal',
            [
                'label' => esc_html__('Normal', 'hostreamly-elementor')
            ]
        );
        
        $this->add_control(
            'play_button_color',
            [
                'label' => esc_html__('Color', 'hostreamly-elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-play-button' => 'color: {{VALUE}};'
                ]
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'play_button_background',
                'selector' => '{{WRAPPER}} .hostreamly-play-button',
            ]
        );
        
        $this->end_controls_tab();
        
        $this->start_controls_tab(
            'play_button_hover',
            [
                'label' => esc_html__('Hover', 'hostreamly-elementor')
            ]
        );
        
        $this->add_control(
            'play_button_hover_color',
            [
                'label' => esc_html__('Color', 'hostreamly-elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-play-button:hover' => 'color: {{VALUE}};'
                ]
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'play_button_hover_background',
                'selector' => '{{WRAPPER}} .hostreamly-play-button:hover',
            ]
        );
        
        $this->end_controls_tab();
        
        $this->end_controls_tabs();
        
        $this->add_control(
            'play_button_border_radius',
            [
                'label' => esc_html__('Border Radius', 'hostreamly-elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-play-button' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
                ],
                'separator' => 'before'
            ]
        );
        
        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'play_button_box_shadow',
                'selector' => '{{WRAPPER}} .hostreamly-play-button',
            ]
        );
        
        $this->end_controls_section();
        
        // Title Style
        $this->start_controls_section(
            'title_style',
            [
                'label' => esc_html__('Title', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_title' => 'yes'
                ]
            ]
        );
        
        $this->add_control(
            'title_color',
            [
                'label' => esc_html__('Color', 'hostreamly-elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-video-title' => 'color: {{VALUE}};'
                ]
            ]
        );
        
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .hostreamly-video-title',
            ]
        );
        
        $this->add_responsive_control(
            'title_spacing',
            [
                'label' => esc_html__('Spacing', 'hostreamly-elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100
                    ]
                ],
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-video-title' => 'margin-bottom: {{SIZE}}{{UNIT}};'
                ]
            ]
        );
        
        $this->end_controls_section();
        
        // Description Style
        $this->start_controls_section(
            'description_style',
            [
                'label' => esc_html__('Description', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_description' => 'yes'
                ]
            ]
        );
        
        $this->add_control(
            'description_color',
            [
                'label' => esc_html__('Color', 'hostreamly-elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .hostreamly-video-description' => 'color: {{VALUE}};'
                ]
            ]
        );
        
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'selector' => '{{WRAPPER}} .hostreamly-video-description',
            ]
        );
        
        $this->end_controls_section();
    }
    
    /**
     * Register advanced controls
     */
    private function register_advanced_controls() {
        
        // Analytics Section
        $this->start_controls_section(
            'analytics_section',
            [
                'label' => esc_html__('Analytics & Tracking', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_ADVANCED,
            ]
        );
        
        $this->add_control(
            'enable_analytics',
            [
                'label' => esc_html__('Enable Analytics', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'description' => esc_html__('Track video views and interactions', 'hostreamly-elementor'),
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'track_events',
            [
                'label' => esc_html__('Track Events', 'hostreamly-elementor'),
                'type' => Controls_Manager::SELECT2,
                'multiple' => true,
                'options' => [
                    'play' => esc_html__('Play', 'hostreamly-elementor'),
                    'pause' => esc_html__('Pause', 'hostreamly-elementor'),
                    'ended' => esc_html__('Ended', 'hostreamly-elementor'),
                    'progress' => esc_html__('Progress (25%, 50%, 75%)', 'hostreamly-elementor')
                ],
                'default' => ['play', 'ended'],
                'condition' => [
                    'enable_analytics' => 'yes'
                ],
                'sanitize_callback' => function($value) {
                    if (is_array($value)) {
                        return array_map('sanitize_key', $value);
                    }
                    return sanitize_key($value);
                }
            ]
        );
        
        $this->end_controls_section();
    }
    
    /**
     * Render widget output
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        
        if (!is_array($settings)) {
            return;
        }
        
        $widget_id = sanitize_key($this->get_id());
        
        // Get video URL based on source
        $video_url = $this->get_video_url($settings);
        $poster_url = !empty($settings['poster_image']['url']) ? esc_url_raw($settings['poster_image']['url']) : '';
        
        // Calculate aspect ratio
        $aspect_ratio_style = $this->get_aspect_ratio_style($settings);
        
        // Build video attributes
        $video_attrs = $this->get_video_attributes($settings);
        
        ?>
        <div class="hostreamly-video-player" data-widget-id="<?php echo esc_attr($widget_id); ?>">
            
            <?php if (sanitize_key($settings['show_title'] ?? '') === 'yes' && !empty($settings['video_title'])): ?>
                <?php $title_tag = sanitize_key($settings['title_tag'] ?? 'h3'); ?>
                <<?php echo $title_tag; ?> class="hostreamly-video-title"><?php echo esc_html(sanitize_text_field($settings['video_title'])); ?></<?php echo $title_tag; ?>>
            <?php endif; ?>
            
            <div class="hostreamly-video-wrapper" style="<?php echo esc_attr($aspect_ratio_style); ?>">
                <?php if ($video_url): ?>
                    <?php if ($this->is_embed_video($settings['video_source'])): ?>
                        <?php echo $this->render_embed_video($settings, $video_url); ?>
                    <?php else: ?>
                        <video <?php echo $video_attrs; ?>>
                            <source src="<?php echo esc_url($video_url); ?>" type="video/mp4">
                            <?php esc_html_e('Your browser does not support the video tag.', 'hostreamly-elementor'); ?>
                        </video>
                    <?php endif; ?>
                    
                    <?php if (sanitize_key($settings['show_play_button'] ?? '') === 'yes' && sanitize_key($settings['autoplay'] ?? '') !== 'yes'): ?>
                        <div class="hostreamly-video-overlay">
                            <button class="hostreamly-play-button" aria-label="<?php esc_attr_e('Play video', 'hostreamly-elementor'); ?>">
                                <i class="eicon-play"></i>
                            </button>
                        </div>
                    <?php endif; ?>
                    
                <?php else: ?>
                    <div class="hostreamly-video-placeholder">
                        <div class="hostreamly-placeholder-icon">
                            <i class="eicon-video-camera"></i>
                        </div>
                        <p><?php esc_html_e('Please select a video', 'hostreamly-elementor'); ?></p>
                    </div>
                <?php endif; ?>
            </div>
            
            <?php if (sanitize_key($settings['show_description'] ?? '') === 'yes' && !empty($settings['video_description'])): ?>
                <div class="hostreamly-video-description">
                    <?php echo wp_kses_post(wpautop(wp_kses_post($settings['video_description']))); ?>
                </div>
            <?php endif; ?>
            
        </div>
        <?php
    }
    
    /**
     * Get video URL based on source
     */
    private function get_video_url($settings) {
        if (!is_array($settings) || empty($settings['video_source'])) {
            return '';
        }
        
        $video_source = sanitize_key($settings['video_source']);
        
        switch ($video_source) {
            case 'library':
                return !empty($settings['video_library']['url']) ? esc_url_raw($settings['video_library']['url']) : '';
            
            case 'url':
                return !empty($settings['video_url']['url']) ? esc_url_raw($settings['video_url']['url']) : '';
            
            case 'hostreamly':
                return !empty($settings['hostreamly_video_id']) ? $this->get_hostreamly_url(sanitize_text_field($settings['hostreamly_video_id'])) : '';
            
            case 'youtube':
                return !empty($settings['youtube_url']) ? $this->get_youtube_embed_url(esc_url_raw($settings['youtube_url'])) : '';
            
            case 'vimeo':
                return !empty($settings['vimeo_url']) ? $this->get_vimeo_embed_url(esc_url_raw($settings['vimeo_url'])) : '';
            
            default:
                return '';
        }
    }
    
    /**
     * Get Hostreamly video URL
     */
    private function get_hostreamly_url($video_id) {
        if (empty($video_id)) {
            return '';
        }
        
        $video_id = sanitize_text_field($video_id);
        // This would integrate with Hostreamly API
        return "https://hostreamly.example.com/video/{$video_id}.mp4";
    }
    
    /**
     * Get YouTube embed URL
     */
    private function get_youtube_embed_url($url) {
        if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return '';
        }
        
        preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/', $url, $matches);
        if (!empty($matches[1])) {
            $video_id = sanitize_text_field($matches[1]);
            return "https://www.youtube.com/embed/{$video_id}";
        }
        return '';
    }
    
    /**
     * Get Vimeo embed URL
     */
    private function get_vimeo_embed_url($url) {
        if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return '';
        }
        
        preg_match('/vimeo\.com\/(\d+)/', $url, $matches);
        if (!empty($matches[1])) {
            $video_id = absint($matches[1]);
            return "https://player.vimeo.com/video/{$video_id}";
        }
        return '';
    }
    
    /**
     * Check if video source is embed type
     */
    private function is_embed_video($source) {
        $source = sanitize_key($source);
        return in_array($source, ['youtube', 'vimeo']);
    }
    
    /**
     * Render embed video
     */
    private function render_embed_video($settings, $url) {
        if (!is_array($settings) || empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return '';
        }
        
        $params = [];
        
        if (sanitize_key($settings['autoplay'] ?? '') === 'yes') {
            $params[] = 'autoplay=1';
        }
        
        if (sanitize_key($settings['muted'] ?? '') === 'yes') {
            $params[] = 'muted=1';
        }
        
        if (sanitize_key($settings['loop'] ?? '') === 'yes') {
            $params[] = 'loop=1';
        }
        
        if (sanitize_key($settings['controls'] ?? 'yes') !== 'yes') {
            $params[] = 'controls=0';
        }
        
        $url_with_params = $url . (strpos($url, '?') !== false ? '&' : '?') . implode('&', $params);
        
        return sprintf(
            '<iframe src="%s" frameborder="0" allowfullscreen></iframe>',
            esc_url($url_with_params)
        );
    }
    
    /**
     * Get aspect ratio style
     */
    private function get_aspect_ratio_style($settings) {
        if (!is_array($settings)) {
            return 'padding-bottom: 56.25%;';
        }
        
        $aspect_ratio = sanitize_key($settings['aspect_ratio'] ?? '16:9');
        
        if ($aspect_ratio === 'custom' && !empty($settings['custom_aspect_ratio'])) {
            $custom_ratio = sanitize_text_field($settings['custom_aspect_ratio']);
            $ratio_parts = explode(':', $custom_ratio);
            if (count($ratio_parts) === 2 && is_numeric($ratio_parts[0]) && is_numeric($ratio_parts[1]) && $ratio_parts[0] > 0) {
                $ratio = (floatval($ratio_parts[1]) / floatval($ratio_parts[0])) * 100;
                return "padding-bottom: {$ratio}%;";
            }
        }
        
        $ratios = [
            '16:9' => 56.25,
            '4:3' => 75,
            '1:1' => 100,
            '9:16' => 177.78,
            '21:9' => 42.86,
            '3:2' => 66.67
        ];
        
        $ratio = $ratios[$aspect_ratio] ?? 56.25;
        return "padding-bottom: {$ratio}%;";
    }
    
    /**
     * Get video attributes
     */
    private function get_video_attributes($settings) {
        if (!is_array($settings)) {
            return 'class="hostreamly-video-element" playsinline="true"';
        }
        
        $attrs = [
            'class="hostreamly-video-element"',
            'playsinline="true"'
        ];
        
        if (sanitize_key($settings['autoplay'] ?? '') === 'yes') {
            $attrs[] = 'autoplay="autoplay"';
        }
        
        if (sanitize_key($settings['muted'] ?? '') === 'yes') {
            $attrs[] = 'muted="muted"';
        }
        
        if (sanitize_key($settings['loop'] ?? '') === 'yes') {
            $attrs[] = 'loop="loop"';
        }
        
        if (sanitize_key($settings['controls'] ?? 'yes') === 'yes') {
            $attrs[] = 'controls="controls"';
        }
        
        if (!empty($settings['poster_image']['url'])) {
            $attrs[] = 'poster="' . esc_url($settings['poster_image']['url']) . '"';
        }
        
        $preload = sanitize_key($settings['preload'] ?? '');
        if (!empty($preload) && in_array($preload, ['none', 'metadata', 'auto'])) {
            $attrs[] = 'preload="' . esc_attr($preload) . '"';
        }
        
        // Add analytics attributes
        if (sanitize_key($settings['enable_analytics'] ?? '') === 'yes') {
            $attrs[] = 'data-analytics="true"';
            if (!empty($settings['track_events']) && is_array($settings['track_events'])) {
                $track_events = array_map('sanitize_key', $settings['track_events']);
                $attrs[] = 'data-track-events="' . esc_attr(implode(',', $track_events)) . '"';
            }
        }
        
        return implode(' ', $attrs);
    }
}