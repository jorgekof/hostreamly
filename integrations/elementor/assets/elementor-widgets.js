/**
 * Hostreamly Elementor Widgets JavaScript
 * 
 * @package Hostreamly_Elementor
 * @since 2.0.0
 */

(function($) {
    'use strict';
    
    // Main Hostreamly Elementor object
    window.HostreamlyElementor = {
        
        // Initialize all widgets
        init: function() {
            this.initVideoPlayers();
            this.initVideoGalleries();
            this.initVideoCarousels();
            this.initLightbox();
            this.bindEvents();
        },
        
        // Initialize video players
        initVideoPlayers: function() {
            $('.bunnyvault-video-player').each(function() {
                const $player = $(this);
                const $playButton = $player.find('.bunnyvault-play-button');
                const $poster = $player.find('.bunnyvault-video-poster');
                const $video = $player.find('video');
                
                if ($playButton.length && $video.length) {
                    $playButton.on('click', function(e) {
                        e.preventDefault();
                        HostreamlyElementor.playVideo($video[0], $poster);
                    });
                }
                
                // Auto-play if enabled
                if ($player.data('autoplay') === true) {
                    setTimeout(() => {
                        HostreamlyElementor.playVideo($video[0], $poster);
                    }, 1000);
                }
            });
        },
        
        // Initialize video galleries
        initVideoGalleries: function() {
            $('.bunnyvault-video-gallery').each(function() {
                const $gallery = $(this);
                const $items = $gallery.find('.bunnyvault-gallery-item');
                
                // Initialize masonry if enabled
                if ($gallery.hasClass('masonry-layout')) {
                    HostreamlyElementor.initMasonry($gallery);
                }
                
                // Initialize lazy loading if enabled
                if ($gallery.find('.lazy-load').length) {
                    HostreamlyElementor.initLazyLoading($gallery);
                }
                
                // Bind play button events
                $items.find('.bunnyvault-play-button').on('click', function(e) {
                    e.preventDefault();
                    const videoUrl = $(this).data('video-url');
                    const playMode = $(this).data('play-mode');
                    
                    if (playMode === 'lightbox') {
                        HostreamlyElementor.openLightbox(videoUrl);
                    } else {
                        HostreamlyElementor.playInline($(this).closest('.bunnyvault-gallery-item'), videoUrl);
                    }
                });
                
                // Hover video functionality
                $items.find('.bunnyvault-hover-video').each(function() {
                    const video = this;
                    const $item = $(this).closest('.bunnyvault-gallery-item');
                    
                    $item.on('mouseenter', function() {
                        video.play().catch(() => {});
                    }).on('mouseleave', function() {
                        video.pause();
                        video.currentTime = 0;
                    });
                });
            });
        },
        
        // Initialize video carousels
        initVideoCarousels: function() {
            $('.bunnyvault-video-carousel').each(function() {
                const $carousel = $(this);
                const $container = $carousel.find('.bunnyvault-carousel-container');
                const settings = $carousel.data('carousel-settings') || {};
                
                // Initialize Slick carousel
                if (typeof $.fn.slick !== 'undefined') {
                    $container.slick({
                        slidesToShow: settings.slidesToShow || 3,
                        slidesToScroll: settings.slidesToScroll || 1,
                        autoplay: settings.autoplay || false,
                        autoplaySpeed: settings.autoplaySpeed || 3000,
                        infinite: settings.infinite !== false,
                        pauseOnHover: settings.pauseOnHover !== false,
                        speed: settings.speed || 500,
                        arrows: settings.arrows !== false,
                        dots: settings.dots !== false,
                        adaptiveHeight: settings.adaptiveHeight || false,
                        centerMode: settings.centerMode || false,
                        responsive: settings.responsive || [
                            {
                                breakpoint: 1024,
                                settings: {
                                    slidesToShow: Math.min(settings.slidesToShow || 3, 2),
                                    slidesToScroll: 1
                                }
                            },
                            {
                                breakpoint: 768,
                                settings: {
                                    slidesToShow: 1,
                                    slidesToScroll: 1
                                }
                            }
                        ],
                        prevArrow: '<button class="bunnyvault-carousel-arrow prev"><i class="eicon-chevron-left"></i></button>',
                        nextArrow: '<button class="bunnyvault-carousel-arrow next"><i class="eicon-chevron-right"></i></button>',
                        customPaging: function(slider, i) {
                            return '<button class="bunnyvault-carousel-dot"></button>';
                        }
                    });
                } else {
                    // Fallback: Simple carousel implementation
                    HostreamlyElementor.initSimpleCarousel($carousel, settings);
                }
                
                // Bind play button events
                $carousel.find('.bunnyvault-play-button').on('click', function(e) {
                    e.preventDefault();
                    const videoUrl = $(this).data('video-url');
                    const playMode = $(this).data('play-mode');
                    
                    if (playMode === 'lightbox') {
                        HostreamlyElementor.openLightbox(videoUrl);
                    } else {
                        HostreamlyElementor.playInline($(this).closest('.bunnyvault-carousel-slide'), videoUrl);
                    }
                });
            });
        },
        
        // Initialize lightbox
        initLightbox: function() {
            // Create lightbox HTML if it doesn't exist
            if (!$('#bunnyvault-lightbox').length) {
                $('body').append(`
                    <div id="bunnyvault-lightbox" class="bunnyvault-lightbox">
                        <div class="bunnyvault-lightbox-content">
                            <button class="bunnyvault-lightbox-close">
                                <i class="eicon-close"></i>
                            </button>
                            <div class="bunnyvault-lightbox-video-container"></div>
                        </div>
                    </div>
                `);
            }
            
            // Bind close events
            $(document).on('click', '#bunnyvault-lightbox', function(e) {
                if (e.target === this) {
                    HostreamlyElementor.closeLightbox();
                }
            });
            
            $(document).on('click', '.bunnyvault-lightbox-close', function(e) {
                e.preventDefault();
                HostreamlyElementor.closeLightbox();
            });
            
            // Bind keyboard events
            $(document).on('keydown', function(e) {
                if (e.keyCode === 27 && $('#bunnyvault-lightbox').hasClass('active')) {
                    HostreamlyElementor.closeLightbox();
                }
            });
        },
        
        // Bind global events
        bindEvents: function() {
            // Reinitialize on Elementor preview update
            if (typeof elementorFrontend !== 'undefined') {
                elementorFrontend.hooks.addAction('frontend/element_ready/widget', function($scope) {
                    if ($scope.find('.hostreamly-elementor-widget').length) {
                        HostreamlyElementor.init();
                    }
                });
            }
            
            // Handle window resize
            $(window).on('resize', HostreamlyElementor.debounce(function() {
                $('.hostreamly-video-gallery.masonry-layout').each(function() {
                    HostreamlyElementor.initMasonry($(this));
                });
            }, 250));
        },
        
        // Play video
        playVideo: function(video, $poster) {
            if (video && video.play) {
                video.play().then(() => {
                    if ($poster) {
                        $poster.addClass('hidden');
                    }
                }).catch((error) => {
                    console.warn('Video play failed:', error);
                });
            }
        },
        
        // Play video inline
        playInline: function($container, videoUrl) {
            const $thumbnail = $container.find('.bunnyvault-video-thumbnail');
            
            // Create video element
            const $video = $('<video>', {
                src: videoUrl,
                controls: true,
                autoplay: true,
                class: 'bunnyvault-inline-video'
            });
            
            // Replace thumbnail with video
            $thumbnail.html($video);
            
            // Track analytics
            HostreamlyElementor.trackEvent('video_play_inline', {
                video_url: videoUrl,
                widget_type: 'gallery'
            });
        },
        
        // Open lightbox
        openLightbox: function(videoUrl) {
            const $lightbox = $('#bunnyvault-lightbox');
            const $container = $lightbox.find('.bunnyvault-lightbox-video-container');
            
            // Create video element
            const $video = $('<video>', {
                src: videoUrl,
                controls: true,
                autoplay: true,
                class: 'bunnyvault-lightbox-video'
            });
            
            // Clear container and add video
            $container.html($video);
            
            // Show lightbox
            $lightbox.addClass('active');
            $('body').addClass('bunnyvault-lightbox-open');
            
            // Track analytics
            HostreamlyElementor.trackEvent('video_play_lightbox', {
                video_url: videoUrl,
                widget_type: 'lightbox'
            });
        },
        
        // Close lightbox
        closeLightbox: function() {
            const $lightbox = $('#bunnyvault-lightbox');
            const $container = $lightbox.find('.bunnyvault-lightbox-video-container');
            
            // Stop video
            $container.find('video').each(function() {
                this.pause();
                this.currentTime = 0;
            });
            
            // Hide lightbox
            $lightbox.removeClass('active');
            $('body').removeClass('bunnyvault-lightbox-open');
            
            // Clear container after animation
            setTimeout(() => {
                $container.empty();
            }, 300);
        },
        
        // Initialize masonry layout
        initMasonry: function($gallery) {
            if (typeof Masonry !== 'undefined') {
                const $grid = $gallery.find('.bunnyvault-gallery-grid');
                
                $grid.masonry({
                    itemSelector: '.bunnyvault-gallery-item',
                    columnWidth: '.bunnyvault-gallery-item',
                    percentPosition: true,
                    gutter: 20
                });
            }
        },
        
        // Initialize lazy loading
        initLazyLoading: function($gallery) {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const $item = $(entry.target);
                            const $img = $item.find('img[data-src]');
                            const $video = $item.find('video[data-src]');
                            
                            // Load images
                            $img.each(function() {
                                this.src = this.dataset.src;
                                delete this.dataset.src;
                            });
                            
                            // Load videos
                            $video.each(function() {
                                this.src = this.dataset.src;
                                delete this.dataset.src;
                            });
                            
                            $item.removeClass('lazy-load');
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    rootMargin: '50px'
                });
                
                $gallery.find('.lazy-load').each(function() {
                    observer.observe(this);
                });
            }
        },
        
        // Simple carousel fallback
        initSimpleCarousel: function($carousel, settings) {
            const $container = $carousel.find('.bunnyvault-carousel-container');
            const $slides = $container.find('.bunnyvault-carousel-slide');
            const slidesToShow = settings.slidesToShow || 3;
            let currentSlide = 0;
            
            // Create navigation
            if (settings.arrows !== false) {
                $carousel.append(`
                    <button class="bunnyvault-carousel-arrow prev">
                        <i class="eicon-chevron-left"></i>
                    </button>
                    <button class="bunnyvault-carousel-arrow next">
                        <i class="eicon-chevron-right"></i>
                    </button>
                `);
            }
            
            if (settings.dots !== false) {
                const dotsHtml = Array.from({length: Math.ceil($slides.length / slidesToShow)}, (_, i) => 
                    `<button class="bunnyvault-carousel-dot ${i === 0 ? 'active' : ''}"></button>`
                ).join('');
                
                $carousel.append(`<div class="bunnyvault-carousel-dots">${dotsHtml}</div>`);
            }
            
            // Set up slides
            $slides.css({
                width: `${100 / slidesToShow}%`,
                float: 'left'
            });
            
            $container.css({
                width: `${($slides.length / slidesToShow) * 100}%`,
                transition: 'transform 0.3s ease'
            });
            
            // Navigation functions
            const goToSlide = (index) => {
                currentSlide = Math.max(0, Math.min(index, Math.ceil($slides.length / slidesToShow) - 1));
                const translateX = -(currentSlide * (100 / Math.ceil($slides.length / slidesToShow)));
                $container.css('transform', `translateX(${translateX}%)`);
                
                $carousel.find('.bunnyvault-carousel-dot').removeClass('active')
                    .eq(currentSlide).addClass('active');
            };
            
            // Bind navigation events
            $carousel.on('click', '.bunnyvault-carousel-arrow.prev', () => {
                goToSlide(currentSlide - 1);
            });
            
            $carousel.on('click', '.bunnyvault-carousel-arrow.next', () => {
                goToSlide(currentSlide + 1);
            });
            
            $carousel.on('click', '.bunnyvault-carousel-dot', function() {
                goToSlide($(this).index());
            });
            
            // Auto-play
            if (settings.autoplay) {
                setInterval(() => {
                    if (currentSlide >= Math.ceil($slides.length / slidesToShow) - 1) {
                        goToSlide(0);
                    } else {
                        goToSlide(currentSlide + 1);
                    }
                }, settings.autoplaySpeed || 3000);
            }
        },
        
        // Track analytics events
        trackEvent: function(eventName, eventData) {
            // Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    event_category: 'Hostreamly_Elementor',
                    event_label: eventData.widget_type || 'unknown',
                    custom_parameters: eventData
                });
            }
            
            // Facebook Pixel
            if (typeof fbq !== 'undefined') {
                fbq('trackCustom', 'Hostreamly_' + eventName, eventData);
            }
            
            // Custom analytics hook
            if (typeof window.hostreamlyAnalytics !== 'undefined') {
                window.hostreamlyAnalytics.track(eventName, eventData);
            }
            
            // Console log for debugging
            if (window.hostreamlyDebug) {
                console.log('Hostreamly Event:', eventName, eventData);
            }
        },
        
        // Utility: Debounce function
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Utility: Format time
        formatTime: function(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },
        
        // Utility: Get video thumbnail
        getVideoThumbnail: function(videoUrl) {
            // YouTube
            const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            if (youtubeMatch) {
                return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
            }
            
            // Vimeo (would need API call for actual thumbnail)
            const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
                return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
            }
            
            return null;
        }
    };
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        HostreamlyElementor.init();
    });
    
    // Reinitialize on Elementor frontend init
    $(window).on('elementor/frontend/init', function() {
        HostreamlyElementor.init();
    });
    
    // Add CSS for lightbox body class
    $('<style>').text(`
        body.bunnyvault-lightbox-open {
            overflow: hidden;
        }
        
        .bunnyvault-inline-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    `).appendTo('head');
    
})(jQuery);

// Elementor Editor Integration
if (typeof elementor !== 'undefined') {
    elementor.hooks.addAction('panel/open_editor/widget', function(panel, model, view) {
        // Custom logic for widget editor
        if (model.get('widgetType').startsWith('hostreamly-')) {
            // Add custom editor enhancements
            console.log('Hostreamly widget editor opened:', model.get('widgetType'));
        }
    });
}