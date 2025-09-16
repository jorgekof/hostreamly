<?php
/**
 * Hostreamly WooCommerce Widgets
 *
 * @package Hostreamly_WooCommerce
 * @version 2.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Hostreamly WooCommerce Widgets Class
 */
class Hostreamly_WC_Widgets {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('widgets_init', array($this, 'register_widgets'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_widget_scripts'));
    }

    /**
     * Register widgets
     */
    public function register_widgets() {
        register_widget('Hostreamly_Product_Video_Widget');
        register_widget('Hostreamly_Product_Gallery_Widget');
        register_widget('Hostreamly_Category_Videos_Widget');
        register_widget('Hostreamly_Featured_Videos_Widget');
        register_widget('Hostreamly_Testimonial_Widget');
    }

    /**
     * Enqueue widget scripts
     */
    public function enqueue_widget_scripts() {
        if (is_active_widget(false, false, 'hostreamly_product_video') ||
            is_active_widget(false, false, 'hostreamly_product_gallery') ||
            is_active_widget(false, false, 'hostreamly_category_videos') ||
            is_active_widget(false, false, 'hostreamly_featured_videos') ||
            is_active_widget(false, false, 'hostreamly_testimonial')) {
            
            wp_enqueue_script(
                'hostreamly-wc-widgets',
                plugin_dir_url(__FILE__) . '../assets/widgets.js',
                array('jquery'),
                '2.0.0',
                true
            );
            
            wp_enqueue_style(
                'hostreamly-wc-widgets',
                plugin_dir_url(__FILE__) . '../assets/widgets.css',
                array(),
                '2.0.0'
            );
        }
    }
}

/**
 * Product Video Widget
 */
class Hostreamly_Product_Video_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'hostreamly_product_video',
            __('Hostreamly: Product Video', 'hostreamly-wc'),
            array(
                'description' => __('Display a video for a specific product', 'hostreamly-wc'),
                'classname' => 'hostreamly-product-video-widget'
            )
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }

        $product_id = !empty($instance['product_id']) ? $instance['product_id'] : '';
        $video_id = !empty($instance['video_id']) ? $instance['video_id'] : '';
        $autoplay = !empty($instance['autoplay']) ? 'true' : 'false';
        $responsive = !empty($instance['responsive']) ? 'true' : 'false';
        $show_title = !empty($instance['show_title']) ? true : false;
        $show_description = !empty($instance['show_description']) ? true : false;

        if ($product_id || $video_id) {
            $shortcode_atts = array();
            
            if ($product_id) {
                $shortcode_atts[] = 'id="' . esc_attr($product_id) . '"';
            }
            
            if ($video_id) {
                $shortcode_atts[] = 'video="' . esc_attr($video_id) . '"';
            }
            
            $shortcode_atts[] = 'autoplay="' . $autoplay . '"';
            $shortcode_atts[] = 'responsive="' . $responsive . '"';
            $shortcode_atts[] = 'class="bunnyvault-widget-video"';

            $shortcode = '[bunnyvault-product ' . implode(' ', $shortcode_atts) . ']';
            
            echo '<div class="bunnyvault-product-video-widget-content">';
            
            if ($show_title && $product_id) {
                $product = wc_get_product($product_id);
                if ($product) {
                    echo '<h4 class="widget-product-title">' . esc_html($product->get_name()) . '</h4>';
                }
            }
            
            echo do_shortcode($shortcode);
            
            if ($show_description && $product_id) {
                $product = wc_get_product($product_id);
                if ($product && $product->get_short_description()) {
                    echo '<div class="widget-product-description">' . wp_kses_post($product->get_short_description()) . '</div>';
                }
            }
            
            echo '</div>';
        }

        echo $args['after_widget'];
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : '';
        $product_id = !empty($instance['product_id']) ? $instance['product_id'] : '';
        $video_id = !empty($instance['video_id']) ? $instance['video_id'] : '';
        $autoplay = !empty($instance['autoplay']) ? $instance['autoplay'] : false;
        $responsive = !empty($instance['responsive']) ? $instance['responsive'] : true;
        $show_title = !empty($instance['show_title']) ? $instance['show_title'] : false;
        $show_description = !empty($instance['show_description']) ? $instance['show_description'] : false;
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php _e('Title:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('product_id')); ?>"><?php _e('Product ID:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('product_id')); ?>" name="<?php echo esc_attr($this->get_field_name('product_id')); ?>" type="number" value="<?php echo esc_attr($product_id); ?>">
            <small><?php _e('Leave empty to use specific video ID', 'bunnyvault-wc'); ?></small>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('video_id')); ?>"><?php _e('Video ID:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('video_id')); ?>" name="<?php echo esc_attr($this->get_field_name('video_id')); ?>" type="text" value="<?php echo esc_attr($video_id); ?>">
            <small><?php _e('Specific BunnyVault video ID', 'bunnyvault-wc'); ?></small>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($autoplay); ?> id="<?php echo esc_attr($this->get_field_id('autoplay')); ?>" name="<?php echo esc_attr($this->get_field_name('autoplay')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('autoplay')); ?>"><?php _e('Autoplay video', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($responsive); ?> id="<?php echo esc_attr($this->get_field_id('responsive')); ?>" name="<?php echo esc_attr($this->get_field_name('responsive')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('responsive')); ?>"><?php _e('Responsive video', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_title); ?> id="<?php echo esc_attr($this->get_field_id('show_title')); ?>" name="<?php echo esc_attr($this->get_field_name('show_title')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_title')); ?>"><?php _e('Show product title', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_description); ?> id="<?php echo esc_attr($this->get_field_id('show_description')); ?>" name="<?php echo esc_attr($this->get_field_name('show_description')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_description')); ?>"><?php _e('Show product description', 'bunnyvault-wc'); ?></label>
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['product_id'] = (!empty($new_instance['product_id'])) ? absint($new_instance['product_id']) : '';
        $instance['video_id'] = (!empty($new_instance['video_id'])) ? sanitize_text_field($new_instance['video_id']) : '';
        $instance['autoplay'] = (!empty($new_instance['autoplay'])) ? true : false;
        $instance['responsive'] = (!empty($new_instance['responsive'])) ? true : false;
        $instance['show_title'] = (!empty($new_instance['show_title'])) ? true : false;
        $instance['show_description'] = (!empty($new_instance['show_description'])) ? true : false;
        return $instance;
    }
}

