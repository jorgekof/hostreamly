# Hostreamly API Documentation

## Overview

Hostreamly is a comprehensive video streaming platform API built with Node.js, Express, and integrated with Bunny.net CDN and Agora for live streaming capabilities. This documentation covers all available endpoints, authentication methods, and usage examples.

## Base URL

```
Production: https://api.hostreamly.com
Development: http://localhost:3001
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Types

- **Access Token**: Short-lived token (15 minutes) for API requests
- **Refresh Token**: Long-lived token (7 days) for obtaining new access tokens

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Login**: 10 attempts per 5 minutes per IP
- **Registration**: 10 registrations per 5 minutes per IP
- **Password Reset**: 3 attempts per hour per IP
- **Video Upload**: 10 uploads per hour (unlimited for premium users)
- **Search**: 30 requests per minute
- **General API**: 1000 requests per hour per user

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## API Endpoints

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "first_name": "John",
      "last_name": "Doe",
      "is_premium": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "access_token": "jwt_access_token",
      "refresh_token": "jwt_refresh_token",
      "expires_in": 900
    }
  }
}
```

#### Login User

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "login": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

#### Logout

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <access_token>`

#### Logout All Devices

```http
POST /api/auth/logout-all
```

#### Forgot Password

```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### Reset Password

```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "NewSecurePass123!"
}
```

#### Change Password

```http
POST /api/auth/change-password
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

#### Get User Profile

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <access_token>`

#### Update User Profile

```http
PUT /api/auth/profile
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "bio": "Content creator",
  "website": "https://johndoe.com",
  "location": "New York, USA",
  "phone": "+1234567890"
}
```

#### Verify Email

```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token"
}
```

#### Resend Email Verification

```http
POST /api/auth/resend-verification
```

**Headers:** `Authorization: Bearer <access_token>`

### Video Management Endpoints

#### Upload Video

```http
POST /api/videos/upload
```

**Headers:** 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `video`: Video file (max 5GB)
- `title`: Video title (required)
- `description`: Video description (optional)
- `visibility`: public|unlisted|private|premium (default: public)
- `category`: Video category (optional)
- `tags`: Array of tags (max 20)
- `enable_comments`: Boolean (default: true)
- `enable_downloads`: Boolean (default: false)
- `password`: Password for private videos (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "video_id",
      "title": "My Video",
      "description": "Video description",
      "visibility": "public",
      "status": "processing",
      "bunny_video_id": "bunny_id",
      "upload_progress": 100,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get Videos

```http
GET /api/videos
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (max: 50, default: 20)
- `category`: Filter by category
- `sort`: newest|oldest|popular|views|duration (default: newest)
- `visibility`: public|unlisted|private|premium

#### Search Videos

```http
GET /api/videos/search
```

**Query Parameters:**
- `q`: Search query (required)
- `category`: Filter by category
- `duration`: short|medium|long
- `sort`: newest|oldest|popular|views|duration
- `page`: Page number
- `limit`: Items per page

#### Get Popular Videos

```http
GET /api/videos/popular
```

#### Get User's Videos

```http
GET /api/videos/my-videos
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Video by ID

```http
GET /api/videos/:identifier
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "video_id",
      "title": "Video Title",
      "description": "Video description",
      "visibility": "public",
      "status": "ready",
      "duration": 120,
      "views": 1500,
      "likes": 45,
      "bunny_video_id": "bunny_id",
      "thumbnail_url": "https://cdn.example.com/thumb.jpg",
      "stream_url": "https://cdn.example.com/playlist.m3u8",
      "user": {
        "id": "user_id",
        "username": "creator",
        "name": "Creator Name"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update Video

```http
PUT /api/videos/:id
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "visibility": "public",
  "category": "Entertainment",
  "tags": ["tag1", "tag2"]
}
```

#### Delete Video

```http
DELETE /api/videos/:id
```

**Headers:** `Authorization: Bearer <access_token>`

#### Like/Unlike Video

```http
POST /api/videos/:id/like
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Video Analytics

```http
GET /api/videos/:id/analytics
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "views": 1500,
      "likes": 45,
      "comments": 12,
      "shares": 8,
      "watch_time": 180000,
      "engagement_rate": 0.04,
      "demographics": {
        "countries": [{"country": "US", "views": 800}],
        "devices": [{"device": "mobile", "views": 900}]
      }
    }
  }
}
```

#### Download Video

```http
POST /api/videos/:id/download
```

**Headers:** `Authorization: Bearer <access_token>`

### Live Streaming Endpoints

#### Create Live Stream

