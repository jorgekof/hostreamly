<?php
/**
 * Hostreamly Video Background Widget
 *
 * @package Hostreamly_Elementor
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

/**
 * Hostreamly Video Background Widget
 */
class Hostreamly_Elementor_Video_Background extends Widget_Base {

    /**
     * Get widget name.
     */
    public function get_name() {
        return 'hostreamly-video-background';
    }

    /**
     * Get widget title.
     */
    public function get_title() {
        return __('Video Background', 'hostreamly-elementor');
    }

    /**
     * Get widget icon.
     */
    public function get_icon() {
        return 'eicon-video-camera';
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
                'label' => __('Video Settings', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'video_url',
            [
                'label' => __('Video URL', 'hostreamly-elementor'),
                'type' => Controls_Manager::URL,
                'placeholder' => __('https://your-video-url.com', 'hostreamly-elementor'),
                'default' => [
                    'url' => '',
                ],
            ]
        );

        $this->add_control(
            'autoplay',
            [
                'label' => __('Autoplay', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'hostreamly-elementor'),
                'label_off' => __('No', 'hostreamly-elementor'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'muted',
            [
                'label' => __('Muted', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'hostreamly-elementor'),
                'label_off' => __('No', 'hostreamly-elementor'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output on the frontend.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        
        echo '<div class="hostreamly-video-background">';
        echo '<p>' . __('Video Background Widget - Coming Soon', 'hostreamly-elementor') . '</p>';
        echo '</div>';
    }
}