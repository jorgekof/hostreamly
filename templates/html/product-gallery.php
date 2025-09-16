<?php
/**
 * Product Gallery Template HTML
 * 
 * Variables available:
 * - $video: Video data array (contains multiple videos)
 * - $settings: Template settings array
 * - $template_id: Template ID string
 */

// Ensure we have video data
if (empty($video) || !is_array($video)) {
    return;
}

// Settings with validation
$columns = isset($settings['columns']) ? absint($settings['columns']) : 3;
$show_thumbnails = isset($settings['show_thumbnails']) ? (bool) $settings['show_thumbnails'] : true;
$show_title = isset($settings['show_title']) ? (bool) $settings['show_title'] : true;
$show_price = isset($settings['show_price']) ? (bool) $settings['show_price'] : true;
$show_quick_view = isset($settings['show_quick_view']) ? (bool) $settings['show_quick_view'] : true;
$autoplay_on_hover = isset($settings['autoplay_on_hover']) ? (bool) $settings['autoplay_on_hover'] : true;
$controls = isset($settings['controls']) ? (bool) $settings['controls'] : false;
$loop = isset($settings['loop']) ? (bool) $settings['loop'] : true;
$muted = isset($settings['muted']) ? (bool) $settings['muted'] : true;
$hover_effect = isset($settings['hover_effect']) ? sanitize_html_class($settings['hover_effect']) : 'zoom';
$animation = isset($settings['animation']) ? sanitize_html_class($settings['animation']) : 'scale-up';
$layout = isset($settings['layout']) ? sanitize_key($settings['layout']) : 'grid';
$show_filters = isset($settings['show_filters']) ? (bool) $settings['show_filters'] : true;
$items_per_page = isset($settings['items_per_page']) ? absint($settings['items_per_page']) : 12;

// Generate unique IDs
$gallery_id = 'gallery-' . uniqid();
$container_id = 'container-' . uniqid();

// Get categories for filters
$categories = [];
if (is_array($video)) {
    foreach ($video as $item) {
        if (isset($item['category']) && !empty($item['category']) && !in_array($item['category'], $categories)) {
            $categories[] = sanitize_text_field($item['category']);
        }
    }
}
?>

