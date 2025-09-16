const { isIP } = require('net');

/**
 * Check if an IP address is within a CIDR block
 * @param {string} ip - IP address to check
 * @param {string} cidr - CIDR block (e.g., '192.168.1.0/24')
 * @returns {boolean} - True if IP is in CIDR block
 */
function isIPInCIDR(ip, cidr) {
  if (!isIP(ip)) {
    return false;
  }
  
  const [network, prefixLength] = cidr.split('/');
  
  if (!isIP(network) || !prefixLength) {
    return false;
  }
  
  const prefix = parseInt(prefixLength, 10);
  
  // Convert IP addresses to integers for comparison
  const ipInt = ipToInt(ip);
  const networkInt = ipToInt(network);
  
  // Create subnet mask
  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
  
  // Check if IP is in the network
  return (ipInt & mask) === (networkInt & mask);
}

/**
 * Convert IP address string to integer
 * @param {string} ip - IP address string
 * @returns {number} - IP as integer
 */
function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => {
    return (acc << 8) + parseInt(octet, 10);
  }, 0) >>> 0;
}

/**
 * Convert integer to IP address string
 * @param {number} int - IP as integer
 * @returns {string} - IP address string
 */
function intToIP(int) {
  return [
    (int >>> 24) & 0xFF,
    (int >>> 16) & 0xFF,
    (int >>> 8) & 0xFF,
    int & 0xFF
  ].join('.');
}

/**
 * Validate IP address or CIDR block
 * @param {string} input - IP address or CIDR block
 * @returns {object} - Validation result
 */
function validateIPOrCIDR(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, type: null, error: 'Input must be a string' };
  }
  
  const trimmed = input.trim();
  
  // Check if it's a CIDR block
  if (trimmed.includes('/')) {
    const [network, prefix] = trimmed.split('/');
    
    if (!isIP(network)) {
      return { valid: false, type: 'cidr', error: 'Invalid network address' };
    }
    
    const prefixNum = parseInt(prefix, 10);
    if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 32) {
      return { valid: false, type: 'cidr', error: 'Invalid prefix length (must be 0-32)' };
    }
    
    return { valid: true, type: 'cidr', network, prefix: prefixNum };
  }
  
  // Check if it's a single IP
  if (isIP(trimmed)) {
    return { valid: true, type: 'ip', ip: trimmed };
  }
  
  return { valid: false, type: null, error: 'Invalid IP address or CIDR block' };
}

/**
 * Get client IP from request object
 * @param {object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIP(req) {
  return (
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.headers['x-real-ip'] || // Nginx
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || // Load balancer
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
}

/**
 * Check if IP is in private range
 * @param {string} ip - IP address
 * @returns {boolean} - True if IP is private
 */
function isPrivateIP(ip) {
  if (!isIP(ip)) {
    return false;
  }
  
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8', // Loopback
    '169.254.0.0/16', // Link-local
    '::1/128', // IPv6 loopback
    'fc00::/7', // IPv6 private
    'fe80::/10' // IPv6 link-local
  ];
  
  return privateRanges.some(range => {
    try {
      return isIPInCIDR(ip, range);
    } catch (error) {
      return false;
    }
  });
}

/**
 * Normalize IP address (remove IPv6 wrapper from IPv4)
 * @param {string} ip - IP address
 * @returns {string} - Normalized IP address
 */
function normalizeIP(ip) {
  if (!ip) return ip;
  
  // Remove IPv6 wrapper from IPv4 addresses
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
}

/**
 * Generate IP range from CIDR
 * @param {string} cidr - CIDR block
 * @returns {object} - Start and end IP addresses
 */
function getCIDRRange(cidr) {
  const [network, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength, 10);
  
  if (!isIP(network) || isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error('Invalid CIDR block');
  }
  
  const networkInt = ipToInt(network);
  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const wildcardMask = ~mask >>> 0;
  
  const startIP = (networkInt & mask) >>> 0;
  const endIP = (startIP | wildcardMask) >>> 0;
  
  return {
    start: intToIP(startIP),
    end: intToIP(endIP),
    count: wildcardMask + 1
  };
}

module.exports = {
  isIPInCIDR,
  ipToInt,
  intToIP,
  validateIPOrCIDR,
  getClientIP,
  isPrivateIP,
  normalizeIP,
  getCIDRRange
};