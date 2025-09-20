<?php
/**
 * Product Hero Template HTML
 * 
 * Variables available:
 * - $video: Video data array
 * - $settings: Template settings array
 * - $template_id: Template ID string
 */

// Ensure we have video data
if (empty($video) || !is_array($video)) {
    echo '<div class="hostreamly-error">Invalid video data provided.</div>';
    return;
}

// Get product data if available with validation
$product_id = isset($video['product_id']) ? intval($video['product_id']) : 0;
$product = null;
if ($product_id > 0 && function_exists('wc_get_product')) {
    $product = wc_get_product($product_id);
    if (!$product || !$product->exists()) {
        $product = null;
    }
}

// Prepare video URL and poster with validation
$video_url = isset($video['url']) ? esc_url($video['url']) : '';
if (empty($video_url) || !filter_var($video_url, FILTER_VALIDATE_URL)) {
    echo '<div class="hostreamly-error">Invalid video URL provided.</div>';
    return;
}

$poster_url = '';
if (isset($video['poster']) && !empty($video['poster'])) {
    $poster_url = esc_url($video['poster']);
} elseif (isset($video['thumbnail']) && !empty($video['thumbnail'])) {
    $poster_url = esc_url($video['thumbnail']);
}

$video_title = '';
if (isset($video['title']) && !empty($video['title'])) {
    $video_title = sanitize_text_field($video['title']);
} elseif ($product) {
    $video_title = $product->get_name();
}

$video_description = '';
if (isset($video['description']) && !empty($video['description'])) {
    $video_description = wp_kses_post($video['description']);
} elseif ($product) {
    $video_description = $product->get_short_description();
}

// Product information
$product_price = $product ? $product->get_price_html() : '';
$product_regular_price = $product ? $product->get_regular_price() : '';
$product_sale_price = $product ? $product->get_sale_price() : '';
$product_url = $product ? $product->get_permalink() : '#';
$product_rating = $product ? $product->get_average_rating() : 0;
$product_review_count = $product ? $product->get_review_count() : 0;
$is_on_sale = $product ? $product->is_on_sale() : false;
$is_featured = $product ? $product->is_featured() : false;
$is_new = $product ? (time() - strtotime($product->get_date_created()) < 30 * 24 * 60 * 60) : false;

// Calculate discount percentage
$discount_percentage = 0;
if ($is_on_sale && $product_regular_price && $product_sale_price && $product_regular_price > 0) {
    $discount_amount = $product_regular_price - $product_sale_price;
    if ($discount_amount > 0) {
        $discount_percentage = round(($discount_amount / $product_regular_price) * 100);
    }
}

// Settings
$overlay_type = isset($settings['overlay_type']) ? sanitize_text_field($settings['overlay_type']) : 'gradient';
$content_alignment = isset($settings['content_alignment']) ? sanitize_text_field($settings['content_alignment']) : 'center';
$show_badge = isset($settings['show_badge']) ? (bool) $settings['show_badge'] : true;
$show_features = isset($settings['show_features']) ? (bool) $settings['show_features'] : true;
$show_rating = isset($settings['show_rating']) ? (bool) $settings['show_rating'] : true;
$show_scroll_indicator = isset($settings['show_scroll_indicator']) ? (bool) $settings['show_scroll_indicator'] : true;
$show_video_controls = isset($settings['show_video_controls']) ? (bool) $settings['show_video_controls'] : true;
$autoplay = isset($settings['autoplay']) ? (bool) $settings['autoplay'] : true;
$loop = isset($settings['loop']) ? (bool) $settings['loop'] : true;
$muted = isset($settings['muted']) ? (bool) $settings['muted'] : true;
$primary_action_text = isset($settings['primary_action_text']) ? sanitize_text_field($settings['primary_action_text']) : __('Buy Now', 'hostreamly');
$secondary_action_text = isset($settings['secondary_action_text']) ? sanitize_text_field($settings['secondary_action_text']) : __('Learn More', 'hostreamly');
$primary_action_url = isset($settings['primary_action_url']) ? esc_url($settings['primary_action_url']) : $product_url;
$secondary_action_url = isset($settings['secondary_action_url']) ? esc_url($settings['secondary_action_url']) : '#';

