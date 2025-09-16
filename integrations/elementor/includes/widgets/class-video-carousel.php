<?php
/**
 * Hostreamly Video Carousel Widget for Elementor
 * 
 * @package Hostreamly_Elementor\Widgets
 * @since 2.0.0
 */

namespace Hostreamly_Elementor\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Repeater;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Video Carousel Widget Class
 */
class Video_Carousel extends Widget_Base {
    
    /**
     * Get widget name
     */
    public function get_name() {
        return 'hostreamly-video-carousel';
    }
    
    /**
     * Get widget title
     */
    public function get_title() {
        return esc_html__('Video Carousel', 'hostreamly-elementor');
    }
    
    /**
     * Get widget icon
     */
    public function get_icon() {
        return 'eicon-media-carousel';
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
        return ['video', 'carousel', 'slider', 'media', 'hostreamly'];
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
        
        // Carousel Items Section
        $this->start_controls_section(
            'carousel_items_section',
            [
                'label' => esc_html__('Carousel Items', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $repeater = new Repeater();
        
        $repeater->add_control(
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
        
        $repeater->add_control(
            'video_library',
            [
                'label' => esc_html__('Choose Video', 'bunnyvault-elementor'),
                'type' => Controls_Manager::MEDIA,
                'media_types' => ['video'],
                'condition' => [
                    'video_source' => 'library'
                ],
                'sanitize_callback' => 'absint'
            ]
        );
        
        $repeater->add_control(
            'video_url',
            [
                'label' => esc_html__('Video URL', 'bunnyvault-elementor'),
                'type' => Controls_Manager::URL,
                'condition' => [
                    'video_source' => 'url'
                ],
                'sanitize_callback' => 'esc_url_raw'
            ]
        );
        
        $repeater->add_control(
            'hostreamly_video_id',
            [
                'label' => esc_html__('Hostreamly Video ID', 'hostreamly-elementor'),
                'type' => Controls_Manager::TEXT,
                'condition' => [
                    'video_source' => 'hostreamly'
                ],
                'sanitize_callback' => 'sanitize_text_field'
            ]
        );
        
        $repeater->add_control(
            'youtube_url',
            [
                'label' => esc_html__('YouTube URL', 'bunnyvault-elementor'),
                'type' => Controls_Manager::TEXT,
                'condition' => [
                    'video_source' => 'youtube'
                ],
                'sanitize_callback' => 'esc_url_raw'
            ]
        );
        
        $repeater->add_control(
            'vimeo_url',
            [
                'label' => esc_html__('Vimeo URL', 'bunnyvault-elementor'),
                'type' => Controls_Manager::TEXT,
                'condition' => [
                    'video_source' => 'vimeo'
                ],
                'sanitize_callback' => 'esc_url_raw'
            ]
        );
        
        $repeater->add_control(
            'video_title',
            [
                'label' => esc_html__('Video Title', 'bunnyvault-elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__('Enter video title', 'bunnyvault-elementor'),
                'sanitize_callback' => 'sanitize_text_field'
            ]
        );
        
        $repeater->add_control(
            'video_description',
            [
                'label' => esc_html__('Video Description', 'bunnyvault-elementor'),
                'type' => Controls_Manager::TEXTAREA,
                'placeholder' => esc_html__('Enter video description', 'bunnyvault-elementor'),
                'sanitize_callback' => 'wp_kses_post'
            ]
        );
        
        $repeater->add_control(
            'custom_thumbnail',
            [
                'label' => esc_html__('Custom Thumbnail', 'bunnyvault-elementor'),
                'type' => Controls_Manager::MEDIA,
                'media_types' => ['image'],
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->add_control(
            'carousel_items',
            [
                'label' => esc_html__('Carousel Items', 'bunnyvault-elementor'),
                'type' => Controls_Manager::REPEATER,
                'fields' => $repeater->get_controls(),
                'default' => [
                    [
                        'video_title' => esc_html__('Video #1', 'bunnyvault-elementor'),
                        'video_source' => 'library'
                    ],
                    [
                        'video_title' => esc_html__('Video #2', 'bunnyvault-elementor'),
                        'video_source' => 'library'
                    ],
                    [
                        'video_title' => esc_html__('Video #3', 'bunnyvault-elementor'),
                        'video_source' => 'library'
                    ]
                ],
                'title_field' => '{{{ video_title }}}'
            ]
        );
        
        $this->end_controls_section();
        
        // Carousel Settings Section
        $this->start_controls_section(
            'carousel_settings_section',
            [
                'label' => esc_html__('Carousel Settings', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_responsive_control(
            'slides_to_show',
            [
                'label' => esc_html__('Slides to Show', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '3',
                'tablet_default' => '2',
                'mobile_default' => '1',
                'options' => [
                    '1' => '1',
                    '2' => '2',
                    '3' => '3',
                    '4' => '4',
                    '5' => '5',
                    '6' => '6'
                ],
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->add_responsive_control(
            'slides_to_scroll',
            [
                'label' => esc_html__('Slides to Scroll', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '1',
                'options' => [
                    '1' => '1',
                    '2' => '2',
                    '3' => '3',
                    '4' => '4'
                ],
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->add_control(
            'autoplay',
            [
                'label' => esc_html__('Autoplay', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'autoplay_speed',
            [
                'label' => esc_html__('Autoplay Speed (ms)', 'bunnyvault-elementor'),
                'type' => Controls_Manager::NUMBER,
                'default' => 3000,
                'min' => 1000,
                'max' => 10000,
                'step' => 100,
                'condition' => [
                    'autoplay' => 'yes'
                ],
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->add_control(
            'infinite_loop',
            [
                'label' => esc_html__('Infinite Loop', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'pause_on_hover',
            [
                'label' => esc_html__('Pause on Hover', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'condition' => [
                    'autoplay' => 'yes'
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'transition_speed',
            [
                'label' => esc_html__('Transition Speed (ms)', 'bunnyvault-elementor'),
                'type' => Controls_Manager::NUMBER,
                'default' => 500,
                'min' => 100,
                'max' => 2000,
                'step' => 50,
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->end_controls_section();
        
        // Navigation Section
        $this->start_controls_section(
            'navigation_section',
            [
                'label' => esc_html__('Navigation', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'show_arrows',
            [
                'label' => esc_html__('Show Arrows', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'show_dots',
            [
                'label' => esc_html__('Show Dots', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'arrow_position',
            [
                'label' => esc_html__('Arrow Position', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'inside',
                'options' => [
                    'inside' => esc_html__('Inside', 'bunnyvault-elementor'),
                    'outside' => esc_html__('Outside', 'bunnyvault-elementor')
                ],
                'condition' => [
                    'show_arrows' => 'yes'
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'dots_position',
            [
                'label' => esc_html__('Dots Position', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'bottom',
                'options' => [
                    'top' => esc_html__('Top', 'bunnyvault-elementor'),
                    'bottom' => esc_html__('Bottom', 'bunnyvault-elementor')
                ],
                'condition' => [
                    'show_dots' => 'yes'
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->end_controls_section();
        
        // Player Settings Section
        $this->start_controls_section(
            'player_settings_section',
            [
                'label' => esc_html__('Player Settings', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'play_mode',
            [
                'label' => esc_html__('Play Mode', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'lightbox',
                'options' => [
                    'lightbox' => esc_html__('Lightbox', 'bunnyvault-elementor'),
                    'inline' => esc_html__('Inline', 'bunnyvault-elementor')
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'aspect_ratio',
            [
                'label' => esc_html__('Aspect Ratio', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '16:9',
                'options' => [
                    '16:9' => '16:9 (Widescreen)',
                    '4:3' => '4:3 (Standard)',
                    '1:1' => '1:1 (Square)',
                    '9:16' => '9:16 (Vertical)'
                ],
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'show_play_button',
            [
                'label' => esc_html__('Show Play Button', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->end_controls_section();
        
        // Content Display Section
        $this->start_controls_section(
            'content_display_section',
            [
                'label' => esc_html__('Content Display', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'show_title',
            [
                'label' => esc_html__('Show Title', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'show_description',
            [
                'label' => esc_html__('Show Description', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'description_length',
            [
                'label' => esc_html__('Description Length', 'bunnyvault-elementor'),
                'type' => Controls_Manager::NUMBER,
                'default' => 100,
                'min' => 10,
                'max' => 500,
                'condition' => [
                    'show_description' => 'yes'
                ],
                'sanitize_callback' => 'absint'
            ]
        );
        
        $this->end_controls_section();
    }
    
    /**
     * Register style controls
     */
    private function register_style_controls() {
        
        // Carousel Container Style
        $this->start_controls_section(
            'carousel_container_style',
            [
                'label' => esc_html__('Carousel Container', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'carousel_background',
                'selector' => '{{WRAPPER}} .bunnyvault-video-carousel',
            ]
        );
        
        $this->add_responsive_control(
            'carousel_padding',
            [
                'label' => esc_html__('Padding', 'bunnyvault-elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-video-carousel' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        
        $this->end_controls_section();
        
        // Slide Style
        $this->start_controls_section(
            'slide_style',
            [
                'label' => esc_html__('Slide', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        
        $this->add_responsive_control(
            'slide_spacing',
            [
                'label' => esc_html__('Slide Spacing', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100
                    ]
                ],
                'default' => [
                    'size' => 15
                ],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-slide' => 'padding: 0 {{SIZE}}{{UNIT}};'
                ]
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'slide_background',
                'selector' => '{{WRAPPER}} .bunnyvault-carousel-slide .slide-content',
            ]
        );
        
        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'slide_border',
                'selector' => '{{WRAPPER}} .bunnyvault-carousel-slide .slide-content',
            ]
        );
        
        $this->add_control(
            'slide_border_radius',
            [
                'label' => esc_html__('Border Radius', 'bunnyvault-elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-slide .slide-content' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        
        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'slide_box_shadow',
                'selector' => '{{WRAPPER}} .bunnyvault-carousel-slide .slide-content',
            ]
        );
        
        $this->end_controls_section();
        
        // Navigation Arrows Style
        $this->start_controls_section(
            'arrows_style',
            [
                'label' => esc_html__('Navigation Arrows', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_arrows' => 'yes'
                ]
            ]
        );
        
        $this->add_responsive_control(
            'arrow_size',
            [
                'label' => esc_html__('Size', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 20,
                        'max' => 80
                    ]
                ],
                'default' => [
                    'size' => 40
                ],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-arrow' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}}; font-size: calc({{SIZE}}{{UNIT}} / 2);'
                ]
            ]
        );
        
        $this->start_controls_tabs('arrow_tabs');
        
        $this->start_controls_tab(
            'arrow_normal',
            [
                'label' => esc_html__('Normal', 'bunnyvault-elementor')
            ]
        );
        
        $this->add_control(
            'arrow_color',
            [
                'label' => esc_html__('Color', 'bunnyvault-elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-arrow' => 'color: {{VALUE}};'
                ]
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'arrow_background',
                'selector' => '{{WRAPPER}} .bunnyvault-carousel-arrow',
            ]
        );
        
        $this->end_controls_tab();
        
        $this->start_controls_tab(
            'arrow_hover',
            [
                'label' => esc_html__('Hover', 'bunnyvault-elementor')
            ]
        );
        
        $this->add_control(
            'arrow_hover_color',
            [
                'label' => esc_html__('Color', 'bunnyvault-elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-arrow:hover' => 'color: {{VALUE}};'
                ]
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'arrow_hover_background',
                'selector' => '{{WRAPPER}} .bunnyvault-carousel-arrow:hover',
            ]
        );
        
        $this->end_controls_tab();
        
        $this->end_controls_tabs();
        
        $this->add_control(
            'arrow_border_radius',
            [
                'label' => esc_html__('Border Radius', 'bunnyvault-elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-arrow' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
                ],
                'separator' => 'before'
            ]
        );
        
        $this->end_controls_section();
        
        // Navigation Dots Style
        $this->start_controls_section(
            'dots_style',
            [
                'label' => esc_html__('Navigation Dots', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_dots' => 'yes'
                ]
            ]
        );
        
        $this->add_responsive_control(
            'dot_size',
            [
                'label' => esc_html__('Size', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 5,
                        'max' => 30
                    ]
                ],
                'default' => [
                    'size' => 10
                ],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-dot' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};'
                ]
            ]
        );
        
        $this->add_responsive_control(
            'dot_spacing',
            [
                'label' => esc_html__('Spacing', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 2,
                        'max' => 20
                    ]
                ],
                'default' => [
                    'size' => 5
                ],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-dot' => 'margin: 0 {{SIZE}}{{UNIT}};'
                ]
            ]
        );
        
        $this->start_controls_tabs('dot_tabs');
        
        $this->start_controls_tab(
            'dot_normal',
            [
                'label' => esc_html__('Normal', 'bunnyvault-elementor')
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'dot_background',
                'selector' => '{{WRAPPER}} .bunnyvault-carousel-dot',
            ]
        );
        
        $this->end_controls_tab();
        
        $this->start_controls_tab(
            'dot_active',
            [
                'label' => esc_html__('Active', 'bunnyvault-elementor')
            ]
        );
        
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'dot_active_background',
                'selector' => '{{WRAPPER}} .bunnyvault-carousel-dot.active',
            ]
        );
        
        $this->end_controls_tab();
        
        $this->end_controls_tabs();
        
        $this->add_control(
            'dot_border_radius',
            [
                'label' => esc_html__('Border Radius', 'bunnyvault-elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .bunnyvault-carousel-dot' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
                ],
                'separator' => 'before'
            ]
        );
        
        $this->end_controls_section();
    }
    
    /**
     * Register advanced controls
     */
    private function register_advanced_controls() {
        
        // Responsive Settings
        $this->start_controls_section(
            'responsive_settings',
            [
                'label' => esc_html__('Responsive Settings', 'bunnyvault-elementor'),
                'tab' => Controls_Manager::TAB_ADVANCED,
            ]
        );
        
        $this->add_control(
            'adaptive_height',
            [
                'label' => esc_html__('Adaptive Height', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'description' => esc_html__('Adjust carousel height based on current slide', 'bunnyvault-elementor'),
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->add_control(
            'center_mode',
            [
                'label' => esc_html__('Center Mode', 'bunnyvault-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'no',
                'description' => esc_html__('Center the current slide', 'bunnyvault-elementor'),
                'sanitize_callback' => 'sanitize_key'
            ]
        );
        
        $this->end_controls_section();
    }
    
    /**
     * Render widget output
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        $widget_id = sanitize_key($this->get_id());
        
        if (!is_array($settings) || empty($settings['carousel_items']) || !is_array($settings['carousel_items'])) {
            echo '<div class="hostreamly-carousel-empty">' . esc_html__('No videos found.', 'hostreamly-elementor') . '</div>';
            return;
        }
        
        $carousel_settings = [
            'slidesToShow' => absint($settings['slides_to_show'] ?? 3),
            'slidesToScroll' => absint($settings['slides_to_scroll'] ?? 1),
            'autoplay' => sanitize_key($settings['autoplay'] ?? 'yes') === 'yes',
            'autoplaySpeed' => absint($settings['autoplay_speed'] ?? 3000),
            'infinite' => sanitize_key($settings['infinite_loop'] ?? 'yes') === 'yes',
            'pauseOnHover' => sanitize_key($settings['pause_on_hover'] ?? 'yes') === 'yes',
            'speed' => absint($settings['transition_speed'] ?? 500),
            'arrows' => sanitize_key($settings['show_arrows'] ?? 'yes') === 'yes',
            'dots' => sanitize_key($settings['show_dots'] ?? 'yes') === 'yes',
            'adaptiveHeight' => sanitize_key($settings['adaptive_height'] ?? 'no') === 'yes',
            'centerMode' => sanitize_key($settings['center_mode'] ?? 'no') === 'yes',
            'responsive' => [
                [
                    'breakpoint' => 1024,
                    'settings' => [
                        'slidesToShow' => absint($settings['slides_to_show_tablet'] ?? $settings['slides_to_show'] ?? 2),
                        'slidesToScroll' => absint($settings['slides_to_scroll_tablet'] ?? $settings['slides_to_scroll'] ?? 1)
                    ]
                ],
                [
                    'breakpoint' => 768,
                    'settings' => [
                        'slidesToShow' => absint($settings['slides_to_show_mobile'] ?? 1),
                        'slidesToScroll' => absint($settings['slides_to_scroll_mobile'] ?? 1)
                    ]
                ]
            ]
        ];
        
        $carousel_classes = ['hostreamly-video-carousel'];
        if (sanitize_key($settings['arrow_position'] ?? '') === 'outside') {
            $carousel_classes[] = 'arrows-outside';
        }
        if (sanitize_key($settings['dots_position'] ?? '') === 'top') {
            $carousel_classes[] = 'dots-top';
        }
        
        ?>
        <div class="<?php echo esc_attr(implode(' ', $carousel_classes)); ?>" 
             data-widget-id="<?php echo esc_attr($widget_id); ?>"
             data-carousel-settings="<?php echo esc_attr(wp_json_encode($carousel_settings)); ?>">
            
            <div class="hostreamly-carousel-container">
                <?php foreach ($settings['carousel_items'] as $index => $item): ?>
                    <?php $this->render_carousel_slide($item, $index, $settings); ?>
                <?php endforeach; ?>
            </div>
            
        </div>
        <?php
    }
    
    /**
     * Render single carousel slide
     */
    private function render_carousel_slide($item, $index, $settings) {
        if (!is_array($item) || !is_array($settings)) {
            return;
        }
        
        $video_url = $this->get_item_video_url($item);
        $thumbnail_url = $this->get_item_thumbnail($item);
        
        $aspect_ratio_style = $this->get_aspect_ratio_style(sanitize_key($settings['aspect_ratio'] ?? '16:9'));
        
        ?>
        <div class="hostreamly-carousel-slide">
            <div class="slide-content">
                <div class="hostreamly-video-thumbnail" style="<?php echo esc_attr($aspect_ratio_style); ?>">
                    
                    <?php if ($thumbnail_url && filter_var($thumbnail_url, FILTER_VALIDATE_URL)): ?>
                        <img src="<?php echo esc_url($thumbnail_url); ?>" alt="<?php echo esc_attr(sanitize_text_field($item['video_title'] ?? '')); ?>">
                    <?php endif; ?>
                    
                    <div class="hostreamly-video-overlay">
                        <?php if (sanitize_key($settings['show_play_button'] ?? 'yes') === 'yes'): ?>
                            <button class="hostreamly-play-button" 
                                    data-video-url="<?php echo esc_url($video_url); ?>"
                                    data-play-mode="<?php echo esc_attr(sanitize_key($settings['play_mode'] ?? 'inline')); ?>"
                                    aria-label="<?php esc_attr_e('Play video', 'hostreamly-elementor'); ?>">
                                <i class="eicon-play"></i>
                            </button>
                        <?php endif; ?>
                    </div>
                </div>
                
                <?php if (sanitize_key($settings['show_title'] ?? 'yes') === 'yes' || sanitize_key($settings['show_description'] ?? 'no') === 'yes'): ?>
                    <div class="hostreamly-carousel-content">
                        <?php if (sanitize_key($settings['show_title'] ?? 'yes') === 'yes' && !empty($item['video_title'])): ?>
                            <h4 class="hostreamly-carousel-title"><?php echo esc_html(sanitize_text_field($item['video_title'])); ?></h4>
                        <?php endif; ?>
                        
                        <?php if (sanitize_key($settings['show_description'] ?? 'no') === 'yes' && !empty($item['video_description'])): ?>
                            <div class="hostreamly-carousel-description">
                                <?php 
                                $description = sanitize_textarea_field($item['video_description']);
                                $length = absint($settings['description_length'] ?? 100);
                                if (strlen($description) > $length) {
                                    $description = substr($description, 0, $length) . '...';
                                }
                                echo esc_html($description);
                                ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
    
    /**
     * Get video URL for item
     */
    private function get_item_video_url($item) {
        if (!is_array($item) || empty($item['video_source'])) {
            return '';
        }
        
        $video_source = sanitize_key($item['video_source']);
        
        switch ($video_source) {
            case 'library':
                return isset($item['video_library']['url']) ? esc_url_raw($item['video_library']['url']) : '';
            case 'url':
                return isset($item['video_url']['url']) ? esc_url_raw($item['video_url']['url']) : '';
            case 'bunnyvault':
                $video_id = sanitize_text_field($item['bunnyvault_video_id'] ?? '');
                if (empty($video_id) || !preg_match('/^[a-zA-Z0-9_-]+$/', $video_id)) {
                    return '';
                }
                return esc_url_raw("https://hostreamly.example.com/video/{$video_id}.mp4");
            case 'youtube':
                return isset($item['youtube_url']) ? esc_url_raw($item['youtube_url']) : '';
            case 'vimeo':
                return isset($item['vimeo_url']) ? esc_url_raw($item['vimeo_url']) : '';
            default:
                return '';
        }
    }
    
    /**
     * Get thumbnail for item
     */
    private function get_item_thumbnail($item) {
        if (!is_array($item)) {
            return '';
        }
        
        // Check for custom thumbnail first
        if (!empty($item['custom_thumbnail']['url'])) {
            $custom_url = esc_url_raw($item['custom_thumbnail']['url']);
            if (filter_var($custom_url, FILTER_VALIDATE_URL)) {
                return $custom_url;
            }
        }
        
        $video_source = sanitize_key($item['video_source'] ?? '');
        
        // Generate thumbnail based on video source
        switch ($video_source) {
            case 'bunnyvault':
                $video_id = sanitize_text_field($item['bunnyvault_video_id'] ?? '');
                if (!empty($video_id) && preg_match('/^[a-zA-Z0-9_-]+$/', $video_id)) {
                    return esc_url_raw("https://hostreamly.example.com/thumbnails/{$video_id}.jpg");
                }
                break;
            case 'youtube':
                $youtube_url = esc_url_raw($item['youtube_url'] ?? '');
                if (!empty($youtube_url)) {
                    preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/', $youtube_url, $matches);
                    if (!empty($matches[1]) && preg_match('/^[a-zA-Z0-9_-]+$/', $matches[1])) {
                        return esc_url_raw("https://img.youtube.com/vi/{$matches[1]}/maxresdefault.jpg");
                    }
                }
                break;
        }
        
        return '';
    }
    
    /**
     * Get aspect ratio style
     */
    private function get_aspect_ratio_style($aspect_ratio) {
        $aspect_ratio = sanitize_key($aspect_ratio);
        
        $ratios = [
            '16:9' => 56.25,
            '4:3' => 75,
            '3:2' => 66.67,
            '1:1' => 100,
            '9:16' => 177.78
        ];
        
        $ratio = isset($ratios[$aspect_ratio]) ? floatval($ratios[$aspect_ratio]) : 56.25;
        return "padding-bottom: {$ratio}%;";
    }
}