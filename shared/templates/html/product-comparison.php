<?php
/**
 * Product Comparison Template HTML
 * 
 * Variables available:
 * - $videos: Array of video data
 * - $settings: Template settings array
 * - $template_id: Template ID string
 */

// Ensure we have video data
if (empty($videos) || !is_array($videos)) {
    return;
}

// Settings with validation
$title = isset($settings['title']) ? sanitize_text_field($settings['title']) : __('Product Comparison', 'hostreamly');
$subtitle = isset($settings['subtitle']) ? sanitize_text_field($settings['subtitle']) : __('Compare features and find the perfect product for you', 'hostreamly');
$layout = isset($settings['layout']) ? sanitize_key($settings['layout']) : 'grid';
$show_table = isset($settings['show_table']) ? (bool) $settings['show_table'] : true;
$show_features = isset($settings['show_features']) ? (bool) $settings['show_features'] : true;
$show_actions = isset($settings['show_actions']) ? (bool) $settings['show_actions'] : true;
$animation = isset($settings['animation']) ? sanitize_html_class($settings['animation']) : 'fade-in';
$featured_product = isset($settings['featured_product']) ? absint($settings['featured_product']) : 0;
$max_products = isset($settings['max_products']) ? absint($settings['max_products']) : 4;

// Limit products
$videos = array_slice($videos, 0, $max_products);

// Prepare product data
$products_data = [];
$all_features = [];

foreach ($videos as $index => $video) {
    $product_id = isset($video['product_id']) ? absint($video['product_id']) : 0;
    $product = ($product_id && function_exists('wc_get_product')) ? wc_get_product($product_id) : null;
    
    $product_data = [
        'video' => $video,
        'product' => $product,
        'is_featured' => $index == $featured_product,
        'video_url' => isset($video['url']) ? esc_url_raw($video['url']) : '',
        'poster_url' => isset($video['poster']) ? esc_url_raw($video['poster']) : (isset($video['thumbnail']) ? esc_url_raw($video['thumbnail']) : ''),
        'title' => isset($video['title']) ? sanitize_text_field($video['title']) : ($product && method_exists($product, 'get_name') ? $product->get_name() : ''),
        'description' => isset($video['description']) ? wp_kses_post($video['description']) : ($product && method_exists($product, 'get_short_description') ? $product->get_short_description() : ''),
        'price' => ($product && method_exists($product, 'get_price_html')) ? $product->get_price_html() : '',
        'regular_price' => ($product && method_exists($product, 'get_regular_price')) ? $product->get_regular_price() : '',
        'sale_price' => ($product && method_exists($product, 'get_sale_price')) ? $product->get_sale_price() : '',
        'is_on_sale' => ($product && method_exists($product, 'is_on_sale')) ? $product->is_on_sale() : false,
        'rating' => ($product && method_exists($product, 'get_average_rating')) ? $product->get_average_rating() : 0,
        'review_count' => ($product && method_exists($product, 'get_review_count')) ? $product->get_review_count() : 0,
        'url' => ($product && method_exists($product, 'get_permalink')) ? $product->get_permalink() : '#',
        'features' => []
    ];
    
    // Get product features/attributes
    if ($product && method_exists($product, 'get_attributes')) {
        $attributes = $product->get_attributes();
        if (is_array($attributes)) {
            foreach ($attributes as $attribute) {
                if (is_object($attribute) && method_exists($attribute, 'get_name')) {
                    $name = sanitize_key($attribute->get_name());
                    $value = method_exists($product, 'get_attribute') ? sanitize_text_field($product->get_attribute($attribute->get_name())) : '';
                    $product_data['features'][$name] = $value;
                    
                    if (!in_array($name, $all_features)) {
                        $all_features[] = $name;
                    }
                }
            }
        }
    }
    
    // Add video-specific features if available
    if (isset($video['features']) && is_array($video['features'])) {
        foreach ($video['features'] as $feature_name => $feature_value) {
            $product_data['features'][$feature_name] = $feature_value;
            if (!in_array($feature_name, $all_features)) {
                $all_features[] = $feature_name;
            }
        }
    }
    
    $products_data[] = $product_data;
}

// Generate unique IDs
$container_id = 'comparison-container-' . uniqid();
?>

