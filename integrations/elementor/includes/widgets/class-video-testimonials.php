<?php
/**
 * Hostreamly Video Testimonials Widget
 *
 * @package Hostreamly_Elementor
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

/**
 * Hostreamly Video Testimonials Widget
 */
class Hostreamly_Elementor_Video_Testimonials extends Widget_Base {

    /**
     * Get widget name.
     */
    public function get_name() {
        return 'hostreamly-video-testimonials';
    }

    /**
     * Get widget title.
     */
    public function get_title() {
        return __('Video Testimonials', 'hostreamly-elementor');
    }

    /**
     * Get widget icon.
     */
    public function get_icon() {
        return 'eicon-testimonial';
    }

    /**
     * Get widget categories.
     */
    public function get_categories() {
        return ['hostreamly'];
    }

    /**
     * Register widget controls.
     */
    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'testimonial_style',
            [
                'label' => __('Style', 'hostreamly-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'classic',
                'options' => [
                    'classic' => __('Classic', 'hostreamly-elementor'),
                    'modern' => __('Modern', 'hostreamly-elementor'),
                    'minimal' => __('Minimal', 'hostreamly-elementor'),
                ],
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output on the frontend.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        
        echo '<div class="hostreamly-video-testimonials style-' . esc_attr($settings['testimonial_style']) . '">';
        echo '<p>' . __('Video Testimonials Widget - Coming Soon', 'hostreamly-elementor') . '</p>';
        echo '</div>';
    }
}