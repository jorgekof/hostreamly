<?php
/**
 * Plantilla de Testimonio de Producto con Video
 * 
 * Esta plantilla muestra testimonios de clientes con videos de productos
 * Incluye información del cliente, calificación y detalles del producto
 */

// Obtener datos del producto y testimonio
$product_id = get_query_var('product_id', 1);
$testimonial_id = get_query_var('testimonial_id', 1);
$layout = get_query_var('layout', 'video-left'); // video-left, video-right, stacked

// Datos del producto (normalmente desde base de datos)
$product = [
    'id' => absint($product_id),
    'name' => 'Smartphone Pro Max 256GB',
    'price' => 899.99,
    'original_price' => 1099.99,
    'currency' => '$',
    'features' => [
        'Cámara triple 48MP',
        'Batería de larga duración',
        'Pantalla OLED 6.7"',
        'Resistente al agua IP68'
    ],
    'rating' => 4.8,
    'reviews_count' => 2847
];

// Validar que $product sea un array
if (!is_array($product)) {
    $product = [];
}

// Datos del testimonio
$testimonial = [
    'id' => absint($testimonial_id),
    'quote' => 'Este producto ha superado todas mis expectativas. La calidad es excepcional y el servicio al cliente es increíble. Lo recomiendo totalmente.',
    'customer' => [
        'name' => 'María González',
        'title' => 'Fotógrafa Profesional',
        'location' => 'Madrid, España',
        'avatar' => 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    ],
    'rating' => 5,
    'verified' => true,
    'date' => '2024-01-15'
];

// Validar que $testimonial sea un array
if (!is_array($testimonial)) {
    $testimonial = [];
}

// Datos del video
$video = [
    'url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'poster' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    'duration' => '2:30',
    'title' => 'Testimonio de María - Smartphone Pro Max'
];
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testimonio de Producto - <?php echo htmlspecialchars($product['name']); ?></title>
    <link rel="stylesheet" href="../css/product-testimonial.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Estilos críticos incrustados -->
    <style>
        .testimonial-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .video-container video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    </style>
