/**
 * BunnyVault Video Selector Control JavaScript
 * 
 * @package BunnyVault_Elementor
 * @since 2.0.0
 */

(function($) {
    'use strict';
    
    // Video Selector Control Handler
    var VideoSelectorControl = elementor.modules.controls.BaseData.extend({
        
        // Control events
        events: function() {
            return _.extend(VideoSelectorControl.__super__.events.apply(this, arguments), {
                'change input[name^="source_type_"]': 'onSourceTypeChange',
                'input .bunnyvault-video-search': 'onSearchInput',
                'click .bunnyvault-search-btn': 'onSearchClick',
                'change .bunnyvault-category-filter': 'onFilterChange',
                'change .bunnyvault-sort-filter': 'onFilterChange',
                'click .bunnyvault-video-item': 'onVideoSelect',
                'click .bunnyvault-load-more': 'onLoadMore',
                'click .bunnyvault-select-media': 'onSelectMedia',
                'click .bunnyvault-remove-media': 'onRemoveMedia',
                'input .bunnyvault-external-url': 'onExternalUrlInput',
                'click .bunnyvault-preview-play': 'onPreviewPlay',
                'click .bunnyvault-change-video': 'onChangeVideo'
            });
        },
        
        // Initialize control
        onReady: function() {
            this.currentPage = 1;
            this.searchTimeout = null;
            this.loadCategories();
            this.initializeSource();
        },
        
        // Initialize based on current source
        initializeSource: function() {
            var value = this.getControlValue();
            if (value && value.source) {
                this.ui.find('input[value="' + value.source + '"]').prop('checked', true);
                this.showSourceSection(value.source);
                
                if (value.source === 'bunnyvault') {
                    this.loadVideos();
                } else if (value.source === 'external' && value.url) {
                    this.loadExternalVideoInfo(value.url);
                }
            } else {
                // Default to first available source
                var firstSource = this.ui.find('input[name^="source_type_"]').first();
                if (firstSource.length) {
                    firstSource.prop('checked', true);
                    this.showSourceSection(firstSource.val());
                    if (firstSource.val() === 'bunnyvault') {
                        this.loadVideos();
                    }
                }
            }
        },
        
        // Handle source type change
        onSourceTypeChange: function(e) {
            var sourceType = $(e.target).val();
            this.showSourceSection(sourceType);
            
            // Update control value
            var value = this.getControlValue() || {};
            value.source = sourceType;
            
            // Clear previous selection when changing source
            if (sourceType !== value.source) {
                value = {
                    source: sourceType,
                    id: '',
                    url: '',
                    title: '',
                    description: '',
                    thumbnail: '',
                    duration: '',
                    size: '',
                    resolution: '',
                    provider: ''
                };
            }
            
            this.setValue(value);
            
            // Load content for new source
            if (sourceType === 'bunnyvault') {
                this.loadVideos();
            }
        },
        
        // Show appropriate source section
        showSourceSection: function(sourceType) {
            this.ui.find('.bunnyvault-library-section, .bunnyvault-media-library-section, .bunnyvault-external-section').hide();
            this.ui.find('.bunnyvault-' + sourceType.replace('_', '-') + '-section').show();
        },
        
        // Handle search input
        onSearchInput: function(e) {
            var self = this;
            var searchTerm = $(e.target).val();
            
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(function() {
                self.currentPage = 1;
                self.loadVideos(searchTerm);
            }, 500);
        },
        
        // Handle search button click
        onSearchClick: function(e) {
            e.preventDefault();
            var searchTerm = this.ui.find('.bunnyvault-video-search').val();
            this.currentPage = 1;
            this.loadVideos(searchTerm);
        },
        
        // Handle filter change
        onFilterChange: function(e) {
            this.currentPage = 1;
            this.loadVideos();
        },
        
        // Handle video selection
        onVideoSelect: function(e) {
            var $item = $(e.currentTarget);
            var videoData = $item.data('video');
            
            // Update UI
            this.ui.find('.bunnyvault-video-item').removeClass('selected');
            $item.addClass('selected');
            
            // Update control value
            var value = this.getControlValue() || {};
            value.source = 'bunnyvault';
            value.id = videoData.id;
            value.url = videoData.url;
            value.title = videoData.title;
            value.description = videoData.description;
            value.thumbnail = videoData.thumbnail;
            value.duration = videoData.duration;
            value.size = videoData.size;
            value.resolution = videoData.resolution;
            value.provider = 'bunnyvault';
            
            this.setValue(value);
        },
        
        // Handle load more
        onLoadMore: function(e) {
            e.preventDefault();
            this.currentPage++;
            this.loadVideos(null, true);
        },
        
        // Handle media library selection
        onSelectMedia: function(e) {
            e.preventDefault();
            var self = this;
            
            // Open WordPress media library
            var mediaFrame = wp.media({
                title: bunnyvaultVideoSelector.strings.selectVideo,
                library: {
                    type: 'video'
                },
                button: {
                    text: bunnyvaultVideoSelector.strings.selectVideo
                },
                multiple: false
            });
            
            mediaFrame.on('select', function() {
                var attachment = mediaFrame.state().get('selection').first().toJSON();
                
                var value = self.getControlValue() || {};
                value.source = 'media_library';
                value.id = attachment.id;
                value.url = attachment.url;
                value.title = attachment.title;
                value.description = attachment.description;
                value.thumbnail = attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url;
                value.duration = self.formatDuration(attachment.fileLength || 0);
                value.size = self.formatFileSize(attachment.filesizeInBytes || 0);
                value.resolution = attachment.width && attachment.height ? attachment.width + 'x' + attachment.height : '';
                value.provider = 'wordpress';
                
                self.setValue(value);
                self.updateMediaPreview(value);
            });
            
            mediaFrame.open();
        },
        
        // Handle media removal
        onRemoveMedia: function(e) {
            e.preventDefault();
            
            var value = {
                source: 'media_library',
                id: '',
                url: '',
                title: '',
                description: '',
                thumbnail: '',
                duration: '',
                size: '',
                resolution: '',
                provider: ''
            };
            
            this.setValue(value);
            this.ui.find('.bunnyvault-selected-media').hide();
        },
        
        // Handle external URL input
        onExternalUrlInput: function(e) {
            var self = this;
            var url = $(e.target).val().trim();
            
            clearTimeout(this.urlTimeout);
            
            if (url) {
                this.urlTimeout = setTimeout(function() {
                    self.loadExternalVideoInfo(url);
                }, 1000);
            } else {
                var value = this.getControlValue() || {};
                value.source = 'external';
                value.url = '';
                value.title = '';
                value.description = '';
                value.thumbnail = '';
                value.duration = '';
                value.provider = '';
                
                this.setValue(value);
                this.ui.find('.bunnyvault-url-preview').hide();
            }
        },
        
        // Handle preview play
        onPreviewPlay: function(e) {
            e.preventDefault();
            var value = this.getControlValue();
            if (value && value.url) {
                // Open video in a modal or new tab
                window.open(value.url, '_blank');
            }
        },
        
        // Handle change video
        onChangeVideo: function(e) {
            e.preventDefault();
            
            var value = this.getControlValue() || {};
            value.id = '';
            value.url = '';
            value.title = '';
            value.description = '';
            value.thumbnail = '';
            value.duration = '';
            value.size = '';
            value.resolution = '';
            value.provider = '';
            
            this.setValue(value);
            
            // Reload videos if BunnyVault source
            if (value.source === 'bunnyvault') {
                this.loadVideos();
            }
        },
        
        // Load categories
        loadCategories: function() {
            var self = this;
            
            $.ajax({
                url: bunnyvaultVideoSelector.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'bunnyvault_get_categories',
                    nonce: bunnyvaultVideoSelector.nonce
                },
                success: function(response) {
                    if (response.success && response.data) {
                        var $select = self.ui.find('.bunnyvault-category-filter');
                        var currentValue = $select.val();
                        
                        // Clear existing options except "All Categories"
                        $select.find('option:not(:first)').remove();
                        
                        // Add category options
                        $.each(response.data, function(index, category) {
                            $select.append('<option value="' + category.id + '">' + category.name + '</option>');
                        });
                        
                        // Restore selection
                        if (currentValue) {
                            $select.val(currentValue);
                        }
                    }
                }
            });
        },
        
        // Load videos from BunnyVault
        loadVideos: function(searchTerm, append) {
            var self = this;
            var $grid = this.ui.find('.bunnyvault-videos-grid');
            var $loadMore = this.ui.find('.bunnyvault-load-more');
            
            if (!append) {
                $grid.html('<div class="bunnyvault-loading"><i class="eicon-loading eicon-animation-spin"></i><span>' + bunnyvaultVideoSelector.strings.loadingVideos + '</span></div>');
                this.currentPage = 1;
            }
            
            var data = {
                action: 'bunnyvault_get_videos',
                nonce: bunnyvaultVideoSelector.nonce,
                page: this.currentPage,
                per_page: 12,
                search: searchTerm || this.ui.find('.bunnyvault-video-search').val(),
                category: this.ui.find('.bunnyvault-category-filter').val(),
                sort: this.ui.find('.bunnyvault-sort-filter').val()
            };
            
            $.ajax({
                url: bunnyvaultVideoSelector.ajaxUrl,
                type: 'POST',
                data: data,
                success: function(response) {
                    if (response.success && response.data) {
                        var html = '';
                        
                        if (response.data.videos && response.data.videos.length > 0) {
                            $.each(response.data.videos, function(index, video) {
                                html += self.renderVideoItem(video);
                            });
                            
                            if (append) {
                                $grid.find('.bunnyvault-loading').remove();
                                $grid.append(html);
                            } else {
                                $grid.html(html);
                            }
                            
                            // Show/hide load more button
                            if (response.data.has_more) {
                                $loadMore.show();
                            } else {
                                $loadMore.hide();
                            }
                            
                            // Highlight selected video
                            var currentValue = self.getControlValue();
                            if (currentValue && currentValue.id) {
                                $grid.find('[data-video-id="' + currentValue.id + '"]').addClass('selected');
                            }
                        } else {
                            $grid.html('<div class="bunnyvault-no-videos"><p>' + bunnyvaultVideoSelector.strings.noVideosFound + '</p></div>');
                            $loadMore.hide();
                        }
                    } else {
                        $grid.html('<div class="bunnyvault-error"><p>Error loading videos</p></div>');
                        $loadMore.hide();
                    }
                },
                error: function() {
                    $grid.html('<div class="bunnyvault-error"><p>Error loading videos</p></div>');
                    $loadMore.hide();
                }
            });
        },
        
        // Load external video info
        loadExternalVideoInfo: function(url) {
            var self = this;
            
            if (!this.isValidVideoUrl(url)) {
                return;
            }
            
            $.ajax({
                url: bunnyvaultVideoSelector.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'bunnyvault_get_external_video_info',
                    nonce: bunnyvaultVideoSelector.nonce,
                    url: url
                },
                success: function(response) {
                    if (response.success && response.data) {
                        var videoInfo = response.data;
                        
                        var value = self.getControlValue() || {};
                        value.source = 'external';
                        value.url = url;
                        value.title = videoInfo.title || 'External Video';
                        value.description = videoInfo.description || '';
                        value.thumbnail = videoInfo.thumbnail || '';
                        value.duration = videoInfo.duration || '';
                        value.provider = videoInfo.provider || self.getUrlProvider(url);
                        
                        self.setValue(value);
                        self.updateUrlPreview(value);
                    }
                }
            });
        },
        
        // Render video item HTML
        renderVideoItem: function(video) {
            return '<div class="bunnyvault-video-item" data-video-id="' + video.id + '" data-video=\'' + JSON.stringify(video) + '\'>' +
                '<img src="' + video.thumbnail + '" alt="' + video.title + '" class="bunnyvault-video-thumbnail">' +
                '<div class="bunnyvault-video-info">' +
                '<h4 class="bunnyvault-video-title">' + video.title + '</h4>' +
                '<span class="bunnyvault-video-duration">' + video.duration + '</span>' +
                '</div>' +
                '</div>';
        },
        
        // Update media preview
        updateMediaPreview: function(value) {
            var $preview = this.ui.find('.bunnyvault-selected-media');
            
            if (value.id) {
                $preview.find('img').attr('src', value.thumbnail).attr('alt', value.title);
                $preview.find('h4').text(value.title);
                $preview.find('.bunnyvault-duration').text(value.duration);
                $preview.find('.bunnyvault-size').text(value.size);
                $preview.show();
            } else {
                $preview.hide();
            }
        },
        
        // Update URL preview
        updateUrlPreview: function(value) {
            var $preview = this.ui.find('.bunnyvault-url-preview');
            
            if (value.url) {
                if (value.thumbnail) {
                    $preview.find('img').attr('src', value.thumbnail).show();
                } else {
                    $preview.find('img').hide();
                }
                
                $preview.find('h4').text(value.title);
                $preview.find('.bunnyvault-url-source').text(value.provider);
                $preview.find('.bunnyvault-duration').text(value.duration);
                $preview.show();
            } else {
                $preview.hide();
            }
        },
        
        // Check if URL is a valid video URL
        isValidVideoUrl: function(url) {
            var videoPatterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
                /vimeo\.com\/(\d+)/,
                /dailymotion\.com\/video\/([^_]+)/,
                /wistia\.com\/medias\/([^\?]+)/,
                /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i
            ];
            
            return videoPatterns.some(function(pattern) {
                return pattern.test(url);
            });
        },
        
        // Get URL provider
        getUrlProvider: function(url) {
            if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
            if (/vimeo\.com/.test(url)) return 'Vimeo';
            if (/dailymotion\.com/.test(url)) return 'Dailymotion';
            if (/wistia\.com/.test(url)) return 'Wistia';
            return 'External';
        },
        
        // Format duration
        formatDuration: function(seconds) {
            if (!seconds) return '';
            
            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds % 3600) / 60);
            var secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return hours + ':' + minutes.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
            } else {
                return minutes + ':' + secs.toString().padStart(2, '0');
            }
        },
        
        // Format file size
        formatFileSize: function(bytes) {
            if (!bytes) return '';
            
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return '0 Byte';
            
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }
    });
    
    // Register the control
    elementor.addControlView('bunnyvault-video-selector', VideoSelectorControl);
    
})(jQuery);