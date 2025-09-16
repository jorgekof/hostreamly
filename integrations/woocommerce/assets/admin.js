/**
 * BunnyVault WooCommerce Integration - Admin JavaScript
 * Handles admin interface, video management, and analytics dashboard
 */

(function($) {
    'use strict';

    // Global admin object
    const BunnyVaultWCAdmin = {
        config: {
            apiUrl: bunnyvault_wc_admin.api_url,
            nonce: bunnyvault_wc_admin.nonce,
            mediaLibraryUrl: bunnyvault_wc_admin.media_library_url
        },
        
        cache: new Map(),
        currentProduct: null,
        videoLibrary: []
    };

    /**
     * Initialize admin functionality
     */
    function init() {
        console.log('BunnyVault WooCommerce Admin initialized');
        
        $(document).ready(function() {
            setupProductMetabox();
            setupBulkActions();
            setupVideoLibrary();
            setupAnalyticsDashboard();
            setupSettingsPage();
            setupShortcodeGenerator();
            setupPreviewModal();
            
            // Initialize existing elements
            initializeExistingElements();
        });
    }

    /**
     * Setup product metabox functionality
     */
    function setupProductMetabox() {
        // Video selection
        $(document).on('click', '.bunnyvault-select-video', handleVideoSelection);
        $(document).on('click', '.bunnyvault-remove-video', handleVideoRemoval);
        $(document).on('click', '.bunnyvault-preview-video', handleVideoPreview);
        
        // Gallery management
        $(document).on('click', '.bunnyvault-add-gallery-video', handleAddGalleryVideo);
        $(document).on('click', '.bunnyvault-remove-gallery-video', handleRemoveGalleryVideo);
        $(document).on('sortupdate', '.bunnyvault-gallery-videos', handleGallerySort);
        
        // Settings toggles
        $(document).on('change', '.bunnyvault-setting-toggle', handleSettingToggle);
        $(document).on('change', '.bunnyvault-video-position', handlePositionChange);
        
        // Auto-save functionality
        $(document).on('input', '.bunnyvault-metabox input, .bunnyvault-metabox select', 
            debounce(autoSaveVideoSettings, 1000));
    }

    /**
     * Handle video selection from library
     */
    function handleVideoSelection(e) {
        e.preventDefault();
        const $button = $(this);
        const targetField = $button.data('target');
        const allowMultiple = $button.data('multiple') || false;
        
        openVideoLibraryModal(targetField, allowMultiple);
    }

    /**
     * Open video library modal
     */
    function openVideoLibraryModal(targetField, allowMultiple = false) {
        const modalHtml = `
            <div id="bunnyvault-video-library-modal" class="bunnyvault-modal">
                <div class="bunnyvault-modal-content">
                    <div class="bunnyvault-modal-header">
                        <h2>Seleccionar Videos de BunnyVault</h2>
                        <span class="bunnyvault-modal-close">&times;</span>
                    </div>
                    <div class="bunnyvault-modal-body">
                        <div class="bunnyvault-library-toolbar">
                            <input type="text" id="bunnyvault-search-videos" placeholder="Buscar videos..." />
                            <select id="bunnyvault-filter-category">
                                <option value="">Todas las categorías</option>
                            </select>
                            <button type="button" id="bunnyvault-refresh-library">Actualizar</button>
                        </div>
                        <div class="bunnyvault-library-grid" id="bunnyvault-library-grid">
                            <div class="bunnyvault-loading">Cargando videos...</div>
                        </div>
                        <div class="bunnyvault-library-pagination">
                            <button type="button" id="bunnyvault-prev-page" disabled>Anterior</button>
                            <span id="bunnyvault-page-info">Página 1 de 1</span>
                            <button type="button" id="bunnyvault-next-page" disabled>Siguiente</button>
                        </div>
                    </div>
                    <div class="bunnyvault-modal-footer">
                        <button type="button" id="bunnyvault-select-videos" class="button-primary" disabled>
                            Seleccionar ${allowMultiple ? 'Videos' : 'Video'}
                        </button>
                        <button type="button" class="bunnyvault-modal-close button">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        
        // Setup modal events
        setupVideoLibraryModalEvents(targetField, allowMultiple);
        
        // Load videos
        loadVideoLibrary();
        
        // Show modal
        $('#bunnyvault-video-library-modal').fadeIn(300);
    }

    /**
     * Setup video library modal events
     */
    function setupVideoLibraryModalEvents(targetField, allowMultiple) {
        const $modal = $('#bunnyvault-video-library-modal');
        
        // Close modal
        $modal.on('click', '.bunnyvault-modal-close', closeVideoLibraryModal);
        $modal.on('click', function(e) {
            if (e.target === this) closeVideoLibraryModal();
        });
        
        // Search and filter
        $modal.on('input', '#bunnyvault-search-videos', debounce(filterVideos, 300));
        $modal.on('change', '#bunnyvault-filter-category', filterVideos);
        $modal.on('click', '#bunnyvault-refresh-library', loadVideoLibrary);
        
        // Video selection
        $modal.on('click', '.bunnyvault-library-video', function() {
            const $video = $(this);
            
            if (allowMultiple) {
                $video.toggleClass('selected');
            } else {
                $modal.find('.bunnyvault-library-video').removeClass('selected');
                $video.addClass('selected');
            }
            
            updateSelectButton();
        });
        
        // Pagination
        $modal.on('click', '#bunnyvault-prev-page', () => changePage(-1));
        $modal.on('click', '#bunnyvault-next-page', () => changePage(1));
        
        // Select videos
        $modal.on('click', '#bunnyvault-select-videos', function() {
            const selectedVideos = getSelectedVideos();
            if (selectedVideos.length > 0) {
                applyVideoSelection(targetField, selectedVideos, allowMultiple);
                closeVideoLibraryModal();
            }
        });
    }

    /**
     * Load video library from API
     */
    function loadVideoLibrary(page = 1, search = '', category = '') {
        const $grid = $('#bunnyvault-library-grid');
        $grid.html('<div class="bunnyvault-loading">Cargando videos...</div>');
        
        $.ajax({
            url: BunnyVaultWCAdmin.config.apiUrl + '/videos',
            type: 'GET',
            data: {
                page: page,
                search: search,
                category: category,
                per_page: 20
            },
            headers: {
                'X-WP-Nonce': BunnyVaultWCAdmin.config.nonce
            },
            success: function(response) {
                if (response.success) {
                    renderVideoLibrary(response.data.videos);
                    updatePagination(response.data.pagination);
                    BunnyVaultWCAdmin.videoLibrary = response.data.videos;
                } else {
                    showError('Error al cargar los videos: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                showError('Error de conexión: ' + error);
            }
        });
    }

    /**
     * Render video library grid
     */
    function renderVideoLibrary(videos) {
        const $grid = $('#bunnyvault-library-grid');
        
        if (videos.length === 0) {
            $grid.html('<div class="bunnyvault-no-videos">No se encontraron videos.</div>');
            return;
        }
        
        let html = '';
        videos.forEach(video => {
            html += `
                <div class="bunnyvault-library-video" data-video-id="${video.id}">
                    <div class="bunnyvault-video-thumbnail">
                        <img src="${video.thumbnail}" alt="${video.title}" />
                        <div class="bunnyvault-video-duration">${formatDuration(video.duration)}</div>
                        <div class="bunnyvault-video-overlay">
                            <div class="bunnyvault-play-icon"></div>
                        </div>
                    </div>
                    <div class="bunnyvault-video-info">
                        <h4 class="bunnyvault-video-title">${video.title}</h4>
                        <p class="bunnyvault-video-description">${truncateText(video.description, 100)}</p>
                        <div class="bunnyvault-video-meta">
                            <span class="bunnyvault-video-views">${formatNumber(video.views)} vistas</span>
                            <span class="bunnyvault-video-date">${formatDate(video.created_at)}</span>
                        </div>
                    </div>
                    <div class="bunnyvault-video-actions">
                        <button type="button" class="bunnyvault-preview-btn" data-video-id="${video.id}">
                            Vista previa
                        </button>
                    </div>
                </div>
            `;
        });
        
        $grid.html(html);
    }

    /**
     * Handle video removal
     */
    function handleVideoRemoval(e) {
        e.preventDefault();
        const $button = $(this);
        const $container = $button.closest('.bunnyvault-video-item');
        const videoId = $container.data('video-id');
        
        if (confirm('¿Estás seguro de que quieres eliminar este video?')) {
            $container.fadeOut(300, function() {
                $(this).remove();
                updateVideoInputs();
            });
            
            // Track removal
            trackAdminEvent('video_removed', {
                video_id: videoId,
                product_id: getCurrentProductId()
            });
        }
    }

    /**
     * Handle video preview
     */
    function handleVideoPreview(e) {
        e.preventDefault();
        const $button = $(this);
        const videoId = $button.data('video-id');
        
        openVideoPreviewModal(videoId);
    }

    /**
     * Open video preview modal
     */
    function openVideoPreviewModal(videoId) {
        const modalHtml = `
            <div id="bunnyvault-preview-modal" class="bunnyvault-modal bunnyvault-preview-modal">
                <div class="bunnyvault-modal-content">
                    <div class="bunnyvault-modal-header">
                        <h2>Vista Previa del Video</h2>
                        <span class="bunnyvault-modal-close">&times;</span>
                    </div>
                    <div class="bunnyvault-modal-body">
                        <div class="bunnyvault-preview-container">
                            <iframe src="${BunnyVaultWCAdmin.config.mediaLibraryUrl}/embed/${videoId}?autoplay=1" 
                                    frameborder="0" allowfullscreen></iframe>
                        </div>
                        <div class="bunnyvault-preview-info">
                            <div class="bunnyvault-loading">Cargando información del video...</div>
                        </div>
                    </div>
                    <div class="bunnyvault-modal-footer">
                        <button type="button" class="bunnyvault-modal-close button">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        
        // Setup modal events
        const $modal = $('#bunnyvault-preview-modal');
        $modal.on('click', '.bunnyvault-modal-close', function() {
            $modal.fadeOut(300, function() {
                $(this).remove();
            });
        });
        
        // Load video info
        loadVideoInfo(videoId);
        
        // Show modal
        $modal.fadeIn(300);
    }

    /**
     * Load video information
     */
    function loadVideoInfo(videoId) {
        $.ajax({
            url: BunnyVaultWCAdmin.config.apiUrl + '/videos/' + videoId,
            type: 'GET',
            headers: {
                'X-WP-Nonce': BunnyVaultWCAdmin.config.nonce
            },
            success: function(response) {
                if (response.success) {
                    renderVideoInfo(response.data);
                } else {
                    $('.bunnyvault-preview-info').html('<div class="error">Error al cargar la información del video.</div>');
                }
            },
            error: function() {
                $('.bunnyvault-preview-info').html('<div class="error">Error de conexión.</div>');
            }
        });
    }

    /**
     * Render video information
     */
    function renderVideoInfo(video) {
        const infoHtml = `
            <div class="bunnyvault-video-details">
                <h3>${video.title}</h3>
                <p class="description">${video.description}</p>
                <div class="bunnyvault-video-stats">
                    <div class="stat">
                        <span class="label">Duración:</span>
                        <span class="value">${formatDuration(video.duration)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Vistas:</span>
                        <span class="value">${formatNumber(video.views)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Tamaño:</span>
                        <span class="value">${formatFileSize(video.file_size)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Resolución:</span>
                        <span class="value">${video.width}x${video.height}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Creado:</span>
                        <span class="value">${formatDate(video.created_at)}</span>
                    </div>
                </div>
                <div class="bunnyvault-shortcode-example">
                    <h4>Shortcode de ejemplo:</h4>
                    <code>[bunnyvault id="${video.id}" responsive="true"]</code>
                    <button type="button" class="bunnyvault-copy-shortcode" data-shortcode='[bunnyvault id="${video.id}" responsive="true"]'>
                        Copiar
                    </button>
                </div>
            </div>
        `;
        
        $('.bunnyvault-preview-info').html(infoHtml);
        
        // Setup copy functionality
        $('.bunnyvault-copy-shortcode').on('click', function() {
            const shortcode = $(this).data('shortcode');
            copyToClipboard(shortcode);
            $(this).text('¡Copiado!').addClass('copied');
            setTimeout(() => {
                $(this).text('Copiar').removeClass('copied');
            }, 2000);
        });
    }

    /**
     * Setup bulk actions
     */
    function setupBulkActions() {
        // Add bulk action to products list
        if ($('#bulk-action-selector-top').length) {
            $('#bulk-action-selector-top, #bulk-action-selector-bottom').append(
                '<option value="bunnyvault_add_video">Agregar Video BunnyVault</option>'
            );
        }
        
        // Handle bulk action
        $(document).on('click', '#doaction, #doaction2', function(e) {
            const action = $(this).prev('select').val();
            if (action === 'bunnyvault_add_video') {
                e.preventDefault();
                handleBulkVideoAdd();
            }
        });
    }

    /**
     * Handle bulk video addition
     */
    function handleBulkVideoAdd() {
        const selectedProducts = [];
        $('input[name="post[]"]:checked').each(function() {
            selectedProducts.push($(this).val());
        });
        
        if (selectedProducts.length === 0) {
            alert('Por favor selecciona al menos un producto.');
            return;
        }
        
        openBulkVideoModal(selectedProducts);
    }

    /**
     * Setup analytics dashboard
     */
    function setupAnalyticsDashboard() {
        if ($('#bunnyvault-analytics-dashboard').length) {
            loadAnalyticsDashboard();
            
            // Setup refresh button
            $(document).on('click', '#bunnyvault-refresh-analytics', loadAnalyticsDashboard);
            
            // Setup date range picker
            $(document).on('change', '#bunnyvault-date-range', loadAnalyticsDashboard);
        }
    }

    /**
     * Load analytics dashboard data
     */
    function loadAnalyticsDashboard() {
        const dateRange = $('#bunnyvault-date-range').val() || '30';
        
        $.ajax({
            url: bunnyvault_wc_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'bunnyvault_wc_get_analytics',
                nonce: BunnyVaultWCAdmin.config.nonce,
                date_range: dateRange
            },
            success: function(response) {
                if (response.success) {
                    renderAnalyticsDashboard(response.data);
                } else {
                    showError('Error al cargar las analíticas: ' + response.message);
                }
            },
            error: function() {
                showError('Error de conexión al cargar las analíticas.');
            }
        });
    }

    /**
     * Render analytics dashboard
     */
    function renderAnalyticsDashboard(data) {
        const $dashboard = $('#bunnyvault-analytics-dashboard');
        
        const dashboardHtml = `
            <div class="bunnyvault-analytics-grid">
                <div class="bunnyvault-stat-card">
                    <h3>Videos Visualizados</h3>
                    <div class="stat-number">${formatNumber(data.total_views)}</div>
                    <div class="stat-change ${data.views_change >= 0 ? 'positive' : 'negative'}">
                        ${data.views_change >= 0 ? '+' : ''}${data.views_change}%
                    </div>
                </div>
                <div class="bunnyvault-stat-card">
                    <h3>Tiempo Total de Visualización</h3>
                    <div class="stat-number">${formatDuration(data.total_watch_time)}</div>
                    <div class="stat-change ${data.watch_time_change >= 0 ? 'positive' : 'negative'}">
                        ${data.watch_time_change >= 0 ? '+' : ''}${data.watch_time_change}%
                    </div>
                </div>
                <div class="bunnyvault-stat-card">
                    <h3>Conversiones</h3>
                    <div class="stat-number">${formatNumber(data.conversions)}</div>
                    <div class="stat-change ${data.conversion_change >= 0 ? 'positive' : 'negative'}">
                        ${data.conversion_change >= 0 ? '+' : ''}${data.conversion_change}%
                    </div>
                </div>
                <div class="bunnyvault-stat-card">
                    <h3>Tasa de Conversión</h3>
                    <div class="stat-number">${data.conversion_rate}%</div>
                    <div class="stat-change ${data.conversion_rate_change >= 0 ? 'positive' : 'negative'}">
                        ${data.conversion_rate_change >= 0 ? '+' : ''}${data.conversion_rate_change}%
                    </div>
                </div>
            </div>
            <div class="bunnyvault-charts">
                <div class="bunnyvault-chart-container">
                    <h3>Videos Más Populares</h3>
                    <div id="bunnyvault-popular-videos-chart"></div>
                </div>
                <div class="bunnyvault-chart-container">
                    <h3>Productos con Mejor Rendimiento</h3>
                    <div id="bunnyvault-top-products-chart"></div>
                </div>
            </div>
        `;
        
        $dashboard.html(dashboardHtml);
        
        // Render charts if data available
        if (data.popular_videos) {
            renderPopularVideosChart(data.popular_videos);
        }
        if (data.top_products) {
            renderTopProductsChart(data.top_products);
        }
    }

    /**
     * Setup shortcode generator
     */
    function setupShortcodeGenerator() {
        if ($('#bunnyvault-shortcode-generator').length) {
            $(document).on('click', '#bunnyvault-generate-shortcode', generateShortcode);
            $(document).on('click', '#bunnyvault-copy-generated-shortcode', copyGeneratedShortcode);
        }
    }

    /**
     * Auto-save video settings
     */
    function autoSaveVideoSettings() {
        const productId = getCurrentProductId();
        if (!productId) return;
        
        const videoData = collectVideoData();
        
        $.ajax({
            url: bunnyvault_wc_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'bunnyvault_wc_save_video_settings',
                nonce: BunnyVaultWCAdmin.config.nonce,
                product_id: productId,
                video_data: JSON.stringify(videoData)
            },
            success: function(response) {
                if (response.success) {
                    showNotice('Configuración guardada automáticamente', 'success');
                }
            }
        });
    }

    /**
     * Utility functions
     */
    
    function closeVideoLibraryModal() {
        $('#bunnyvault-video-library-modal').fadeOut(300, function() {
            $(this).remove();
        });
    }
    
    function getSelectedVideos() {
        const selected = [];
        $('.bunnyvault-library-video.selected').each(function() {
            const videoId = $(this).data('video-id');
            const videoData = BunnyVaultWCAdmin.videoLibrary.find(v => v.id === videoId);
            if (videoData) {
                selected.push(videoData);
            }
        });
        return selected;
    }
    
    function applyVideoSelection(targetField, videos, allowMultiple) {
        if (targetField === 'main_video') {
            setMainVideo(videos[0]);
        } else if (targetField === 'gallery_videos') {
            addGalleryVideos(videos);
        }
    }
    
    function setMainVideo(video) {
        $('#bunnyvault_main_video_id').val(video.id);
        updateMainVideoPreview(video);
    }
    
    function addGalleryVideos(videos) {
        const $gallery = $('.bunnyvault-gallery-videos');
        videos.forEach(video => {
            const videoHtml = createGalleryVideoHtml(video);
            $gallery.append(videoHtml);
        });
        updateVideoInputs();
    }
    
    function updateVideoInputs() {
        const videoIds = [];
        $('.bunnyvault-gallery-video-item').each(function() {
            videoIds.push($(this).data('video-id'));
        });
        $('#bunnyvault_gallery_video_ids').val(videoIds.join(','));
    }
    
    function getCurrentProductId() {
        return $('#post_ID').val() || $('input[name="post_ID"]').val();
    }
    
    function collectVideoData() {
        return {
            main_video_id: $('#bunnyvault_main_video_id').val(),
            gallery_video_ids: $('#bunnyvault_gallery_video_ids').val(),
            video_position: $('#bunnyvault_video_position').val(),
            autoplay: $('#bunnyvault_autoplay').is(':checked'),
            muted: $('#bunnyvault_muted').is(':checked'),
            loop: $('#bunnyvault_loop').is(':checked'),
            responsive: $('#bunnyvault_responsive').is(':checked')
        };
    }
    
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    function formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    }
    
    function formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }
    
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
    
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
    
    function showNotice(message, type = 'info') {
        const noticeHtml = `
            <div class="notice notice-${type} is-dismissible bunnyvault-notice">
                <p>${message}</p>
                <button type="button" class="notice-dismiss">
                    <span class="screen-reader-text">Descartar este aviso.</span>
                </button>
            </div>
        `;
        
        $('.wrap h1').after(noticeHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            $('.bunnyvault-notice').fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }
    
    function showError(message) {
        showNotice(message, 'error');
    }
    
    function trackAdminEvent(eventName, data) {
        $.ajax({
            url: bunnyvault_wc_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'bunnyvault_wc_track_admin_event',
                nonce: BunnyVaultWCAdmin.config.nonce,
                event_name: eventName,
                event_data: JSON.stringify(data)
            }
        });
    }
    
    function initializeExistingElements() {
        // Initialize sortable galleries
        if ($.fn.sortable) {
            $('.bunnyvault-gallery-videos').sortable({
                items: '.bunnyvault-gallery-video-item',
                handle: '.bunnyvault-drag-handle',
                update: function() {
                    updateVideoInputs();
                }
            });
        }
        
        // Initialize color pickers
        if ($.fn.wpColorPicker) {
            $('.bunnyvault-color-picker').wpColorPicker();
        }
    }

    // Initialize when script loads
    init();

    // Expose public API
    window.BunnyVaultWCAdmin = {
        init: init,
        openVideoLibraryModal: openVideoLibraryModal,
        loadVideoLibrary: loadVideoLibrary,
        trackAdminEvent: trackAdminEvent,
        config: BunnyVaultWCAdmin.config
    };

})(jQuery);