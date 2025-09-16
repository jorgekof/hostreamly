/**
 * BunnyVault WooCommerce Widgets JavaScript
 * @version 2.0.0
 */

(function($) {
    'use strict';

    /**
     * BunnyVault Widgets Manager
     */
    const BunnyVaultWidgets = {
        
        // Configuration
        config: {
            selectors: {
                productVideo: '.bunnyvault-product-video-widget',
                productGallery: '.bunnyvault-product-gallery-widget',
                categoryVideos: '.bunnyvault-category-videos-widget',
                featuredVideos: '.bunnyvault-featured-videos-widget',
                testimonials: '.bunnyvault-testimonial-widget'
            },
            classes: {
                loading: 'bunnyvault-widget-loading',
                error: 'bunnyvault-widget-error',
                empty: 'bunnyvault-widget-empty',
                active: 'bunnyvault-widget-active'
            },
            events: {
                videoLoad: 'bunnyvault:video:load',
                videoPlay: 'bunnyvault:video:play',
                videoPause: 'bunnyvault:video:pause',
                videoEnd: 'bunnyvault:video:end',
                widgetReady: 'bunnyvault:widget:ready'
            }
        },

        // Initialize all widgets
        init: function() {
            this.initProductVideoWidgets();
            this.initProductGalleryWidgets();
            this.initCategoryVideoWidgets();
            this.initFeaturedVideoWidgets();
            this.initTestimonialWidgets();
            this.initLazyLoading();
            this.initAnalytics();
            this.bindEvents();
            
            // Trigger ready event
            $(document).trigger(this.config.events.widgetReady);
        },

        /**
         * Initialize Product Video Widgets
         */
        initProductVideoWidgets: function() {
            const self = this;
            
            $(this.config.selectors.productVideo).each(function() {
                const $widget = $(this);
                const $video = $widget.find('.bunnyvault-widget-video');
                
                if ($video.length) {
                    self.setupVideoPlayer($video, {
                        widget: 'product-video',
                        autoplay: $video.data('autoplay') || false,
                        responsive: $video.data('responsive') !== false
                    });
                }
            });
        },

        /**
         * Initialize Product Gallery Widgets
         */
        initProductGalleryWidgets: function() {
            const self = this;
            
            $(this.config.selectors.productGallery).each(function() {
                const $widget = $(this);
                const $gallery = $widget.find('.bunnyvault-widget-gallery');
                
                if ($gallery.length) {
                    self.setupGallery($gallery, {
                        widget: 'product-gallery',
                        lazyLoad: true,
                        lightbox: true
                    });
                }
            });
        },

        /**
         * Initialize Category Video Widgets
         */
        initCategoryVideoWidgets: function() {
            const self = this;
            
            $(this.config.selectors.categoryVideos).each(function() {
                const $widget = $(this);
                const $videos = $widget.find('.bunnyvault-category-item');
                
                $videos.each(function() {
                    const $video = $(this).find('video, iframe');
                    if ($video.length) {
                        self.setupVideoPlayer($video, {
                            widget: 'category-videos',
                            autoplay: false,
                            playOnHover: true
                        });
                    }
                });
            });
        },

        /**
         * Initialize Featured Video Widgets
         */
        initFeaturedVideoWidgets: function() {
            const self = this;
            
            $(this.config.selectors.featuredVideos).each(function() {
                const $widget = $(this);
                const $videos = $widget.find('.bunnyvault-featured-item');
                
                $videos.each(function() {
                    const $video = $(this).find('video, iframe');
                    if ($video.length) {
                        self.setupVideoPlayer($video, {
                            widget: 'featured-videos',
                            autoplay: $widget.data('autoplay') || false,
                            showControls: true
                        });
                    }
                });
                
                // Setup carousel if needed
                if ($widget.hasClass('layout-carousel')) {
                    self.setupCarousel($widget.find('.bunnyvault-widget-featured'));
                }
            });
        },

        /**
         * Initialize Testimonial Widgets
         */
        initTestimonialWidgets: function() {
            const self = this;
            
            $(this.config.selectors.testimonials).each(function() {
                const $widget = $(this);
                const $testimonials = $widget.find('.bunnyvault-testimonial-item');
                
                $testimonials.each(function() {
                    const $video = $(this).find('.bunnyvault-testimonial-video video, .bunnyvault-testimonial-video iframe');
                    if ($video.length) {
                        self.setupVideoPlayer($video, {
                            widget: 'testimonials',
                            autoplay: $widget.data('autoplay') || false,
                            muted: true
                        });
                    }
                });
                
                // Setup carousel if needed
                if ($widget.hasClass('layout-carousel')) {
                    self.setupCarousel($widget.find('.bunnyvault-widget-testimonials'));
                }
            });
        },

        /**
         * Setup video player
         */
        setupVideoPlayer: function($video, options) {
            const self = this;
            const defaults = {
                autoplay: false,
                muted: false,
                responsive: true,
                playOnHover: false,
                showControls: true,
                widget: 'unknown'
            };
            
            const settings = $.extend({}, defaults, options);
            
            // Add responsive wrapper if needed
            if (settings.responsive && !$video.closest('.bunnyvault-responsive-wrapper').length) {
                $video.wrap('<div class="bunnyvault-responsive-wrapper"></div>');
            }
            
            // Setup video element
            if ($video.is('video')) {
                $video.attr({
                    'controls': settings.showControls,
                    'muted': settings.muted,
                    'autoplay': settings.autoplay,
                    'playsinline': true
                });
                
                // Bind video events
                $video.on('loadstart', function() {
                    self.trackEvent('video_load_start', {
                        widget: settings.widget,
                        video_id: $(this).data('video-id')
                    });
                });
                
                $video.on('canplay', function() {
                    $(this).trigger(self.config.events.videoLoad);
                });
                
                $video.on('play', function() {
                    $(this).trigger(self.config.events.videoPlay);
                    self.trackEvent('video_play', {
                        widget: settings.widget,
                        video_id: $(this).data('video-id')
                    });
                });
                
                $video.on('pause', function() {
                    $(this).trigger(self.config.events.videoPause);
                });
                
                $video.on('ended', function() {
                    $(this).trigger(self.config.events.videoEnd);
                    self.trackEvent('video_complete', {
                        widget: settings.widget,
                        video_id: $(this).data('video-id')
                    });
                });
            }
            
            // Setup hover play
            if (settings.playOnHover) {
                const $container = $video.closest('.bunnyvault-gallery-item, .bunnyvault-category-item, .bunnyvault-featured-item');
                
                $container.on('mouseenter', function() {
                    if ($video.is('video') && $video[0].paused) {
                        $video[0].play().catch(function() {
                            // Handle autoplay restrictions
                        });
                    }
                });
                
                $container.on('mouseleave', function() {
                    if ($video.is('video') && !$video[0].paused) {
                        $video[0].pause();
                    }
                });
            }
            
            // Add loading state
            $video.addClass(this.config.classes.loading);
            
            // Remove loading state when ready
            $video.on(this.config.events.videoLoad, function() {
                $(this).removeClass(self.config.classes.loading);
            });
        },

        /**
         * Setup gallery
         */
        setupGallery: function($gallery, options) {
            const self = this;
            const $items = $gallery.find('.bunnyvault-gallery-item');
            
            // Setup lightbox
            if (options.lightbox) {
                $items.on('click', function(e) {
                    e.preventDefault();
                    const $video = $(this).find('video, iframe');
                    if ($video.length) {
                        self.openLightbox($video, {
                            title: $(this).find('.bunnyvault-gallery-title').text()
                        });
                    }
                });
            }
            
            // Setup masonry layout if needed
            if ($gallery.hasClass('masonry')) {
                this.setupMasonry($gallery);
            }
        },

        /**
         * Setup carousel
         */
        setupCarousel: function($carousel) {
            if (!$carousel.length) return;
            
            const $items = $carousel.children();
            let currentIndex = 0;
            
            // Add navigation if more than one item
            if ($items.length > 1) {
                const $nav = $('<div class="bunnyvault-carousel-nav"></div>');
                const $prevBtn = $('<button class="bunnyvault-carousel-prev" aria-label="Previous">‹</button>');
                const $nextBtn = $('<button class="bunnyvault-carousel-next" aria-label="Next">›</button>');
                
                $nav.append($prevBtn, $nextBtn);
                $carousel.after($nav);
                
                // Navigation events
                $prevBtn.on('click', function() {
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : $items.length - 1;
                    updateCarousel();
                });
                
                $nextBtn.on('click', function() {
                    currentIndex = currentIndex < $items.length - 1 ? currentIndex + 1 : 0;
                    updateCarousel();
                });
                
                // Auto-scroll
                let autoScrollInterval;
                const startAutoScroll = function() {
                    autoScrollInterval = setInterval(function() {
                        $nextBtn.click();
                    }, 5000);
                };
                
                const stopAutoScroll = function() {
                    clearInterval(autoScrollInterval);
                };
                
                $carousel.on('mouseenter', stopAutoScroll);
                $carousel.on('mouseleave', startAutoScroll);
                
                startAutoScroll();
            }
            
            function updateCarousel() {
                const itemWidth = $items.first().outerWidth(true);
                $carousel.css('transform', `translateX(-${currentIndex * itemWidth}px)`);
            }
        },

        /**
         * Setup masonry layout
         */
        setupMasonry: function($gallery) {
            // Simple masonry implementation
            const $items = $gallery.children();
            const columns = parseInt($gallery.data('columns')) || 3;
            
            $items.each(function(index) {
                const column = index % columns;
                $(this).css({
                    'position': 'absolute',
                    'left': `${(column * 100) / columns}%`,
                    'width': `${100 / columns}%`
                });
            });
        },

        /**
         * Initialize lazy loading
         */
        initLazyLoading: function() {
            if ('IntersectionObserver' in window) {
                const lazyVideoObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            const $video = $(entry.target);
                            const src = $video.data('src');
                            
                            if (src && !$video.attr('src')) {
                                $video.attr('src', src);
                                $video.removeClass('lazy');
                                lazyVideoObserver.unobserve(entry.target);
                            }
                        }
                    });
                });
                
                $('.bunnyvault-widget-video.lazy, .bunnyvault-gallery-video.lazy').each(function() {
                    lazyVideoObserver.observe(this);
                });
            }
        },

        /**
         * Open lightbox
         */
        openLightbox: function($video, options) {
            const defaults = {
                title: '',
                showControls: true
            };
            
            const settings = $.extend({}, defaults, options);
            
            // Create lightbox
            const $lightbox = $(`
                <div class="bunnyvault-lightbox">
                    <div class="bunnyvault-lightbox-overlay"></div>
                    <div class="bunnyvault-lightbox-content">
                        <button class="bunnyvault-lightbox-close" aria-label="Close">×</button>
                        ${settings.title ? `<h3 class="bunnyvault-lightbox-title">${settings.title}</h3>` : ''}
                        <div class="bunnyvault-lightbox-video"></div>
                    </div>
                </div>
            `);
            
            // Clone video
            const $clonedVideo = $video.clone();
            $clonedVideo.attr('controls', settings.showControls);
            $lightbox.find('.bunnyvault-lightbox-video').append($clonedVideo);
            
            // Add to body
            $('body').append($lightbox);
            
            // Show lightbox
            setTimeout(function() {
                $lightbox.addClass('active');
            }, 10);
            
            // Close events
            $lightbox.find('.bunnyvault-lightbox-close, .bunnyvault-lightbox-overlay').on('click', function() {
                $lightbox.removeClass('active');
                setTimeout(function() {
                    $lightbox.remove();
                }, 300);
            });
            
            // Escape key
            $(document).on('keyup.bunnyvault-lightbox', function(e) {
                if (e.keyCode === 27) {
                    $lightbox.find('.bunnyvault-lightbox-close').click();
                    $(document).off('keyup.bunnyvault-lightbox');
                }
            });
        },

        /**
         * Initialize analytics
         */
        initAnalytics: function() {
            const self = this;
            
            // Track widget views
            if ('IntersectionObserver' in window) {
                const widgetObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            const $widget = $(entry.target);
                            const widgetType = self.getWidgetType($widget);
                            
                            self.trackEvent('widget_view', {
                                widget_type: widgetType,
                                widget_id: $widget.attr('id') || 'unknown'
                            });
                            
                            widgetObserver.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.5
                });
                
                // Observe all widgets
                Object.values(this.config.selectors).forEach(function(selector) {
                    $(selector).each(function() {
                        widgetObserver.observe(this);
                    });
                });
            }
        },

        /**
         * Get widget type from element
         */
        getWidgetType: function($widget) {
            for (const [type, selector] of Object.entries(this.config.selectors)) {
                if ($widget.is(selector)) {
                    return type.replace(/([A-Z])/g, '-$1').toLowerCase();
                }
            }
            return 'unknown';
        },

        /**
         * Track analytics event
         */
        trackEvent: function(eventName, data) {
            // Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    'custom_map': {'dimension1': 'bunnyvault_widgets'},
                    ...data
                });
            }
            
            // Facebook Pixel
            if (typeof fbq !== 'undefined') {
                fbq('trackCustom', `BunnyVault_${eventName}`, data);
            }
            
            // Custom event
            $(document).trigger(`bunnyvault:analytics:${eventName}`, [data]);
        },

        /**
         * Bind global events
         */
        bindEvents: function() {
            const self = this;
            
            // Window resize
            $(window).on('resize', this.debounce(function() {
                self.handleResize();
            }, 250));
            
            // AJAX complete (for dynamic content)
            $(document).on('ajaxComplete', function() {
                setTimeout(function() {
                    self.init();
                }, 100);
            });
        },

        /**
         * Handle window resize
         */
        handleResize: function() {
            // Update responsive videos
            $('.bunnyvault-responsive-wrapper').each(function() {
                const $wrapper = $(this);
                const $video = $wrapper.find('video, iframe');
                
                if ($video.length) {
                    const aspectRatio = $video.data('aspect-ratio') || (9/16);
                    $wrapper.css('padding-bottom', (aspectRatio * 100) + '%');
                }
            });
            
            // Update masonry layouts
            $('.bunnyvault-widget-gallery.masonry').each(function() {
                BunnyVaultWidgets.setupMasonry($(this));
            });
        },

        /**
         * Utility: Debounce function
         */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = function() {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Utility: Get video duration
         */
        getVideoDuration: function($video) {
            if ($video.is('video')) {
                return $video[0].duration || 0;
            }
            return 0;
        },

        /**
         * Utility: Format time
         */
        formatTime: function(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    };

    /**
     * Widget Admin Interface (for Customizer)
     */
    const BunnyVaultWidgetAdmin = {
        
        init: function() {
            this.bindWidgetFormEvents();
            this.initColorPickers();
            this.initPreviewUpdates();
        },

        /**
         * Bind widget form events
         */
        bindWidgetFormEvents: function() {
            $(document).on('change', '.widget-content input, .widget-content select', function() {
                const $widget = $(this).closest('.widget');
                BunnyVaultWidgetAdmin.updatePreview($widget);
            });
            
            // Product selector
            $(document).on('click', '.bunnyvault-select-product', function(e) {
                e.preventDefault();
                BunnyVaultWidgetAdmin.openProductSelector($(this));
            });
            
            // Video selector
            $(document).on('click', '.bunnyvault-select-video', function(e) {
                e.preventDefault();
                BunnyVaultWidgetAdmin.openVideoSelector($(this));
            });
        },

        /**
         * Initialize color pickers
         */
        initColorPickers: function() {
            if ($.fn.wpColorPicker) {
                $('.bunnyvault-color-picker').wpColorPicker({
                    change: function() {
                        const $widget = $(this).closest('.widget');
                        BunnyVaultWidgetAdmin.updatePreview($widget);
                    }
                });
            }
        },

        /**
         * Update widget preview
         */
        updatePreview: function($widget) {
            // This would integrate with WordPress Customizer
            // to show live preview of widget changes
            if (typeof wp !== 'undefined' && wp.customize) {
                wp.customize.preview.send('widget-updated', {
                    widget: $widget.attr('id')
                });
            }
        },

        /**
         * Open product selector modal
         */
        openProductSelector: function($button) {
            // Implementation would depend on WooCommerce admin interface
    
        },

        /**
         * Open video selector modal
         */
        openVideoSelector: function($button) {
            // Implementation would integrate with BunnyVault media library
            console.log('Opening video selector...');
        }
    };

    /**
     * Initialize on document ready
     */
    $(document).ready(function() {
        BunnyVaultWidgets.init();
        
        // Initialize admin interface if in admin
        if (typeof pagenow !== 'undefined' && (pagenow === 'widgets' || pagenow === 'customize')) {
            BunnyVaultWidgetAdmin.init();
        }
    });

    // Expose to global scope
    window.BunnyVaultWidgets = BunnyVaultWidgets;
    window.BunnyVaultWidgetAdmin = BunnyVaultWidgetAdmin;

})(jQuery);

