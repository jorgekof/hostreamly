<?php
/**
 * Product Showcase Template HTML
 * 
 * Variables available:
 * - $video: Video data array
 * - $settings: Template settings array
 * - $template_id: Template ID string
 */

// Ensure we have video data
if (empty($video)) {
    return;
}

// Get product data if available with validation
$product_id = isset($video['product_id']) ? intval($video['product_id']) : 0;
$product = null;
if ($product_id > 0 && function_exists('wc_get_product')) {
    $product = wc_get_product($product_id);
    if (!$product || !$product->exists() || $product->get_status() !== 'publish') {
        $product = null;
    }
}

// Prepare video URL and poster
$video_url = isset($video['url']) && filter_var($video['url'], FILTER_VALIDATE_URL) ? esc_url($video['url']) : '';
$poster_url = '';
if (isset($video['poster']) && filter_var($video['poster'], FILTER_VALIDATE_URL)) {
    $poster_url = esc_url($video['poster']);
} elseif (isset($video['thumbnail']) && filter_var($video['thumbnail'], FILTER_VALIDATE_URL)) {
    $poster_url = esc_url($video['thumbnail']);
}
$video_title = isset($video['title']) ? sanitize_text_field($video['title']) : ($product && method_exists($product, 'get_name') ? $product->get_name() : '');
$video_description = isset($video['description']) ? wp_kses_post($video['description']) : ($product && method_exists($product, 'get_short_description') ? $product->get_short_description() : '');

// Product information
$product_price = $product && method_exists($product, 'get_price_html') ? $product->get_price_html() : '';
$product_url = $product && method_exists($product, 'get_permalink') ? $product->get_permalink() : '#';
$product_rating = $product && method_exists($product, 'get_average_rating') ? floatval($product->get_average_rating()) : 0;
$is_on_sale = $product && method_exists($product, 'is_on_sale') ? $product->is_on_sale() : false;
$is_featured = $product && method_exists($product, 'is_featured') ? $product->is_featured() : false;
$is_new = false;
if ($product && method_exists($product, 'get_date_created')) {
    $created_date = $product->get_date_created();
    if ($created_date && method_exists($created_date, 'getTimestamp')) {
        $is_new = $created_date->getTimestamp() > (time() - 30 * DAY_IN_SECONDS);
    }
}

// Settings
$show_title = isset($settings['show_title']) ? (bool) $settings['show_title'] : true;
$show_price = isset($settings['show_price']) ? (bool) $settings['show_price'] : true;
$show_description = isset($settings['show_description']) ? (bool) $settings['show_description'] : true;
$show_add_to_cart = isset($settings['show_add_to_cart']) ? (bool) $settings['show_add_to_cart'] : true;
$autoplay = isset($settings['autoplay']) ? (bool) $settings['autoplay'] : false;
$controls = isset($settings['controls']) ? (bool) $settings['controls'] : true;
$loop = isset($settings['loop']) ? (bool) $settings['loop'] : true;
$muted = isset($settings['muted']) ? (bool) $settings['muted'] : true;
$overlay_position = isset($settings['overlay_position']) ? sanitize_text_field($settings['overlay_position']) : 'bottom-left';
$overlay_style = isset($settings['overlay_style']) ? sanitize_text_field($settings['overlay_style']) : 'gradient';
$animation = isset($settings['animation']) ? sanitize_text_field($settings['animation']) : 'fade-in';

// Generate unique IDs
$video_id = 'video-' . uniqid();
$container_id = 'container-' . uniqid();
?>