<div class="product-comparison-container <?php echo esc_attr($animation); ?>" id="<?php echo esc_attr($container_id); ?>">
    
    <!-- Header -->
    <div class="comparison-header">
        <h2 class="comparison-title"><?php echo esc_html($title); ?></h2>
        <?php if ($subtitle): ?>
            <p class="comparison-subtitle"><?php echo esc_html($subtitle); ?></p>
        <?php endif; ?>
    </div>
    
    <!-- Comparison Grid -->
    <div class="comparison-grid">
        
        <?php foreach ($products_data as $index => $data): 
            $video_id = 'comparison-video-' . $index . '-' . uniqid();
        ?>
            
            <div class="comparison-item <?php echo $data['is_featured'] ? 'featured' : ''; ?>" 
                 <?php echo $data['is_featured'] ? 'data-badge="' . esc_attr__('Best Choice', 'hostreamly') . '"' : ''; ?>>
                
                <!-- Video Section -->
                <div class="comparison-video">
                    
                    <video 
                        id="<?php echo esc_attr($video_id); ?>"
                        class="comparison-video-element"
                        <?php echo $data['poster_url'] ? 'poster="' . esc_url($data['poster_url']) . '"' : ''; ?>
                        preload="metadata"
                        muted
                        playsinline
                    >
                        <source src="<?php echo esc_url($data['video_url']); ?>" type="video/mp4">
                        <?php esc_html_e('Your browser does not support the video tag.', 'hostreamly'); ?>
                    </video>
                    
                    <!-- Video Overlay -->
                    <div class="comparison-video-overlay" onclick="playComparisonVideo('<?php echo esc_js($video_id); ?>')">
                        <button class="comparison-play-button" aria-label="<?php esc_attr_e('Play video', 'hostreamly'); ?>"></button>
                    </div>
                    
                </div>
                
                <!-- Content -->
                <div class="comparison-content">
                    
                    <!-- Title -->
                    <h3 class="comparison-product-title"><?php echo esc_html($data['title']); ?></h3>
                    
                    <!-- Description -->
                    <?php if ($data['description']): ?>
                        <p class="comparison-product-description"><?php echo wp_kses_post($data['description']); ?></p>
                    <?php endif; ?>
                    
                    <!-- Price -->
                    <?php if ($data['price']): ?>
                        <div class="comparison-price">
                            <?php if ($data['is_on_sale'] && $data['regular_price'] && function_exists('wc_price')): ?>
                                <span class="original-price"><?php echo wp_kses_post(wc_price($data['regular_price'])); ?></span>
                            <?php endif; ?>
                            <span class="price"><?php echo wp_kses_post($data['price']); ?></span>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Rating -->
                    <?php if ($data['rating'] > 0): ?>
                        <div class="comparison-rating">
                            <div class="stars"><?php echo function_exists('wc_get_rating_html') ? wp_kses_post(wc_get_rating_html($data['rating'])) : ''; ?></div>
                            <span class="rating-text">
                                <?php printf(
                                    _n('%s review', '%s reviews', absint($data['review_count']), 'hostreamly'),
                                    function_exists('number_format_i18n') ? number_format_i18n(absint($data['review_count'])) : absint($data['review_count'])
                                ); ?>
                            </span>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Key Features -->
                    <?php if ($show_features && !empty($data['features'])): ?>
                        <div class="comparison-features">
                            <h4 class="comparison-features-title"><?php esc_html_e('Key Features', 'hostreamly'); ?></h4>
                            <ul class="comparison-features-list">
                                <?php 
                                $feature_count = 0;
                                foreach ($data['features'] as $feature_name => $feature_value): 
                                    if ($feature_count >= 5) break; // Limit to 5 features in grid view
                                    $feature_count++;
                                ?>
                                    <li>
                                        <span class="feature-name"><?php echo esc_html(ucfirst(str_replace('_', ' ', $feature_name))); ?></span>
                                        <span class="feature-value">
                                            <?php 
                                            if (is_bool($feature_value)) {
                                                echo $feature_value ? '<span class="feature-check">✓</span>' : '<span class="feature-cross">✗</span>';
                                            } else {
                                                echo esc_html($feature_value);
                                            }
                                            ?>
                                        </span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Actions -->
                    <?php if ($show_actions): ?>
                        <div class="comparison-actions">
                            
                            <!-- Add to Cart -->
                            <?php if ($data['product'] && is_object($data['product'])): ?>
                                <?php if (method_exists($data['product'], 'is_type') && $data['product']->is_type('simple')): ?>
                                    <form class="cart" method="post" enctype="multipart/form-data">
                                        <?php wp_nonce_field('add_to_cart_nonce', 'add_to_cart_nonce'); ?>
                                        <input type="hidden" name="add-to-cart" value="<?php echo method_exists($data['product'], 'get_id') ? esc_attr($data['product']->get_id()) : ''; ?>">
                                        <button type="submit" class="comparison-add-to-cart" data-product-id="<?php echo method_exists($data['product'], 'get_id') ? esc_attr($data['product']->get_id()) : ''; ?>">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                            </svg>
                                            <?php echo method_exists($data['product'], 'single_add_to_cart_text') ? esc_html($data['product']->single_add_to_cart_text()) : esc_html__('Add to Cart', 'hostreamly'); ?>
                                        </button>
                                    </form>
                                <?php else: ?>
                                    <a href="<?php echo esc_url($data['url']); ?>" class="comparison-add-to-cart">
                                        <?php esc_html_e('View Product', 'hostreamly'); ?>
                                    </a>
                                <?php endif; ?>
                            <?php endif; ?>
                            
                            <!-- Secondary Actions -->
                            <div class="comparison-secondary-actions">
                                
                                <!-- Wishlist -->
                                <button onclick="addToWishlist(<?php echo esc_js(($data['product'] && method_exists($data['product'], 'get_id')) ? $data['product']->get_id() : 0); ?>)" title="<?php esc_attr_e('Add to Wishlist', 'hostreamly'); ?>">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                    <?php esc_html_e('Wishlist', 'hostreamly'); ?>
                                </button>
                                
                                <!-- Compare -->
                                <button onclick="addToCompare(<?php echo esc_js(($data['product'] && method_exists($data['product'], 'get_id')) ? $data['product']->get_id() : 0); ?>)" title="<?php esc_attr_e('Add to Compare', 'hostreamly'); ?>">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                                    </svg>
                                    <?php esc_html_e('Compare', 'hostreamly'); ?>
                                </button>
                                
                            </div>
                            
                        </div>
                    <?php endif; ?>
                    
                </div>
                
            </div>
            
        <?php endforeach; ?>
        
    </div>
    
    <!-- Detailed Comparison Table -->
    <?php if ($show_table && !empty($all_features)): ?>
        <div class="comparison-table-container">
            <table class="comparison-table">
                
                <thead>
                    <tr>
                        <th class="feature-name"><?php esc_html_e('Features', 'hostreamly'); ?></th>
                        <?php foreach ($products_data as $data): ?>
                            <th><?php echo esc_html($data['title']); ?></th>
                        <?php endforeach; ?>
                    </tr>
                </thead>
                
                <tbody>
                    
                    <!-- Price Row -->
                    <tr>
                        <td class="feature-name"><?php esc_html_e('Price', 'hostreamly'); ?></td>
                        <?php foreach ($products_data as $data): ?>
                            <td>
                                <?php if ($data['price']): ?>
                                    <?php echo wp_kses_post($data['price']); ?>
                                <?php else: ?>
                                    <span class="feature-unavailable">-</span>
                                <?php endif; ?>
                            </td>
                        <?php endforeach; ?>
                    </tr>
                    
                    <!-- Rating Row -->
                    <tr>
                        <td class="feature-name"><?php esc_html_e('Rating', 'hostreamly'); ?></td>
                        <?php foreach ($products_data as $data): ?>
                            <td>
                                <?php if ($data['rating'] > 0): ?>
                                    <?php echo function_exists('wc_get_rating_html') ? wp_kses_post(wc_get_rating_html($data['rating'])) : ''; ?>
                                    <small>(<?php echo esc_html(absint($data['review_count'])); ?>)</small>
                                <?php else: ?>
                                    <span class="feature-unavailable">-</span>
                                <?php endif; ?>
                            </td>
                        <?php endforeach; ?>
                    </tr>
                    
                    <!-- Feature Rows -->
                    <?php foreach ($all_features as $feature_name): ?>
                        <tr>
                            <td class="feature-name"><?php echo esc_html(ucfirst(str_replace('_', ' ', $feature_name))); ?></td>
                            <?php foreach ($products_data as $data): ?>
                                <td>
                                    <?php if (isset($data['features'][$feature_name])): ?>
                                        <?php 
                                        $feature_value = $data['features'][$feature_name];
                                        if (is_bool($feature_value)): 
                                        ?>
                                            <span class="<?php echo $feature_value ? 'feature-available' : 'feature-unavailable'; ?>">
                                                <?php echo $feature_value ? '✓' : '✗'; ?>
                                            </span>
                                        <?php else: ?>
                                            <?php echo esc_html($feature_value); ?>
                                        <?php endif; ?>
                                    <?php else: ?>
                                        <span class="feature-unavailable">-</span>
                                    <?php endif; ?>
                                </td>
                            <?php endforeach; ?>
                        </tr>
                    <?php endforeach; ?>
                    
                </tbody>
                
            </table>
        </div>
    <?php endif; ?>
    
