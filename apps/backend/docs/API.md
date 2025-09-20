# Hostreamly API Documentation

## Overview

Hostreamly API provides comprehensive video streaming and management capabilities with enhanced security, monitoring, and performance features.

**Base URL:** `http://159.65.98.112:3001/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **General API:** 100 requests per 15 minutes per IP
- **Authentication endpoints:** 5 requests per 15 minutes per IP

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

#### POST /auth/change-password
Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### Videos

#### GET /videos
Get list of videos with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category
- `search` (string): Search in title and description
- `sortBy` (string): Sort field (createdAt, views, likes)
- `sortOrder` (string): asc or desc

**Response:**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "thumbnail": "string",
        "duration": "number",
        "views": "number",
        "likes": "number",
        "createdAt": "datetime",
        "user": {
          "id": "uuid",
          "username": "string"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

#### GET /videos/:id
Get video details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "thumbnail": "string",
      "streamUrl": "string",
      "duration": "number",
      "views": "number",
      "likes": "number",
      "dislikes": "number",
      "createdAt": "datetime",
      "user": {
        "id": "uuid",
        "username": "string",
        "avatar": "string"
      },
      "tags": ["string"],
      "category": "string"
    }
  }
}
```

#### POST /videos
Upload a new video.

**Headers:** `Authorization: Bearer <token>`

**Request Body (multipart/form-data):**
- `title` (string): Video title
- `description` (string): Video description
- `category` (string): Video category
- `tags` (string): Comma-separated tags
- `video` (file): Video file
- `thumbnail` (file, optional): Thumbnail image

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "video": {
      "id": "uuid",
      "title": "string",
      "status": "processing",
      "uploadProgress": 100
    }
  }
}
```

#### PUT /videos/:id
Update video details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"]
}
```

#### DELETE /videos/:id
Delete a video.

**Headers:** `Authorization: Bearer <token>`

### Analytics

#### GET /analytics/video/:id
Get video analytics.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "views": {
      "total": 1000,
      "today": 50,
      "thisWeek": 300,
      "thisMonth": 800
    },
    "engagement": {
      "likes": 100,
      "dislikes": 5,
      "comments": 25,
      "shares": 15
    },
    "demographics": {
      "countries": [
        {"country": "US", "views": 400},
        {"country": "UK", "views": 200}
      ],
      "devices": [
        {"device": "mobile", "views": 600},
        {"device": "desktop", "views": 400}
      ]
    }
  }
}
```

### Monitoring

#### GET /monitoring/health
Get system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "datetime",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "storage": "healthy"
    },
    "metrics": {
      "uptime": 86400,
      "memory": {
        "used": "512MB",
        "total": "2GB",
        "percentage": 25
      },
      "cpu": {
        "usage": 15.5
      }
    }
  }
}
```

#### GET /monitoring/metrics
Get current system metrics.

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "datetime",
    "system": {
      "memory": {
        "used": 536870912,
        "total": 2147483648,
        "percentage": 25
      },
      "cpu": {
        "usage": 15.5,
        "loadAverage": [1.2, 1.1, 1.0]
      },
      "disk": {
        "used": 10737418240,
        "total": 107374182400,
        "percentage": 10
      }
    },
    "application": {
      "activeConnections": 25,
      "requestsPerMinute": 150,
      "averageResponseTime": 250,
      "errorRate": 0.5
    }
  }
}
```

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Request validation failed
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Security Features

### JWT Authentication
- Access tokens expire in 24 hours
- Refresh tokens expire in 7 days
- Tokens are invalidated on logout

### Rate Limiting
- IP-based rate limiting
- Different limits for different endpoint types
- Automatic blocking of abusive IPs

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection
- XSS protection

### Security Headers
- CORS configuration
- Helmet.js security headers
- Content Security Policy

## Performance Features

### Caching
- Redis caching for frequently accessed data
- CDN integration for static assets
- Database query optimization

### Compression
- Gzip compression for API responses
- Image optimization
- Video transcoding and optimization

### Monitoring
- Real-time performance metrics
- Error tracking and alerting
- Health checks and uptime monitoring

## Development

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostreamly
DB_USERNAME=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# BunnyCDN
BUNNY_API_KEY=your-bunny-api-key
BUNNY_STORAGE_ZONE=your-storage-zone
BUNNY_PULL_ZONE=your-pull-zone
```

### Running the Server

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Support

For API support and questions, please contact the development team or create an issue in the project repository.