/**
 * Blockchain-Based DRM System
 * Revolutionary content protection using smart contracts, NFTs, and decentralized verification
 */

import { ethers } from 'ethers';

interface ContentLicense {
  id: string;
  contentId: string;
  owner: string;
  licensee: string;
  permissions: {
    view: boolean;
    download: boolean;
    share: boolean;
    modify: boolean;
    commercial: boolean;
    timeLimit?: number; // Unix timestamp
    viewCount?: number;
    deviceLimit?: number;
    geographicRestrictions?: string[];
  };
  price: string; // In Wei
  royaltyPercentage: number;
  createdAt: number;
  expiresAt?: number;
  transferable: boolean;
  sublicensable: boolean;
  revocable: boolean;
  metadata: {
    title: string;
    description: string;
    thumbnail: string;
    contentHash: string;
    encryptionKey?: string;
  };
}

interface SmartContract {
  address: string;
  abi: any[];
  instance: ethers.Contract;
}

interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

interface DRMEvent {
  type: 'license_created' | 'license_transferred' | 'access_granted' | 'access_denied' | 'violation_detected';
  contentId: string;
  userId: string;
  licenseId?: string;
  timestamp: number;
  metadata: any;
  transactionHash?: string;
}

interface ContentProtection {
  contentId: string;
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  encryptedKey: string;
  keyDerivationSalt: string;
  accessControlList: string[]; // Wallet addresses
  watermarkData?: {
    userId: string;
    timestamp: number;
    invisible: boolean;
  };
  fingerprintHash: string;
  integrityProof: string;
}

interface DecentralizedStorage {
  provider: 'IPFS' | 'Arweave' | 'Filecoin';
  hash: string;
  gateway: string;
  pinned: boolean;
  replicas: number;
}

interface RoyaltyDistribution {
  contentId: string;
  totalRevenue: string; // In Wei
  distributions: {
    recipient: string;
    percentage: number;
    amount: string;
    paid: boolean;
    transactionHash?: string;
  }[];
  timestamp: number;
}

// Smart Contract ABI for DRM License NFT
const DRM_LICENSE_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "contentId", "type": "string"},
      {"internalType": "address", "name": "licensee", "type": "address"},
      {"internalType": "uint256", "name": "permissions", "type": "uint256"},
      {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
      {"internalType": "string", "name": "metadataURI", "type": "string"}
    ],
    "name": "mintLicense",
    "outputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "string", "name": "contentId", "type": "string"}
    ],
    "name": "verifyAccess",
    "outputs": [{"internalType": "bool", "name": "hasAccess", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "revokeLicense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "contentId", "type": "string"},
      {"internalType": "uint256", "name": "revenue", "type": "uint256"}
    ],
    "name": "distributeRoyalties",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "licensee", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "contentId", "type": "string"}
    ],
    "name": "LicenseCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "contentId", "type": "string"},
      {"indexed": false, "internalType": "bool", "name": "granted", "type": "bool"}
    ],
    "name": "AccessAttempt",
    "type": "event"
  }
];

class CryptographicProtection {
  private static readonly ALGORITHM = 'AES-256-GCM';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly TAG_LENGTH = 16; // 128 bits

  static async generateContentKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  static async encryptContent(content: ArrayBuffer, key: CryptoKey): Promise<{
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    authTag: Uint8Array;
  }> {
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      content
    );

    // Extract auth tag from the end of encrypted data
    const authTag = new Uint8Array(encryptedData.slice(-this.TAG_LENGTH));
    const ciphertext = encryptedData.slice(0, -this.TAG_LENGTH);

