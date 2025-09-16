# BunnyVault React Native SDK

A comprehensive React Native SDK for integrating BunnyVault video streaming platform into your mobile applications.

## Features

- 🎥 **Video Streaming**: High-quality video playback with adaptive bitrate streaming
- 📱 **Cross-Platform**: Works on both iOS and Android
- 🔄 **Offline Support**: Download and cache videos for offline viewing
- 📊 **Analytics**: Comprehensive video analytics and user engagement tracking
- 🎛️ **Customizable Player**: Fully customizable video player with controls
- 🚀 **Performance Optimized**: Efficient caching and network management
- 🔐 **Secure**: Built-in authentication and secure video delivery
- 📈 **Real-time Metrics**: Track video performance and user behavior

## Installation

```bash
npm install @bunnyvault/react-native-sdk
# or
yarn add @bunnyvault/react-native-sdk
```

### Peer Dependencies

Install the required peer dependencies:

```bash
npm install react-native-video react-native-webview @react-native-async-storage/async-storage @react-native-community/netinfo react-native-fs react-native-device-info
# or
yarn add react-native-video react-native-webview @react-native-async-storage/async-storage @react-native-community/netinfo react-native-fs react-native-device-info
```

### iOS Setup

For iOS, you need to run:

```bash
cd ios && pod install
```

### Android Setup

For Android, make sure you have the following permissions in your `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## Quick Start

### 1. Setup Provider

Wrap your app with the BunnyVault provider:

```tsx
import React from 'react';
import { BunnyVaultProvider } from '@bunnyvault/react-native-sdk';

const App = () => {
  return (
    <BunnyVaultProvider
      config={{
        apiKey: 'your-api-key',
        baseUrl: 'https://api.bunnyvault.com',
      }}
      analyticsConfig={{
        enabled: true,
        debug: __DEV__,
      }}
      cacheConfig={{
        enabled: true,
        maxCacheSize: 1024 * 1024 * 1024, // 1GB
        maxCachedVideos: 50,
      }}
    >
      <YourApp />
    </BunnyVaultProvider>
  );
};

export default App;
```

### 2. Use Video Player

```tsx
import React from 'react';
import { View } from 'react-native';
import { BunnyVaultPlayer } from '@bunnyvault/react-native-sdk';

const VideoScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <BunnyVaultPlayer
        videoId="your-video-id"
        autoPlay={false}
        showControls={true}
        onVideoStart={(videoId) => console.log('Video started:', videoId)}
        onVideoEnd={(videoId) => console.log('Video ended:', videoId)}
        onError={(error) => console.error('Video error:', error)}
      />
    </View>
  );
};

export default VideoScreen;
```

### 3. Use SDK Hook

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useBunnyVault } from '@bunnyvault/react-native-sdk';

const VideoListScreen = () => {
  const { api, cache, analytics } = useBunnyVault();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const result = await api.searchVideos({
          query: 'featured',
          limit: 20,
        });
        setVideos(result.videos);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [api]);

  const handleVideoPress = async (video) => {
    // Pre-cache video for better performance
    if (cache && !cache.isCached(video.id)) {
      const streamUrl = await api.getVideoStreamUrl(video.id);
      await cache.cacheVideo(video, streamUrl, 'high');
    }

    // Track user interaction
    if (analytics) {
      await analytics.trackEvent({
        type: 'video_selected',
        videoId: video.id,
        timestamp: Date.now(),
        data: { source: 'video_list' },
      });
    }

    // Navigate to video player
    // navigation.navigate('VideoPlayer', { videoId: video.id });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading videos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <VideoItem video={item} onPress={() => handleVideoPress(item)} />
      )}
    />
  );
};
```

## Configuration

### API Configuration

```tsx
const apiConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.bunnyvault.com',
  timeout: 30000,
  retries: 3,
  customHeaders: {
    'X-Custom-Header': 'value',
  },
};
```

### Analytics Configuration