// Product features
$features = [];
if ($product) {
    $product_features = $product->get_attribute('features');
    if ($product_features) {
        $features = is_string($product_features) ? explode('|', $product_features) : (array) $product_features;
    }
}
if (empty($features) && isset($video['features'])) {
    $features = is_array($video['features']) ? $video['features'] : explode('|', (string) $video['features']);
}
if (empty($features)) {
    $features = [
        __('Premium Quality', 'hostreamly'),
        __('Fast Shipping', 'hostreamly'),
        __('Money Back Guarantee', 'hostreamly')
    ];
}
// Sanitize features
$features = array_filter(array_map('sanitize_text_field', (array) $features));

// Badge text
$badge_text = '';
$badge_class = '';
if ($show_badge) {
    if ($is_on_sale) {
        $badge_text = __('Sale', 'hostreamly');
        $badge_class = 'sale';
    } elseif ($is_new) {
        $badge_text = __('New', 'hostreamly');
        $badge_class = 'new';
    } elseif ($is_featured) {
        $badge_text = __('Featured', 'hostreamly');
        $badge_class = 'featured';
    }
}

// Generate unique IDs
$video_id = 'hero-video-' . uniqid();
$container_id = 'hero-container-' . uniqid();
?>

<div class="product-hero-container" id="<?php echo esc_attr($container_id); ?>">
    
    <!-- Background Video -->
    <video 
        id="<?php echo esc_attr($video_id); ?>"
        class="hero-background-video"
        <?php echo $poster_url ? 'poster="' . esc_url($poster_url) . '"' : ''; ?>
        <?php echo $autoplay ? 'autoplay' : ''; ?>
        <?php echo $loop ? 'loop' : ''; ?>
        <?php echo $muted ? 'muted' : ''; ?>
        preload="metadata"
        playsinline
    >
        <source src="<?php echo esc_url($video_url); ?>" type="video/mp4">
        <?php esc_html_e('Your browser does not support the video tag.', 'hostreamly'); ?>
    </video>
    
    <!-- Overlay -->
    <div class="hero-overlay <?php echo esc_attr($overlay_type); ?>"></div>
    
    <!-- Content -->
    <div class="hero-content <?php echo esc_attr($content_alignment); ?>">
        
        <!-- Badge -->
        <?php if ($badge_text): ?>
            <div class="hero-badge <?php echo esc_attr($badge_class); ?>">
                <?php echo esc_html($badge_text); ?>
            </div>
        <?php endif; ?>
        
        <!-- Title -->
        <?php if ($video_title): ?>
            <h1 class="hero-title"><?php echo esc_html($video_title); ?></h1>
        <?php endif; ?>
        
        <!-- Subtitle -->
        <?php if ($video_description): ?>
            <p class="hero-subtitle"><?php echo wp_kses_post($video_description); ?></p>
        <?php endif; ?>
        
        <!-- Price -->
        <?php if ($product_price): ?>
            <div class="hero-price">
                <?php if ($is_on_sale && $product_regular_price && function_exists('wc_price')): ?>
                    <span class="original-price"><?php echo wc_price($product_regular_price); ?></span>
                <?php endif; ?>
                <span class="price"><?php echo wp_kses_post($product_price); ?></span>
                <?php if ($discount_percentage > 0): ?>
                    <span class="discount">-<?php echo esc_html($discount_percentage); ?>%</span>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <!-- Features -->
        <?php if ($show_features && !empty($features)): ?>
            <div class="hero-features">
                <ul class="hero-features-list">
                    <?php foreach (array_slice($features, 0, 3) as $feature): // Limit to 3 features ?>
                        <li><?php echo esc_html(trim($feature)); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <!-- Actions -->
        <div class="hero-actions">
            
            <!-- Primary Action -->
            <a href="<?php echo esc_url($primary_action_url); ?>" class="hero-primary-action">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                <?php echo esc_html($primary_action_text); ?>
            </a>
            
            <!-- Secondary Action -->
            <?php if ($secondary_action_url !== '#'): ?>
                <a href="<?php echo esc_url($secondary_action_url); ?>" class="hero-secondary-action">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <?php echo esc_html($secondary_action_text); ?>
                </a>
            <?php endif; ?>
            
        </div>
        
        <!-- Rating -->
        <?php if ($show_rating && $product_rating > 0 && function_exists('wc_get_rating_html')): ?>
            <div class="hero-rating">
                <div class="stars"><?php echo wc_get_rating_html($product_rating); ?></div>
                <div class="rating-text">
                    <?php 
                    if (function_exists('number_format_i18n')) {
                        printf(
                            _n('%s review', '%s reviews', $product_review_count, 'hostreamly'),
                            number_format_i18n($product_review_count)
                        );
                    } else {
                        printf(
                            _n('%s review', '%s reviews', $product_review_count, 'hostreamly'),
                            number_format($product_review_count)
                        );
                    }
                    ?>
                </div>
            </div>
        <?php endif; ?>
        
    </div>
    
    <!-- Scroll Indicator -->
    <?php if ($show_scroll_indicator): ?>
        <div class="hero-scroll-indicator">
            <button onclick="scrollToContent()" aria-label="<?php esc_attr_e('Scroll to content', 'hostreamly'); ?>">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                </svg>
            </button>
        </div>
    <?php endif; ?>
    
    <!-- Video Controls -->
    <?php if ($show_video_controls): ?>
        <div class="hero-video-controls">
            
            <!-- Play/Pause -->
            <button class="hero-video-control" onclick="toggleHeroVideo('<?php echo esc_js($video_id); ?>')" id="play-pause-<?php echo esc_attr($video_id); ?>" aria-label="<?php esc_attr_e('Play/Pause video', 'hostreamly'); ?>">
                <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            </button>
            
            <!-- Mute/Unmute -->
            <button class="hero-video-control" onclick="toggleHeroVideoMute('<?php echo esc_js($video_id); ?>')" id="mute-unmute-<?php echo esc_attr($video_id); ?>" aria-label="<?php esc_attr_e('Mute/Unmute video', 'hostreamly'); ?>">
                <svg class="volume-on-icon" viewBox="0 0 24 24" fill="currentColor" <?php echo $muted ? 'style="display: none;"' : ''; ?>>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                <svg class="volume-off-icon" viewBox="0 0 24 24" fill="currentColor" <?php echo !$muted ? 'style="display: none;"' : ''; ?>>
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
            </button>
            
        </div>
    <?php endif; ?>
    