    return {
      encryptedData: ciphertext,
      iv,
      authTag
    };
  }

  static async decryptContent(
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array,
    authTag: Uint8Array
  ): Promise<ArrayBuffer> {
    // Combine ciphertext and auth tag
    const combined = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
    combined.set(new Uint8Array(encryptedData));
    combined.set(authTag, encryptedData.byteLength);

    return await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      combined
    );
  }

  static async deriveKeyFromLicense(licenseId: string, userAddress: string, salt: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(licenseId + userAddress + salt),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async generateFingerprint(content: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async addInvisibleWatermark(
    videoData: ArrayBuffer,
    watermarkData: { userId: string; timestamp: number }
  ): Promise<ArrayBuffer> {
    // Simplified watermarking - in real implementation, use advanced steganography
    const watermarkString = JSON.stringify(watermarkData);
    const watermarkBytes = new TextEncoder().encode(watermarkString);
    
    // Embed watermark in least significant bits of video data
    const modifiedData = new Uint8Array(videoData);
    const embedPosition = Math.floor(modifiedData.length * 0.1); // Embed at 10% position
    
    for (let i = 0; i < watermarkBytes.length && embedPosition + i < modifiedData.length; i++) {
      // Modify LSB of each byte
      const watermarkBit = (watermarkBytes[i] >> (i % 8)) & 1;
      modifiedData[embedPosition + i] = (modifiedData[embedPosition + i] & 0xFE) | watermarkBit;
    }
    
    return modifiedData.buffer;
  }

  static async extractWatermark(videoData: ArrayBuffer, expectedLength: number): Promise<string | null> {
    try {
      const data = new Uint8Array(videoData);
      const embedPosition = Math.floor(data.length * 0.1);
      const extractedBytes = new Uint8Array(expectedLength);
      
      for (let i = 0; i < expectedLength && embedPosition + i < data.length; i++) {
        const bit = data[embedPosition + i] & 1;
        extractedBytes[i] |= bit << (i % 8);
      }
      
      return new TextDecoder().decode(extractedBytes);
    } catch (error) {
      console.error('Watermark extraction failed:', error);
      return null;
    }
  }
}

class DecentralizedStorageManager {
  private ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ];

  async storeContent(content: ArrayBuffer, metadata: any): Promise<DecentralizedStorage> {
    // Simulate IPFS storage
    const contentHash = await this.calculateIPFSHash(content);
    
    // In real implementation, upload to IPFS

    
    return {
      provider: 'IPFS',
      hash: contentHash,
      gateway: this.ipfsGateways[0],
      pinned: true,
      replicas: 3
    };
  }

  async retrieveContent(storage: DecentralizedStorage): Promise<ArrayBuffer> {
    // Try multiple gateways for redundancy
    for (const gateway of this.ipfsGateways) {
      try {
        const response = await fetch(`${gateway}${storage.hash}`);
        if (response.ok) {
          return await response.arrayBuffer();
        }
      } catch (error) {
        console.warn(`Failed to retrieve from ${gateway}:`, error);
      }
    }
    
    throw new Error('Failed to retrieve content from all IPFS gateways');
  }

  async pinContent(hash: string): Promise<boolean> {
    // Simulate pinning service

    return true;
  }

  private async calculateIPFSHash(content: ArrayBuffer): Promise<string> {
    // Simplified IPFS hash calculation
    const hashBuffer = await crypto.subtle.digest('SHA-256', content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // IPFS uses base58 encoding with multihash prefix
    return 'Qm' + hashHex.substring(0, 44); // Simplified IPFS hash format
  }
}

export class BlockchainDRMSystem {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private drmContract: SmartContract | null = null;
  private storageManager: DecentralizedStorageManager;
  private eventListeners: Map<string, Function[]> = new Map();
  private licenseCache: Map<string, ContentLicense> = new Map();
  private protectionCache: Map<string, ContentProtection> = new Map();

  constructor(private contractAddress?: string) {
    this.storageManager = new DecentralizedStorageManager();
    this.initializeEventListeners();
  }

  async initialize(web3Provider?: any): Promise<void> {
    try {
      // Initialize Web3 provider
      if (web3Provider) {
        this.provider = new ethers.providers.Web3Provider(web3Provider);
      } else if (typeof window !== 'undefined' && (window as any).ethereum) {
        this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else {
        throw new Error('No Web3 provider available');
      }

      this.signer = this.provider.getSigner();

      // Initialize smart contract
      if (this.contractAddress) {
        this.drmContract = {
          address: this.contractAddress,
          abi: DRM_LICENSE_ABI,
          instance: new ethers.Contract(this.contractAddress, DRM_LICENSE_ABI, this.signer)
        };

        // Set up event listeners
        this.setupContractEventListeners();
      }

  
    } catch (error) {
      console.error('Failed to initialize Blockchain DRM:', error);
      throw error;
    }
  }

  async protectContent(
    contentId: string,
    content: ArrayBuffer,
    owner: string,
    metadata: {
      title: string;
      description: string;
      thumbnail: string;
    }
  ): Promise<ContentProtection> {
    try {
      // Generate encryption key
      const contentKey = await CryptographicProtection.generateContentKey();
      
      // Encrypt content
      const { encryptedData, iv, authTag } = await CryptographicProtection.encryptContent(content, contentKey);
      
      // Add watermark
      const watermarkedContent = await CryptographicProtection.addInvisibleWatermark(
        encryptedData,
        { userId: owner, timestamp: Date.now() }
      );
      
      // Generate fingerprint
      const fingerprintHash = await CryptographicProtection.generateFingerprint(content);
      
      // Store encrypted content on IPFS
      const storage = await this.storageManager.storeContent(watermarkedContent, {
        contentId,
        encrypted: true,
        iv: Array.from(iv),
        authTag: Array.from(authTag),
        ...metadata
      });
      
      // Export and encrypt the content key
      const exportedKey = await crypto.subtle.exportKey('raw', contentKey);
      const keyDerivationSalt = crypto.getRandomValues(new Uint8Array(32));
      const encryptedKey = await this.encryptKeyForOwner(exportedKey, owner, keyDerivationSalt);
      
      const protection: ContentProtection = {
        contentId,
        encryptionAlgorithm: 'AES-256-GCM',
        encryptedKey: Array.from(new Uint8Array(encryptedKey)).map(b => b.toString(16).padStart(2, '0')).join(''),
        keyDerivationSalt: Array.from(keyDerivationSalt).map(b => b.toString(16).padStart(2, '0')).join(''),
        accessControlList: [owner],
        watermarkData: {
          userId: owner,
          timestamp: Date.now(),
          invisible: true
        },
        fingerprintHash,
        integrityProof: storage.hash
      };
      
      this.protectionCache.set(contentId, protection);
      
      // Emit event
      this.emitEvent({
        type: 'license_created',
        contentId,
        userId: owner,
        timestamp: Date.now(),
        metadata: { protection }
      });
      
      return protection;
    } catch (error) {
      console.error('Content protection failed:', error);
      throw error;
    }
  }

  async createLicense(
    contentId: string,
    licensee: string,
    permissions: ContentLicense['permissions'],
    price: string,
    royaltyPercentage: number = 10,
    metadata: {
      title: string;
      description: string;
      thumbnail: string;
    }
  ): Promise<ContentLicense> {
    if (!this.drmContract || !this.signer) {
      throw new Error('DRM system not initialized');
    }

    try {
      const owner = await this.signer.getAddress();
      const licenseId = `${contentId}-${licensee}-${Date.now()}`;
      
      // Encode permissions as bitmask
      const permissionsBitmask = this.encodePermissions(permissions);
      
      // Create metadata URI for IPFS
      const licenseMetadata = {
        contentId,
        permissions,
        ...metadata
      };
      
      const metadataStorage = await this.storageManager.storeContent(
        new TextEncoder().encode(JSON.stringify(licenseMetadata)),
        { type: 'license-metadata' }
      );
      
      // Mint NFT license on blockchain
      const tx = await this.drmContract.instance.mintLicense(
        contentId,
        licensee,
        permissionsBitmask,
        permissions.timeLimit || 0,
        `ipfs://${metadataStorage.hash}`,
        { value: ethers.utils.parseEther(price) }
      );
      
      const receipt = await tx.wait();
      const tokenId = receipt.events?.find((e: any) => e.event === 'LicenseCreated')?.args?.tokenId;
      
      const license: ContentLicense = {
        id: licenseId,
        contentId,
        owner,
        licensee,
        permissions,
        price,
        royaltyPercentage,
        createdAt: Date.now(),
        expiresAt: permissions.timeLimit,
        transferable: true,
        sublicensable: false,
        revocable: true,
        metadata: {
          ...metadata,
          contentHash: this.protectionCache.get(contentId)?.fingerprintHash || '',
          encryptionKey: await this.generateLicenseKey(licenseId, licensee)
        }
      };
      
      this.licenseCache.set(licenseId, license);
      
      // Emit event
      this.emitEvent({
        type: 'license_created',
        contentId,
        userId: licensee,
        licenseId,
        timestamp: Date.now(),
        metadata: { tokenId: tokenId?.toString() },
        transactionHash: tx.hash
      });
      
      return license;
    } catch (error) {
      console.error('License creation failed:', error);
      throw error;
    }
  }

  async verifyAccess(contentId: string, userAddress: string, licenseId?: string): Promise<boolean> {
    try {
      // Check local cache first
      if (licenseId) {
        const license = this.licenseCache.get(licenseId);
        if (license && this.isLicenseValid(license, userAddress)) {
          this.emitEvent({
            type: 'access_granted',
            contentId,
            userId: userAddress,
            licenseId,
            timestamp: Date.now(),
            metadata: { source: 'cache' }
          });
          return true;
        }
      }
      
      // Verify on blockchain
      if (this.drmContract) {
        const hasAccess = await this.drmContract.instance.verifyAccess(licenseId || 0, contentId);
        
        this.emitEvent({
          type: hasAccess ? 'access_granted' : 'access_denied',
          contentId,
          userId: userAddress,
          licenseId,
          timestamp: Date.now(),
          metadata: { source: 'blockchain' }
        });
        
        return hasAccess;
      }
      
      // Fallback: check protection ACL
      const protection = this.protectionCache.get(contentId);
      if (protection && protection.accessControlList.includes(userAddress)) {
        this.emitEvent({
          type: 'access_granted',
          contentId,
          userId: userAddress,
          timestamp: Date.now(),
          metadata: { source: 'acl' }
        });
        return true;
      }
      
      this.emitEvent({
        type: 'access_denied',
        contentId,
        userId: userAddress,
        timestamp: Date.now(),
        metadata: { reason: 'no_valid_license' }
      });
      
      return false;
    } catch (error) {
      console.error('Access verification failed:', error);
      this.emitEvent({
        type: 'access_denied',
        contentId,
        userId: userAddress,
        timestamp: Date.now(),
        metadata: { error: error.message }
      });
      return false;
    }
  }

  async decryptContent(contentId: string, userAddress: string, licenseId: string): Promise<ArrayBuffer> {
    // Verify access first
    const hasAccess = await this.verifyAccess(contentId, userAddress, licenseId);
    if (!hasAccess) {
      throw new Error('Access denied: Invalid license or expired');
    }
    
    const protection = this.protectionCache.get(contentId);
    if (!protection) {
      throw new Error('Content protection data not found');
    }
    
    try {
      // Retrieve encrypted content from IPFS
      const storage: DecentralizedStorage = {
        provider: 'IPFS',
        hash: protection.integrityProof,
        gateway: 'https://ipfs.io/ipfs/',
        pinned: true,
        replicas: 1
      };
      
      const encryptedContent = await this.storageManager.retrieveContent(storage);
      
      // Derive decryption key from license
      const license = this.licenseCache.get(licenseId);
      if (!license || !license.metadata.encryptionKey) {
        throw new Error('License encryption key not found');
      }
      
      const salt = Uint8Array.from(protection.keyDerivationSalt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const decryptionKey = await CryptographicProtection.deriveKeyFromLicense(licenseId, userAddress, protection.keyDerivationSalt);
      
      // Decrypt content (simplified - in real implementation, extract IV and auth tag)
      const iv = new Uint8Array(12); // Placeholder
      const authTag = new Uint8Array(16); // Placeholder
      
      const decryptedContent = await CryptographicProtection.decryptContent(
        encryptedContent,
        decryptionKey,
        iv,
        authTag
      );
      
      // Verify content integrity
      const contentFingerprint = await CryptographicProtection.generateFingerprint(decryptedContent);
      if (contentFingerprint !== protection.fingerprintHash) {
        this.emitEvent({
          type: 'violation_detected',
          contentId,
          userId: userAddress,
          timestamp: Date.now(),
          metadata: { violation: 'integrity_check_failed' }
        });
        throw new Error('Content integrity verification failed');
      }
      
      return decryptedContent;
    } catch (error) {
      console.error('Content decryption failed:', error);
      throw error;
    }
  }

  async transferLicense(licenseId: string, newOwner: string): Promise<BlockchainTransaction> {
    if (!this.drmContract || !this.signer) {
      throw new Error('DRM system not initialized');
    }
    
    const license = this.licenseCache.get(licenseId);
    if (!license) {
      throw new Error('License not found');
    }
    
    if (!license.transferable) {
      throw new Error('License is not transferable');
    }
    
    try {
      // Transfer NFT on blockchain
      const currentOwner = await this.signer.getAddress();
      const tx = await this.drmContract.instance.transferFrom(currentOwner, newOwner, licenseId);
      const receipt = await tx.wait();
      
      // Update local cache
      license.licensee = newOwner;
      this.licenseCache.set(licenseId, license);
      
      const transaction: BlockchainTransaction = {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'confirmed',
        timestamp: Date.now()
      };
      
      this.emitEvent({
        type: 'license_transferred',
        contentId: license.contentId,
        userId: newOwner,
        licenseId,
        timestamp: Date.now(),
        metadata: { previousOwner: currentOwner },
        transactionHash: tx.hash
      });
      
      return transaction;
    } catch (error) {
      console.error('License transfer failed:', error);
      throw error;
    }
  }

  async revokeLicense(licenseId: string): Promise<BlockchainTransaction> {
    if (!this.drmContract || !this.signer) {
      throw new Error('DRM system not initialized');
    }
    
    const license = this.licenseCache.get(licenseId);
    if (!license) {
      throw new Error('License not found');
    }
    
    if (!license.revocable) {
      throw new Error('License is not revocable');
    }
    
    try {
      const tx = await this.drmContract.instance.revokeLicense(licenseId);
      const receipt = await tx.wait();
      
      // Remove from cache
      this.licenseCache.delete(licenseId);
      
      const transaction: BlockchainTransaction = {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'confirmed',
        timestamp: Date.now()
      };
      
      this.emitEvent({
        type: 'license_transferred', // Using transferred as revoked
        contentId: license.contentId,
        userId: license.licensee,
        licenseId,
        timestamp: Date.now(),
        metadata: { revoked: true },
        transactionHash: tx.hash
      });
      
      return transaction;
    } catch (error) {
      console.error('License revocation failed:', error);
      throw error;
    }
  }

  async distributeRoyalties(contentId: string, revenue: string): Promise<RoyaltyDistribution> {
    if (!this.drmContract) {
      throw new Error('DRM system not initialized');
    }
    
    try {
      // Get all licenses for this content
      const contentLicenses = Array.from(this.licenseCache.values())
        .filter(license => license.contentId === contentId);
      
      const distributions: RoyaltyDistribution['distributions'] = [];
      const totalRevenueWei = ethers.utils.parseEther(revenue);
      
      // Calculate distributions
      for (const license of contentLicenses) {
        const royaltyAmount = totalRevenueWei.mul(license.royaltyPercentage).div(100);
        
        distributions.push({
          recipient: license.owner,
          percentage: license.royaltyPercentage,
          amount: royaltyAmount.toString(),
          paid: false
        });
      }
      
      // Execute blockchain transaction
      const tx = await this.drmContract.instance.distributeRoyalties(contentId, totalRevenueWei, {
        value: totalRevenueWei
      });
      
      const receipt = await tx.wait();
      
      // Mark as paid
      distributions.forEach(dist => {
        dist.paid = true;
        dist.transactionHash = tx.hash;
      });
      
      const royaltyDistribution: RoyaltyDistribution = {
        contentId,
        totalRevenue: revenue,
        distributions,
        timestamp: Date.now()
      };
      
      return royaltyDistribution;
    } catch (error) {
      console.error('Royalty distribution failed:', error);
      throw error;
    }
  }

  // Event system
  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Utility methods
  getLicense(licenseId: string): ContentLicense | undefined {
    return this.licenseCache.get(licenseId);
  }

  getContentProtection(contentId: string): ContentProtection | undefined {
    return this.protectionCache.get(contentId);
  }

  getAllLicenses(): ContentLicense[] {
    return Array.from(this.licenseCache.values());
  }

  getUserLicenses(userAddress: string): ContentLicense[] {
    return Array.from(this.licenseCache.values())
      .filter(license => license.licensee.toLowerCase() === userAddress.toLowerCase());
  }

  getContentLicenses(contentId: string): ContentLicense[] {
    return Array.from(this.licenseCache.values())
      .filter(license => license.contentId === contentId);
  }

  // Private methods
  private async encryptKeyForOwner(key: ArrayBuffer, owner: string, salt: Uint8Array): Promise<ArrayBuffer> {
    // Simplified key encryption - in real implementation, use owner's public key
    const ownerKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(owner + Array.from(salt).join('')),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      ownerKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedKey = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      encryptionKey,
      key
    );
    
    // Combine IV and encrypted key
    const combined = new Uint8Array(iv.length + encryptedKey.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedKey), iv.length);
    
    return combined.buffer;
  }

  private async generateLicenseKey(licenseId: string, licensee: string): Promise<string> {
    const keyMaterial = licenseId + licensee + Date.now();
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyMaterial));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private encodePermissions(permissions: ContentLicense['permissions']): number {
    let bitmask = 0;
    if (permissions.view) bitmask |= 1;
    if (permissions.download) bitmask |= 2;
    if (permissions.share) bitmask |= 4;
    if (permissions.modify) bitmask |= 8;
    if (permissions.commercial) bitmask |= 16;
    return bitmask;
  }

  private isLicenseValid(license: ContentLicense, userAddress: string): boolean {
    // Check if user matches
    if (license.licensee.toLowerCase() !== userAddress.toLowerCase()) {
      return false;
    }
    
    // Check expiration
    if (license.expiresAt && Date.now() > license.expiresAt) {
      return false;
    }
    
    // Check view count limit
    if (license.permissions.viewCount !== undefined && license.permissions.viewCount <= 0) {
      return false;
    }
    
    return true;
  }

  private emitEvent(event: DRMEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
    
    // Also emit to 'all' listeners
    const allListeners = this.eventListeners.get('all');
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  private initializeEventListeners(): void {
    // Set up default event handlers
    this.addEventListener('violation_detected', (event: DRMEvent) => {
      console.warn('DRM Violation detected:', event);
      // In real implementation, could trigger automatic license revocation
    });
    
    this.addEventListener('access_denied', (event: DRMEvent) => {
  
      // Could implement rate limiting or suspicious activity detection
    });
  }

  private setupContractEventListeners(): void {
    if (!this.drmContract) return;
    
    // Listen to contract events
    this.drmContract.instance.on('LicenseCreated', (tokenId, licensee, contentId, event) => {
  
      
      this.emitEvent({
        type: 'license_created',
        contentId,
        userId: licensee,
        licenseId: tokenId.toString(),
        timestamp: Date.now(),
        metadata: { blockNumber: event.blockNumber },
        transactionHash: event.transactionHash
      });
    });
    
    this.drmContract.instance.on('AccessAttempt', (user, contentId, granted, event) => {
  
      
      this.emitEvent({
        type: granted ? 'access_granted' : 'access_denied',
        contentId,
        userId: user,
        timestamp: Date.now(),
        metadata: { blockNumber: event.blockNumber },
        transactionHash: event.transactionHash
      });
    });
  }

  destroy(): void {
    // Clean up event listeners
    if (this.drmContract) {
      this.drmContract.instance.removeAllListeners();
    }
    
    this.eventListeners.clear();
    this.licenseCache.clear();
    this.protectionCache.clear();
  }
}

export default BlockchainDRMSystem;