<div class="product-showcase-container <?php echo esc_attr($animation); ?>" id="<?php echo esc_attr($container_id); ?>">
    
    <!-- Product Badge -->
    <?php if ($is_on_sale || $is_featured || $is_new): ?>
        <div class="product-badge <?php 
            echo $is_on_sale ? 'sale' : ($is_featured ? 'featured' : 'new'); 
        ?>">
            <?php 
            if ($is_on_sale) {
                echo esc_html__('Sale', 'hostreamly');
            } elseif ($is_featured) {
                echo esc_html__('Featured', 'hostreamly');
            } else {
                echo esc_html__('New', 'hostreamly');
            }
            ?>
        </div>
    <?php endif; ?>
    
    <!-- Video Container -->
    <div class="video-container">
        
        <!-- Video Element -->
        <video 
            id="<?php echo esc_attr($video_id); ?>"
            class="video-player"
            <?php echo $poster_url ? 'poster="' . esc_url($poster_url) . '"' : ''; ?>
            <?php echo $autoplay ? 'autoplay' : ''; ?>
            <?php echo $controls ? 'controls' : ''; ?>
            <?php echo $loop ? 'loop' : ''; ?>
            <?php echo $muted ? 'muted' : ''; ?>
            preload="metadata"
            playsinline
        >
            <source src="<?php echo esc_url($video_url); ?>" type="video/mp4">
            <?php esc_html_e('Your browser does not support the video tag.', 'hostreamly'); ?>
        </video>
        
        <!-- Play Button Overlay -->
        <?php if (!$autoplay): ?>
            <button class="play-button" onclick="playVideo('<?php echo esc_js($video_id); ?>')" aria-label="<?php esc_attr_e('Play video', 'hostreamly'); ?>"></button>
        <?php endif; ?>
        
        <!-- Content Overlay -->
        <div class="video-overlay <?php echo esc_attr($overlay_style); ?> <?php echo esc_attr($overlay_position); ?>">
            
            <!-- Product Title -->
            <?php if ($show_title && $video_title): ?>
                <h3 class="product-title"><?php echo esc_html($video_title); ?></h3>
            <?php endif; ?>
            
            <!-- Product Price -->
            <?php if ($show_price && $product_price): ?>
                <div class="product-price">
                    <?php if ($is_on_sale && $product && method_exists($product, 'get_regular_price_html')): ?>
                        <span class="original-price"><?php echo $product->get_regular_price_html(); ?></span>
                    <?php endif; ?>
                    <?php echo wp_kses_post($product_price); ?>
                </div>
            <?php endif; ?>
            
            <!-- Product Rating -->
            <?php if ($product_rating > 0 && function_exists('wc_get_rating_html')): ?>
                <div class="product-rating">
                    <?php echo wc_get_rating_html($product_rating); ?>
                </div>
            <?php endif; ?>
            
            <!-- Product Description -->
            <?php if ($show_description && $video_description): ?>
                <p class="product-description"><?php echo wp_kses_post($video_description); ?></p>
            <?php endif; ?>
            
            <!-- Product Actions -->
            <?php if ($show_add_to_cart || $product): ?>
                <div class="product-actions">
                    
                    <!-- Add to Cart Button -->
                    <?php if ($show_add_to_cart && $product): ?>
                        <?php if (method_exists($product, 'is_type') && $product->is_type('simple')): ?>
                            <form class="cart" method="post" enctype="multipart/form-data">
                                <?php wp_nonce_field('add_to_cart_nonce', 'add_to_cart_nonce'); ?>
                                <input type="hidden" name="add-to-cart" value="<?php echo esc_attr($product->get_id()); ?>">
                                <button type="submit" class="add-to-cart-btn" data-product-id="<?php echo esc_attr($product->get_id()); ?>">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                    <?php echo esc_html(method_exists($product, 'single_add_to_cart_text') ? $product->single_add_to_cart_text() : __('Add to Cart', 'hostreamly')); ?>
                                </button>
                            </form>
                        <?php else: ?>
                            <a href="<?php echo esc_url($product_url); ?>" class="add-to-cart-btn">
                                <?php esc_html_e('View Product', 'hostreamly'); ?>
                            </a>
                        <?php endif; ?>
                    <?php endif; ?>
                    
                    <!-- Quick View Button -->
                    <?php if ($product && method_exists($product, 'get_id')): ?>
                        <button class="quick-view-btn" onclick="openQuickView(<?php echo esc_js($product->get_id()); ?>)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                            <?php esc_html_e('Quick View', 'hostreamly'); ?>
                        </button>
                    <?php endif; ?>
                    
                </div>
            <?php endif; ?>
            
        </div>
        
    </div>
    