</div>

<script>
// Comparison video functionality
function playComparisonVideo(videoId) {
    const video = document.getElementById(videoId);
    const overlay = video.parentElement.querySelector('.comparison-video-overlay');
    
    if (video) {
        // Pause all other videos
        const allVideos = document.querySelectorAll('.comparison-video-element');
        allVideos.forEach(v => {
            if (v.id !== videoId && !v.paused) {
                v.pause();
                const otherOverlay = v.parentElement.querySelector('.comparison-video-overlay');
                if (otherOverlay) {
                    otherOverlay.style.opacity = '';
                }
            }
        });
        
        video.play().then(() => {
            if (overlay) {
                overlay.style.opacity = '0';
            }
        }).catch(error => {
            console.error('Error playing video:', error);
        });
        
        // Show overlay when video ends
        video.addEventListener('ended', function() {
            if (overlay) {
                overlay.style.opacity = '';
            }
        });
        
        // Show overlay when video is paused
        video.addEventListener('pause', function() {
            if (overlay && video.currentTime < video.duration) {
                overlay.style.opacity = '';
            }
        });
    }
}

// Wishlist functionality
function addToWishlist(productId) {
    if (!productId || !Number.isInteger(Number(productId))) return;
    
    if (typeof wc_add_to_cart_params !== 'undefined' && wc_add_to_cart_params.ajax_url) {
        jQuery.post(wc_add_to_cart_params.ajax_url, {
            action: 'hostreamly_add_to_wishlist',
            product_id: parseInt(productId, 10),
            nonce: <?php echo wp_json_encode(wp_create_nonce('hostreamly_nonce')); ?>
        }, function(response) {
            if (response && response.success) {
                alert(<?php echo wp_json_encode(__('Added to wishlist!', 'hostreamly')); ?>);
            } else {
                alert(<?php echo wp_json_encode(__('Error adding to wishlist.', 'hostreamly')); ?>);
            }
        }).fail(function() {
            alert(<?php echo wp_json_encode(__('Network error occurred.', 'hostreamly')); ?>);
        });
    }
}