</head>
<body>
    <div class="testimonial-container layout-<?php echo $layout; ?>" data-product-id="<?php echo $product['id']; ?>" data-testimonial-id="<?php echo $testimonial['id']; ?>">
        
        <!-- Sección de Video -->
        <div class="video-section">
            <div class="video-container">
                <video 
                    id="testimonial-video"
                    poster="<?php echo htmlspecialchars($video['poster']); ?>"
                    preload="metadata"
                    playsinline
                    data-video-title="<?php echo htmlspecialchars($video['title']); ?>"
                >
                    <source src="<?php echo htmlspecialchars($video['url']); ?>" type="video/mp4">
                    Tu navegador no soporta el elemento de video.
                </video>
                
                <div class="video-overlay">
                    <button class="play-button" aria-label="Reproducir testimonio">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                
                <div class="video-duration"><?php echo $video['duration']; ?></div>
            </div>
        </div>
        
        <!-- Sección de Contenido -->
        <div class="content-section">
            <div class="content-header">
                <div class="section-title">Testimonio Verificado</div>
                <h1 class="main-title">Lo que dicen nuestros clientes</h1>
                <p class="subtitle">Experiencias reales de personas que confían en nuestros productos</p>
            </div>
            
            <!-- Testimonio -->
            <div class="testimonial-content">
                <div class="quote-text">
                    "<?php echo esc_html($testimonial['quote'] ?? ''); ?>"
                </div>
                
                <!-- Información del Cliente -->
                <div class="customer-info">
                    <div class="customer-avatar">
                        <img src="<?php echo esc_url($testimonial['customer']['avatar'] ?? ''); ?>" 
                             alt="<?php echo esc_attr($testimonial['customer']['name'] ?? ''); ?>">
                        <?php if ($testimonial['verified'] ?? false): ?>
                            <div class="verified-badge" title="Cliente Verificado">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <div class="customer-details">
                        <div class="customer-name"><?php echo esc_html($testimonial['customer']['name'] ?? ''); ?></div>
                        <div class="customer-title"><?php echo esc_html($testimonial['customer']['title'] ?? ''); ?></div>
                        <div class="customer-location"><?php echo esc_html($testimonial['customer']['location'] ?? ''); ?></div>
                    </div>
                </div>
                
                <!-- Calificación -->
                <div class="rating-section">
                    <div class="stars" data-rating="<?php echo absint($testimonial['rating'] ?? 0); ?>">
                        <?php 
                        $rating = absint($testimonial['rating'] ?? 0);
                        for ($i = 1; $i <= 5; $i++): 
                        ?>
                            <span class="star <?php echo $i <= $rating ? 'filled' : ''; ?>">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                                </svg>
                            </span>
                        <?php endfor; ?>
                    </div>
                    <div class="rating-text"><?php echo absint($testimonial['rating'] ?? 0); ?>/5 estrellas</div>
                    <div class="review-date">Verificado el <?php echo date('d/m/Y', strtotime($testimonial['date'] ?? '')); ?></div>
                </div>
            </div>
            
            <!-- Información del Producto -->
            <div class="product-info">
                <h3 class="product-name"><?php echo htmlspecialchars($product['name'] ?? ''); ?></h3>
                
                <div class="product-price">
                    <span class="current-price"><?php echo esc_html($product['currency'] ?? '') . number_format(floatval($product['price'] ?? 0), 2); ?></span>
                    <?php 
                    $original_price = floatval($product['original_price'] ?? 0);
                    $current_price = floatval($product['price'] ?? 0);
                    if (isset($product['original_price']) && $original_price > $current_price): 
                    ?>
                        <span class="original-price"><?php echo esc_html($product['currency'] ?? '') . number_format($original_price, 2); ?></span>
                        <span class="discount"><?php echo round((($original_price - $current_price) / $original_price) * 100); ?>% OFF</span>
                    <?php endif; ?>
                </div>
                
                <div class="product-features">
                    <?php foreach ($product['features'] as $feature): ?>
                        <div class="feature-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <?php echo htmlspecialchars($feature); ?>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <div class="product-rating">
                    <div class="stars" data-rating="<?php echo $product['rating']; ?>">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <span class="star <?php echo $i <= floor($product['rating']) ? 'filled' : ($i <= $product['rating'] ? 'half' : ''); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                                </svg>
                            </span>
                        <?php endfor; ?>
                    </div>
                    <span class="rating-value"><?php echo $product['rating']; ?></span>
                    <span class="reviews-count">(<?php echo number_format($product['reviews_count']); ?> reseñas)</span>
                </div>
            </div>
            
            <!-- Acciones -->
            <div class="actions-section">
                <button class="btn-primary add-to-cart" data-product-id="<?php echo absint($product['id'] ?? 0); ?>" data-price="<?php echo floatval($product['price'] ?? 0); ?>" data-currency="<?php echo esc_html($product['currency'] ?? ''); ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.35 2.65a1 1 0 00.7 1.7h12.65M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Añadir al Carrito
                </button>
                
                <div class="secondary-actions">
                    <button class="btn-secondary wishlist" data-product-id="<?php echo absint($product['id'] ?? 0); ?>" title="Añadir a lista de deseos">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Lista de Deseos
                    </button>
                    
                    <button class="btn-secondary share" title="Compartir testimonio">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Compartir
                    </button>
                </div>
            </div>
            
            <!-- Indicadores de Confianza -->
            <div class="trust-indicators">
                <div class="trust-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Envío Gratis</span>
                </div>
                
                <div class="trust-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Garantía 2 Años</span>
                </div>
                
                <div class="trust-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Devolución 30 Días</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Funcionalidad de reproducción de video
        document.addEventListener('DOMContentLoaded', function() {
            const video = document.getElementById('testimonial-video');
            const playButton = document.querySelector('.play-button');
            const videoOverlay = document.querySelector('.video-overlay');
            
            // Reproducir/pausar video
            function toggleVideo() {
                if (video.paused) {
                    video.play();
                    videoOverlay.style.opacity = '0';
                    
                    // Analytics
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'video_play', {
                            'video_title': video.dataset.videoTitle,
                            'product_id': document.querySelector('.testimonial-container').dataset.productId,
                            'testimonial_id': document.querySelector('.testimonial-container').dataset.testimonialId
                        });
                    }
                } else {
                    video.pause();
                    videoOverlay.style.opacity = '1';
                }
            }
            
            playButton.addEventListener('click', toggleVideo);
            video.addEventListener('click', toggleVideo);
            
            // Mostrar overlay cuando el video termina
            video.addEventListener('ended', function() {
                videoOverlay.style.opacity = '1';
                
                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'video_complete', {
                        'video_title': video.dataset.videoTitle,
                        'product_id': document.querySelector('.testimonial-container').dataset.productId
                    });
                }
            });
            
            // Funcionalidad de añadir al carrito
            const addToCartBtn = document.querySelector('.add-to-cart');
            addToCartBtn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                
                // Aquí iría la lógica de añadir al carrito
        
                
                // Feedback visual
                this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Añadido';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.35 2.65a1 1 0 00.7 1.7h12.65M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Añadir al Carrito';
                    this.disabled = false;
                }, 2000);
                
                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'add_to_cart', {
                        'currency': 'EUR',
                        'value': <?php echo floatval($product['price'] ?? 0); ?>,
                        'items': [{
                            'item_id': productId,
                            'item_name': <?php echo json_encode($product['name'] ?? ''); ?>,
                            'price': <?php echo floatval($product['price'] ?? 0); ?>,
                            'quantity': 1
                        }]
                    });
                }
            });
            
            // Funcionalidad de lista de deseos
            const wishlistBtn = document.querySelector('.wishlist');
            wishlistBtn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                
                // Toggle estado
                this.classList.toggle('active');
                
                if (this.classList.contains('active')) {
                    this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>En Lista';
                } else {
                    this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Lista de Deseos';
                }
                
        
            });
            
            // Funcionalidad de compartir
            const shareBtn = document.querySelector('.share');
            shareBtn.addEventListener('click', function() {
                if (navigator.share) {
                    navigator.share({
                        title: <?php echo json_encode('Testimonio - ' . ($product['name'] ?? '')); ?>,
                        text: <?php echo json_encode($testimonial['quote'] ?? ''); ?>,
                        url: window.location.href
                    });
                } else {
                    // Fallback: copiar URL al portapapeles
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('Enlace copiado al portapapeles');
                    });
                }
            });
            
            // Animaciones de entrada
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, observerOptions);
            
            // Observar elementos para animación
            document.querySelectorAll('.content-section > *').forEach(el => {
                observer.observe(el);
            });
        });
    </script>
</body>
</html>