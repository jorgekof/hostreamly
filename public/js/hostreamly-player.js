/**
 * Hostreamly Player SDK
 * JavaScript SDK for easy video integration
 * Version: 1.0.0
 */

(function(window) {
  'use strict';

  // Default configuration
  const DEFAULT_CONFIG = {
    width: 640,
    height: 360,
    autoplay: false,
    controls: true,
    muted: false,
    loop: false,
    responsive: true,
    theme: 'default',
    apiUrl: 'http://localhost:3001/api'
  };

  /**
   * Hostreamly Player Class
   */
  class HostreamlyPlayer {
    constructor(config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.container = null;
      this.iframe = null;
      this.isReady = false;
      this.eventListeners = {};
      
      this.init();
    }

    /**
     * Initialize the player
     */
    init() {
      // Find container element
      if (typeof this.config.container === 'string') {
        this.container = document.querySelector(this.config.container);
      } else {
        this.container = this.config.container;
      }

      if (!this.container) {
        throw new Error('Container element not found');
      }

      if (!this.config.videoId) {
        throw new Error('Video ID is required');
      }

      this.createPlayer();
    }

    /**
     * Create the video player
     */
    createPlayer() {
      // Create iframe element
      this.iframe = document.createElement('iframe');
      
      // Build embed URL
      const embedUrl = this.buildEmbedUrl();
      
      // Set iframe attributes
      this.iframe.src = embedUrl;
      this.iframe.width = this.config.width;
      this.iframe.height = this.config.height;
      this.iframe.frameBorder = '0';
      this.iframe.allowFullscreen = true;
      this.iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      
      // Add responsive styling if enabled
      if (this.config.responsive) {
        this.makeResponsive();
      }

      // Add CSS classes
      this.iframe.className = 'hostreamly-player';
      
      // Clear container and add iframe
      this.container.innerHTML = '';
      this.container.appendChild(this.iframe);

      // Set up message listener for iframe communication
      this.setupMessageListener();

      // Mark as ready
      this.isReady = true;
      this.emit('ready');
    }

    /**
     * Build embed URL with parameters
     */
    buildEmbedUrl() {
      const baseUrl = this.config.apiUrl.replace('/api', '');
      const params = new URLSearchParams();
      
      if (this.config.token) {
        params.append('token', this.config.token);
      }
      
      params.append('autoplay', this.config.autoplay.toString());
      params.append('controls', this.config.controls.toString());
      params.append('muted', this.config.muted.toString());
      params.append('loop', this.config.loop.toString());
      
      return `${baseUrl}/embed/${this.config.videoId}?${params.toString()}`;
    }

    /**
     * Make player responsive
     */
    makeResponsive() {
      // Create wrapper div
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.paddingBottom = '56.25%'; // 16:9 aspect ratio
      wrapper.style.height = '0';
      wrapper.style.overflow = 'hidden';
      
      // Style iframe for responsive
      this.iframe.style.position = 'absolute';
      this.iframe.style.top = '0';
      this.iframe.style.left = '0';
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      
      // Remove fixed dimensions
      this.iframe.removeAttribute('width');
      this.iframe.removeAttribute('height');
      
      // Wrap iframe
      this.container.appendChild(wrapper);
      wrapper.appendChild(this.iframe);
    }

    /**
     * Set up message listener for iframe communication
     */
    setupMessageListener() {
      window.addEventListener('message', (event) => {
        // Verify origin for security
        const allowedOrigins = [
          'http://localhost:3001',
          'http://localhost:8080',
          'https://hostreamly.com',
          'https://app.hostreamly.com'
        ];
        
        if (!allowedOrigins.includes(event.origin)) {
          return;
        }

        const data = event.data;
        
        if (data.type && data.videoId === this.config.videoId) {
          this.handlePlayerEvent(data);
        }
      });
    }

    /**
     * Handle player events from iframe
     */
    handlePlayerEvent(data) {
      switch (data.type) {
        case 'play':
          this.emit('play', data);
          break;
        case 'pause':
          this.emit('pause', data);
          break;
        case 'ended':
          this.emit('ended', data);
          break;
        case 'timeupdate':
          this.emit('timeupdate', data);
          break;
        case 'error':
          this.emit('error', data);
          break;
        default:
          this.emit(data.type, data);
      }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
      if (!this.eventListeners[event]) {
        return;
      }
      
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }

    /**
     * Emit event
     */
    emit(event, data) {
      if (!this.eventListeners[event]) {
        return;
      }
      
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }

    /**
     * Send command to player
     */
    sendCommand(command, data = {}) {
      if (!this.iframe || !this.isReady) {
        console.warn('Player not ready');
        return;
      }

      const message = {
        type: 'command',
        command,
        data,
        videoId: this.config.videoId
      };

      this.iframe.contentWindow.postMessage(message, '*');
    }

    /**
     * Play video
     */
    play() {
      this.sendCommand('play');
    }

    /**
     * Pause video
     */
    pause() {
      this.sendCommand('pause');
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume) {
      this.sendCommand('setVolume', { volume });
    }

    /**
     * Seek to time (in seconds)
     */
    seekTo(time) {
      this.sendCommand('seekTo', { time });
    }

    /**
     * Set playback rate
     */
    setPlaybackRate(rate) {
      this.sendCommand('setPlaybackRate', { rate });
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
      this.sendCommand('toggleFullscreen');
    }

    /**
     * Destroy player
     */
    destroy() {
      if (this.container) {
        this.container.innerHTML = '';
      }
      
      this.eventListeners = {};
      this.isReady = false;
      this.iframe = null;
      this.container = null;
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      
      // Recreate player if necessary
      if (newConfig.videoId || newConfig.token) {
        this.createPlayer();
      }
    }
  }

  /**
   * Static methods for easy initialization
   */
  HostreamlyPlayer.init = function(config) {
    return new HostreamlyPlayer(config);
  };

  /**
   * Generate embed code
   */
  HostreamlyPlayer.generateEmbedCode = async function(videoId, options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };
    
    try {
      const response = await fetch(`${config.apiUrl}/embed/${videoId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error('Failed to generate embed code');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error generating embed code:', error);
      throw error;
    }
  };

  /**
   * Utility function to load multiple videos
   */
  HostreamlyPlayer.loadMultiple = function(configs) {
    return configs.map(config => new HostreamlyPlayer(config));
  };

  /**
   * Check if browser supports required features
   */
  HostreamlyPlayer.isSupported = function() {
    return !!(window.postMessage && window.addEventListener && document.querySelector);
  };

  // Export to global scope
  window.HostreamlyPlayer = HostreamlyPlayer;

  // AMD support
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return HostreamlyPlayer;
    });
  }

  // CommonJS support
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HostreamlyPlayer;
  }

})(window);