<div class="product-gallery-container <?php echo esc_attr($animation); ?>" id="<?php echo esc_attr($container_id); ?>">
    
    <!-- Gallery Header -->
    <div class="gallery-header">
        <h2 class="gallery-title"><?php echo esc_html(isset($settings['gallery_title']) ? sanitize_text_field($settings['gallery_title']) : __('Product Gallery', 'hostreamly')); ?></h2>
        <?php if (isset($settings['gallery_description']) && !empty($settings['gallery_description'])): ?>
            <p class="gallery-description"><?php echo esc_html(sanitize_text_field($settings['gallery_description'])); ?></p>
        <?php endif; ?>
    </div>
    
    <!-- Gallery Filters -->
    <?php if ($show_filters && !empty($categories)): ?>
        <div class="gallery-filters">
            <button class="filter-btn active" data-filter="*"><?php esc_html_e('All', 'hostreamly'); ?></button>
            <?php foreach ($categories as $category): ?>
                <button class="filter-btn" data-filter="<?php echo esc_attr($category); ?>">
                    <?php echo esc_html(ucfirst($category)); ?>
                </button>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
    
    <!-- Gallery Grid -->
    <div class="gallery-grid columns-<?php echo esc_attr($columns); ?> <?php echo esc_attr($layout); ?>" id="<?php echo esc_attr($gallery_id); ?>">
        
        <?php foreach ($video as $index => $item): 
            // Get product data if available
            $product_id = isset($item['product_id']) ? absint($item['product_id']) : 0;
            $product = ($product_id && function_exists('wc_get_product')) ? wc_get_product($product_id) : null;
            
            // Prepare item data
            $video_url = isset($item['url']) ? esc_url_raw($item['url']) : '';
            $poster_url = isset($item['poster']) ? esc_url_raw($item['poster']) : (isset($item['thumbnail']) ? esc_url_raw($item['thumbnail']) : '');
            $video_title = isset($item['title']) ? sanitize_text_field($item['title']) : ($product && method_exists($product, 'get_name') ? $product->get_name() : '');
            $video_description = isset($item['description']) ? wp_kses_post($item['description']) : ($product && method_exists($product, 'get_short_description') ? $product->get_short_description() : '');
            $duration = isset($item['duration']) ? sanitize_text_field($item['duration']) : '';
            $category = isset($item['category']) ? sanitize_text_field($item['category']) : '';
            
            // Product information
            $product_price = ($product && method_exists($product, 'get_price_html')) ? $product->get_price_html() : '';
            $product_url = ($product && method_exists($product, 'get_permalink')) ? $product->get_permalink() : '#';
            $product_rating = ($product && method_exists($product, 'get_average_rating')) ? $product->get_average_rating() : 0;
            $is_on_sale = ($product && method_exists($product, 'is_on_sale')) ? $product->is_on_sale() : false;
            $is_featured = ($product && method_exists($product, 'is_featured')) ? $product->is_featured() : false;
            $is_new = ($product && method_exists($product, 'get_date_created')) ? ($product->get_date_created() > (new DateTime('-30 days'))) : false;
            
            // Generate unique IDs for this item
            $item_id = 'item-' . $index . '-' . uniqid();
            $video_id = 'video-' . $index . '-' . uniqid();
        ?>
        
        <div class="gallery-item <?php echo esc_attr($hover_effect); ?>" 
             data-category="<?php echo esc_attr($category); ?>"
             data-product-id="<?php echo esc_attr($product_id); ?>"
             id="<?php echo esc_attr($item_id); ?>">
            
            <!-- Video Container -->
            <div class="item-video-container">
                
                <!-- Thumbnail -->
                <?php if ($show_thumbnails && $poster_url): ?>
                    <img class="item-thumbnail" 
                         src="<?php echo esc_url($poster_url); ?>" 
                         alt="<?php echo esc_attr($video_title); ?>"
                         loading="lazy">
                <?php endif; ?>
                
                <!-- Video Element -->
                <video class="item-video" 
                       id="<?php echo esc_attr($video_id); ?>"
                       <?php echo $controls ? 'controls' : ''; ?>
                       <?php echo $loop ? 'loop' : ''; ?>
                       <?php echo $muted ? 'muted' : ''; ?>
                       preload="none"
                       playsinline>
                    <source src="<?php echo esc_url($video_url); ?>" type="video/mp4">
                </video>
                
                <!-- Overlay -->
                <div class="item-overlay">
                    <button class="item-play-button" 
                            onclick="playGalleryVideo('<?php echo esc_js($video_id); ?>', '<?php echo esc_js($item_id); ?>')"
                            aria-label="<?php esc_attr_e('Play video', 'hostreamly'); ?>">
                    </button>
                </div>
                
                <!-- Duration Badge -->
                <?php if ($duration): ?>
                    <div class="item-duration"><?php echo esc_html($duration); ?></div>
                <?php endif; ?>
                
                <!-- Product Badge -->
                <?php if ($is_on_sale || $is_featured || $is_new): ?>
                    <div class="item-badge <?php 
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
                
            </div>
            
            <!-- Item Content -->
            <div class="item-content">
                
                <!-- Title -->
                <?php if ($show_title && $video_title): ?>
                    <h3 class="item-title"><?php echo esc_html($video_title); ?></h3>
                <?php endif; ?>
                
                <!-- Price -->
                <?php if ($show_price && $product_price): ?>
                    <div class="item-price">
                        <?php if ($is_on_sale && $product): ?>
                            <span class="original-price"><?php echo wp_kses_post($product->get_regular_price_html()); ?></span>
                        <?php endif; ?>
                        <?php echo wp_kses_post($product_price); ?>
                    </div>
                <?php endif; ?>
                
                <!-- Rating -->
                <?php if ($product_rating > 0 && function_exists('wc_get_rating_html')): ?>
                    <div class="item-rating">
                        <div class="stars"><?php echo wp_kses_post(wc_get_rating_html($product_rating)); ?></div>
                        <span class="rating-count">(<?php echo absint($product->get_review_count()); ?>)</span>
                    </div>
                <?php endif; ?>
                
                <!-- Description -->
                <?php if ($video_description): ?>
                    <p class="item-description"><?php echo wp_kses_post($video_description); ?></p>
                <?php endif; ?>
                
                <!-- Actions -->
                <div class="item-actions">
                    
                    <!-- Add to Cart -->
                    <?php if ($product): ?>
                        <?php if ($product->is_type('simple')): ?>
                            <form class="cart" method="post" enctype="multipart/form-data">
                                <input type="hidden" name="add-to-cart" value="<?php echo esc_attr($product->get_id()); ?>">
                                <button type="submit" class="item-add-to-cart" data-product-id="<?php echo esc_attr($product->get_id()); ?>">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                    <?php echo esc_html($product->single_add_to_cart_text()); ?>
                                </button>
                            </form>
                        <?php else: ?>
                            <a href="<?php echo esc_url($product_url); ?>" class="item-add-to-cart">
                                <?php esc_html_e('View Product', 'hostreamly'); ?>
                            </a>
                        <?php endif; ?>
                    <?php endif; ?>
                    
                    <!-- Quick View -->
                    <?php if ($show_quick_view && $product && $product_id): ?>
                        <button class="item-quick-view" onclick="openQuickView(<?php echo absint($product->get_id()); ?>)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    <?php endif; ?>
                    
                </div>
                
            </div>
            
        </div>
        
        <?php endforeach; ?>
        
    </div>
    
    <!-- Load More Button -->
    <?php if (count($video) > $items_per_page): ?>
        <div class="gallery-load-more">
            <button class="load-more-btn" onclick="loadMoreItems()">
                <?php esc_html_e('Load More', 'hostreamly'); ?>
            </button>
        </div>
    <?php endif; ?>
    
    <!-- Empty State -->
    <div class="gallery-empty" style="display: none;">
        <div class="gallery-empty-icon">📹</div>
        <p class="gallery-empty-text"><?php esc_html_e('No videos found for the selected filter.', 'hostreamly'); ?></p>
    </div>
    
