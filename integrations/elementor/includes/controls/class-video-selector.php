<?php
/**
 * BunnyVault Video Selector Control for Elementor
 *
 * @package BunnyVault_Elementor
 * @since 2.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use Elementor\Base_Data_Control;

/**
 * Video Selector Control
 *
 * Custom Elementor control for selecting videos from BunnyVault library
 */
class Video_Selector extends Base_Data_Control {

    /**
     * Get control type.
     *
     * @return string Control type.
     */
    public function get_type() {
        return 'bunnyvault-video-selector';
    }

    /**
     * Get default settings.
     *
     * @return array Control default settings.
     */
    protected function get_default_settings() {
        return [
            'label_block' => true,
            'multiple' => false,
            'source_types' => ['bunnyvault', 'media_library', 'external'],
            'show_preview' => true,
            'show_duration' => true,
            'show_size' => true,
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
                <div class="bunnyvault-video-selector-wrapper">
                    
                    <!-- Source Type Selector -->
                    <div class="bunnyvault-source-selector">
                        <# if ( data.source_types.includes('bunnyvault') ) { #>
                            <label class="bunnyvault-source-option">
                                <input type="radio" name="source_type_{{ data._cid }}" value="bunnyvault" <# if ( data.controlValue && data.controlValue.source === 'bunnyvault' ) { #>checked<# } #>>
                                <span><?php esc_html_e('BunnyVault Library', 'bunnyvault'); ?></span>
                            </label>
                        <# } #>
                        
                        <# if ( data.source_types.includes('media_library') ) { #>
                            <label class="bunnyvault-source-option">
                                <input type="radio" name="source_type_{{ data._cid }}" value="media_library" <# if ( data.controlValue && data.controlValue.source === 'media_library' ) { #>checked<# } #>>
                                <span><?php esc_html_e('Media Library', 'bunnyvault'); ?></span>
                            </label>
                        <# } #>
                        
                        <# if ( data.source_types.includes('external') ) { #>
                            <label class="bunnyvault-source-option">
                                <input type="radio" name="source_type_{{ data._cid }}" value="external" <# if ( data.controlValue && data.controlValue.source === 'external' ) { #>checked<# } #>>
                                <span><?php esc_html_e('External URL', 'bunnyvault'); ?></span>
                            </label>
                        <# } #>
                    </div>
                    
                    <!-- BunnyVault Library Section -->
                    <div class="bunnyvault-library-section" style="display: <# if ( data.controlValue && data.controlValue.source === 'bunnyvault' ) { #>block<# } else { #>none<# } #>">
                        <div class="bunnyvault-search-wrapper">
                            <input type="text" class="bunnyvault-video-search" placeholder="<?php esc_attr_e('Search videos...', 'bunnyvault'); ?>">
                            <button type="button" class="bunnyvault-search-btn">
                                <i class="eicon-search"></i>
                            </button>
                        </div>
                        
                        <div class="bunnyvault-filters">
                            <select class="bunnyvault-category-filter">
                                <option value=""><?php esc_html_e('All Categories', 'bunnyvault'); ?></option>
                                <!-- Categories will be populated via AJAX -->
                            </select>
                            
                            <select class="bunnyvault-sort-filter">
                                <option value="date_desc"><?php esc_html_e('Newest First', 'bunnyvault'); ?></option>
                                <option value="date_asc"><?php esc_html_e('Oldest First', 'bunnyvault'); ?></option>
                                <option value="title_asc"><?php esc_html_e('Title A-Z', 'bunnyvault'); ?></option>
                                <option value="title_desc"><?php esc_html_e('Title Z-A', 'bunnyvault'); ?></option>
                                <option value="duration_asc"><?php esc_html_e('Shortest First', 'bunnyvault'); ?></option>
                                <option value="duration_desc"><?php esc_html_e('Longest First', 'bunnyvault'); ?></option>
                            </select>
                        </div>
                        
                        <div class="bunnyvault-videos-grid">
                            <div class="bunnyvault-loading">
                                <i class="eicon-loading eicon-animation-spin"></i>
                                <span><?php esc_html_e('Loading videos...', 'bunnyvault'); ?></span>
                            </div>
                        </div>
                        
                        <div class="bunnyvault-pagination">
                            <button type="button" class="bunnyvault-load-more" style="display: none;">
                                <?php esc_html_e('Load More', 'bunnyvault'); ?>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Media Library Section -->
                    <div class="bunnyvault-media-library-section" style="display: <# if ( data.controlValue && data.controlValue.source === 'media_library' ) { #>block<# } else { #>none<# } #>">
                        <button type="button" class="bunnyvault-select-media button button-primary">
                            <i class="eicon-plus-circle"></i>
                            <?php esc_html_e('Select Video', 'bunnyvault'); ?>
                        </button>
                        
                        <div class="bunnyvault-selected-media" style="display: <# if ( data.controlValue && data.controlValue.source === 'media_library' && data.controlValue.id ) { #>block<# } else { #>none<# } #>">
                            <div class="bunnyvault-media-preview">
                                <# if ( data.controlValue && data.controlValue.thumbnail ) { #>
                                    <img src="{{{ data.controlValue.thumbnail }}}" alt="{{{ data.controlValue.title }}}">
                                <# } #>
                                <div class="bunnyvault-media-info">
                                    <h4>{{{ data.controlValue && data.controlValue.title }}}</h4>
                                    <# if ( data.show_duration && data.controlValue && data.controlValue.duration ) { #>
                                        <span class="bunnyvault-duration">{{{ data.controlValue.duration }}}</span>
                                    <# } #>
                                    <# if ( data.show_size && data.controlValue && data.controlValue.size ) { #>
                                        <span class="bunnyvault-size">{{{ data.controlValue.size }}}</span>
                                    <# } #>
                                </div>
                                <button type="button" class="bunnyvault-remove-media">
                                    <i class="eicon-close"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- External URL Section -->
                    <div class="bunnyvault-external-section" style="display: <# if ( data.controlValue && data.controlValue.source === 'external' ) { #>block<# } else { #>none<# } #>">
                        <input type="url" class="bunnyvault-external-url" placeholder="<?php esc_attr_e('Enter video URL (YouTube, Vimeo, etc.)', 'bunnyvault'); ?>" value="{{{ data.controlValue && data.controlValue.url }}}">
                        
                        <div class="bunnyvault-url-preview" style="display: <# if ( data.controlValue && data.controlValue.source === 'external' && data.controlValue.url ) { #>block<# } else { #>none<# } #>">
                            <div class="bunnyvault-url-info">
                                <# if ( data.controlValue && data.controlValue.thumbnail ) { #>
                                    <img src="{{{ data.controlValue.thumbnail }}}" alt="Video thumbnail">
                                <# } #>
                                <div class="bunnyvault-url-details">
                                    <h4>{{{ data.controlValue && data.controlValue.title }}}</h4>
                                    <span class="bunnyvault-url-source">{{{ data.controlValue && data.controlValue.provider }}}</span>
                                    <# if ( data.show_duration && data.controlValue && data.controlValue.duration ) { #>
                                        <span class="bunnyvault-duration">{{{ data.controlValue.duration }}}</span>
                                    <# } #>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Selected Video Preview -->
                    <# if ( data.show_preview && data.controlValue && data.controlValue.id ) { #>
                        <div class="bunnyvault-selected-preview">
                            <div class="bunnyvault-preview-wrapper">
                                <# if ( data.controlValue.thumbnail ) { #>
                                    <img src="{{{ data.controlValue.thumbnail }}}" alt="{{{ data.controlValue.title }}}">
                                <# } #>
                                <div class="bunnyvault-preview-overlay">
                                    <button type="button" class="bunnyvault-preview-play">
                                        <i class="eicon-play"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="bunnyvault-preview-info">
                                <h4>{{{ data.controlValue.title }}}</h4>
                                <# if ( data.controlValue.description ) { #>
                                    <p>{{{ data.controlValue.description }}}</p>
                                <# } #>
                                
                                <div class="bunnyvault-preview-meta">
                                    <# if ( data.show_duration && data.controlValue.duration ) { #>
                                        <span class="bunnyvault-meta-item">
                                            <i class="eicon-clock-o"></i>
                                            {{{ data.controlValue.duration }}}
                                        </span>
                                    <# } #>
                                    
                                    <# if ( data.show_size && data.controlValue.size ) { #>
                                        <span class="bunnyvault-meta-item">
                                            <i class="eicon-database"></i>
                                            {{{ data.controlValue.size }}}
                                        </span>
                                    <# } #>
                                    
                                    <# if ( data.controlValue.resolution ) { #>
                                        <span class="bunnyvault-meta-item">
                                            <i class="eicon-device-desktop"></i>
                                            {{{ data.controlValue.resolution }}}
                                        </span>
                                    <# } #>
                                </div>
                                
                                <button type="button" class="bunnyvault-change-video button button-secondary">
                                    <?php esc_html_e('Change Video', 'bunnyvault'); ?>
                                </button>
                            </div>
                        </div>
                    <# } #>
                    
                </div>
            </div>
            
            <# if ( data.description ) { #>
                <div class="elementor-control-field-description">{{{ data.description }}}</div>
            <# } #>
        </div>
        
        <style>
            .bunnyvault-video-selector-wrapper {
                border: 1px solid #d5dadf;
                border-radius: 3px;
                background: #fff;
            }
            
            .bunnyvault-source-selector {
                display: flex;
                border-bottom: 1px solid #e6e9ec;
                background: #f1f3f5;
            }
            
            .bunnyvault-source-option {
                flex: 1;
                padding: 10px;
                text-align: center;
                cursor: pointer;
                border-right: 1px solid #e6e9ec;
                transition: background-color 0.2s;
            }
            
            .bunnyvault-source-option:last-child {
                border-right: none;
            }
            
            .bunnyvault-source-option:hover {
                background: #e6e9ec;
            }
            
            .bunnyvault-source-option input[type="radio"] {
                display: none;
            }
            
            .bunnyvault-source-option input[type="radio"]:checked + span {
                color: #71d7f7;
                font-weight: 600;
            }
            
            .bunnyvault-library-section,
            .bunnyvault-media-library-section,
            .bunnyvault-external-section {
                padding: 15px;
            }
            
            .bunnyvault-search-wrapper {
                display: flex;
                margin-bottom: 15px;
            }
            
            .bunnyvault-video-search {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #d5dadf;
                border-radius: 3px 0 0 3px;
                border-right: none;
            }
            
            .bunnyvault-search-btn {
                padding: 8px 12px;
                border: 1px solid #d5dadf;
                border-radius: 0 3px 3px 0;
                background: #f1f3f5;
                cursor: pointer;
            }
            
            .bunnyvault-filters {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .bunnyvault-filters select {
                flex: 1;
                padding: 8px;
                border: 1px solid #d5dadf;
                border-radius: 3px;
            }
            
            .bunnyvault-videos-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 10px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .bunnyvault-video-item {
                position: relative;
                cursor: pointer;
                border: 2px solid transparent;
                border-radius: 3px;
                overflow: hidden;
                transition: border-color 0.2s;
            }
            
            .bunnyvault-video-item:hover {
                border-color: #71d7f7;
            }
            
            .bunnyvault-video-item.selected {
                border-color: #71d7f7;
                box-shadow: 0 0 0 1px #71d7f7;
            }
            
            .bunnyvault-video-thumbnail {
                width: 100%;
                height: 80px;
                object-fit: cover;
                display: block;
            }
            
            .bunnyvault-video-info {
                padding: 8px;
                background: #fff;
            }
            
            .bunnyvault-video-title {
                font-size: 12px;
                font-weight: 500;
                margin: 0 0 4px 0;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .bunnyvault-video-duration {
                font-size: 11px;
                color: #6c757d;
            }
            
            .bunnyvault-loading {
                text-align: center;
                padding: 40px;
                color: #6c757d;
            }
            
            .bunnyvault-loading i {
                font-size: 24px;
                margin-bottom: 10px;
                display: block;
            }
            
            .bunnyvault-selected-preview {
                margin-top: 15px;
                border-top: 1px solid #e6e9ec;
                padding-top: 15px;
            }
            
            .bunnyvault-preview-wrapper {
                position: relative;
                margin-bottom: 10px;
            }
            
            .bunnyvault-preview-wrapper img {
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 3px;
            }
            
            .bunnyvault-preview-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            .bunnyvault-preview-wrapper:hover .bunnyvault-preview-overlay {
                opacity: 1;
            }
            
            .bunnyvault-preview-play {
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.9);
                color: #333;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .bunnyvault-preview-info h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .bunnyvault-preview-info p {
                margin: 0 0 10px 0;
                font-size: 12px;
                color: #6c757d;
                line-height: 1.4;
            }
            
            .bunnyvault-preview-meta {
                display: flex;
                gap: 15px;
                margin-bottom: 10px;
            }
            
            .bunnyvault-meta-item {
                font-size: 11px;
                color: #6c757d;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .bunnyvault-external-url {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d5dadf;
                border-radius: 3px;
                margin-bottom: 15px;
            }
            
            .bunnyvault-url-preview {
                border: 1px solid #e6e9ec;
                border-radius: 3px;
                padding: 10px;
                background: #f8f9fa;
            }
            
            .bunnyvault-url-info {
                display: flex;
                gap: 10px;
            }
            
            .bunnyvault-url-info img {
                width: 80px;
                height: 60px;
                object-fit: cover;
                border-radius: 3px;
            }
            
            .bunnyvault-url-details h4 {
                margin: 0 0 4px 0;
                font-size: 13px;
                font-weight: 600;
            }
            
            .bunnyvault-url-source {
                font-size: 11px;
                color: #6c757d;
                text-transform: uppercase;
                font-weight: 500;
            }
        </style>
        <?php
    }

    /**
     * Get control default value.
     *
     * @return array Control default value.
     */
    public function get_default_value() {
        return [
            'source' => 'bunnyvault',
            'id' => '',
            'url' => '',
            'title' => '',
            'description' => '',
            'thumbnail' => '',
            'duration' => '',
            'size' => '',
            'resolution' => '',
            'provider' => ''
        ];
    }

    /**
     * Enqueue control scripts and styles.
     */
    public function enqueue() {
        wp_enqueue_script(
            'bunnyvault-video-selector-control',
            BUNNYVAULT_ELEMENTOR_URL . 'assets/controls/video-selector.js',
            ['jquery', 'elementor-editor'],
            BUNNYVAULT_VERSION,
            true
        );

        wp_enqueue_style(
            'bunnyvault-video-selector-control',
            BUNNYVAULT_ELEMENTOR_URL . 'assets/controls/video-selector.css',
            [],
            BUNNYVAULT_VERSION
        );

        wp_localize_script('bunnyvault-video-selector-control', 'bunnyvaultVideoSelector', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bunnyvault_elementor_nonce'),
            'strings' => [
                'selectVideo' => __('Select Video', 'bunnyvault'),
                'changeVideo' => __('Change Video', 'bunnyvault'),
                'removeVideo' => __('Remove Video', 'bunnyvault'),
                'loadingVideos' => __('Loading videos...', 'bunnyvault'),
                'noVideosFound' => __('No videos found', 'bunnyvault'),
                'searchPlaceholder' => __('Search videos...', 'bunnyvault'),
                'invalidUrl' => __('Please enter a valid video URL', 'bunnyvault'),
                'urlNotSupported' => __('This URL is not supported', 'bunnyvault'),
            ]
        ]);
    }
}