/**
 * Lightbox CSS (injected dynamically)
 */
if (!document.getElementById('bunnyvault-lightbox-styles')) {
    const lightboxStyles = `
        <style id="bunnyvault-lightbox-styles">
            .bunnyvault-lightbox {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 999999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .bunnyvault-lightbox.active {
                opacity: 1;
                visibility: visible;
            }
            
            .bunnyvault-lightbox-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                cursor: pointer;
            }
            
            .bunnyvault-lightbox-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                padding: 2em;
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
            }
            
            .bunnyvault-lightbox-close {
                position: absolute;
                top: 1em;
                right: 1em;
                background: none;
                border: none;
                font-size: 2em;
                cursor: pointer;
                color: #666;
                z-index: 1;
            }
            
            .bunnyvault-lightbox-close:hover {
                color: #333;
            }
            
            .bunnyvault-lightbox-title {
                margin: 0 0 1em 0;
                font-size: 1.2em;
                font-weight: 600;
            }
            
            .bunnyvault-lightbox-video {
                position: relative;
            }
            
            .bunnyvault-lightbox-video video,
            .bunnyvault-lightbox-video iframe {
                width: 100%;
                height: auto;
                max-width: 800px;
            }
            
            @media (max-width: 768px) {
                .bunnyvault-lightbox-content {
                    padding: 1em;
                    margin: 1em;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', lightboxStyles);
}