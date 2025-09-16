<?php
/**
 * Hostreamly Section Video Background Extension
 *
 * @package Hostreamly_Elementor
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Element_Base;
use Elementor\Controls_Manager;

/**
 * Hostreamly Section Video Background Extension
 */
class Hostreamly_Elementor_Section_Video_Background {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('elementor/element/section/section_background/after_section_end', [$this, 'add_video_background_controls']);
        add_action('elementor/frontend/section/before_render', [$this, 'before_render']);
    }

    /**
     * Add video background controls to section
     */
    public function add_video_background_controls(Element_Base $element) {
        $element->start_controls_section(
            'hostreamly_video_background',
            [
                'label' => __('Hostreamly Video Background', 'hostreamly-elementor'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $element->add_control(
            'hostreamly_enable_video_bg',
            [
                'label' => __('Enable Video Background', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'hostreamly-elementor'),
                'label_off' => __('No', 'hostreamly-elementor'),
                'return_value' => 'yes',
                'default' => '',
            ]
        );

        $element->add_control(
            'hostreamly_video_url',
            [
                'label' => __('Video URL', 'hostreamly-elementor'),
                'type' => Controls_Manager::URL,
                'placeholder' => __('https://your-video-url.com', 'hostreamly-elementor'),
                'condition' => [
                    'hostreamly_enable_video_bg' => 'yes',
                ],
            ]
        );

        $element->add_control(
            'hostreamly_video_autoplay',
            [
                'label' => __('Autoplay', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'hostreamly-elementor'),
                'label_off' => __('No', 'hostreamly-elementor'),
                'default' => 'yes',
                'condition' => [
                    'hostreamly_enable_video_bg' => 'yes',
                ],
            ]
        );

        $element->add_control(
            'hostreamly_video_muted',
            [
                'label' => __('Muted', 'hostreamly-elementor'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'hostreamly-elementor'),
                'label_off' => __('No', 'hostreamly-elementor'),
                'default' => 'yes',
                'condition' => [
                    'hostreamly_enable_video_bg' => 'yes',
                ],
            ]
        );

        $element->end_controls_section();
    }

    /**
     * Before render section
     */
    public function before_render(Element_Base $element) {
        $settings = $element->get_settings_for_display();
        
        if ('yes' === $settings['hostreamly_enable_video_bg'] && !empty($settings['hostreamly_video_url']['url'])) {
            $element->add_render_attribute('_wrapper', 'class', 'hostreamly-video-background-section');
            $element->add_render_attribute('_wrapper', 'data-video-url', $settings['hostreamly_video_url']['url']);
            $element->add_render_attribute('_wrapper', 'data-autoplay', $settings['hostreamly_video_autoplay']);
            $element->add_render_attribute('_wrapper', 'data-muted', $settings['hostreamly_video_muted']);
        }
    }
}

// Initialize the extension
new Hostreamly_Elementor_Section_Video_Background();