```tsx
const analyticsConfig = {
  enabled: true,
  debug: __DEV__,
  autoFlush: true,
  flushInterval: 30000, // 30 seconds
  flushThreshold: 50, // events
  maxQueueSize: 1000,
};
```

### Cache Configuration

```tsx
const cacheConfig = {
  enabled: true,
  maxCacheSize: 1024 * 1024 * 1024, // 1GB
  maxCachedVideos: 50,
  enablePeriodicCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
};
```

### Offline Configuration

```tsx
const offlineConfig = {
  enabled: true,
  autoDownload: false,
  downloadQuality: 'medium',
  maxOfflineVideos: 20,
};
```

## API Reference

### BunnyVaultProvider Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `BunnyVaultAPIConfig` | Yes | API configuration |
| `analyticsConfig` | `AnalyticsConfig` | No | Analytics configuration |
| `cacheConfig` | `CacheConfig` | No | Cache configuration |
| `offlineConfig` | `OfflineConfig` | No | Offline configuration |
| `children` | `ReactNode` | Yes | Child components |

### BunnyVaultPlayer Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `videoId` | `string` | Yes | Video ID to play |
| `autoPlay` | `boolean` | No | Auto-play video |
| `showControls` | `boolean` | No | Show player controls |
| `muted` | `boolean` | No | Start muted |
| `loop` | `boolean` | No | Loop video |
| `quality` | `VideoQuality` | No | Video quality |
| `style` | `ViewStyle` | No | Player container style |
| `onVideoStart` | `(videoId: string) => void` | No | Video start callback |
| `onVideoEnd` | `(videoId: string) => void` | No | Video end callback |
| `onVideoProgress` | `(progress: VideoProgress) => void` | No | Progress callback |
| `onError` | `(error: BunnyVaultError) => void` | No | Error callback |

### useBunnyVault Hook

Returns an object with:

- `api`: BunnyVault API client
- `analytics`: Analytics tracker
- `cache`: Video cache manager
- `config`: Current configuration
- `isOnline`: Network status
- `isInitialized`: SDK initialization status

## Advanced Usage

### Custom Video Player

```tsx
import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Video from 'react-native-video';
import { useBunnyVault } from '@bunnyvault/react-native-sdk';

const CustomVideoPlayer = ({ videoId }) => {
  const { api, analytics, cache } = useBunnyVault();
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        // Check if video is cached
        const cachedPath = cache?.getCachedVideoPath(videoId);
        if (cachedPath) {
          setStreamUrl(`file://${cachedPath}`);
        } else {
          const url = await api.getVideoStreamUrl(videoId);
          setStreamUrl(url);
        }
      } catch (error) {
        console.error('Failed to load video:', error);
      }
    };

    loadVideo();
  }, [videoId, api, cache]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    // Track analytics
    analytics?.trackVideoEvent(
      isPlaying ? 'video_pause' : 'video_resume',
      videoId
    );
  };

  const handleProgress = (data) => {
    analytics?.trackVideoProgress(
      videoId,
      data.currentTime,
      data.seekableDuration
    );
  };

  if (!streamUrl) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading video...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={{ flex: 1 }}
        paused={!isPlaying}
        onProgress={handleProgress}
        onLoad={() => analytics?.trackVideoEvent('video_start', videoId)}
        onEnd={() => analytics?.trackVideoEvent('video_end', videoId)}
        onError={(error) => analytics?.trackError(error, videoId)}
      />
      
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 10,
          borderRadius: 5,
        }}
        onPress={handlePlayPause}
      >
        <Text style={{ color: 'white' }}>
          {isPlaying ? 'Pause' : 'Play'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Offline Video Management

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useBunnyVault } from '@bunnyvault/react-native-sdk';