</div>

<script>
// Hero video functionality
let heroVideoPlaying = <?php echo $autoplay ? 'true' : 'false'; ?>;
let heroVideoMuted = <?php echo $muted ? 'true' : 'false'; ?>;

// Toggle play/pause
function toggleHeroVideo(videoId) {
    const video = document.getElementById(videoId);
    const playPauseBtn = document.getElementById('play-pause-' + videoId);
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');
    
    if (video) {
        if (video.paused) {
            video.play().then(() => {
                heroVideoPlaying = true;
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            }).catch(error => {
                console.error('Error playing video:', error);
            });
        } else {
            video.pause();
            heroVideoPlaying = false;
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
}

// Toggle mute/unmute
function toggleHeroVideoMute(videoId) {
    const video = document.getElementById(videoId);
    const muteBtn = document.getElementById('mute-unmute-' + videoId);
    const volumeOnIcon = muteBtn.querySelector('.volume-on-icon');
    const volumeOffIcon = muteBtn.querySelector('.volume-off-icon');
    
    if (video) {
        video.muted = !video.muted;
        heroVideoMuted = video.muted;
        
        if (video.muted) {
            volumeOnIcon.style.display = 'none';
            volumeOffIcon.style.display = 'block';
        } else {
            volumeOnIcon.style.display = 'block';
            volumeOffIcon.style.display = 'none';
        }
    }
}

// Scroll to content
function scrollToContent() {
    const heroContainer = document.getElementById('<?php echo esc_js($container_id); ?>');
    const nextElement = heroContainer.nextElementSibling;
    
    if (nextElement) {
        nextElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        // Scroll down by viewport height
        window.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    }
}

// Handle video events
function setupHeroVideoEvents(videoId) {
    const video = document.getElementById(videoId);
    const playPauseBtn = document.getElementById('play-pause-' + videoId);
    
    if (video && playPauseBtn) {
        const playIcon = playPauseBtn.querySelector('.play-icon');
        const pauseIcon = playPauseBtn.querySelector('.pause-icon');
        
        // Update button state based on video state
        video.addEventListener('play', function() {
            heroVideoPlaying = true;
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        });
        
        video.addEventListener('pause', function() {
            heroVideoPlaying = false;
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        });
        
        video.addEventListener('ended', function() {
            heroVideoPlaying = false;
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        });
        
        // Handle autoplay failure
        video.addEventListener('loadstart', function() {
            if (<?php echo $autoplay ? 'true' : 'false'; ?>) {
                video.play().catch(error => {
            
                    heroVideoPlaying = false;
                    playIcon.style.display = 'block';
                    pauseIcon.style.display = 'none';
                });
            }
        });
    }
}

// Keyboard navigation
function setupHeroKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        const video = document.getElementById('<?php echo esc_js($video_id); ?>');
        
        if (!video) return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                toggleHeroVideo('<?php echo esc_js($video_id); ?>');
                break;
            case 'KeyM':
                e.preventDefault();
                toggleHeroVideoMute('<?php echo esc_js($video_id); ?>');
                break;
            case 'ArrowDown':
                if (e.target === document.body) {
                    e.preventDefault();
                    scrollToContent();
                }
                break;
        }
    });
}

