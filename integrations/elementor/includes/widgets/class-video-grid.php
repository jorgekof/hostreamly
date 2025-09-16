<?php
/**
 * Hostreamly Video Grid Widget
 *
 * @package Hostreamly_Elementor
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

/**
 * Hostreamly Video Grid Widget
 */
class Hostreamly_Elementor_Video_Grid extends Widget_Base {

    /**
     * Get widget name.
     */
    public function get_name() {
        return 'hostreamly-video-grid';
    }

    /**
     * Get widget title.
     */
    public function get_title() {
        return __('Video Grid', 'hostreamly-elementor');
    }

    /**
     * Get widget icon.
     */
    public function get_icon() {
        return 'eicon-gallery-grid';
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
            'grid_columns',
            [
                'label' => __('Columns', 'hostreamly-elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '3',
                'options' => [
                    '1' => '1',
                    '2' => '2',
                    '3' => '3',
                    '4' => '4',
                    '6' => '6',
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
        
        echo '<div class="hostreamly-video-grid columns-' . esc_attr($settings['grid_columns']) . '">';
        echo '<p>' . __('Video Grid Widget - Coming Soon', 'hostreamly-elementor') . '</p>';
        echo '</div>';
    }
}