// Compare functionality
function addToCompare(productId) {
    if (!productId || !Number.isInteger(Number(productId))) return;
    
    if (typeof wc_add_to_cart_params !== 'undefined' && wc_add_to_cart_params.ajax_url) {
        jQuery.post(wc_add_to_cart_params.ajax_url, {
            action: 'hostreamly_add_to_compare',
            product_id: parseInt(productId, 10),
            nonce: <?php echo wp_json_encode(wp_create_nonce('hostreamly_nonce')); ?>
        }, function(response) {
            if (response && response.success) {
                alert(<?php echo wp_json_encode(__('Added to compare!', 'hostreamly')); ?>);
            } else {
                alert(<?php echo wp_json_encode(__('Error adding to compare.', 'hostreamly')); ?>);
            }
        }).fail(function() {
            alert(<?php echo wp_json_encode(__('Network error occurred.', 'hostreamly')); ?>);
        });
    }
}

// Initialize comparison on page load
document.addEventListener('DOMContentLoaded', function() {
    const videos = document.querySelectorAll('.comparison-video-element');
    
    videos.forEach(video => {
        if (typeof hostreamlyAnalytics !== 'undefined' && hostreamlyAnalytics.trackVideo) {
            hostreamlyAnalytics.trackVideo(video, {
                template: <?php echo wp_json_encode(sanitize_key($template_id ?? '')); ?>,
                video_id: video.id || '',
                comparison_mode: true
            });
        }
    });
    
    // Add intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    if (video.dataset.src) {
                        video.src = video.dataset.src;
                        video.load();
                        delete video.dataset.src;
                        videoObserver.unobserve(video);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        videos.forEach(video => {
            if (video.dataset.src) {
                videoObserver.observe(video);
            }
        });
    }
});
</script>