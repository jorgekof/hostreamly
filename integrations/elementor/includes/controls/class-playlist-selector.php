<?php/**
 * Hostreamly Playlist Selector Control
 *
 * @package Hostreamly_Elementor
 * @since 1.0.0
 */if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Base_Data_Control;

/**
 * Hostreamly Playlist Selector Control
 */
class Hostreamly_Elementor_Playlist_Selector extends Base_Data_Control {

    /**
     * Get control type.
     */
    public function get_type() {
        return 'hostreamly-playlist-selector';
    }

    /**
     * Enqueue control scripts and styles.
     */
    public function enqueue() {
        // Enqueue control assets
        wp_enqueue_script(
            'hostreamly-playlist-selector',
            HOSTREAMLY_ELEMENTOR_URL . 'assets/js/playlist-selector.js',
            ['jquery'],
            HOSTREAMLY_ELEMENTOR_VERSION,
            true
        );

        wp_enqueue_style(
            'hostreamly-playlist-selector',
            HOSTREAMLY_ELEMENTOR_URL . 'assets/css/playlist-selector.css',
            [],
            HOSTREAMLY_ELEMENTOR_VERSION
        );
    }

    /**
     * Get default settings.
     */
    protected function get_default_settings() {
        return [
            'label_block' => true,
            'multiple' => false,
            'options' => [],
        ];
    }

    /**
     * Render control output in the editor.
     */
    public function content_template() {
        $control_uid = $this->get_control_uid();
        ?>
        <div class="elementor-control-field">
            <# if ( data.label ) {#>
                <label for="<?php echo esc_attr($control_uid); ?>" class="elementor-control-title">{{{ data.label }}}</label>
            <# } #>
            <div class="elementor-control-input-wrapper elementor-control-unit-5">
                <select id="<?php echo esc_attr($control_uid); ?>" class="elementor-control-hostreamly-playlist-selector" data-setting="{{ data.name }}">
            <option value=""><?php echo __('Select Playlist', 'hostreamly-elementor'); ?></option>
                    <# _.each( data.options, function( option_title, option_value ) { #>
                        <option value="{{ option_value }}">{{{ option_title }}}</option>
                    <# }); #>
                </select>
            </div>
        </div>
        <# if ( data.description ) { #>
            <div class="elementor-control-field-description">{{{ data.description }}}</div>
        <# } #>
        <?php
    }
}