```http
POST /api/livestreams
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "title": "Live Stream Title",
  "description": "Stream description",
  "visibility": "public",
  "category": "Gaming",
  "tags": ["gaming", "live"],
  "scheduled_start_time": "2024-01-01T20:00:00.000Z",
  "max_viewers": 1000,
  "enable_chat": true,
  "enable_recording": false,
  "ticket_price": 0,
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stream": {
      "id": "stream_id",
      "title": "Live Stream Title",
      "status": "scheduled",
      "channel_name": "agora_channel_name",
      "broadcaster_uid": 12345,
      "rtmp_url": "rtmp://ingest.example.com/live",
      "stream_key": "stream_key_here",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get Live Streams

```http
GET /api/livestreams
```

**Query Parameters:**
- `status`: scheduled|live|ended
- `category`: Filter by category
- `page`: Page number
- `limit`: Items per page

#### Get Stream by ID

```http
GET /api/livestreams/:id
```

#### Join Stream

```http
POST /api/livestreams/:id/join
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "rtc_token": "agora_rtc_token",
      "rtm_token": "agora_rtm_token",
      "channel_name": "channel_name",
      "uid": 67890,
      "expires_at": "2024-01-01T01:00:00.000Z"
    }
  }
}
```

#### Start Stream

```http
POST /api/livestreams/:id/start
```

**Headers:** `Authorization: Bearer <access_token>`

#### End Stream

```http
POST /api/livestreams/:id/end
```

**Headers:** `Authorization: Bearer <access_token>`

#### Update Stream

```http
PUT /api/livestreams/:id
```

**Headers:** `Authorization: Bearer <access_token>`

#### Delete Stream

```http
DELETE /api/livestreams/:id
```

**Headers:** `Authorization: Bearer <access_token>`

### Analytics Endpoints

#### Get User Analytics Dashboard

```http
GET /api/analytics/dashboard
```

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `period`: day|week|month|year

#### Get Advanced Analytics

```http
GET /api/advanced-analytics/overview
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Bandwidth Usage

```http
GET /api/analytics/bandwidth
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Storage Usage

```http
GET /api/analytics/storage
```

**Headers:** `Authorization: Bearer <access_token>`

### API Keys Management

#### Generate API Key

```http
POST /api/api-keys
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "My API Key",
  "permissions": ["videos:read", "videos:write"],
  "expiresIn": "30d"
}
```

#### Get API Keys

```http
GET /api/api-keys
```

**Headers:** `Authorization: Bearer <access_token>`

#### Update API Key

```http
PUT /api/api-keys/:keyId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Delete API Key

```http
DELETE /api/api-keys/:keyId
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get API Key Statistics

```http
GET /api/api-keys/:keyId/stats
```

**Headers:** `Authorization: Bearer <access_token>`

### Embed & Sharing

#### Get Embed Code

```http
GET /api/embed/:videoId
```

**Query Parameters:**
- `width`: Player width (default: 640)
- `height`: Player height (default: 360)
- `autoplay`: Auto-play video (default: false)
- `controls`: Show player controls (default: true)

#### Get Shareable Link

```http
GET /api/embed/:videoId/share
```

### Usage & Billing

#### Get Usage Statistics

```http
GET /api/usage/stats
```

**Headers:** `Authorization: Bearer <access_token>`

#### Get Billing Information

```http
GET /api/usage/billing
```

**Headers:** `Authorization: Bearer <access_token>`

### Storage Management

#### Get Storage Information

```http
GET /api/storage/info
```

**Headers:** `Authorization: Bearer <access_token>`

#### Upload File to Storage

```http
POST /api/storage/upload
```

**Headers:** 
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

### System Configuration

#### Get System Status

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "bunny": "connected",
    "agora": "connected"
  },
  "version": "1.0.0"
}
```

## Webhooks

Hostreamly supports webhooks for real-time notifications about video processing, live stream events, and other important updates.

### Webhook Events

- `video.uploaded` - Video upload completed
- `video.encoded` - Video encoding finished
- `video.ready` - Video is ready for playback
- `video.failed` - Video processing failed
- `video.deleted` - Video was deleted
- `stream.started` - Live stream started
- `stream.ended` - Live stream ended
- `stream.viewer_joined` - Viewer joined stream
- `stream.viewer_left` - Viewer left stream

### Webhook Payload Example

```json
{
  "event": "video.ready",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "video_id": "video_id",
    "user_id": "user_id",
    "bunny_video_id": "bunny_id",
    "status": "ready",
    "duration": 120,
    "file_size": 52428800
  }
}
```

## SDKs and Libraries

### JavaScript/Node.js

```javascript
const HostreamlyAPI = require('@hostreamly/api-client');

const client = new HostreamlyAPI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.hostreamly.com'
});

// Upload video
const video = await client.videos.upload({
  file: videoFile,
  title: 'My Video',
  description: 'Video description'
});

// Get video
const videoData = await client.videos.get(video.id);
```

### Python

```python
from hostreamly import HostreamlyClient

client = HostreamlyClient(api_key='your_api_key')

# Upload video
video = client.videos.upload(
    file=video_file,
    title='My Video',
    description='Video description'
)

# Get video
video_data = client.videos.get(video['id'])
```

## Best Practices

### Security

1. **Always use HTTPS** in production
2. **Store API keys securely** - never expose them in client-side code
3. **Implement proper CORS** policies for web applications
4. **Validate all input** on both client and server side
5. **Use refresh tokens** to maintain secure sessions

### Performance

1. **Implement caching** for frequently accessed data
2. **Use pagination** for large datasets
3. **Compress video files** before uploading
4. **Use CDN** for global content delivery
5. **Monitor API usage** to avoid rate limits

### Error Handling

1. **Always check response status** codes
2. **Implement retry logic** for transient failures
3. **Log errors** for debugging purposes
4. **Provide user-friendly error messages**
5. **Handle network timeouts** gracefully

## Support

For API support and questions:

- **Documentation**: https://docs.hostreamly.com
- **Support Email**: support@hostreamly.com
- **GitHub Issues**: https://github.com/hostreamly/api/issues
- **Discord Community**: https://discord.gg/hostreamly

## Changelog

### Version 1.0.0 (2024-01-01)

- Initial API release
- Video upload and management
- Live streaming with Agora integration
- User authentication and authorization
- Analytics and reporting
- Webhook support
- API key management

---

**Hostreamly API** - Powering next-generation video streaming platforms.