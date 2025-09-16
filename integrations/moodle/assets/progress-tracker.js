/**
 * BunnyVault Moodle Progress Tracker
 * Tracks video viewing progress and integrates with LearnDash completion
 */

(function($) {
    'use strict';
    
    class BunnyVaultProgressTracker {
        constructor() {
            this.trackers = new Map();
            this.updateInterval = 5000; // Update every 5 seconds
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.initializeTrackers();
        }
        
        bindEvents() {
            $(document).ready(() => {
                this.initializeTrackers();
            });
            
            // Handle dynamic content loading
            $(document).on('DOMNodeInserted', '.bunnyvault-lms-container', (e) => {
                this.initializeTracker($(e.target));
            });
        }
        
        initializeTrackers() {
            $('.bunnyvault-lms-container').each((index, element) => {
                this.initializeTracker($(element));
            });
        }
        
        initializeTracker($container) {
            const videoId = $container.data('video-id');
            const lessonId = $container.data('lesson-id');
            const requiredProgress = $container.data('required') || 80;
            
            if (!videoId || !lessonId) {
                console.warn('BunnyVault: Missing video-id or lesson-id');
                return;
            }
            
            const $iframe = $container.find('iframe');
            if (!$iframe.length) {
                console.warn('BunnyVault: No iframe found in container');
                return;
            }
            
            const tracker = {
                videoId: videoId,
                lessonId: lessonId,
                requiredProgress: requiredProgress,
                $container: $container,
                $iframe: $iframe,
                currentProgress: 0,
                duration: 0,
                lastUpdate: 0,
                isTracking: false
            };
            
            this.trackers.set(videoId + '_' + lessonId, tracker);
            this.setupIframeTracking(tracker);
        }
        
        setupIframeTracking(tracker) {
            const iframe = tracker.$iframe[0];
            
            // Listen for iframe load
            iframe.addEventListener('load', () => {
                this.startTracking(tracker);
            });
            
            // If iframe is already loaded
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                this.startTracking(tracker);
            }
        }
        
        startTracking(tracker) {
            if (tracker.isTracking) return;
            
            tracker.isTracking = true;
            
            // Try to communicate with iframe
            this.setupPostMessageListener(tracker);
            
            // Fallback: simulate progress based on time
            this.startTimeBasedTracking(tracker);
        }
        
        setupPostMessageListener(tracker) {
            window.addEventListener('message', (event) => {
                // Verify origin for security
                if (event.origin !== 'https://bunnyvault.com') {
                    return;
                }
                
                const data = event.data;
                if (data.type === 'bunnyvault-progress' && data.videoId === tracker.videoId) {
                    this.updateProgress(tracker, data.progress, data.duration);
                }
            });
        }
        
        startTimeBasedTracking(tracker) {
            // Estimate video duration (fallback)
            const estimatedDuration = 600; // 10 minutes default
            tracker.duration = estimatedDuration;
            
            let startTime = Date.now();
            let watchedTime = 0;
            
            const trackingInterval = setInterval(() => {
                if (!this.isVideoVisible(tracker.$iframe)) {
                    return;
                }
                
                const currentTime = Date.now();
                const deltaTime = (currentTime - startTime) / 1000;
                startTime = currentTime;
                
                watchedTime += deltaTime;
                const progress = Math.min((watchedTime / tracker.duration) * 100, 100);
                
                this.updateProgress(tracker, progress, tracker.duration);
                
                // Stop tracking if video is completed or removed
                if (progress >= 100 || !tracker.$container.is(':visible')) {
                    clearInterval(trackingInterval);
                }
            }, this.updateInterval);
            
            // Store interval reference for cleanup
            tracker.trackingInterval = trackingInterval;
        }
        
        isVideoVisible($iframe) {
            if (!$iframe.is(':visible')) return false;
            
            const rect = $iframe[0].getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;
            
            // Check if at least 50% of the video is visible
            const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
            const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
            
            const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
            const totalArea = rect.height * rect.width;
            
            return totalArea > 0 && (visibleArea / totalArea) >= 0.5;
        }
        
        updateProgress(tracker, progress, duration) {
            if (progress <= tracker.currentProgress) {
                return; // Don't go backwards
            }
            
            tracker.currentProgress = progress;
            tracker.duration = duration || tracker.duration;
            
            // Update UI
            this.updateProgressUI(tracker);
            
            // Send to server (throttled)
            const now = Date.now();
            if (now - tracker.lastUpdate > this.updateInterval) {
                tracker.lastUpdate = now;
                this.sendProgressToServer(tracker);
            }
        }
        
        updateProgressUI(tracker) {
            const $progressFill = tracker.$container.find('.progress-fill');
            const $progressText = tracker.$container.find('.progress-text');
            const $completionStatus = tracker.$container.find('.bunnyvault-completion-status');
            
            // Update progress bar
            $progressFill.css('width', tracker.currentProgress + '%');
            $progressText.text(`Progreso: ${Math.round(tracker.currentProgress)}%`);
            
            // Update completion status
            if (tracker.currentProgress >= tracker.requiredProgress) {
                $completionStatus
                    .removeClass('pending')
                    .addClass('completed')
                    .html('<i class="dashicons dashicons-yes-alt"></i> Lección completada');
                
                // Show completion animation
                this.showCompletionAnimation(tracker.$container);
            } else {
                const remaining = tracker.requiredProgress - tracker.currentProgress;
                $completionStatus
                    .removeClass('completed')
                    .addClass('pending')
                    .text(`Necesitas ver ${Math.round(remaining)}% más para completar esta lección`);
            }
        }
        
        showCompletionAnimation($container) {
            $container.addClass('lesson-completed');
            
            // Add celebration effect
            const $celebration = $('<div class="completion-celebration">🎉 ¡Lección Completada! 🎉</div>');
            $container.append($celebration);
            
            setTimeout(() => {
                $celebration.fadeOut(() => {
                    $celebration.remove();
                });
            }, 3000);
        }
        
        sendProgressToServer(tracker) {
            $.ajax({
                url: bunnyvault_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'bunnyvault_track_progress',
                    nonce: bunnyvault_ajax.nonce,
                    video_id: tracker.videoId,
                    lesson_id: tracker.lessonId,
                    progress: tracker.currentProgress,
                    duration: tracker.duration
                },
                success: (response) => {
                    if (response.success) {
                        console.log('Progress updated:', response.data);
                        
                        // Handle lesson completion
                        if (response.data.completed) {
                            this.handleLessonCompletion(tracker);
                        }
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Failed to update progress:', error);
                }
            });
        }
        
        handleLessonCompletion(tracker) {
            // Trigger custom event for other plugins to listen
            $(document).trigger('bunnyvault:lesson_completed', {
                videoId: tracker.videoId,
                lessonId: tracker.lessonId,
                progress: tracker.currentProgress
            });
            
            // Show success message
            this.showSuccessMessage(tracker.$container);
            
            // Auto-advance to next lesson (if configured)
            this.checkAutoAdvance(tracker);
        }
        
        showSuccessMessage($container) {
            const $message = $('<div class="bunnyvault-success-message">');
            $message.html(`
                <div class="success-content">
                    <i class="dashicons dashicons-yes-alt"></i>
                    <h4>¡Excelente trabajo!</h4>
                    <p>Has completado esta lección exitosamente.</p>
                </div>
            `);
            
            $container.append($message);
            
            setTimeout(() => {
                $message.fadeOut(() => {
                    $message.remove();
                });
            }, 5000);
        }
        
        checkAutoAdvance(tracker) {
            const autoAdvance = tracker.$container.data('auto-advance');
            if (autoAdvance) {
                setTimeout(() => {
                    const nextLessonUrl = tracker.$container.data('next-lesson-url');
                    if (nextLessonUrl) {
                        window.location.href = nextLessonUrl;
                    }
                }, 2000);
            }
        }
        
        // Public methods
        getProgress(videoId, lessonId) {
            const tracker = this.trackers.get(videoId + '_' + lessonId);
            return tracker ? tracker.currentProgress : 0;
        }
        
        forceUpdate(videoId, lessonId) {
            const tracker = this.trackers.get(videoId + '_' + lessonId);
            if (tracker) {
                this.sendProgressToServer(tracker);
            }
        }
        
        destroy() {
            // Cleanup intervals and event listeners
            this.trackers.forEach(tracker => {
                if (tracker.trackingInterval) {
                    clearInterval(tracker.trackingInterval);
                }
            });
            this.trackers.clear();
        }
    }
    
    // Initialize when DOM is ready
    $(document).ready(() => {
        window.bunnyvaultTracker = new BunnyVaultProgressTracker();
    });
    
    // Cleanup on page unload
    $(window).on('beforeunload', () => {
        if (window.bunnyvaultTracker) {
            window.bunnyvaultTracker.destroy();
        }
    });
    
})(jQuery);