/**
 * Product Gallery Widget
 */
class BunnyVault_Product_Gallery_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'bunnyvault_product_gallery',
            __('BunnyVault: Product Gallery', 'bunnyvault-wc'),
            array(
                'description' => __('Display a gallery of videos for products', 'bunnyvault-wc'),
                'classname' => 'bunnyvault-product-gallery-widget'
            )
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }

        $product_ids = !empty($instance['product_ids']) ? $instance['product_ids'] : '';
        $category_slug = !empty($instance['category_slug']) ? $instance['category_slug'] : '';
        $columns = !empty($instance['columns']) ? $instance['columns'] : 3;
        $limit = !empty($instance['limit']) ? $instance['limit'] : 6;
        $orderby = !empty($instance['orderby']) ? $instance['orderby'] : 'date';
        $order = !empty($instance['order']) ? $instance['order'] : 'desc';
        $show_titles = !empty($instance['show_titles']) ? true : false;
        $show_prices = !empty($instance['show_prices']) ? true : false;

        $shortcode_atts = array();
        
        if ($product_ids) {
            $shortcode_atts[] = 'products="' . esc_attr($product_ids) . '"';
        } elseif ($category_slug) {
            $shortcode_atts[] = 'category="' . esc_attr($category_slug) . '"';
        }
        
        $shortcode_atts[] = 'columns="' . esc_attr($columns) . '"';
        $shortcode_atts[] = 'limit="' . esc_attr($limit) . '"';
        $shortcode_atts[] = 'orderby="' . esc_attr($orderby) . '"';
        $shortcode_atts[] = 'order="' . esc_attr($order) . '"';
        $shortcode_atts[] = 'class="bunnyvault-widget-gallery"';

        if ($show_titles) {
            $shortcode_atts[] = 'show_titles="true"';
        }
        
        if ($show_prices) {
            $shortcode_atts[] = 'show_prices="true"';
        }

        $shortcode = '[bunnyvault-gallery ' . implode(' ', $shortcode_atts) . ']';
        
        echo '<div class="bunnyvault-product-gallery-widget-content">';
        echo do_shortcode($shortcode);
        echo '</div>';

        echo $args['after_widget'];
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : '';
        $product_ids = !empty($instance['product_ids']) ? $instance['product_ids'] : '';
        $category_slug = !empty($instance['category_slug']) ? $instance['category_slug'] : '';
        $columns = !empty($instance['columns']) ? $instance['columns'] : 3;
        $limit = !empty($instance['limit']) ? $instance['limit'] : 6;
        $orderby = !empty($instance['orderby']) ? $instance['orderby'] : 'date';
        $order = !empty($instance['order']) ? $instance['order'] : 'desc';
        $show_titles = !empty($instance['show_titles']) ? $instance['show_titles'] : false;
        $show_prices = !empty($instance['show_prices']) ? $instance['show_prices'] : false;
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php _e('Title:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('product_ids')); ?>"><?php _e('Product IDs:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('product_ids')); ?>" name="<?php echo esc_attr($this->get_field_name('product_ids')); ?>" type="text" value="<?php echo esc_attr($product_ids); ?>">
            <small><?php _e('Comma-separated product IDs (e.g., 123,456,789)', 'bunnyvault-wc'); ?></small>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('category_slug')); ?>"><?php _e('Category Slug:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('category_slug')); ?>" name="<?php echo esc_attr($this->get_field_name('category_slug')); ?>" type="text" value="<?php echo esc_attr($category_slug); ?>">
            <small><?php _e('Use category slug instead of specific products', 'bunnyvault-wc'); ?></small>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('columns')); ?>"><?php _e('Columns:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('columns')); ?>" name="<?php echo esc_attr($this->get_field_name('columns')); ?>">
                <?php for ($i = 1; $i <= 6; $i++) : ?>
                    <option value="<?php echo $i; ?>" <?php selected($columns, $i); ?>><?php echo $i; ?></option>
                <?php endfor; ?>
            </select>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('limit')); ?>"><?php _e('Limit:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('limit')); ?>" name="<?php echo esc_attr($this->get_field_name('limit')); ?>" type="number" value="<?php echo esc_attr($limit); ?>" min="1" max="50">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('orderby')); ?>"><?php _e('Order By:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('orderby')); ?>" name="<?php echo esc_attr($this->get_field_name('orderby')); ?>">
                <option value="date" <?php selected($orderby, 'date'); ?>><?php _e('Date', 'bunnyvault-wc'); ?></option>
                <option value="title" <?php selected($orderby, 'title'); ?>><?php _e('Title', 'bunnyvault-wc'); ?></option>
                <option value="price" <?php selected($orderby, 'price'); ?>><?php _e('Price', 'bunnyvault-wc'); ?></option>
                <option value="popularity" <?php selected($orderby, 'popularity'); ?>><?php _e('Popularity', 'bunnyvault-wc'); ?></option>
                <option value="rating" <?php selected($orderby, 'rating'); ?>><?php _e('Rating', 'bunnyvault-wc'); ?></option>
                <option value="random" <?php selected($orderby, 'random'); ?>><?php _e('Random', 'bunnyvault-wc'); ?></option>
            </select>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('order')); ?>"><?php _e('Order:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('order')); ?>" name="<?php echo esc_attr($this->get_field_name('order')); ?>">
                <option value="desc" <?php selected($order, 'desc'); ?>><?php _e('Descending', 'bunnyvault-wc'); ?></option>
                <option value="asc" <?php selected($order, 'asc'); ?>><?php _e('Ascending', 'bunnyvault-wc'); ?></option>
            </select>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_titles); ?> id="<?php echo esc_attr($this->get_field_id('show_titles')); ?>" name="<?php echo esc_attr($this->get_field_name('show_titles')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_titles')); ?>"><?php _e('Show product titles', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_prices); ?> id="<?php echo esc_attr($this->get_field_id('show_prices')); ?>" name="<?php echo esc_attr($this->get_field_name('show_prices')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_prices')); ?>"><?php _e('Show product prices', 'bunnyvault-wc'); ?></label>
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['product_ids'] = (!empty($new_instance['product_ids'])) ? sanitize_text_field($new_instance['product_ids']) : '';
        $instance['category_slug'] = (!empty($new_instance['category_slug'])) ? sanitize_text_field($new_instance['category_slug']) : '';
        $instance['columns'] = (!empty($new_instance['columns'])) ? absint($new_instance['columns']) : 3;
        $instance['limit'] = (!empty($new_instance['limit'])) ? absint($new_instance['limit']) : 6;
        $instance['orderby'] = (!empty($new_instance['orderby'])) ? sanitize_text_field($new_instance['orderby']) : 'date';
        $instance['order'] = (!empty($new_instance['order'])) ? sanitize_text_field($new_instance['order']) : 'desc';
        $instance['show_titles'] = (!empty($new_instance['show_titles'])) ? true : false;
        $instance['show_prices'] = (!empty($new_instance['show_prices'])) ? true : false;
        return $instance;
    }
}

