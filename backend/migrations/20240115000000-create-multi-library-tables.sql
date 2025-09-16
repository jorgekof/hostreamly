-- Migration: Create Multi-Library Tables
-- Date: 2024-01-15
-- Description: Creates tables to support multiple Bunny Stream libraries and user collections

-- Create library_metadata table
CREATE TABLE IF NOT EXISTS library_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id VARCHAR(255) NOT NULL UNIQUE,
  library_name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  cdn_hostname VARCHAR(255),
  webhook_secret VARCHAR(255),
  token_auth_key VARCHAR(255),
  max_users INTEGER DEFAULT 1000,
  current_users INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0.00,
  bandwidth_used_gb DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  health_status VARCHAR(50) DEFAULT 'healthy',
  last_health_check DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user_library_assignments table
CREATE TABLE IF NOT EXISTS user_library_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) NOT NULL,
  library_id VARCHAR(255) NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (library_id) REFERENCES library_metadata(library_id) ON DELETE CASCADE,
  UNIQUE(user_id, library_id)
);

-- Create user_collections table
CREATE TABLE IF NOT EXISTS user_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) NOT NULL,
  library_id VARCHAR(255) NOT NULL,
  collection_id VARCHAR(255) NOT NULL,
  collection_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  video_count INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (library_id) REFERENCES library_metadata(library_id) ON DELETE CASCADE,
  UNIQUE(user_id, library_id, collection_id)
);

-- Create user_videos table
CREATE TABLE IF NOT EXISTS user_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) NOT NULL,
  library_id VARCHAR(255) NOT NULL,
  collection_id VARCHAR(255) NOT NULL,
  video_id VARCHAR(255) NOT NULL,
  bunny_video_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  thumbnail_url VARCHAR(1000),
  video_url VARCHAR(1000),
  status VARCHAR(50) DEFAULT 'processing',
  upload_progress INTEGER DEFAULT 0,
  encoding_progress INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (library_id) REFERENCES library_metadata(library_id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES user_collections(collection_id) ON DELETE CASCADE,
  UNIQUE(video_id),
  UNIQUE(bunny_video_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_library_assignments_user_id ON user_library_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_assignments_library_id ON user_library_assignments(library_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_library_id ON user_collections(library_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON user_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_library_id ON user_videos(library_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_collection_id ON user_videos(collection_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_bunny_video_id ON user_videos(bunny_video_id);
CREATE INDEX IF NOT EXISTS idx_library_metadata_region ON library_metadata(region);
CREATE INDEX IF NOT EXISTS idx_library_metadata_health_status ON library_metadata(health_status);