// Intersection Observer for performance
function setupHeroIntersectionObserver() {
    if ('IntersectionObserver' in window) {
        const video = document.getElementById('<?php echo esc_js($video_id); ?>');
        
        if (video) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Video is visible, ensure it's playing if it should be
                        if (<?php echo $autoplay ? 'true' : 'false'; ?> && video.paused) {
                            video.play().catch(error => {
                    
                            });
                        }
                    } else {
                        // Video is not visible, pause it to save resources
                        if (!video.paused) {
                            video.pause();
                        }
                    }
                });
            }, {
                threshold: 0.5
            });
            
            observer.observe(video);
        }
    }
}

// Initialize hero on page load
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('<?php echo esc_js($video_id); ?>');
    
    if (video) {
        // Setup video events
        setupHeroVideoEvents('<?php echo esc_js($video_id); ?>');
        
        // Setup keyboard navigation
        setupHeroKeyboardNavigation();
        
        // Setup intersection observer
        setupHeroIntersectionObserver();
        
        // Analytics tracking
        if (typeof hostreamlyAnalytics !== 'undefined') {
            hostreamlyAnalytics.trackVideo(video, {
                product_id: <?php echo wp_json_encode($product_id); ?>,
                template: <?php echo wp_json_encode($template_id); ?>,
                video_id: <?php echo wp_json_encode(isset($video['id']) ? $video['id'] : ''); ?>,
                hero_mode: true
            });
        }
    }
    
    // Smooth scroll polyfill for older browsers
    if (!('scrollBehavior' in document.documentElement.style)) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/iamdustan/smoothscroll@1.4.10/src/smoothscroll.js';
        document.head.appendChild(script);
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    // Adjust video aspect ratio if needed
    const video = document.getElementById('<?php echo esc_js($video_id); ?>');
    if (video) {
        // Force video to maintain aspect ratio
        video.style.objectFit = 'cover';
    }
});
</script>

<style>
/* Inline critical styles for hero */
#<?php echo esc_attr($container_id); ?> {
    position: relative;
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #000;
}

#<?php echo esc_attr($video_id); ?> {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
}
</style>