/**
 * Category Videos Widget
 */
class BunnyVault_Category_Videos_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'bunnyvault_category_videos',
            __('BunnyVault: Category Videos', 'bunnyvault-wc'),
            array(
                'description' => __('Display videos from specific product categories', 'bunnyvault-wc'),
                'classname' => 'bunnyvault-category-videos-widget'
            )
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }

        $category_slug = !empty($instance['category_slug']) ? $instance['category_slug'] : '';
        $limit = !empty($instance['limit']) ? $instance['limit'] : 4;
        $orderby = !empty($instance['orderby']) ? $instance['orderby'] : 'date';
        $order = !empty($instance['order']) ? $instance['order'] : 'desc';
        $featured_only = !empty($instance['featured_only']) ? 'true' : 'false';
        $show_category_title = !empty($instance['show_category_title']) ? true : false;

        if ($category_slug) {
            $shortcode_atts = array(
                'slug="' . esc_attr($category_slug) . '"',
                'limit="' . esc_attr($limit) . '"',
                'orderby="' . esc_attr($orderby) . '"',
                'order="' . esc_attr($order) . '"',
                'featured="' . $featured_only . '"',
                'class="bunnyvault-widget-category"'
            );

            $shortcode = '[bunnyvault-category ' . implode(' ', $shortcode_atts) . ']';
            
            echo '<div class="bunnyvault-category-videos-widget-content">';
            
            if ($show_category_title) {
                $category = get_term_by('slug', $category_slug, 'product_cat');
                if ($category) {
                    echo '<h4 class="widget-category-title">' . esc_html($category->name) . '</h4>';
                }
            }
            
            echo do_shortcode($shortcode);
            echo '</div>';
        }

        echo $args['after_widget'];
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : '';
        $category_slug = !empty($instance['category_slug']) ? $instance['category_slug'] : '';
        $limit = !empty($instance['limit']) ? $instance['limit'] : 4;
        $orderby = !empty($instance['orderby']) ? $instance['orderby'] : 'date';
        $order = !empty($instance['order']) ? $instance['order'] : 'desc';
        $featured_only = !empty($instance['featured_only']) ? $instance['featured_only'] : false;
        $show_category_title = !empty($instance['show_category_title']) ? $instance['show_category_title'] : false;
        
        // Get product categories
        $categories = get_terms(array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ));
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php _e('Title:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('category_slug')); ?>"><?php _e('Category:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('category_slug')); ?>" name="<?php echo esc_attr($this->get_field_name('category_slug')); ?>">
                <option value=""><?php _e('Select a category', 'bunnyvault-wc'); ?></option>
                <?php foreach ($categories as $category) : ?>
                    <option value="<?php echo esc_attr($category->slug); ?>" <?php selected($category_slug, $category->slug); ?>>
                        <?php echo esc_html($category->name); ?> (<?php echo $category->count; ?>)
                    </option>
                <?php endforeach; ?>
            </select>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('limit')); ?>"><?php _e('Limit:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('limit')); ?>" name="<?php echo esc_attr($this->get_field_name('limit')); ?>" type="number" value="<?php echo esc_attr($limit); ?>" min="1" max="20">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('orderby')); ?>"><?php _e('Order By:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('orderby')); ?>" name="<?php echo esc_attr($this->get_field_name('orderby')); ?>">
                <option value="date" <?php selected($orderby, 'date'); ?>><?php _e('Date', 'bunnyvault-wc'); ?></option>
                <option value="title" <?php selected($orderby, 'title'); ?>><?php _e('Title', 'bunnyvault-wc'); ?></option>
                <option value="popularity" <?php selected($orderby, 'popularity'); ?>><?php _e('Popularity', 'bunnyvault-wc'); ?></option>
                <option value="rating" <?php selected($orderby, 'rating'); ?>><?php _e('Rating', 'bunnyvault-wc'); ?></option>
                <option value="random" <?php selected($orderby, 'random'); ?>><?php _e('Random', 'bunnyvault-wc'); ?></option>
            </select>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('order')); ?>"><?php _e('Order:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('order')); ?>" name="<?php echo esc_attr($this->get_field_name('order')); ?>">
                <option value="desc" <?php selected($order, 'desc'); ?>><?php _e('Descending', 'bunnyvault-wc'); ?></option>
                <option value="asc" <?php selected($order, 'asc'); ?>><?php _e('Ascending', 'bunnyvault-wc'); ?></option>
            </select>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($featured_only); ?> id="<?php echo esc_attr($this->get_field_id('featured_only')); ?>" name="<?php echo esc_attr($this->get_field_name('featured_only')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('featured_only')); ?>"><?php _e('Featured products only', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_category_title); ?> id="<?php echo esc_attr($this->get_field_id('show_category_title')); ?>" name="<?php echo esc_attr($this->get_field_name('show_category_title')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_category_title')); ?>"><?php _e('Show category title', 'bunnyvault-wc'); ?></label>
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['category_slug'] = (!empty($new_instance['category_slug'])) ? sanitize_text_field($new_instance['category_slug']) : '';
        $instance['limit'] = (!empty($new_instance['limit'])) ? absint($new_instance['limit']) : 4;
        $instance['orderby'] = (!empty($new_instance['orderby'])) ? sanitize_text_field($new_instance['orderby']) : 'date';
        $instance['order'] = (!empty($new_instance['order'])) ? sanitize_text_field($new_instance['order']) : 'desc';
        $instance['featured_only'] = (!empty($new_instance['featured_only'])) ? true : false;
        $instance['show_category_title'] = (!empty($new_instance['show_category_title'])) ? true : false;
        return $instance;
    }
}

