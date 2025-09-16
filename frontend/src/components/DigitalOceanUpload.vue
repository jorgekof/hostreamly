<template>
  <div class="digitalocean-upload">
    <div class="upload-header">
      <h3>📁 Gestión de Archivos - DigitalOcean Spaces</h3>
      <div class="storage-info">
        <span class="provider">🌊 DigitalOcean Spaces</span>
        <span class="status" :class="{ connected: isConnected }">{{ connectionStatus }}</span>
      </div>
    </div>

    <!-- Upload Section -->
    <div class="upload-section">
      <div class="upload-area" 
           :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
           @drop="handleDrop"
           @dragover.prevent="isDragOver = true"
           @dragleave="isDragOver = false"
           @click="triggerFileInput">
        
        <div v-if="!isUploading" class="upload-content">
          <div class="upload-icon">📤</div>
          <p class="upload-text">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p class="upload-hint">Soporta videos, imágenes y audio • Máx. 100MB</p>
        </div>
        
        <div v-else class="uploading-content">
          <div class="spinner"></div>
          <p>Subiendo a DigitalOcean Spaces...</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>
      </div>
      
      <input ref="fileInput" 
             type="file" 
             multiple 
             accept="video/*,image/*,audio/*"
             @change="handleFileSelect"
             style="display: none">
    </div>

    <!-- Files List -->
    <div class="files-section" v-if="files.length > 0">
      <h4>📋 Archivos en DigitalOcean Spaces</h4>
      <div class="files-list">
        <div v-for="file in files" :key="file.key" class="file-item">
          <div class="file-info">
            <div class="file-icon">{{ getFileIcon(file.type) }}</div>
            <div class="file-details">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-meta">{{ formatFileSize(file.size) }} • {{ file.folder }}</span>
            </div>
          </div>
          <div class="file-actions">
            <button @click="copyUrl(file.cdnUrl)" class="btn-copy" title="Copiar URL CDN">
              🔗
            </button>
            <button @click="generateSignedUrl(file.key)" class="btn-signed" title="URL Firmada">
              🔐
            </button>
            <button @click="deleteFile(file.key)" class="btn-delete" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Storage Stats -->
    <div class="storage-stats">
      <div class="stat-item">
        <span class="stat-label">Archivos:</span>
        <span class="stat-value">{{ files.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Almacenamiento:</span>
        <span class="stat-value">{{ totalSize }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">CDN:</span>
        <span class="stat-value">✅ Activo</span>
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DigitalOceanUpload',
  data() {
    return {
      files: [],
      isUploading: false,
      uploadProgress: 0,
      isDragOver: false,
      isConnected: false,
      notification: null,
      storageInfo: null
    }
  },
  computed: {
    connectionStatus() {
      return this.isConnected ? '🟢 Conectado' : '🔴 Desconectado'
    },
    totalSize() {
      const total = this.files.reduce((sum, file) => sum + file.size, 0)
      return this.formatFileSize(total)
    }
  },
  async mounted() {
    await this.checkConnection()
    await this.loadFiles()
  },
  methods: {
    async checkConnection() {
      try {
        const response = await axios.get('/api/storage/spaces/info')
        if (response.data.success) {
          this.isConnected = true
          this.storageInfo = response.data.data.storageInfo
        }
      } catch (error) {
        console.error('Error checking DigitalOcean connection:', error)
        this.isConnected = false
      }
    },

    async loadFiles() {
      try {
        const response = await axios.get('/api/storage/spaces/list')
        if (response.data.success) {
          this.files = response.data.data.files.map(file => ({
            key: file.key,
            name: file.key.split('/').pop(),
            size: file.size,
            url: file.url,
            cdnUrl: file.url,
            type: this.getFileType(file.key),
            folder: file.key.split('/')[0],
            lastModified: file.lastModified
          }))
        }
      } catch (error) {
        console.error('Error loading files:', error)
        this.showNotification('Error cargando archivos', 'error')
      }
    },

    triggerFileInput() {
      if (!this.isUploading) {
        this.$refs.fileInput.click()
      }
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      this.uploadFiles(files)
    },

    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      const files = Array.from(event.dataTransfer.files)
      this.uploadFiles(files)
    },

    async uploadFiles(files) {
      if (files.length === 0) return

      this.isUploading = true
      this.uploadProgress = 0

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          await this.uploadSingleFile(file)
          this.uploadProgress = Math.round(((i + 1) / files.length) * 100)
        }
        
        this.showNotification(`${files.length} archivo(s) subido(s) exitosamente`, 'success')
        await this.loadFiles() // Reload files list
      } catch (error) {
        console.error('Upload error:', error)
        this.showNotification('Error subiendo archivos', 'error')
      } finally {
        this.isUploading = false
        this.uploadProgress = 0
      }
    },

    async uploadSingleFile(file) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/storage/spaces/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      return response.data.data
    },

    async deleteFile(key) {
      if (!confirm('¿Estás seguro de eliminar este archivo?')) return

      try {
        const response = await axios.delete(`/api/storage/spaces/delete/${key}`)
        if (response.data.success) {
          this.showNotification('Archivo eliminado exitosamente', 'success')
          await this.loadFiles()
        }
      } catch (error) {
        console.error('Delete error:', error)
        this.showNotification('Error eliminando archivo', 'error')
      }
    },

    async generateSignedUrl(key) {
      try {
        const response = await axios.get(`/api/storage/spaces/signed-url/${key}?expires=3600`)
        if (response.data.success) {
          const signedUrl = response.data.data.signedUrl
          await navigator.clipboard.writeText(signedUrl)
          this.showNotification('URL firmada copiada al portapapeles', 'success')
        }
      } catch (error) {
        console.error('Signed URL error:', error)
        this.showNotification('Error generando URL firmada', 'error')
      }
    },

    async copyUrl(url) {
      try {
        await navigator.clipboard.writeText(url)
        this.showNotification('URL copiada al portapapeles', 'success')
      } catch (error) {
        console.error('Copy error:', error)
        this.showNotification('Error copiando URL', 'error')
      }
    },

    getFileIcon(type) {
      if (type?.startsWith('video/')) return '🎥'
      if (type?.startsWith('image/')) return '🖼️'
      if (type?.startsWith('audio/')) return '🎵'
      return '📄'
    },

    getFileType(filename) {
      const ext = filename.split('.').pop()?.toLowerCase()
      if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video/mp4'
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image/jpeg'
      if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio/mp3'
      return 'application/octet-stream'
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    showNotification(message, type = 'info') {
      this.notification = { message, type }
      setTimeout(() => {
        this.notification = null
      }, 5000)
    }
  }
}
</script>

