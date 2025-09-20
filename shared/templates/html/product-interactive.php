<?php
/**
 * Plantilla de Video Interactivo de Producto
 * 
 * Esta plantilla muestra un video interactivo con hotspots clickeables
 * que revelan información detallada sobre características del producto
 */

// Obtener datos del producto
$product_id = isset($_GET['product_id']) ? absint($_GET['product_id']) : 1;
$video_id = isset($_GET['video_id']) ? absint($_GET['video_id']) : 1;

// Datos del producto (normalmente desde base de datos)
$product = [
    'id' => $product_id,
    'name' => 'Smartphone Pro Max 256GB',
    'subtitle' => 'La tecnología más avanzada en tus manos',
    'price' => 899.99,
    'original_price' => 1099.99,
    'currency' => '$',
    'rating' => 4.8,
    'reviews_count' => 2847,
    'in_stock' => true
];

// Validar que $product es un array
if (!is_array($product)) {
    $product = [];
}

// Datos del video
$video = [
    'url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'poster' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=800&fit=crop',
    'duration' => 180, // segundos
    'title' => 'Demostración Interactiva - Smartphone Pro Max'
];

// Hotspots interactivos con timestamps
$hotspots = [
    [
        'id' => 1,
        'title' => 'Cámara Triple 48MP',
        'description' => 'Sistema de cámara profesional con IA',
        'x' => 65, // porcentaje desde la izquierda
        'y' => 30, // porcentaje desde arriba
        'timestamp' => 15, // segundo en el video
        'details' => [
            'Resolución' => '48MP + 12MP + 12MP',
            'Apertura' => 'f/1.6, f/2.4, f/2.2',
            'Zoom' => 'Hasta 10x óptico',
            'Video' => '4K a 60fps',
            'Estabilización' => 'OIS + EIS'
        ],
        'icon' => '📷'
    ],
    [
        'id' => 2,
        'title' => 'Pantalla OLED 6.7"',
        'description' => 'Display ProMotion con 120Hz',
        'x' => 50,
        'y' => 45,
        'timestamp' => 45,
        'details' => [
            'Tamaño' => '6.7 pulgadas',
            'Resolución' => '2796 x 1290 píxeles',
            'Tecnología' => 'Super Retina XDR OLED',
            'Frecuencia' => '120Hz ProMotion',
            'Brillo' => 'Hasta 2000 nits'
        ],
        'icon' => '📱'
    ],
    [
        'id' => 3,
        'title' => 'Chip A17 Pro',
        'description' => 'Procesador de última generación',
        'x' => 35,
        'y' => 60,
        'timestamp' => 75,
        'details' => [
            'Proceso' => '3nm',
            'CPU' => '6 núcleos',
            'GPU' => '6 núcleos',
            'Neural Engine' => '16 núcleos',
            'Rendimiento' => '20% más rápido'
        ],
        'icon' => '⚡'
    ],
    [
        'id' => 4,
        'title' => 'Batería Todo el Día',
        'description' => 'Hasta 29 horas de reproducción de video',
        'x' => 20,
        'y' => 75,
        'timestamp' => 105,
        'details' => [
            'Capacidad' => '4422 mAh',
            'Carga rápida' => '20W',
            'Carga inalámbrica' => '15W MagSafe',
            'Duración video' => 'Hasta 29 horas',
            'Duración audio' => 'Hasta 95 horas'
        ],
        'icon' => '🔋'
    ],
    [
        'id' => 5,
        'title' => 'Resistencia IP68',
        'description' => 'Resistente al agua y polvo',
        'x' => 80,
        'y' => 70,
        'timestamp' => 135,
        'details' => [
            'Certificación' => 'IP68',
            'Profundidad' => 'Hasta 6 metros',
            'Tiempo' => 'Hasta 30 minutos',
            'Protección' => 'Agua, polvo, salpicaduras',
            'Materiales' => 'Ceramic Shield'
        ],
        'icon' => '💧'
    ]
];