/**
 * Featured Videos Widget
 */
class BunnyVault_Featured_Videos_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'bunnyvault_featured_videos',
            __('BunnyVault: Featured Videos', 'bunnyvault-wc'),
            array(
                'description' => __('Display featured product videos', 'bunnyvault-wc'),
                'classname' => 'bunnyvault-featured-videos-widget'
            )
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }

        $limit = !empty($instance['limit']) ? $instance['limit'] : 3;
        $columns = !empty($instance['columns']) ? $instance['columns'] : 1;
        $orderby = !empty($instance['orderby']) ? $instance['orderby'] : 'date';
        $order = !empty($instance['order']) ? $instance['order'] : 'desc';
        $show_titles = !empty($instance['show_titles']) ? 'true' : 'false';
        $show_prices = !empty($instance['show_prices']) ? 'true' : 'false';
        $autoplay = !empty($instance['autoplay']) ? 'true' : 'false';

        $shortcode_atts = array(
            'featured="true"',
            'limit="' . esc_attr($limit) . '"',
            'columns="' . esc_attr($columns) . '"',
            'orderby="' . esc_attr($orderby) . '"',
            'order="' . esc_attr($order) . '"',
            'show_titles="' . $show_titles . '"',
            'show_prices="' . $show_prices . '"',
            'autoplay="' . $autoplay . '"',
            'class="bunnyvault-widget-featured"'
        );

        $shortcode = '[bunnyvault-gallery ' . implode(' ', $shortcode_atts) . ']';
        
        echo '<div class="bunnyvault-featured-videos-widget-content">';
        echo do_shortcode($shortcode);
        echo '</div>';

        echo $args['after_widget'];
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : __('Featured Videos', 'bunnyvault-wc');
        $limit = !empty($instance['limit']) ? $instance['limit'] : 3;
        $columns = !empty($instance['columns']) ? $instance['columns'] : 1;
        $orderby = !empty($instance['orderby']) ? $instance['orderby'] : 'date';
        $order = !empty($instance['order']) ? $instance['order'] : 'desc';
        $show_titles = !empty($instance['show_titles']) ? $instance['show_titles'] : true;
        $show_prices = !empty($instance['show_prices']) ? $instance['show_prices'] : false;
        $autoplay = !empty($instance['autoplay']) ? $instance['autoplay'] : false;
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php _e('Title:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('limit')); ?>"><?php _e('Limit:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('limit')); ?>" name="<?php echo esc_attr($this->get_field_name('limit')); ?>" type="number" value="<?php echo esc_attr($limit); ?>" min="1" max="20">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('columns')); ?>"><?php _e('Columns:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('columns')); ?>" name="<?php echo esc_attr($this->get_field_name('columns')); ?>">
                <?php for ($i = 1; $i <= 4; $i++) : ?>
                    <option value="<?php echo $i; ?>" <?php selected($columns, $i); ?>><?php echo $i; ?></option>
                <?php endfor; ?>
            </select>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('orderby')); ?>"><?php _e('Order By:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('orderby')); ?>" name="<?php echo esc_attr($this->get_field_name('orderby')); ?>">
                <option value="date" <?php selected($orderby, 'date'); ?>><?php _e('Date', 'bunnyvault-wc'); ?></option>
                <option value="title" <?php selected($orderby, 'title'); ?>><?php _e('Title', 'bunnyvault-wc'); ?></option>
                <option value="popularity" <?php selected($orderby, 'popularity'); ?>><?php _e('Popularity', 'bunnyvault-wc'); ?></option>
                <option value="rating" <?php selected($orderby, 'rating'); ?>><?php _e('Rating', 'bunnyvault-wc'); ?></option>
                <option value="views" <?php selected($orderby, 'views'); ?>><?php _e('Views', 'bunnyvault-wc'); ?></option>
                <option value="random" <?php selected($orderby, 'random'); ?>><?php _e('Random', 'bunnyvault-wc'); ?></option>
            </select>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('order')); ?>"><?php _e('Order:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('order')); ?>" name="<?php echo esc_attr($this->get_field_name('order')); ?>">
                <option value="desc" <?php selected($order, 'desc'); ?>><?php _e('Descending', 'bunnyvault-wc'); ?></option>
                <option value="asc" <?php selected($order, 'asc'); ?>><?php _e('Ascending', 'bunnyvault-wc'); ?></option>
            </select>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_titles); ?> id="<?php echo esc_attr($this->get_field_id('show_titles')); ?>" name="<?php echo esc_attr($this->get_field_name('show_titles')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_titles')); ?>"><?php _e('Show product titles', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_prices); ?> id="<?php echo esc_attr($this->get_field_id('show_prices')); ?>" name="<?php echo esc_attr($this->get_field_name('show_prices')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_prices')); ?>"><?php _e('Show product prices', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($autoplay); ?> id="<?php echo esc_attr($this->get_field_id('autoplay')); ?>" name="<?php echo esc_attr($this->get_field_name('autoplay')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('autoplay')); ?>"><?php _e('Autoplay videos', 'bunnyvault-wc'); ?></label>
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['limit'] = (!empty($new_instance['limit'])) ? absint($new_instance['limit']) : 3;
        $instance['columns'] = (!empty($new_instance['columns'])) ? absint($new_instance['columns']) : 1;
        $instance['orderby'] = (!empty($new_instance['orderby'])) ? sanitize_text_field($new_instance['orderby']) : 'date';
        $instance['order'] = (!empty($new_instance['order'])) ? sanitize_text_field($new_instance['order']) : 'desc';
        $instance['show_titles'] = (!empty($new_instance['show_titles'])) ? true : false;
        $instance['show_prices'] = (!empty($new_instance['show_prices'])) ? true : false;
        $instance['autoplay'] = (!empty($new_instance['autoplay'])) ? true : false;
        return $instance;
    }
}

