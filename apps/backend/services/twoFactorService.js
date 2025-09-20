const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('../utils/logger');

class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   * @param {Object} user - User object
   * @returns {Object} Secret and QR code data
   */
  static async generateSecret(user) {
    try {
      const secret = speakeasy.generateSecret({
        name: `${user.email}`,
        service: 'Hostreamly',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      logger.audit('2fa_secret_generated', user.id, 'security', {
        email: user.email
      });

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
        otpauthUrl: secret.otpauth_url
      };
    } catch (error) {
      logger.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify a TOTP token
   * @param {string} token - 6-digit TOTP token
   * @param {string} secret - User's 2FA secret
   * @param {number} window - Time window for verification (default: 2)
   * @returns {boolean} Verification result
   */
  static verifyToken(token, secret, window = 2) {
    try {
      return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window
      });
    } catch (error) {
      logger.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for 2FA
   * @param {number} count - Number of backup codes to generate (default: 10)
   * @returns {Array} Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Hash backup codes for secure storage
   * @param {Array} codes - Array of backup codes
   * @returns {Array} Array of hashed backup codes
   */
  static async hashBackupCodes(codes) {
    const bcrypt = require('bcryptjs');
    const hashedCodes = [];
    
    for (const code of codes) {
      const salt = await bcrypt.genSalt(12);
      const hashedCode = await bcrypt.hash(code, salt);
      hashedCodes.push({
        code: hashedCode,
        used: false,
        created_at: new Date()
      });
    }
    
    return hashedCodes;
  }

  /**
   * Verify a backup code
   * @param {string} inputCode - Backup code provided by user
   * @param {Array} storedCodes - Array of stored backup codes
   * @returns {Object} Verification result and updated codes
   */
  static async verifyBackupCode(inputCode, storedCodes) {
    const bcrypt = require('bcryptjs');
    
    if (!storedCodes || !Array.isArray(storedCodes)) {
      return { valid: false, updatedCodes: storedCodes };
    }
    
    for (let i = 0; i < storedCodes.length; i++) {
      const codeObj = storedCodes[i];
      
      // Skip if already used
      if (codeObj.used) continue;
      
      // Verify the code
      const isValid = await bcrypt.compare(inputCode.toUpperCase(), codeObj.code);
      
      if (isValid) {
        // Mark code as used
        storedCodes[i].used = true;
        storedCodes[i].used_at = new Date();
        
        return {
          valid: true,
          updatedCodes: storedCodes
        };
      }
    }
    
    return { valid: false, updatedCodes: storedCodes };
  }

  /**
   * Check if user has unused backup codes
   * @param {Array} backupCodes - Array of backup codes
   * @returns {number} Number of unused backup codes
   */
  static getUnusedBackupCodesCount(backupCodes) {
    if (!backupCodes || !Array.isArray(backupCodes)) {
      return 0;
    }
    
    return backupCodes.filter(code => !code.used).length;
  }

  /**
   * Generate new backup codes and invalidate old ones
   * @param {Object} user - User object
   * @returns {Array} New backup codes (unhashed for display)
   */
  static async regenerateBackupCodes(user) {
    try {
      const newCodes = this.generateBackupCodes();
      const hashedCodes = await this.hashBackupCodes(newCodes);
      
      // Update user's backup codes
      await user.update({
        backup_codes: hashedCodes
      });
      
      logger.audit('2fa_backup_codes_regenerated', user.id, 'security', {
        email: user.email,
        codesCount: newCodes.length
      });
      
      return newCodes;
    } catch (error) {
      logger.error('Error regenerating backup codes:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }

  /**
   * Disable 2FA for a user
   * @param {Object} user - User object
   * @returns {boolean} Success status
   */
  static async disable2FA(user) {
    try {
      await user.update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null
      });
      
      logger.audit('2fa_disabled', user.id, 'security', {
        email: user.email
      });
      
      return true;
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Enable 2FA for a user
   * @param {Object} user - User object
   * @param {string} secret - 2FA secret
   * @param {Array} backupCodes - Hashed backup codes
   * @returns {boolean} Success status
   */
  static async enable2FA(user, secret, backupCodes) {
    try {
      await user.update({
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: backupCodes
      });
      
      logger.audit('2fa_enabled', user.id, 'security', {
        email: user.email
      });
      
      return true;
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Count unused backup codes
   * @param {Array} backupCodes - Array of backup code objects
   * @returns {number} Number of unused backup codes
   */
  static getUnusedBackupCodesCount(backupCodes) {
    if (!Array.isArray(backupCodes)) {
      return 0;
    }
    
    return backupCodes.filter(codeObj => !codeObj.used).length;
  }
}

module.exports = TwoFactorService;