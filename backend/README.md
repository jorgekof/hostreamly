# Hostreamly Backend

Hostreamly is a comprehensive video streaming platform backend built with Node.js, Express, and integrated with Bunny.net CDN and Agora for live streaming capabilities.

## Features

### Core Features
- 🎥 **Video Management**: Upload, encode, and stream videos via Bunny.net
- 📺 **Live Streaming**: Real-time streaming with Agora integration
- 🔐 **Authentication & Authorization**: JWT-based auth with role management
- 💾 **Database**: MariaDB with Sequelize ORM
- 🚀 **Caching**: Redis for session management and caching
- 📊 **Analytics**: Comprehensive video and streaming analytics
- 🛡️ **Security**: Rate limiting, input validation, and DRM protection
- 🔄 **Real-time**: WebSocket support for live features

### Bunny.net Integration
- Video upload and encoding
- CDN distribution
- DRM protection
- Analytics and statistics
- Thumbnail generation
- Multiple streaming formats (HLS, DASH, MP4)

### Agora Integration
- Live streaming with RTC
- Real-time messaging (RTM)
- Cloud recording
- Channel management
- Token generation

## Prerequisites

- Node.js 18+ and npm 8+
- MariaDB 10.6+
- Redis 6+
- Bunny.net account with Stream and Storage zones
- Agora account with App ID and Certificate

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hostreamly-media-main/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Database Setup**
   - Create a MariaDB database
   - Update database credentials in `.env`
   - Run migrations (in development, models will auto-sync)

5. **Redis Setup**
   - Install and start Redis server
   - Update Redis configuration in `.env`

## Configuration

### Required Environment Variables

#### Database (MariaDB)
```env
DB_HOST=your_mariadb_host
DB_PORT=3306
DB_NAME=bunnyvault
DB_USER=your_username
DB_PASSWORD=your_password
```

#### Redis
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

#### JWT Secrets
```env
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

#### Bunny.net Configuration
```env
BUNNY_API_KEY=your_bunny_api_key
BUNNY_LIBRARY_ID=your_stream_library_id
BUNNY_CDN_HOSTNAME=your_cdn.b-cdn.net
BUNNY_STORAGE_ZONE=your_storage_zone
BUNNY_STORAGE_PASSWORD=your_storage_password
```

#### Agora Configuration
```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Video Management
- `GET /api/videos` - Get videos with filtering
- `POST /api/videos` - Upload new video
- `GET /api/videos/:id` - Get video details
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `POST /api/videos/:id/like` - Like/unlike video
- `GET /api/videos/:id/analytics` - Get video analytics

### Live Streaming
- `GET /api/livestreams` - Get live streams
- `POST /api/livestreams` - Create new stream
- `GET /api/livestreams/:id` - Get stream details
- `POST /api/livestreams/:id/join` - Join stream (get tokens)
- `POST /api/livestreams/:id/start` - Start stream
- `POST /api/livestreams/:id/end` - End stream
- `PUT /api/livestreams/:id` - Update stream
- `DELETE /api/livestreams/:id` - Delete stream

### Health Check
- `GET /health` - Application health status

## Architecture

### Directory Structure
```
backend/
├── config/          # Configuration files
│   ├── database.js  # Database configuration
│   └── redis.js     # Redis configuration
├── middleware/      # Express middleware
│   ├── auth.js      # Authentication middleware
│   └── errorHandler.js # Error handling
├── models/          # Database models
│   ├── User.js      # User model
│   ├── Video.js     # Video model
│   └── LiveStream.js # Live stream model
├── routes/          # API routes
│   ├── auth.js      # Authentication routes
│   ├── videos.js    # Video management routes
│   └── livestreams.js # Live streaming routes
├── services/        # Business logic services
│   ├── BunnyService.js # Bunny.net integration
│   └── AgoraService.js # Agora integration
├── utils/           # Utility functions
│   └── logger.js    # Logging configuration
├── app.js           # Express application setup
└── server.js        # Server startup
```

### Database Models

#### User Model
- Authentication and profile management
- Role-based access control
- Premium subscription tracking
- Usage limits and quotas

#### Video Model
- Video metadata and Bunny.net integration
- Processing status tracking
- Analytics and engagement metrics
- DRM and access control

#### LiveStream Model
- Agora channel management
- Stream configuration and settings
- Real-time analytics
- Recording management

## Services Integration

### Bunny.net Service
Handles all Bunny.net API interactions:
- Video upload and encoding
- CDN management
- Storage operations
- Analytics retrieval
- DRM configuration

### Agora Service
Manages Agora platform features:
- RTC token generation
- RTM messaging
- Cloud recording
- Channel statistics
- Webhook processing

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Request data validation
- **CORS Configuration**: Cross-origin request handling
- **Helmet Security**: HTTP security headers
- **Password Hashing**: bcrypt password encryption
- **Session Management**: Redis-based sessions

## Monitoring and Logging

- **Winston Logging**: Structured logging with rotation
- **Performance Monitoring**: Request timing and metrics
- **Health Checks**: Application and service status
- **Error Tracking**: Comprehensive error logging
- **Analytics**: User and content analytics

## Development

### Code Style
- ESLint for code linting
- Prettier for code formatting
- Consistent naming conventions

### Testing
```bash
npm test
```

### Debugging
Set `DEBUG=bunnyvault:*` in your environment for detailed logs.

## Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up Redis cluster
4. Configure Bunny.net production zones
5. Set up Agora production app

### Production Considerations
- Use process manager (PM2)
- Set up reverse proxy (Nginx)
- Configure SSL certificates
- Set up monitoring and alerting
- Configure backup strategies

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MariaDB service status
   - Verify connection credentials
   - Ensure database exists

2. **Redis Connection Failed**
   - Check Redis service status
   - Verify Redis configuration
   - Check network connectivity

3. **Bunny.net API Errors**
   - Verify API key validity
   - Check library and zone IDs
   - Review API rate limits

4. **Agora Token Errors**
   - Verify App ID and Certificate
   - Check token expiration
   - Validate channel names

### Logs Location
- Application logs: `./logs/`
- Error logs: `./logs/error.log`
- Access logs: `./logs/access.log`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the logs for error details

---

**BunnyVault Backend** - Powering next-generation video streaming platforms.