/**
 * Testimonial Widget
 */
class BunnyVault_Testimonial_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'bunnyvault_testimonial',
            __('BunnyVault: Video Testimonials', 'bunnyvault-wc'),
            array(
                'description' => __('Display customer video testimonials', 'bunnyvault-wc'),
                'classname' => 'bunnyvault-testimonial-widget'
            )
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }

        $limit = !empty($instance['limit']) ? $instance['limit'] : 3;
        $category = !empty($instance['category']) ? $instance['category'] : 'testimonials';
        $featured_only = !empty($instance['featured_only']) ? 'true' : 'false';
        $autoplay = !empty($instance['autoplay']) ? 'true' : 'false';
        $show_customer_info = !empty($instance['show_customer_info']) ? 'true' : 'false';
        $layout = !empty($instance['layout']) ? $instance['layout'] : 'grid';

        $shortcode_atts = array(
            'limit="' . esc_attr($limit) . '"',
            'category="' . esc_attr($category) . '"',
            'featured="' . $featured_only . '"',
            'autoplay="' . $autoplay . '"',
            'show_customer_info="' . $show_customer_info . '"',
            'layout="' . esc_attr($layout) . '"',
            'class="bunnyvault-widget-testimonials"'
        );

        $shortcode = '[bunnyvault-testimonial ' . implode(' ', $shortcode_atts) . ']';
        
        echo '<div class="bunnyvault-testimonial-widget-content">';
        echo do_shortcode($shortcode);
        echo '</div>';

        echo $args['after_widget'];
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : __('Customer Testimonials', 'bunnyvault-wc');
        $limit = !empty($instance['limit']) ? $instance['limit'] : 3;
        $category = !empty($instance['category']) ? $instance['category'] : 'testimonials';
        $featured_only = !empty($instance['featured_only']) ? $instance['featured_only'] : false;
        $autoplay = !empty($instance['autoplay']) ? $instance['autoplay'] : false;
        $show_customer_info = !empty($instance['show_customer_info']) ? $instance['show_customer_info'] : true;
        $layout = !empty($instance['layout']) ? $instance['layout'] : 'grid';
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php _e('Title:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('limit')); ?>"><?php _e('Limit:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('limit')); ?>" name="<?php echo esc_attr($this->get_field_name('limit')); ?>" type="number" value="<?php echo esc_attr($limit); ?>" min="1" max="10">
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('category')); ?>"><?php _e('Category:', 'bunnyvault-wc'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('category')); ?>" name="<?php echo esc_attr($this->get_field_name('category')); ?>" type="text" value="<?php echo esc_attr($category); ?>">
            <small><?php _e('BunnyVault category for testimonials', 'bunnyvault-wc'); ?></small>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('layout')); ?>"><?php _e('Layout:', 'bunnyvault-wc'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('layout')); ?>" name="<?php echo esc_attr($this->get_field_name('layout')); ?>">
                <option value="grid" <?php selected($layout, 'grid'); ?>><?php _e('Grid', 'bunnyvault-wc'); ?></option>
                <option value="carousel" <?php selected($layout, 'carousel'); ?>><?php _e('Carousel', 'bunnyvault-wc'); ?></option>
                <option value="list" <?php selected($layout, 'list'); ?>><?php _e('List', 'bunnyvault-wc'); ?></option>
            </select>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($featured_only); ?> id="<?php echo esc_attr($this->get_field_id('featured_only')); ?>" name="<?php echo esc_attr($this->get_field_name('featured_only')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('featured_only')); ?>"><?php _e('Featured testimonials only', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($autoplay); ?> id="<?php echo esc_attr($this->get_field_id('autoplay')); ?>" name="<?php echo esc_attr($this->get_field_name('autoplay')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('autoplay')); ?>"><?php _e('Autoplay videos', 'bunnyvault-wc'); ?></label>
        </p>
        
        <p>
            <input class="checkbox" type="checkbox" <?php checked($show_customer_info); ?> id="<?php echo esc_attr($this->get_field_id('show_customer_info')); ?>" name="<?php echo esc_attr($this->get_field_name('show_customer_info')); ?>">
            <label for="<?php echo esc_attr($this->get_field_id('show_customer_info')); ?>"><?php _e('Show customer information', 'bunnyvault-wc'); ?></label>
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['limit'] = (!empty($new_instance['limit'])) ? absint($new_instance['limit']) : 3;
        $instance['category'] = (!empty($new_instance['category'])) ? sanitize_text_field($new_instance['category']) : 'testimonials';
        $instance['featured_only'] = (!empty($new_instance['featured_only'])) ? true : false;
        $instance['autoplay'] = (!empty($new_instance['autoplay'])) ? true : false;
        $instance['show_customer_info'] = (!empty($new_instance['show_customer_info'])) ? true : false;
        $instance['layout'] = (!empty($new_instance['layout'])) ? sanitize_text_field($new_instance['layout']) : 'grid';
        return $instance;
    }
}

// Initialize widgets
new BunnyVault_WC_Widgets();