// Validar que $hotspots es un array
if (!is_array($hotspots)) {
    $hotspots = [];
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Interactivo - <?php echo htmlspecialchars($product['name']); ?></title>
    <link rel="stylesheet" href="../css/product-interactive.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Estilos críticos incrustados -->
    <style>
        .interactive-container {
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
    <div class="interactive-container" data-product-id="<?php echo $product['id']; ?>" data-video-id="<?php echo $video_id; ?>">
        <div class="interactive-wrapper">
            
            <!-- Sección de Video -->
            <div class="video-section">
                <div class="video-container">
                    <video 
                        id="interactive-video"
                        poster="<?php echo htmlspecialchars($video['poster']); ?>"
                        preload="metadata"
                        playsinline
                        data-duration="<?php echo $video['duration']; ?>"
                        data-video-title="<?php echo htmlspecialchars($video['title']); ?>"
                    >
                        <source src="<?php echo htmlspecialchars($video['url']); ?>" type="video/mp4">
                        Tu navegador no soporta el elemento de video.
                    </video>
                    
                    <!-- Hotspots Interactivos -->
                    <?php if (is_array($hotspots)): ?>
                    <?php foreach ($hotspots as $hotspot): ?>
                        <?php if (is_array($hotspot)): ?>
                        <div class="hotspot" 
                             data-hotspot-id="<?php echo absint($hotspot['id'] ?? 0); ?>"
                             data-timestamp="<?php echo absint($hotspot['timestamp'] ?? 0); ?>"
                             style="left: <?php echo floatval($hotspot['x'] ?? 0); ?>%; top: <?php echo floatval($hotspot['y'] ?? 0); ?>%;"
                        >
                            <div class="hotspot-tooltip">
                                <?php echo htmlspecialchars($hotspot['title'] ?? ''); ?>
                            </div>
                        </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
                    <?php endif; ?>
                    
                    <!-- Controles de Video -->
                    <div class="video-controls">
                        <div class="controls-row">
                            <button class="play-pause-btn" aria-label="Reproducir/Pausar">
                                <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 5v14l11-7z" fill="currentColor"/>
                                </svg>
                                <svg class="pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" style="display: none;">
                                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>
                                </svg>
                            </button>
                            
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            
                            <div class="time-display">
                                <span class="current-time">0:00</span> / <span class="total-time"><?php echo gmdate('i:s', $video['duration']); ?></span>
                            </div>
                            
                            <div class="volume-control">
                                <button class="volume-btn" aria-label="Silenciar">
                                    <svg class="volume-on" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <svg class="volume-off" width="20" height="20" viewBox="0 0 24 24" fill="none" style="display: none;">
                                        <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
                            </div>
                            
                            <button class="fullscreen-btn" aria-label="Pantalla completa">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Indicador de Progreso -->
                    <div class="progress-indicator">
                        <span class="current-hotspot">1</span> de <?php echo is_array($hotspots) ? count($hotspots) : 0; ?> características
                    </div>
                </div>
            </div>
            
            <!-- Panel Lateral -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <h1 class="product-title"><?php echo esc_html($product['name'] ?? ''); ?></h1>
                    <p class="product-subtitle"><?php echo esc_html($product['subtitle'] ?? ''); ?></p>
                    
                    <div class="product-price">
                        <span class="current-price"><?php echo esc_html($product['currency'] ?? '') . number_format(floatval($product['price'] ?? 0), 2); ?></span>
                        <?php if (isset($product['original_price'], $product['price']) && floatval($product['original_price']) > floatval($product['price'])): ?>
                            <span class="original-price"><?php echo esc_html($product['currency'] ?? '') . number_format(floatval($product['original_price']), 2); ?></span>
                            <span class="discount-badge"><?php echo round(((floatval($product['original_price']) - floatval($product['price'])) / floatval($product['original_price'])) * 100); ?>% OFF</span>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Sección de Hotspots -->
                <div class="hotspots-section">
                    <h2 class="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
                        </svg>
                        Características Interactivas
                    </h2>
                    
                    <div class="hotspot-list">
                        <?php if (is_array($hotspots)): ?>
                        <?php foreach ($hotspots as $index => $hotspot): ?>
                            <?php if (is_array($hotspot)): ?>
                            <div class="hotspot-item <?php echo $index === 0 ? 'active' : ''; ?>" 
                                 data-hotspot-id="<?php echo absint($hotspot['id'] ?? 0); ?>"
                                 data-timestamp="<?php echo absint($hotspot['timestamp'] ?? 0); ?>">
                                
                                <div class="hotspot-item-header">
                                    <div class="hotspot-icon"><?php echo esc_html($hotspot['icon'] ?? ''); ?></div>
                                    <div>
                                        <h3 class="hotspot-title"><?php echo esc_html($hotspot['title'] ?? ''); ?></h3>
                                        <p class="hotspot-description"><?php echo esc_html($hotspot['description'] ?? ''); ?></p>
                                    </div>
                                </div>
                                
                                <div class="hotspot-details">
                                    <?php if (is_array($hotspot['details'] ?? [])): ?>
                                    <?php foreach ($hotspot['details'] as $label => $value): ?>
                                        <div class="detail-row">
                                            <span class="detail-label"><?php echo esc_html($label); ?>:</span>
                                            <span class="detail-value"><?php echo esc_html($value); ?></span>
                                        </div>
                                    <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <?php endif; ?>
                        <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Acciones -->
                <div class="actions-section">
                    <button class="btn btn-primary add-to-cart" data-product-id="<?php echo absint($product['id'] ?? 0); ?>">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.35 2.65a1 1 0 00.7 1.7h12.65M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Añadir al Carrito - <?php echo esc_html($product['currency'] ?? '') . number_format(floatval($product['price'] ?? 0), 2); ?>
                    </button>
                    
                    <div class="secondary-actions">
                        <button class="btn btn-secondary wishlist" data-product-id="<?php echo absint($product['id'] ?? 0); ?>" title="Añadir a lista de deseos">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Favoritos
                        </button>
                        
                        <button class="btn btn-secondary share" title="Compartir producto">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Compartir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Funcionalidad de video interactivo
        document.addEventListener('DOMContentLoaded', function() {
            const video = document.getElementById('interactive-video');
            const playPauseBtn = document.querySelector('.play-pause-btn');
            const playIcon = document.querySelector('.play-icon');
            const pauseIcon = document.querySelector('.pause-icon');
            const progressBar = document.querySelector('.progress-bar');
            const progressFill = document.querySelector('.progress-fill');
            const currentTimeSpan = document.querySelector('.current-time');
            const volumeBtn = document.querySelector('.volume-btn');
            const volumeSlider = document.querySelector('.volume-slider');
            const volumeOnIcon = document.querySelector('.volume-on');
            const volumeOffIcon = document.querySelector('.volume-off');
            const fullscreenBtn = document.querySelector('.fullscreen-btn');
            const hotspots = document.querySelectorAll('.hotspot');
            const hotspotItems = document.querySelectorAll('.hotspot-item');
            const progressIndicator = document.querySelector('.current-hotspot');
            
            let currentHotspotIndex = 0;
            const hotspotData = <?php echo json_encode($hotspots); ?>;
            
            // Reproducir/pausar video
            function togglePlayPause() {
                if (video.paused) {
                    video.play();
                    playIcon.style.display = 'none';
                    pauseIcon.style.display = 'block';
                    document.querySelector('.video-container').classList.add('playing');
                } else {
                    video.pause();
                    playIcon.style.display = 'block';
                    pauseIcon.style.display = 'none';
                    document.querySelector('.video-container').classList.remove('playing');
                }
            }
            
            playPauseBtn.addEventListener('click', togglePlayPause);
            video.addEventListener('click', togglePlayPause);
            
            // Actualizar progreso
            video.addEventListener('timeupdate', function() {
                const progress = (video.currentTime / video.duration) * 100;
                progressFill.style.width = progress + '%';
                
                // Actualizar tiempo actual
                const minutes = Math.floor(video.currentTime / 60);
                const seconds = Math.floor(video.currentTime % 60);
                currentTimeSpan.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                
                // Activar hotspots según el tiempo
                updateActiveHotspot(video.currentTime);
            });
            
            // Buscar en el video
            progressBar.addEventListener('click', function(e) {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickRatio = clickX / rect.width;
                video.currentTime = clickRatio * video.duration;
            });
            
            // Control de volumen
            volumeBtn.addEventListener('click', function() {
                video.muted = !video.muted;
                if (video.muted) {
                    volumeOnIcon.style.display = 'none';
                    volumeOffIcon.style.display = 'block';
                    volumeSlider.value = 0;
                } else {
                    volumeOnIcon.style.display = 'block';
                    volumeOffIcon.style.display = 'none';
                    volumeSlider.value = video.volume;
                }
            });
            
            volumeSlider.addEventListener('input', function() {
                video.volume = this.value;
                video.muted = this.value == 0;
                
                if (video.muted || this.value == 0) {
                    volumeOnIcon.style.display = 'none';
                    volumeOffIcon.style.display = 'block';
                } else {
                    volumeOnIcon.style.display = 'block';
                    volumeOffIcon.style.display = 'none';
                }
            });
            
            // Pantalla completa
            fullscreenBtn.addEventListener('click', function() {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.querySelector('.video-container').requestFullscreen();
                }
            });
            
            // Funcionalidad de hotspots
            function updateActiveHotspot(currentTime) {
                let activeIndex = -1;
                
                for (let i = 0; i < hotspotData.length; i++) {
                    if (currentTime >= hotspotData[i].timestamp) {
                        activeIndex = i;
                    }
                }
                
                if (activeIndex !== currentHotspotIndex && activeIndex >= 0) {
                    currentHotspotIndex = activeIndex;
                    
                    // Actualizar hotspots visuales
                    hotspots.forEach((hotspot, index) => {
                        hotspot.classList.toggle('active', index === activeIndex);
                    });
                    
                    // Actualizar elementos de la lista
                    hotspotItems.forEach((item, index) => {
                        item.classList.toggle('active', index === activeIndex);
                    });
                    
                    // Actualizar indicador de progreso
                    progressIndicator.textContent = activeIndex + 1;
                    
                    // Analytics
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'hotspot_activated', {
                            'hotspot_id': hotspotData[activeIndex].id,
                            'hotspot_title': hotspotData[activeIndex].title,
                            'video_time': currentTime
                        });
                    }
                }
            }
            
            // Click en hotspots
            hotspots.forEach((hotspot, index) => {
                hotspot.addEventListener('click', function() {
                    const timestamp = parseInt(this.dataset.timestamp);
                    video.currentTime = timestamp;
                    
                    // Analytics
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'hotspot_clicked', {
                            'hotspot_id': this.dataset.hotspotId,
                            'timestamp': timestamp
                        });
                    }
                });
            });
            
            // Click en elementos de la lista
            hotspotItems.forEach((item, index) => {
                item.addEventListener('click', function() {
                    const timestamp = parseInt(this.dataset.timestamp);
                    video.currentTime = timestamp;
                    
                    // Activar elemento
                    hotspotItems.forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                });
            });
            
            // Funcionalidad de añadir al carrito
            const addToCartBtn = document.querySelector('.add-to-cart');
            addToCartBtn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                
                // Aquí iría la lógica de añadir al carrito
                console.log('Añadiendo producto al carrito:', productId);
                
                // Feedback visual
                const originalText = this.innerHTML;
                this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>¡Añadido al Carrito!';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 3000);
                
                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'add_to_cart', {
                            'currency': 'EUR',
                            'value': <?php echo json_encode($product['price']); ?>,
                            'items': [{
                                'item_id': productId,
                                'item_name': <?php echo json_encode($product['name']); ?>,
                                'price': <?php echo json_encode($product['price']); ?>,
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
                    this.style.background = 'var(--error-color)';
                    this.style.color = 'white';
                } else {
                    this.style.background = '';
                    this.style.color = '';
                }
                
                console.log('Producto en lista de deseos:', productId, this.classList.contains('active'));
            });
            
            // Funcionalidad de compartir
            const shareBtn = document.querySelector('.share');
            shareBtn.addEventListener('click', function() {
                if (navigator.share) {
                    navigator.share({
                        title: <?php echo json_encode($product['name']); ?>,
                        text: 'Descubre las características de este increíble producto',
                        url: window.location.href
                    });
                } else {
                    // Fallback: copiar URL al portapapeles
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('Enlace copiado al portapapeles');
                    });
                }
            });
            
            // Navegación por teclado
            document.addEventListener('keydown', function(e) {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        togglePlayPause();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        video.currentTime = Math.max(0, video.currentTime - 10);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        video.currentTime = Math.min(video.duration, video.currentTime + 10);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        video.volume = Math.min(1, video.volume + 0.1);
                        volumeSlider.value = video.volume;
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        video.volume = Math.max(0, video.volume - 0.1);
                        volumeSlider.value = video.volume;
                        break;
                    case 'KeyM':
                        e.preventDefault();
                        volumeBtn.click();
                        break;
                    case 'KeyF':
                        e.preventDefault();
                        fullscreenBtn.click();
                        break;
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
            document.querySelectorAll('.sidebar > *').forEach(el => {
                observer.observe(el);
            });
            
            // Analytics de carga de página
            if (typeof gtag !== 'undefined') {
                gtag('event', 'interactive_video_loaded', {
                    'product_id': document.querySelector('.interactive-container').dataset.productId,
                    'video_id': document.querySelector('.interactive-container').dataset.videoId,
                    'hotspots_count': hotspotData.length
                });
            }
        });
    </script>
</body>
</html>