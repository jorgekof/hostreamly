import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, createIPRateLimiter, createUserRateLimiter } from './lib/rateLimiter';

// Define rate limiting rules for different API routes
const routeRules: Record<string, { limiter: string; customConfig?: Record<string, unknown> }> = {
  // Authentication routes
  '/api/auth/signin': { limiter: 'auth' },
  '/api/auth/signup': { limiter: 'auth' },
  '/api/auth/reset-password': { limiter: 'auth' },
  '/api/auth/verify': { limiter: 'auth' },
  
  // Video management routes
  '/api/videos/upload': { limiter: 'upload' },
  '/api/videos/stream': { limiter: 'stream' },
  '/api/videos': { limiter: 'api' },
  
  // Live streaming routes
  '/api/live-streams': { limiter: 'liveStream' },
  '/api/live-streams/create': { limiter: 'liveStream' },
  '/api/live-streams/stats': { limiter: 'analytics' },
  
  // Analytics routes
  '/api/analytics': { limiter: 'analytics' },
  '/api/analytics/dashboard': { limiter: 'analytics' },
  '/api/analytics/reports': { limiter: 'analytics' },
  
  // DRM routes
  '/api/drm/generate-token': { limiter: 'drm' },
  '/api/drm/verify-token': { limiter: 'drm' },
  
  // Webhook routes
  '/api/webhooks/bunny': { limiter: 'webhook' },
  '/api/webhooks/stripe': { limiter: 'webhook' },
  
  // Public API routes (more restrictive)
  '/api/public': { 
    limiter: 'custom',
    customConfig: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      message: 'Public API rate limit exceeded',
    }
  },
};

// Paths that should be excluded from rate limiting
const excludedPaths = [
  '/api/health',
  '/api/status',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

// Paths that require stricter rate limiting
const strictPaths = [
  '/api/auth',
  '/api/admin',
];

// Create custom rate limiters
const customLimiters = {
  strict: createIPRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 requests per 15 minutes
    message: 'Strict rate limit exceeded for sensitive endpoints',
  }),
  
  publicAPI: createIPRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: 'Public API rate limit exceeded',
  }),
  
  userBased: createUserRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2000, // 2000 requests per 15 minutes for authenticated users
    message: 'User rate limit exceeded',
  }),
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip rate limiting for excluded paths
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Skip rate limiting for static files
  if (pathname.includes('.') && !pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  try {
    // Determine which rate limiter to use
    let limiter;
    let limiterName = 'api'; // default
    
    // Check for specific route rules
    for (const [route, rule] of Object.entries(routeRules)) {
      if (pathname.startsWith(route)) {
        limiterName = rule.limiter;
        
        if (rule.limiter === 'custom' && rule.customConfig) {
          limiter = createIPRateLimiter(rule.customConfig);
        }
        break;
      }
    }
    
    // Check for strict paths
    if (strictPaths.some(path => pathname.startsWith(path))) {
      limiter = customLimiters.strict;
      limiterName = 'strict';
    }
    
    // Use predefined limiter if no custom limiter was created
    if (!limiter) {
      limiter = rateLimiters[limiterName as keyof typeof rateLimiters] || rateLimiters.api;
    }
    
    // Check if user is authenticated for user-based rate limiting
    const authHeader = request.headers.get('authorization');
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    
    // Use user-based rate limiting for authenticated requests (except webhooks)
    if (isAuthenticated && !pathname.startsWith('/api/webhooks/')) {
      limiter = customLimiters.userBased;
      limiterName = 'userBased';
    }
    
    // Generate rate limit key
    const identifier = limiter.generateKey(request);
    
    // Check rate limit
    const result = await limiter.checkLimit(identifier);
    
    // Create response headers
    const headers = limiter.createHeaders(result.info, result.retryAfter);
    
    // Add additional security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    
    if (!result.allowed) {
      // Log rate limit violation
      console.warn(`Rate limit exceeded for ${identifier} on ${pathname}`, {
        limiter: limiterName,
        totalHits: result.info.totalHits,
        limit: result.info.limit,
        resetTime: result.info.resetTime,
        userAgent: request.headers.get('user-agent'),
        ip: getClientIP(request),
      });
      
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: limiter.config.message,
          retryAfter: result.retryAfter,
          limit: result.info.limit,
          remaining: result.info.remaining,
          resetTime: result.info.resetTime,
          type: 'RATE_LIMIT_ERROR',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }
    
    // Create response with rate limit headers
    const response = NextResponse.next();
    
    // Add rate limit headers to the response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add rate limit info to request headers for API routes to use
    response.headers.set('X-RateLimit-Info', JSON.stringify({
      limiter: limiterName,
      remaining: result.info.remaining,
      resetTime: result.info.resetTime,
    }));
    
    return response;
    
  } catch (error) {
    console.error('Rate limiting middleware error:', error);
    
    // Continue without rate limiting if there's an error
    const response = NextResponse.next();
    
    // Add error header for debugging
    response.headers.set('X-RateLimit-Error', 'Rate limiting temporarily unavailable');
    
    return response;
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// Helper function to detect suspicious patterns
function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /requests/i,
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return true;
  }
  
  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    return true;
  }
  
  // Check for suspicious referers
  const suspiciousReferers = [
    'localhost',
    '127.0.0.1',
    'postman',
    'insomnia',
  ];
  
  if (suspiciousReferers.some(suspicious => referer.includes(suspicious))) {
    return true;
  }
  
  return false;
}

// Configuration for which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
