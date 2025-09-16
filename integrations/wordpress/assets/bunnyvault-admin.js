/**
 * JavaScript para Hostreamly Video Player Admin
 * Version: 2.0.0
 */

(function($) {
    'use strict';
    
    // Variables globales
    let currentEditor = null;
    
    $(document).ready(function() {
        initBunnyVaultAdmin();
    });
    
    /**
     * Inicializar funcionalidad del admin
     */
    function initBunnyVaultAdmin() {
        // Crear modal
        createModal();
        
        // Agregar event listeners
        bindEvents();
        
        // Inicializar tooltips
        initTooltips();
    }
    
    /**
     * Crear modal HTML
     */
    function createModal() {
        const modalHTML = `
            <div id="hostreamly-modal" class="hostreamly-modal">
                <div class="hostreamly-modal-content">
                    <span class="hostreamly-close">&times;</span>
                    <h2>🎬 Insertar Video Hostreamly</h2>
                    
                    <form id="hostreamly-form">
                        <div class="form-group">
                            <label for="bunnyvault-video-id">ID del Video *</label>
                            <input type="text" id="hostreamly-video-id" name="video_id" 
                                   placeholder="Ej: abc123xyz" required>
                            <small>Puedes encontrar el ID en la URL del video o en tu dashboard de Hostreamly</small>
                        </div>
                        
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="hostreamly-responsive" name="responsive" checked>
                                <label for="hostreamly-responsive">Video Responsive</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="hostreamly-autoplay" name="autoplay">
                                <label for="hostreamly-autoplay">Reproducción Automática</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="hostreamly-muted" name="muted">
                                <label for="hostreamly-muted">Silenciado</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="hostreamly-loop" name="loop">
                                <label for="hostreamly-loop">Reproducir en Bucle</label>
                            </div>
                        </div>
                        
                        <div id="hostreamly-dimensions" style="display: none;">
                            <div style="display: flex; gap: 15px;">
                                <div style="flex: 1;">
                                    <label for="bunnyvault-width">Ancho</label>
                                    <input type="text" id="hostreamly-width" name="width" 
                                           value="640" placeholder="640">
                                </div>
                                <div style="flex: 1;">
                                    <label for="bunnyvault-height">Alto</label>
                                    <input type="text" id="hostreamly-height" name="height" 
                                           value="360" placeholder="360">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="bunnyvault-class">Clase CSS (opcional)</label>
                            <input type="text" id="hostreamly-class" name="class" 
                                   placeholder="mi-clase-personalizada">
                        </div>
                        
                        <div class="button-group">
                            <button type="button" class="button button-secondary" id="hostreamly-cancel">
                                Cancelar
                            </button>
                            <button type="submit" class="button button-primary" id="hostreamly-insert">
                                🎥 Insertar Video
                            </button>
                        </div>
                    </form>
                    
                    <div id="hostreamly-preview" style="display: none; margin-top: 20px;">
                        <h3>Vista Previa del Shortcode:</h3>
                        <code id="hostreamly-shortcode-preview"></code>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHTML);
    }
    
    /**
     * Vincular eventos
     */
    function bindEvents() {
        // Botón para abrir modal
        $(document).on('click', '.hostreamly-media-button', function(e) {
            e.preventDefault();
            currentEditor = $(this).data('editor') || 'content';
            openModal();
        });
        
        // Cerrar modal
        $(document).on('click', '.hostreamly-close, #hostreamly-cancel', function() {
            closeModal();
        });
        
        // Cerrar modal al hacer clic fuera
        $(document).on('click', '#hostreamly-modal', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Toggle dimensiones
        $(document).on('change', '#hostreamly-responsive', function() {
            const dimensionsDiv = $('#hostreamly-dimensions');
            if ($(this).is(':checked')) {
                dimensionsDiv.hide();
            } else {
                dimensionsDiv.show();
            }
        });
        
        // Auto-check muted cuando autoplay está activado
        $(document).on('change', '#hostreamly-autoplay', function() {
            if ($(this).is(':checked')) {
                $('#hostreamly-muted').prop('checked', true);
                showNotification('Nota: El video se silenciará automáticamente para cumplir con las políticas del navegador.', 'info');
            }
        });
        
        // Preview en tiempo real
        $(document).on('input change', '#hostreamly-form input', function() {
            updatePreview();
        });
        
        // Enviar formulario
        $(document).on('submit', '#hostreamly-form', function(e) {
            e.preventDefault();
            insertVideo();
        });
        
        // Atajos de teclado
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $('#hostreamly-modal').is(':visible')) {
                closeModal();
            }
        });
    }
    
    /**
     * Abrir modal
     */
    function openModal() {
        $('#hostreamly-modal').fadeIn(300);
        $('#hostreamly-video-id').focus();
        resetForm();
    }
    
    /**
     * Cerrar modal
     */
    function closeModal() {
        $('#hostreamly-modal').fadeOut(300);
        resetForm();
    }
    
    /**
     * Resetear formulario
     */
    function resetForm() {
        $('#hostreamly-form')[0].reset();
        $('#hostreamly-responsive').prop('checked', true);
        $('#hostreamly-dimensions').hide();
        $('#hostreamly-preview').hide();
        $('#hostreamly-width').val('640');
        $('#hostreamly-height').val('360');
    }
    
    /**
     * Actualizar preview
     */
    function updatePreview() {
        const videoId = $('#hostreamly-video-id').val().trim();
        
        if (!videoId) {
            $('#hostreamly-preview').hide();
            return;
        }
        
        const shortcode = generateShortcode();
        $('#hostreamly-shortcode-preview').text(shortcode);
        $('#hostreamly-preview').show();
    }
    
    /**
     * Generar shortcode
     */
    function generateShortcode() {
        const videoId = $('#hostreamly-video-id').val().trim();
        const responsive = $('#hostreamly-responsive').is(':checked');
        const autoplay = $('#hostreamly-autoplay').is(':checked');
        const muted = $('#hostreamly-muted').is(':checked');
        const loop = $('#hostreamly-loop').is(':checked');
        const width = $('#hostreamly-width').val() || '640';
        const height = $('#hostreamly-height').val() || '360';
        const customClass = $('#hostreamly-class').val().trim();
        
        let shortcode = `[hostreamly id="${videoId}"`;
        
        if (!responsive) {
            shortcode += ` responsive="false" width="${width}" height="${height}"`;
        }
        
        if (autoplay) {
            shortcode += ` autoplay="true"`;
        }
        
        if (muted) {
            shortcode += ` muted="true"`;
        }
        
        if (loop) {
            shortcode += ` loop="true"`;
        }
        
        if (customClass) {
            shortcode += ` class="${customClass}"`;
        }
        
        shortcode += ']';
        
        return shortcode;
    }
    
    /**
     * Insertar video
     */
    function insertVideo() {
        const videoId = $('#hostreamly-video-id').val().trim();
        
        if (!videoId) {
            showNotification('Por favor, ingresa un ID de video válido.', 'error');
            $('#hostreamly-video-id').focus();
            return;
        }
        
        // Validar formato del ID
        if (!/^[a-zA-Z0-9_-]+$/.test(videoId)) {
            showNotification('El ID del video contiene caracteres no válidos. Solo se permiten letras, números, guiones y guiones bajos.', 'error');
            $('#hostreamly-video-id').focus();
            return;
        }
        
        const shortcode = generateShortcode();
        
        // Insertar en el editor
        if (typeof tinyMCE !== 'undefined' && tinyMCE.get(currentEditor)) {
            // Editor visual
            tinyMCE.get(currentEditor).insertContent(shortcode + '\n\n');
        } else {
            // Editor de texto
            const textarea = $('#' + currentEditor);
            if (textarea.length) {
                const cursorPos = textarea[0].selectionStart;
                const textBefore = textarea.val().substring(0, cursorPos);
                const textAfter = textarea.val().substring(cursorPos);
                textarea.val(textBefore + shortcode + '\n\n' + textAfter);
                
                // Mover cursor después del shortcode
                const newPos = cursorPos + shortcode.length + 2;
                textarea[0].setSelectionRange(newPos, newPos);
                textarea.focus();
            }
        }
        
        showNotification('¡Video insertado correctamente!', 'success');
        closeModal();
        
        // Analytics (opcional)
        trackEvent('video_inserted', {
            video_id: videoId,
            responsive: $('#hostreamly-responsive').is(':checked'),
            autoplay: $('#hostreamly-autoplay').is(':checked')
        });
    }
    
    /**
     * Mostrar notificación
     */
    function showNotification(message, type = 'info') {
        const notification = $(`
            <div class="hostreamly-notification hostreamly-notification-${type}">
                ${message}
            </div>
        `);
        
        $('body').append(notification);
        
        // Mostrar con animación
        notification.css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1',
            color: type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460',
            border: `1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'}`,
            padding: '12px 20px',
            borderRadius: '8px',
            zIndex: 100001,
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            opacity: 0,
            transform: 'translateX(100%)'
        }).animate({
            opacity: 1,
            right: '20px'
        }, 300);
        
        // Auto-ocultar después de 4 segundos
        setTimeout(() => {
            notification.animate({
                opacity: 0,
                transform: 'translateX(100%)'
            }, 300, function() {
                $(this).remove();
            });
        }, 4000);
    }
    
    /**
     * Inicializar tooltips
     */
    function initTooltips() {
        // Agregar tooltips a elementos con data-tooltip
        $(document).on('mouseenter', '[data-tooltip]', function() {
            const tooltip = $('<div class="hostreamly-tooltip">' + $(this).data('tooltip') + '</div>');
            $('body').append(tooltip);
            
            const offset = $(this).offset();
            tooltip.css({
                position: 'absolute',
                top: offset.top - tooltip.outerHeight() - 10,
                left: offset.left + ($(this).outerWidth() / 2) - (tooltip.outerWidth() / 2),
                background: '#333',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                zIndex: 100002,
                whiteSpace: 'nowrap'
            }).fadeIn(200);
        });
        
        $(document).on('mouseleave', '[data-tooltip]', function() {
            $('.hostreamly-tooltip').fadeOut(200, function() {
                $(this).remove();
            });
        });
    }
    
    /**
     * Track events (opcional - para analytics)
     */
    function trackEvent(eventName, properties = {}) {
        // Implementar tracking si es necesario
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        
        // O usar otra herramienta de analytics
        console.log('Hostreamly Event:', eventName, properties);
    }
    
    /**
     * Utilidades adicionales
     */
    window.HostreamlyAdmin = {
        openModal: openModal,
        closeModal: closeModal,
        insertVideo: insertVideo,
        generateShortcode: generateShortcode
    };
    
})(jQuery);