</div>

<script>
// Play video function
function playVideo(videoId) {
    const video = document.getElementById(videoId);
    const playButton = video.parentElement.querySelector('.play-button');
    
    if (video) {
        video.play();
        if (playButton) {
            playButton.style.display = 'none';
        }
        
        // Show play button when video ends
        video.addEventListener('ended', function() {
            if (playButton) {
                playButton.style.display = 'flex';
            }
        });
        
        // Hide play button when video starts playing
        video.addEventListener('play', function() {
            if (playButton) {
                playButton.style.display = 'none';
            }
        });
        
        // Show play button when video is paused
        video.addEventListener('pause', function() {
            if (playButton && video.currentTime < video.duration) {
                playButton.style.display = 'flex';
            }
        });
    }
}

// Quick view function
function openQuickView(productId) {
    // Validate product ID
    if (!productId || isNaN(productId)) {
        console.error('Invalid product ID');
        return;
    }
    
    // Trigger WooCommerce quick view if available
    if (typeof wc_add_to_cart_params !== 'undefined' && typeof jQuery !== 'undefined') {
        // Use WooCommerce AJAX to load product quick view
        jQuery.post(wc_add_to_cart_params.ajax_url, {
            action: 'hostreamly_quick_view',
            product_id: parseInt(productId),
            nonce: <?php echo wp_json_encode(wp_create_nonce('hostreamly_nonce')); ?>
        }, function(response) {
            if (response && response.success && response.data && response.data.html) {
                // Create and show modal
                showQuickViewModal(response.data.html);
            } else {
                // Fallback on AJAX failure
                window.location.href = <?php echo wp_json_encode($product_url); ?>;
            }
        }).fail(function() {
            // Fallback on AJAX error
            window.location.href = <?php echo wp_json_encode($product_url); ?>;
        });
    } else {
        // Fallback: redirect to product page
        window.location.href = <?php echo wp_json_encode($product_url); ?>;
    }
}

// Show quick view modal
function showQuickViewModal(html) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'hostreamly-quick-view-overlay';
    overlay.innerHTML = `
        <div class="hostreamly-quick-view-modal">
            <button class="hostreamly-quick-view-close">&times;</button>
            <div class="hostreamly-quick-view-content">
                ${html}
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Close modal events
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target.classList.contains('hostreamly-quick-view-close')) {
            closeQuickViewModal(overlay);
        }
    });
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeQuickViewModal(overlay);
        }
    });
}

// Close quick view modal
function closeQuickViewModal(overlay) {
    document.body.removeChild(overlay);
    document.body.style.overflow = '';
}

// Initialize video analytics tracking
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById(<?php echo wp_json_encode($video_id); ?>);
    if (video && typeof hostrealmyAnalytics !== 'undefined') {
        hostrealmyAnalytics.trackVideo(video, {
            product_id: <?php echo wp_json_encode($product_id); ?>,
            template: <?php echo wp_json_encode($template_id); ?>,
            video_id: <?php echo wp_json_encode(isset($video['id']) ? $video['id'] : ''); ?>
        });
    }
});
</script>

<style>
/* Quick View Modal Styles */
.hostreamly-quick-view-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
}

.hostreamly-quick-view-modal {
    background: #fff;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    position: relative;
    animation: scaleIn 0.3s ease;
}

.hostreamly-quick-view-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    z-index: 1;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.1);
    transition: background 0.2s ease;
}

.hostreamly-quick-view-close:hover {
    background: rgba(0, 0, 0, 0.2);
}

.hostreamly-quick-view-content {
    padding: 24px;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from { 
        opacity: 0;
        transform: scale(0.9);
    }
    to { 
        opacity: 1;
        transform: scale(1);
    }
}
</style>