<style scoped>
.digitalocean-upload {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e1e5e9;
}

.upload-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5em;
}

.storage-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.provider {
  background: #0080ff;
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.9em;
  font-weight: 500;
}

.status {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.9em;
  font-weight: 500;
  background: #e74c3c;
  color: white;
}

.status.connected {
  background: #27ae60;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-area {
  border: 3px dashed #bdc3c7;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.upload-area:hover {
  border-color: #0080ff;
  background: #e3f2fd;
}

.upload-area.drag-over {
  border-color: #27ae60;
  background: #e8f5e8;
}

.upload-area.uploading {
  border-color: #f39c12;
  background: #fef9e7;
  cursor: not-allowed;
}

.upload-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.upload-text {
  font-size: 1.2em;
  color: #2c3e50;
  margin: 10px 0;
  font-weight: 500;
}

.upload-hint {
  color: #7f8c8d;
  font-size: 0.9em;
  margin: 0;
}

.uploading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0080ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0080ff;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 500;
  color: #2c3e50;
}

.files-section h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-color: #0080ff;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 1.5em;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
}

.file-meta {
  font-size: 0.85em;
  color: #7f8c8d;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.file-actions button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s ease;
}

.btn-copy {
  background: #3498db;
  color: white;
}

.btn-copy:hover {
  background: #2980b9;
}

.btn-signed {
  background: #f39c12;
  color: white;
}

.btn-signed:hover {
  background: #e67e22;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background: #c0392b;
}

.storage-stats {
  display: flex;
  justify-content: space-around;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9em;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.2em;
  font-weight: 600;
  color: #2c3e50;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #27ae60;
}

.notification.error {
  background: #e74c3c;
}

.notification.info {
  background: #3498db;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .digitalocean-upload {
    padding: 15px;
  }
  
  .upload-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .file-item {
    flex-direction: column;
    gap: 15px;
  }
  
  .storage-stats {
    flex-direction: column;
    gap: 15px;
  }
}
</style>