/**
 * Integración con Gutenberg (Block Editor)
 */
if (typeof wp !== 'undefined' && wp.blocks) {
    (function() {
        const { registerBlockType } = wp.blocks;
        const { InspectorControls } = wp.blockEditor;
        const { PanelBody, TextControl, ToggleControl } = wp.components;
        const { Fragment } = wp.element;
        
        registerBlockType('hostreamly/video', {
            title: 'Hostreamly Video',
            icon: 'video-alt3',
            category: 'embed',
            attributes: {
                videoId: {
                    type: 'string',
                    default: ''
                },
                responsive: {
                    type: 'boolean',
                    default: true
                },
                autoplay: {
                    type: 'boolean',
                    default: false
                },
                muted: {
                    type: 'boolean',
                    default: false
                },
                width: {
                    type: 'string',
                    default: '640'
                },
                height: {
                    type: 'string',
                    default: '360'
                }
            },
            
            edit: function(props) {
                const { attributes, setAttributes } = props;
                const { videoId, responsive, autoplay, muted, width, height } = attributes;
                
                return wp.element.createElement(Fragment, null,
                    wp.element.createElement(InspectorControls, null,
                        wp.element.createElement(PanelBody, { title: 'Configuración del Video' },
                            wp.element.createElement(TextControl, {
                                label: 'ID del Video',
                                value: videoId,
                                onChange: (value) => setAttributes({ videoId: value })
                            }),
                            wp.element.createElement(ToggleControl, {
                                label: 'Responsive',
                                checked: responsive,
                                onChange: (value) => setAttributes({ responsive: value })
                            }),
                            wp.element.createElement(ToggleControl, {
                                label: 'Autoplay',
                                checked: autoplay,
                                onChange: (value) => setAttributes({ autoplay: value })
                            }),
                            wp.element.createElement(ToggleControl, {
                                label: 'Muted',
                                checked: muted,
                                onChange: (value) => setAttributes({ muted: value })
                            }),
                            !responsive && wp.element.createElement(TextControl, {
                                label: 'Ancho',
                                value: width,
                                onChange: (value) => setAttributes({ width: value })
                            }),
                            !responsive && wp.element.createElement(TextControl, {
                                label: 'Alto',
                                value: height,
                                onChange: (value) => setAttributes({ height: value })
                            })
                        )
                    ),
                    
                    videoId ? 
                        wp.element.createElement('div', {
                            className: 'hostreamly-block-preview',
                            style: { padding: '20px', background: '#f8f9fa', borderRadius: '8px' }
                        },
                            wp.element.createElement('p', { style: { margin: 0, textAlign: 'center' } },
                                '🎬 Video Hostreamly: ' + videoId
                            )
                        ) :
                        wp.element.createElement('div', {
                            className: 'hostreamly-block-placeholder',
                            style: { padding: '40px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }
                        },
                            wp.element.createElement('p', null, '🎬 Ingresa un ID de video en la configuración')
                        )
                );
            },
            
            save: function(props) {
                const { attributes } = props;
                const { videoId, responsive, autoplay, muted, width, height } = attributes;
                
                if (!videoId) return null;
                
                let shortcode = `[hostreamly id="${videoId}"`;
                
                if (!responsive) {
                    shortcode += ` responsive="false" width="${width}" height="${height}"`;
                }
                
                if (autoplay) {
                    shortcode += ` autoplay="true"`;
                }
                
                if (muted) {
                    shortcode += ` muted="true"`;
                }
                
                shortcode += ']';
                
                return wp.element.createElement('div', {
                    dangerouslySetInnerHTML: { __html: shortcode }
                });
            }
        });
    })();
}