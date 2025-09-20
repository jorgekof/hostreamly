<?php
/**
 * Product Demo Template HTML
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

// Get product data if available
$product_id = $video['product_id'] ?? 0;
$product = $product_id ? wc_get_product($product_id) : null;

// Prepare video URL and poster
$video_url = $video['url'] ?? '';
$poster_url = $video['poster'] ?? $video['thumbnail'] ?? '';
$video_title = $video['title'] ?? ($product ? $product->get_name() : '');
$video_description = $video['description'] ?? ($product ? $product->get_short_description() : '');

// Product information
$product_price = $product ? $product->get_price_html() : '';
$product_url = $product ? $product->get_permalink() : '#';
$product_rating = $product ? $product->get_average_rating() : 0;
$product_review_count = $product ? $product->get_review_count() : 0;
$is_on_sale = $product ? $product->is_on_sale() : false;

// Settings
$layout = $settings['layout'] ?? 'sidebar';
$sidebar_position = $settings['sidebar_position'] ?? 'right';
$show_title = $settings['show_title'] ?? true;
$show_features = $settings['show_features'] ?? true;
$show_specifications = $settings['show_specifications'] ?? true;
$show_add_to_cart = $settings['show_add_to_cart'] ?? true;
$autoplay = $settings['autoplay'] ?? true;
$controls = $settings['controls'] ?? false;
$loop = $settings['loop'] ?? true;
$muted = $settings['muted'] ?? true;
$features_style = $settings['features_style'] ?? 'checklist';
$animation = $settings['animation'] ?? 'slide-in';
$show_chapters = $settings['show_chapters'] ?? false;

// Demo chapters (if available)
$chapters = $video['chapters'] ?? [
    ['title' => __('Overview', 'hostreamly'), 'time' => 0],
        ['title' => __('Features', 'hostreamly'), 'time' => 30],
        ['title' => __('Usage', 'hostreamly'), 'time' => 60],
        ['title' => __('Benefits', 'hostreamly'), 'time' => 90]
];

// Product features
$features = $product ? $product->get_attribute('features') : '';
if (empty($features) && isset($video['features'])) {
    $features = $video['features'];
}
if (empty($features)) {
    $features = [
        __('High Quality Materials', 'hostreamly'),
        __('Easy to Use', 'hostreamly'),
        __('Durable Construction', 'hostreamly'),
        __('Money Back Guarantee', 'hostreamly')
    ];
}
if (is_string($features)) {
    $features = explode('|', $features);
}

// Product specifications
$specifications = [];
if ($product) {
    $attributes = $product->get_attributes();
    foreach ($attributes as $attribute) {
        if ($attribute->get_name() !== 'features') {
            $specifications[$attribute->get_name()] = $product->get_attribute($attribute->get_name());
        }
    }
}
if (empty($specifications) && isset($video['specifications'])) {
    $specifications = $video['specifications'];
}
if (empty($specifications)) {
    $specifications = [
        __('Weight', 'hostreamly') => '2.5 kg',
        __('Dimensions', 'hostreamly') => '30 x 20 x 15 cm',
        __('Material', 'hostreamly') => __('Premium Quality', 'hostreamly'),
        __('Warranty', 'hostreamly') => __('2 Years', 'hostreamly')
    ];
}

// Generate unique IDs
$video_id = 'demo-video-' . uniqid();
$container_id = 'demo-container-' . uniqid();
?>

<div class="product-demo-container <?php echo esc_attr($animation); ?> sidebar-<?php echo esc_attr($sidebar_position); ?>" id="<?php echo esc_attr($container_id); ?>">
    
    <!-- Video Section -->
    <div class="demo-video-section">
        
        <div class="demo-video-container">
            
            <!-- Video Element -->
            <video 
                id="<?php echo esc_attr($video_id); ?>"
                class="demo-video"
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
            
            <!-- Video Overlay -->
            <?php if (!$autoplay): ?>
                <div class="demo-video-overlay">
                    <button class="demo-play-button" onclick="playDemoVideo('<?php echo esc_js($video_id); ?>')" aria-label="<?php esc_attr_e('Play demo video', 'hostreamly'); ?>"></button>
                </div>
            <?php endif; ?>
            
            <!-- Progress Bar -->
            <div class="demo-progress-bar">
                <div class="demo-progress-fill" id="progress-<?php echo esc_attr($video_id); ?>"></div>
            </div>
            
            <!-- Chapters -->
            <?php if ($show_chapters && !empty($chapters)): ?>
                <div class="demo-chapters">
                    <?php foreach ($chapters as $index => $chapter): ?>
                        <button class="demo-chapter <?php echo $index === 0 ? 'active' : ''; ?>" 
                                onclick="seekToChapter('<?php echo esc_js($video_id); ?>', <?php echo esc_js($chapter['time']); ?>, this)"
                                data-time="<?php echo esc_attr($chapter['time']); ?>">
                            <?php echo esc_html($chapter['title']); ?>
                        </button>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            
        </div>
        
    </div>
    
    <!-- Content Section -->
    <div class="demo-content-section">
        
        <!-- Header -->
        <div class="demo-header">
            
            <!-- Title -->
            <?php if ($show_title && $video_title): ?>
                <h2 class="demo-title"><?php echo esc_html($video_title); ?></h2>
            <?php endif; ?>
            
            <!-- Subtitle -->
            <?php if ($video_description): ?>
                <p class="demo-subtitle"><?php echo wp_kses_post($video_description); ?></p>
            <?php endif; ?>
            
            <!-- Price -->
            <?php if ($product_price): ?>
                <div class="demo-price">
                    <?php if ($is_on_sale && $product): ?>
                        <span class="original-price"><?php echo $product->get_regular_price_html(); ?></span>
                    <?php endif; ?>
                    <?php echo $product_price; ?>
                </div>
            <?php endif; ?>
            
            <!-- Rating -->
            <?php if ($product_rating > 0): ?>
                <div class="demo-rating">
                    <div class="stars"><?php echo wc_get_rating_html($product_rating); ?></div>
                    <span class="rating-text">
                        <?php printf(
                            _n('%s review', '%s reviews', $product_review_count, 'hostreamly'),
                            number_format_i18n($product_review_count)
                        ); ?>
                    </span>
                </div>
            <?php endif; ?>
            
        </div>
        
        <!-- Features -->
        <?php if ($show_features && !empty($features)): ?>
            <div class="demo-features">
                <h3 class="demo-features-title"><?php esc_html_e('Key Features', 'hostreamly'); ?></h3>
                <ul class="demo-features-list <?php echo esc_attr($features_style); ?>">
                    <?php foreach ($features as $feature): ?>
                        <li><?php echo esc_html(trim($feature)); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <!-- Specifications -->
        <?php if ($show_specifications && !empty($specifications)): ?>
            <div class="demo-specifications">
                <h3 class="demo-specifications-title"><?php esc_html_e('Specifications', 'hostreamly'); ?></h3>
                <table class="demo-specs-table">
                    <?php foreach ($specifications as $spec_name => $spec_value): ?>
                        <tr>
                            <td><?php echo esc_html(ucfirst(str_replace('_', ' ', $spec_name))); ?></td>
                            <td><?php echo esc_html($spec_value); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            </div>
        <?php endif; ?>
        
        <!-- Actions -->
        <?php if ($show_add_to_cart): ?>
            <div class="demo-actions">
                
                <!-- Add to Cart -->
                <?php if ($product): ?>
                    <?php if ($product->is_type('simple')): ?>
                        <form class="cart" method="post" enctype="multipart/form-data">
                            <input type="hidden" name="add-to-cart" value="<?php echo esc_attr($product->get_id()); ?>">
                            <button type="submit" class="demo-add-to-cart" data-product-id="<?php echo esc_attr($product->get_id()); ?>">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                                <?php echo esc_html($product->single_add_to_cart_text()); ?>
                            </button>
                        </form>
                    <?php else: ?>
                        <a href="<?php echo esc_url($product_url); ?>" class="demo-add-to-cart">
                            <?php esc_html_e('View Product', 'hostreamly'); ?>
                        </a>
                    <?php endif; ?>
                <?php endif; ?>
                
                <!-- Secondary Actions -->
                <div class="demo-secondary-actions">
                    
                    <!-- Wishlist -->
                    <button class="demo-wishlist" onclick="addToWishlist(<?php echo esc_js($product_id); ?>)" title="<?php esc_attr_e('Add to Wishlist', 'hostreamly'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                    
                    <!-- Compare -->
                    <button class="demo-compare" onclick="addToCompare(<?php echo esc_js($product_id); ?>)" title="<?php esc_attr_e('Add to Compare', 'hostreamly'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                    </button>
                    
                    <!-- Share -->
                    <button class="demo-share" onclick="shareProduct()" title="<?php esc_attr_e('Share Product', 'hostreamly'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                    </button>
                    
                </div>
                
            </div>
        <?php endif; ?>
        
    </div>
    
</div>

<script>
// Demo video functionality
let currentChapter = 0;
let chapters = <?php echo json_encode($chapters); ?>;

// Play demo video
function playDemoVideo(videoId) {
    const video = document.getElementById(videoId);
    const overlay = video.parentElement.querySelector('.demo-video-overlay');
    
    if (video) {
        video.play().then(() => {
            if (overlay) {
                overlay.style.opacity = '0';
            }
        }).catch(error => {
            console.error('Error playing video:', error);
        });
        
        // Setup progress tracking
        setupProgressTracking(video);
        
        // Setup chapter tracking
        setupChapterTracking(video);
        
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

// Setup progress tracking
function setupProgressTracking(video) {
    const progressFill = document.getElementById('progress-' + video.id);
    
    if (progressFill) {
        video.addEventListener('timeupdate', function() {
            const progress = (video.currentTime / video.duration) * 100;
            progressFill.style.width = progress + '%';
        });
    }
}

// Setup chapter tracking
function setupChapterTracking(video) {
    if (chapters.length === 0) return;
    
    video.addEventListener('timeupdate', function() {
        const currentTime = video.currentTime;
        
        // Find current chapter
        for (let i = chapters.length - 1; i >= 0; i--) {
            if (currentTime >= chapters[i].time) {
                if (currentChapter !== i) {
                    updateActiveChapter(i);
                    currentChapter = i;
                }
                break;
            }
        }
        
        // Mark completed chapters
        chapters.forEach((chapter, index) => {
            const chapterBtn = document.querySelector(`[data-time="${chapter.time}"]`);
            if (chapterBtn && currentTime > chapter.time + 10) { // 10 seconds buffer
                chapterBtn.classList.add('completed');
            }
        });
    });
}

// Update active chapter
function updateActiveChapter(chapterIndex) {
    const chapterButtons = document.querySelectorAll('.demo-chapter');
    
    chapterButtons.forEach((btn, index) => {
        if (index === chapterIndex) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Seek to chapter
function seekToChapter(videoId, time, button) {
    const video = document.getElementById(videoId);
    
    if (video) {
        video.currentTime = time;
        
        // Update active chapter
        const chapterButtons = document.querySelectorAll('.demo-chapter');
        chapterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Play video if paused
        if (video.paused) {
            video.play();
        }
    }
}

// Wishlist functionality
function addToWishlist(productId) {
    if (typeof wc_add_to_cart_params !== 'undefined') {
        jQuery.post(wc_add_to_cart_params.ajax_url, {
            action: 'hostreamly_add_to_wishlist',
            product_id: productId,
            nonce: '<?php echo wp_create_nonce('hostreamly_nonce'); ?>'
        }, function(response) {
            if (response.success) {
                alert('<?php esc_html_e('Added to wishlist!', 'hostreamly'); ?>');
            } else {
                alert('<?php esc_html_e('Error adding to wishlist.', 'hostreamly'); ?>');
            }
        });
    }
}

// Compare functionality
function addToCompare(productId) {
    if (typeof wc_add_to_cart_params !== 'undefined') {
        jQuery.post(wc_add_to_cart_params.ajax_url, {
            action: 'hostreamly_add_to_compare',
            product_id: productId,
            nonce: '<?php echo wp_create_nonce('hostreamly_nonce'); ?>'
        }, function(response) {
            if (response.success) {
                alert('<?php esc_html_e('Added to compare!', 'hostreamly'); ?>');
            } else {
                alert('<?php esc_html_e('Error adding to compare.', 'hostreamly'); ?>');
            }
        });
    }
}

// Share functionality
function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: '<?php echo esc_js($video_title); ?>',
            text: '<?php echo esc_js($video_description); ?>',
            url: window.location.href
        }).catch(error => {
            console.error('Error sharing:', error);
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

// Fallback share functionality
function fallbackShare() {
    const url = window.location.href;
    const title = '<?php echo esc_js($video_title); ?>';
    
    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('<?php esc_html_e('Link copied to clipboard!', 'hostreamly'); ?>');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('<?php esc_html_e('Link copied to clipboard!', 'hostreamly'); ?>');
    }
}

// Initialize demo on page load
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('<?php echo esc_js($video_id); ?>');
    
    if (video && typeof hostreamlyAnalytics !== 'undefined') {
        hostreamlyAnalytics.trackVideo(video, {
            product_id: <?php echo json_encode($product_id); ?>,
            template: '<?php echo esc_js($template_id); ?>',
            video_id: '<?php echo esc_js($video['id'] ?? ''); ?>',
            demo_mode: true
        });
    }
    
    // Auto-play if enabled
    <?php if ($autoplay): ?>
    if (video) {
        playDemoVideo('<?php echo esc_js($video_id); ?>');
    }
    <?php endif; ?>
});
</script>