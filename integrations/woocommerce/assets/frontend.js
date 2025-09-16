/**
 * BunnyVault WooCommerce Integration - Frontend JavaScript
 * Handles video interactions, analytics, and performance optimizations
 */

(function($) {
    'use strict';

    // Global configuration
    const BunnyVaultWC = {
        config: {
            lazyLoad: true,
            trackViews: true,
            trackEngagement: true,
            autoplayThreshold: 0.5, // 50% visible
            intersectionThreshold: 0.1,
            debounceDelay: 300
        },
        
        stats: {
            videosLoaded: 0,
            videosPlayed: 0,
            totalWatchTime: 0,
            conversions: 0
        },
        
        observers: {
            intersection: null,
            resize: null
        },
        
        timers: {},
        cache: new Map()
    };

    /**
     * Initialize the plugin
     */
    function init() {
        console.log('BunnyVault WooCommerce Integration initialized');
        
        // Wait for DOM to be ready
        $(document).ready(function() {
            setupIntersectionObserver();
            setupEventListeners();
            setupLazyLoading();
            setupAnalytics();
            setupResponsiveVideos();
            setupAccessibility();
            
            // Initialize existing videos
            processExistingVideos();
            
            // Setup AJAX handlers for dynamic content
            setupAjaxHandlers();
        });
    }

    /**
     * Setup Intersection Observer for lazy loading and autoplay
     */
    function setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, falling back to scroll events');
            setupScrollFallback();
            return;
        }

        BunnyVaultWC.observers.intersection = new IntersectionObserver(
            handleIntersection,
            {
                threshold: [0, BunnyVaultWC.config.intersectionThreshold, BunnyVaultWC.config.autoplayThreshold, 1],
                rootMargin: '50px 0px'
            }
        );

        // Observe all video containers
        $('.bunnyvault-video-container').each(function() {
            BunnyVaultWC.observers.intersection.observe(this);
        });
    }

    /**
     * Handle intersection observer events
     */
    function handleIntersection(entries) {
        entries.forEach(entry => {
            const $container = $(entry.target);
            const $iframe = $container.find('iframe');
            
            if (entry.isIntersecting) {
                // Load video if not loaded
                if ($container.hasClass('bunnyvault-lazy') && !$container.hasClass('bunnyvault-loaded')) {
                    loadVideo($container);
                }
                
                // Track view
                if (entry.intersectionRatio >= BunnyVaultWC.config.intersectionThreshold) {
                    trackVideoView($container);
                }
                
                // Autoplay if threshold met
                if (entry.intersectionRatio >= BunnyVaultWC.config.autoplayThreshold) {
                    handleAutoplay($container);
                }
                
                // Start engagement tracking
                startEngagementTracking($container);
            } else {
                // Stop engagement tracking
                stopEngagementTracking($container);
                
                // Pause video if playing
                pauseVideo($container);
            }
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Video interaction events
        $(document).on('click', '.bunnyvault-play-button', handlePlayButtonClick);
        $(document).on('click', '.bunnyvault-gallery-item', handleGalleryItemClick);
        
        // Product page events
        $(document).on('click', '.single_add_to_cart_button', handleAddToCart);
        $(document).on('wc_fragments_refreshed', handleCartUpdate);
        
        // Window events
        $(window).on('resize', debounce(handleWindowResize, BunnyVaultWC.config.debounceDelay));
        $(window).on('beforeunload', handlePageUnload);
        
        // WooCommerce events
        $('body').on('added_to_cart', handleProductAddedToCart);
        $('body').on('wc_cart_button_updated', handleCartButtonUpdate);
    }

    /**
     * Setup lazy loading
     */
    function setupLazyLoading() {
        if (!BunnyVaultWC.config.lazyLoad) return;
        
        $('.bunnyvault-video-container').each(function() {
            const $container = $(this);
            const $iframe = $container.find('iframe');
            
            if ($iframe.length && !$container.hasClass('bunnyvault-no-lazy')) {
                // Store original src
                const originalSrc = $iframe.attr('src');
                $container.data('video-src', originalSrc);
                
                // Remove src and add lazy class
                $iframe.removeAttr('src');
                $container.addClass('bunnyvault-lazy bunnyvault-loading');
                
                // Add placeholder
                addLazyPlaceholder($container);
            }
        });
    }

    /**
     * Add lazy loading placeholder
     */
    function addLazyPlaceholder($container) {
        const $placeholder = $('<div class="bunnyvault-lazy-placeholder"></div>');
        $container.prepend($placeholder);
    }

    /**
     * Load video
     */
    function loadVideo($container) {
        const videoSrc = $container.data('video-src');
        if (!videoSrc) return;
        
        const $iframe = $container.find('iframe');
        const $placeholder = $container.find('.bunnyvault-lazy-placeholder');
        
        // Set src
        $iframe.attr('src', videoSrc);
        
        // Update classes
        $container.removeClass('bunnyvault-lazy bunnyvault-loading').addClass('bunnyvault-loaded');
        
        // Remove placeholder
        $placeholder.fadeOut(300, function() {
            $(this).remove();
        });
        
        // Track loading
        BunnyVaultWC.stats.videosLoaded++;
        trackEvent('video_loaded', {
            video_id: getVideoId($container),
            product_id: getProductId($container)
        });
    }

    /**
     * Setup analytics tracking
     */
    function setupAnalytics() {
        if (!BunnyVaultWC.config.trackViews) return;
        
        // Track page view with videos
        const videoCount = $('.bunnyvault-video-container').length;
        if (videoCount > 0) {
            trackEvent('page_view_with_videos', {
                video_count: videoCount,
                page_type: getPageType()
            });
        }
    }

    /**
     * Track video view
     */
    function trackVideoView($container) {
        const videoId = getVideoId($container);
        const productId = getProductId($container);
        
        if (!videoId || $container.data('view-tracked')) return;
        
        $container.data('view-tracked', true);
        
        // Send to server
        $.ajax({
            url: bunnyvault_wc.ajax_url,
            type: 'POST',
            data: {
                action: 'bunnyvault_wc_track_view',
                nonce: bunnyvault_wc.nonce,
                video_id: videoId,
                product_id: productId,
                page_type: getPageType(),
                timestamp: Date.now()
            },
            success: function(response) {
                if (response.success) {
                    console.log('Video view tracked:', videoId);
                }
            }
        });
        
        // Track locally
        trackEvent('video_view', {
            video_id: videoId,
            product_id: productId
        });
    }

    /**
     * Start engagement tracking
     */
    function startEngagementTracking($container) {
        if (!BunnyVaultWC.config.trackEngagement) return;
        
        const videoId = getVideoId($container);
        if (!videoId) return;
        
        const startTime = Date.now();
        $container.data('engagement-start', startTime);
        
        // Set up periodic tracking
        const trackingInterval = setInterval(() => {
            if (!isElementVisible($container[0])) {
                clearInterval(trackingInterval);
                return;
            }
            
            const currentTime = Date.now();
            const watchTime = currentTime - startTime;
            
            trackEvent('video_engagement', {
                video_id: videoId,
                product_id: getProductId($container),
                watch_time: watchTime,
                timestamp: currentTime
            });
        }, 5000); // Track every 5 seconds
        
        $container.data('tracking-interval', trackingInterval);
    }

    /**
     * Stop engagement tracking
     */
    function stopEngagementTracking($container) {
        const trackingInterval = $container.data('tracking-interval');
        if (trackingInterval) {
            clearInterval(trackingInterval);
            $container.removeData('tracking-interval');
        }
        
        const startTime = $container.data('engagement-start');
        if (startTime) {
            const totalTime = Date.now() - startTime;
            BunnyVaultWC.stats.totalWatchTime += totalTime;
            
            trackEvent('video_engagement_end', {
                video_id: getVideoId($container),
                product_id: getProductId($container),
                total_watch_time: totalTime
            });
            
            $container.removeData('engagement-start');
        }
    }

    /**
     * Handle autoplay
     */
    function handleAutoplay($container) {
        const $iframe = $container.find('iframe');
        const autoplay = $container.data('autoplay');
        
        if (autoplay === 'true' || autoplay === true) {
            // Send play message to iframe
            try {
                $iframe[0].contentWindow.postMessage('play', '*');
                BunnyVaultWC.stats.videosPlayed++;
                
                trackEvent('video_autoplay', {
                    video_id: getVideoId($container),
                    product_id: getProductId($container)
                });
            } catch (e) {
                console.warn('Could not autoplay video:', e);
            }
        }
    }

    /**
     * Pause video
     */
    function pauseVideo($container) {
        const $iframe = $container.find('iframe');
        
        try {
            $iframe[0].contentWindow.postMessage('pause', '*');
        } catch (e) {
            console.warn('Could not pause video:', e);
        }
    }

    /**
     * Handle play button click
     */
    function handlePlayButtonClick(e) {
        e.preventDefault();
        const $button = $(this);
        const $container = $button.closest('.bunnyvault-video-container');
        
        // Load video if lazy
        if ($container.hasClass('bunnyvault-lazy')) {
            loadVideo($container);
        }
        
        // Play video
        setTimeout(() => {
            const $iframe = $container.find('iframe');
            try {
                $iframe[0].contentWindow.postMessage('play', '*');
                BunnyVaultWC.stats.videosPlayed++;
                
                trackEvent('video_play_button', {
                    video_id: getVideoId($container),
                    product_id: getProductId($container)
                });
            } catch (e) {
                console.warn('Could not play video:', e);
            }
        }, 100);
        
        // Hide play button
        $button.fadeOut(300);
    }

    /**
     * Handle gallery item click
     */
    function handleGalleryItemClick(e) {
        const $item = $(this);
        const $link = $item.find('.bunnyvault-gallery-title a, .bunnyvault-view-product');
        
        if ($link.length && !$(e.target).is('iframe, .bunnyvault-play-button')) {
            trackEvent('gallery_item_click', {
                video_id: getVideoId($item.find('.bunnyvault-video-container')),
                product_id: getProductId($item.find('.bunnyvault-video-container')),
                target_url: $link.attr('href')
            });
        }
    }

    /**
     * Handle add to cart
     */
    function handleAddToCart(e) {
        const $button = $(this);
        const $form = $button.closest('form');
        const productId = $form.find('[name="product_id"], [name="add-to-cart"]').val();
        
        // Check if product has video
        const $videoContainer = $('.bunnyvault-video-container[data-product-id="' + productId + '"]');
        if ($videoContainer.length) {
            trackEvent('add_to_cart_with_video', {
                video_id: getVideoId($videoContainer),
                product_id: productId,
                watch_time: BunnyVaultWC.stats.totalWatchTime
            });
            
            BunnyVaultWC.stats.conversions++;
        }
    }

    /**
     * Handle product added to cart
     */
    function handleProductAddedToCart(e, fragments, cart_hash, $button) {
        const productId = $button.val();
        
        trackEvent('product_added_to_cart', {
            product_id: productId,
            cart_hash: cart_hash
        });
    }

    /**
     * Setup responsive videos
     */
    function setupResponsiveVideos() {
        handleWindowResize();
    }

    /**
     * Handle window resize
     */
    function handleWindowResize() {
        $('.bunnyvault-responsive').each(function() {
            const $container = $(this);
            const aspectRatio = $container.data('aspect-ratio') || '16:9';
            const [width, height] = aspectRatio.split(':').map(Number);
            const paddingBottom = (height / width) * 100;
            
            $container.css('padding-bottom', paddingBottom + '%');
        });
    }

    /**
     * Setup accessibility features
     */
    function setupAccessibility() {
        // Add ARIA labels
        $('.bunnyvault-video-container iframe').each(function() {
            const $iframe = $(this);
            const $container = $iframe.closest('.bunnyvault-video-container');
            const videoId = getVideoId($container);
            const productId = getProductId($container);
            
            $iframe.attr({
                'aria-label': 'Video del producto ' + productId,
                'title': 'Video BunnyVault ' + videoId
            });
        });
        
        // Add keyboard navigation
        $('.bunnyvault-play-button').attr({
            'role': 'button',
            'tabindex': '0',
            'aria-label': 'Reproducir video'
        }).on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                $(this).click();
            }
        });
    }

    /**
     * Process existing videos on page
     */
    function processExistingVideos() {
        $('.bunnyvault-video-container').each(function() {
            const $container = $(this);
            
            // Add data attributes if missing
            if (!$container.data('video-id')) {
                const videoId = extractVideoIdFromSrc($container.find('iframe').attr('src'));
                if (videoId) {
                    $container.data('video-id', videoId);
                }
            }
            
            // Add play button overlay if needed
            if ($container.hasClass('bunnyvault-gallery-video') && !$container.find('.bunnyvault-video-overlay').length) {
                addPlayButtonOverlay($container);
            }
        });
    }

    /**
     * Add play button overlay
     */
    function addPlayButtonOverlay($container) {
        const $overlay = $('<div class="bunnyvault-video-overlay"><div class="bunnyvault-play-button"></div></div>');
        $container.append($overlay);
    }

    /**
     * Setup AJAX handlers for dynamic content
     */
    function setupAjaxHandlers() {
        // Handle AJAX loaded content
        $(document).ajaxComplete(function(event, xhr, settings) {
            // Re-initialize videos in new content
            setTimeout(() => {
                const $newVideos = $('.bunnyvault-video-container').not('.bunnyvault-initialized');
                if ($newVideos.length) {
                    $newVideos.addClass('bunnyvault-initialized');
                    
                    // Setup lazy loading for new videos
                    if (BunnyVaultWC.config.lazyLoad) {
                        $newVideos.each(function() {
                            const $container = $(this);
                            if (BunnyVaultWC.observers.intersection) {
                                BunnyVaultWC.observers.intersection.observe(this);
                            }
                        });
                    }
                    
                    // Setup accessibility
                    setupAccessibility();
                }
            }, 100);
        });
    }

    /**
     * Setup scroll fallback for older browsers
     */
    function setupScrollFallback() {
        $(window).on('scroll', debounce(function() {
            $('.bunnyvault-video-container.bunnyvault-lazy').each(function() {
                if (isElementVisible(this)) {
                    loadVideo($(this));
                }
            });
        }, 100));
    }

    /**
     * Utility functions
     */
    
    function getVideoId($container) {
        return $container.data('video-id') || extractVideoIdFromSrc($container.find('iframe').attr('src'));
    }
    
    function getProductId($container) {
        return $container.data('product-id') || $container.closest('[data-product-id]').data('product-id');
    }
    
    function extractVideoIdFromSrc(src) {
        if (!src) return null;
        const match = src.match(/\/embed\/([^?&\/]+)/);
        return match ? match[1] : null;
    }
    
    function getPageType() {
        if ($('body').hasClass('single-product')) return 'product';
        if ($('body').hasClass('woocommerce-shop')) return 'shop';
        if ($('body').hasClass('woocommerce-cart')) return 'cart';
        if ($('body').hasClass('woocommerce-checkout')) return 'checkout';
        return 'other';
    }
    
    function isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function trackEvent(eventName, data) {
        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_map: { dimension1: 'bunnyvault_wc' },
                ...data
            });
        }
        
        // Send to Facebook Pixel if available
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'BunnyVault_' + eventName, data);
        }
        
        // Console log for debugging
        if (window.bunnyvault_debug) {
            console.log('BunnyVault Event:', eventName, data);
        }
    }
    
    function handlePageUnload() {
        // Send final analytics
        trackEvent('page_unload', {
            videos_loaded: BunnyVaultWC.stats.videosLoaded,
            videos_played: BunnyVaultWC.stats.videosPlayed,
            total_watch_time: BunnyVaultWC.stats.totalWatchTime,
            conversions: BunnyVaultWC.stats.conversions
        });
    }
    
    function handleCartUpdate() {
        // Re-initialize any new video elements in cart
        setTimeout(processExistingVideos, 100);
    }
    
    function handleCartButtonUpdate() {
        // Track cart button updates related to video products
        trackEvent('cart_button_updated', {
            timestamp: Date.now()
        });
    }

    // Initialize when script loads
    init();

    // Expose public API
    window.BunnyVaultWC = {
        init: init,
        loadVideo: loadVideo,
        trackEvent: trackEvent,
        stats: BunnyVaultWC.stats,
        config: BunnyVaultWC.config
    };

})(jQuery);