</div>

<script>
// Gallery functionality
let currentlyPlaying = null;
let visibleItems = <?php echo json_encode($items_per_page); ?>;
let allItems = [];

// Initialize gallery
document.addEventListener('DOMContentLoaded', function() {
    initializeGallery();
    setupFilters();
    setupHoverEffects();
    
    // Store all items for filtering
    allItems = Array.from(document.querySelectorAll('#<?php echo esc_js($gallery_id); ?> .gallery-item'));
    
    // Show initial items
    showItems(visibleItems);
});

// Initialize gallery
function initializeGallery() {
    const gallery = document.getElementById(<?php echo wp_json_encode($gallery_id); ?>);
    if (!gallery) return;
    
    // Setup masonry layout if needed
    if (gallery.classList.contains('masonry')) {
        setupMasonry(gallery);
    }
    
    // Setup lazy loading
    setupLazyLoading();
}

// Setup filters
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
            const filter = this.dataset.filter;
            filterItems(filter);
        });
    });
}

// Filter items
function filterItems(filter) {
    const items = document.querySelectorAll('.gallery-item');
    let visibleCount = 0;
    
    items.forEach(item => {
        const category = item.dataset.category;
        const shouldShow = filter === '*' || category === filter;
        
        if (shouldShow) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide empty state
    const emptyState = document.querySelector('.gallery-empty');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    
    // Update load more button
    updateLoadMoreButton();
}

// Setup hover effects
function setupHoverEffects() {
    <?php if ($autoplay_on_hover): ?>
    const galleryId = <?php echo wp_json_encode($gallery_id); ?>;
    if (typeof galleryId !== 'string') return;
    
    const items = document.querySelectorAll('#' + galleryId + ' .gallery-item');
    
    items.forEach(item => {
        const video = item.querySelector('.item-video');
        const thumbnail = item.querySelector('.item-thumbnail');
        
        if (video && thumbnail) {
            item.addEventListener('mouseenter', function() {
                if (currentlyPlaying !== video && typeof video.play === 'function') {
                    video.currentTime = 0;
                    video.play().catch(() => {});
                    video.classList.add('playing');
                }
            });
            
            item.addEventListener('mouseleave', function() {
                if (currentlyPlaying !== video && typeof video.pause === 'function') {
                    video.pause();
                    video.currentTime = 0;
                    video.classList.remove('playing');
                }
            });
        }
    });
    <?php endif; ?>
}

// Play gallery video
function playGalleryVideo(videoId, itemId) {
    if (typeof videoId !== 'string' || typeof itemId !== 'string') return;
    
    const video = document.getElementById(videoId);
    const item = document.getElementById(itemId);
    
    if (!video || !item || typeof video.play !== 'function') return;
    
    // Stop currently playing video
    if (currentlyPlaying && currentlyPlaying !== video && typeof currentlyPlaying.pause === 'function') {
        currentlyPlaying.pause();
        currentlyPlaying.currentTime = 0;
        currentlyPlaying.classList.remove('playing');
    }
    
    // Play selected video
    video.currentTime = 0;
    video.play().then(() => {
        currentlyPlaying = video;
        video.classList.add('playing');
        
        // Hide overlay
        const overlay = item.querySelector('.item-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
        }
    }).catch(error => {
        console.error('Error playing video:', error);
    });
    
    // Show overlay when video ends
    video.addEventListener('ended', function() {
        currentlyPlaying = null;
        video.classList.remove('playing');
        const overlay = item.querySelector('.item-overlay');
        if (overlay) {
            overlay.style.opacity = '';
        }
    });
    
    // Track analytics
    if (typeof hostreamlyAnalytics !== 'undefined' && typeof hostreamlyAnalytics.trackVideo === 'function') {
            hostreamlyAnalytics.trackVideo(video, {
            template: <?php echo wp_json_encode($template_id); ?>,
            gallery_item: true,
            product_id: item.dataset && item.dataset.productId ? item.dataset.productId : null
        });
    }
}

// Show items with pagination
function showItems(count) {
    const items = document.querySelectorAll('.gallery-item');
    
    items.forEach((item, index) => {
        if (index < count) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    updateLoadMoreButton();
}

// Load more items
function loadMoreItems() {
    visibleItems += <?php echo absint($items_per_page); ?>;
    showItems(visibleItems);
}

// Update load more button
function updateLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const visibleItemsCount = document.querySelectorAll('.gallery-item[style*="block"], .gallery-item:not([style*="none"])').length;
    const totalItems = document.querySelectorAll('.gallery-item').length;
    
    if (loadMoreBtn) {
        loadMoreBtn.style.display = visibleItemsCount >= totalItems ? 'none' : 'block';
    }
}

// Setup masonry layout
function setupMasonry(gallery) {
    // Simple masonry implementation
    function layoutMasonry() {
        const items = gallery.querySelectorAll('.gallery-item');
        const columnCount = parseInt(getComputedStyle(gallery).columnCount);
        const columnGap = parseInt(getComputedStyle(gallery).columnGap);
        
        // Reset column heights
        const columnHeights = new Array(columnCount).fill(0);
        
        items.forEach(item => {
            // Find shortest column
            const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
            
            // Position item
            item.style.position = 'absolute';
            item.style.left = `${shortestColumn * (100 / columnCount)}%`;
            item.style.top = `${columnHeights[shortestColumn]}px`;
            item.style.width = `calc(${100 / columnCount}% - ${columnGap * (columnCount - 1) / columnCount}px)`;
            
            // Update column height
            columnHeights[shortestColumn] += item.offsetHeight + columnGap;
        });
        
        // Set gallery height
        gallery.style.height = `${Math.max(...columnHeights)}px`;
    }
    
    // Layout on load and resize
    window.addEventListener('load', layoutMasonry);
    window.addEventListener('resize', layoutMasonry);
}

// Setup lazy loading
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Quick view function (reuse from showcase template)
function openQuickView(productId) {
    if (typeof productId !== 'number' || productId <= 0) return;
    
    if (typeof wc_add_to_cart_params !== 'undefined' && typeof jQuery !== 'undefined') {
        jQuery.post(wc_add_to_cart_params.ajax_url, {
            action: 'hostreamly_quick_view',
            product_id: productId,
            nonce: <?php echo wp_json_encode(wp_create_nonce('hostreamly_nonce')); ?>
        }, function(response) {
            if (response && response.success && response.data && response.data.html) {
                showQuickViewModal(response.data.html);
            }
        }).fail(function() {

        });
    }
}

// Show quick view modal (reuse from showcase template)
function showQuickViewModal(html) {
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
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target.classList.contains('hostreamly-quick-view-close')) {
            closeQuickViewModal(overlay);
        }
    });
    
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
</script>