const OfflineVideosScreen = () => {
  const { cache, api } = useBunnyVault();
  const [cachedVideos, setCachedVideos] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);

  useEffect(() => {
    loadCachedVideos();
    loadCacheStats();
  }, []);

  const loadCachedVideos = () => {
    if (cache) {
      const videos = cache.getCachedVideosList();
      setCachedVideos(videos);
    }
  };

  const loadCacheStats = async () => {
    if (cache) {
      const stats = await cache.getCacheStats();
      setCacheStats(stats);
    }
  };

  const handleDownloadVideo = async (videoId) => {
    try {
      const video = await api.getVideo(videoId);
      const streamUrl = await api.getVideoStreamUrl(videoId);
      await cache.cacheVideo(video, streamUrl, 'high');
      
      loadCachedVideos();
      loadCacheStats();
      
      Alert.alert('Success', 'Video downloaded for offline viewing');
    } catch (error) {
      Alert.alert('Error', 'Failed to download video');
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      await cache.removeCachedVideo(videoId);
      loadCachedVideos();
      loadCacheStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove video');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {cacheStats && (
        <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Cache Statistics</Text>
          <Text>Total Videos: {cacheStats.totalVideos}</Text>
          <Text>Total Size: {formatFileSize(cacheStats.totalSize)}</Text>
          <Text>Usage: {cacheStats.usagePercentage.toFixed(1)}%</Text>
        </View>
      )}
      
      <FlatList
        data={cachedVideos}
        keyExtractor={(item) => item.videoId}
        renderItem={({ item }) => (
          <View style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                {item.metadata.title}
              </Text>
              <Text style={{ color: '#666' }}>
                {formatFileSize(item.fileSize)} • Cached {new Date(item.cachedAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveVideo(item.videoId)}
              style={{
                backgroundColor: '#ff4444',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};
```

## Analytics Events

The SDK automatically tracks various events:

- `session_start` / `session_end`
- `video_start` / `video_end`
- `video_pause` / `video_resume`
- `video_progress`
- `video_seek`
- `video_quality_change`
- `error` / `video_error`
- `performance`

You can also track custom events:

```tsx
const { analytics } = useBunnyVault();

// Track custom event
analytics.trackEvent({
  type: 'custom_event',
  videoId: 'video-123',
  timestamp: Date.now(),
  data: {
    action: 'share_video',
    platform: 'twitter',
  },
});
```

## Error Handling

```tsx
import { BunnyVaultError } from '@bunnyvault/react-native-sdk';

try {
  const video = await api.getVideo('video-id');
} catch (error) {
  if (error instanceof BunnyVaultError) {
    console.error('BunnyVault Error:', error.code, error.message);
    
    switch (error.code) {
      case 'VIDEO_NOT_FOUND':
        // Handle video not found
        break;
      case 'NETWORK_ERROR':
        // Handle network error
        break;
      case 'AUTHENTICATION_ERROR':
        // Handle auth error
        break;
      default:
        // Handle other errors
        break;
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Performance Tips

1. **Pre-cache Popular Videos**: Cache frequently accessed videos for better performance
2. **Use Appropriate Quality**: Choose video quality based on network conditions
3. **Implement Progressive Loading**: Load video metadata first, then stream content
4. **Monitor Cache Size**: Regularly clean up old cached videos
5. **Batch Analytics**: Use automatic batching for analytics events

## Troubleshooting

### Common Issues

1. **Video not playing**: Check network connectivity and API key
2. **Cache not working**: Verify storage permissions on Android
3. **Analytics not tracking**: Ensure analytics is enabled in configuration
4. **High memory usage**: Implement proper cleanup in component unmount

### Debug Mode

Enable debug mode for detailed logging:

```tsx
<BunnyVaultProvider
  config={{ apiKey: 'your-key', debug: true }}
  analyticsConfig={{ debug: true }}
>
  {/* Your app */}
</BunnyVaultProvider>
```

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Email: support@bunnyvault.com
- Documentation: https://docs.bunnyvault.com
- GitHub Issues: https://github.com/bunnyvault/react-native-sdk/issues

## Changelog

### v1.0.0
- Initial release
- Video streaming and playback
- Offline caching
- Analytics tracking
- Cross-platform support