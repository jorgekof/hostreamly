import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitInfo {
  totalHits: number;
  remaining: number;
  limit: number;
  resetTime: Date;
}

interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
  retryAfter?: number;
}

class RateLimiter {
  public config: RateLimitConfig;
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }
    
    // Default key generation based on IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || 
               'unknown';
    
    return `ip:${ip}`;
  }

  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let entry = this.store.get(key);
    
    // Reset if window has expired
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }
    
    entry.count++;
    this.store.set(key, entry);
    
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count <= this.config.maxRequests;
    
    const info: RateLimitInfo = {
      totalHits: entry.count,
      remaining,
      limit: this.config.maxRequests,
      resetTime: new Date(entry.resetTime)
    };
    
    const result: RateLimitResult = {
      allowed,
      info
    };
    
    if (!allowed) {
      result.retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    }
    
    return result;
  }

  createHeaders(info: RateLimitInfo, retryAfter?: number): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': info.limit.toString(),
      'X-RateLimit-Remaining': info.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(info.resetTime.getTime() / 1000).toString(),
    };
    
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }
    
    return headers;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Advanced rate limiter with Redis-like sliding window
class SlidingWindowRateLimiter extends RateLimiter {
  private windows: Map<string, number[]> = new Map();

  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let timestamps = this.windows.get(key) || [];
    
    // Remove expired timestamps
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    // Add current request
    timestamps.push(now);
    this.windows.set(key, timestamps);
    
    const totalHits = timestamps.length;
    const remaining = Math.max(0, this.config.maxRequests - totalHits);
    const allowed = totalHits <= this.config.maxRequests;
    
    const info: RateLimitInfo = {
      totalHits,
      remaining,
      limit: this.config.maxRequests,
      resetTime: new Date(now + this.config.windowMs)
    };
    
    const result: RateLimitResult = {
      allowed,
      info
    };
    
    if (!allowed) {
      // Calculate retry after based on oldest request in window
      const oldestRequest = Math.min(...timestamps);
      result.retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);
    }
    
    return result;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [key, timestamps] of this.windows.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, validTimestamps);
      }
    }
  }
}

// User-based rate limiter
class UserRateLimiter extends RateLimiter {
  generateKey(request: NextRequest): string {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract user ID from JWT token (simplified)
      try {
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        return `user:${payload.id}`;
      } catch (error) {
        // Fallback to IP-based limiting
        return super.generateKey(request);
      }
    }
    
    return super.generateKey(request);
  }
}

// Adaptive rate limiter that adjusts based on system load
class AdaptiveRateLimiter extends RateLimiter {
  private systemLoad: number = 0;
  private loadThreshold: number = 0.8;
  private scaleFactor: number = 0.5;

  updateSystemLoad(load: number): void {
    this.systemLoad = load;
  }

  async checkLimit(key: string): Promise<RateLimitResult> {
    // Adjust limits based on system load
    const adjustedConfig = { ...this.config };
    
    if (this.systemLoad > this.loadThreshold) {
      adjustedConfig.maxRequests = Math.floor(
        this.config.maxRequests * this.scaleFactor
      );
    }
    
    const originalConfig = this.config;
    this.config = adjustedConfig;
    
    const result = await super.checkLimit(key);
    
    this.config = originalConfig;
    return result;
  }
}

// Factory functions
export function createIPRateLimiter(config: Partial<RateLimitConfig>): RateLimiter {
  const defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.'
  };
  
  return new RateLimiter({ ...defaultConfig, ...config });
}

export function createUserRateLimiter(config: Partial<RateLimitConfig>): UserRateLimiter {
  const defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests from this user, please try again later.'
  };
  
  return new UserRateLimiter({ ...defaultConfig, ...config });
}

export function createSlidingWindowRateLimiter(config: Partial<RateLimitConfig>): SlidingWindowRateLimiter {
  const defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later.'
  };
  
  return new SlidingWindowRateLimiter({ ...defaultConfig, ...config });
}

export function createAdaptiveRateLimiter(config: Partial<RateLimitConfig>): AdaptiveRateLimiter {
  const defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later.'
  };
  
  return new AdaptiveRateLimiter({ ...defaultConfig, ...config });
}

// Predefined rate limiters
export const rateLimiters = {
  // General API rate limiting
  api: createIPRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.'
  }),
  
  // Authentication endpoints (stricter)
  auth: createIPRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  }),
  
  // Upload endpoints
  upload: createUserRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Upload limit exceeded, please try again later.'
  }),
  
  // Streaming endpoints
  stream: createIPRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Streaming rate limit exceeded, please try again later.'
  }),
  
  // Live streaming endpoints
  liveStream: createUserRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Live streaming limit exceeded, please try again later.'
  }),
  
  // Analytics endpoints
  analytics: createUserRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Analytics rate limit exceeded, please try again later.'
  }),
  
  // DRM endpoints
  drm: createIPRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'DRM rate limit exceeded, please try again later.'
  }),
  
  // Webhook endpoints (more lenient)
  webhook: createIPRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'Webhook rate limit exceeded, please try again later.'
  })
};

export { RateLimiter, SlidingWindowRateLimiter, UserRateLimiter, AdaptiveRateLimiter };
export type { RateLimitConfig, RateLimitInfo, RateLimitResult };