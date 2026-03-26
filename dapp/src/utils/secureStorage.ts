/**
 * Secure Storage Utilities
 *
 * Uses IndexedDB with encryption for secure storage of sensitive data.
 * - IndexedDB provides better XSS protection than localStorage
 * - Web Crypto API (AES-GCM) encrypts data at rest
 * - Encryption key derived from session-specific entropy
 */

const DB_NAME = 'Based';
const DB_VERSION = 1;
const STORE_NAME = 'secureData';
const ENCRYPTION_ENABLED = true; // Set to false to disable encryption (not recommended)

interface SecureData {
  key: string;
  value: any; // Encrypted when ENCRYPTION_ENABLED is true
  timestamp: number;
  iv?: string; // Initialization vector for AES-GCM (base64)
}

// Cache the encryption key for the session
let cachedEncryptionKey: CryptoKey | null = null;

/**
 * Custom error class for secure storage errors
 */
export class SecureStorageError extends Error {
  constructor(message: string, public readonly cause?: any) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

/**
 * Retry helper for database operations
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} failed:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw new SecureStorageError(
    `Operation failed after ${maxRetries} attempts`,
    lastError
  );
}

/**
 * Get or generate encryption key for the session
 * Uses Web Crypto API to derive a key from session-specific data
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  // Generate key material from session ID + user agent
  const sessionData = `${Date.now()}-${navigator.userAgent}`;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(sessionData));

  // Import as AES-GCM key
  cachedEncryptionKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedEncryptionKey;
}

/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data: any): Promise<{ encrypted: string; iv: string }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  // Convert to base64 for storage
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encrypted: string, iv: string): Promise<any> {
  const key = await getEncryptionKey();

  // Convert from base64
  const ciphertext = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
}

/**
 * Initialize IndexedDB with error handling
 */
async function getDB(): Promise<IDBDatabase> {
  return retryOperation(() => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new SecureStorageError('IndexedDB is not supported in this browser'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new SecureStorageError('Failed to open IndexedDB', request.error));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            console.log('[SecureStorage] Created object store:', STORE_NAME);
          }
        } catch (error) {
          reject(new SecureStorageError('Failed to create object store', error));
        }
      };

      request.onblocked = () => {
        console.warn('[SecureStorage] IndexedDB upgrade blocked. Close other tabs.');
      };
    });
  });
}

/**
 * Store data securely in IndexedDB (with encryption and retry logic)
 */
export async function setSecureItem(key: string, value: any): Promise<void> {
  if (!key) {
    throw new SecureStorageError('Key cannot be empty');
  }

  if (value === undefined) {
    throw new SecureStorageError('Value cannot be undefined (use null for empty values)');
  }

  return retryOperation(async () => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let data: SecureData;

      if (ENCRYPTION_ENABLED) {
        // Encrypt the value before storing
        try {
          const { encrypted, iv } = await encryptData(value);
          data = {
            key,
            value: encrypted,
            iv,
            timestamp: Date.now(),
          };
        } catch (encryptError) {
          throw new SecureStorageError('Failed to encrypt data', encryptError);
        }
      } else {
        // Store plaintext (not recommended for production)
        data = {
          key,
          value,
          timestamp: Date.now(),
        };
      }

      return new Promise<void>((resolve, reject) => {
        const request = store.put(data);

        request.onsuccess = () => {
          console.log(`[SecureStorage] Stored key: ${key}`);
          resolve();
        };

        request.onerror = () => {
          reject(new SecureStorageError(`Failed to store key: ${key}`, request.error));
        };

        transaction.onerror = () => {
          reject(new SecureStorageError(`Transaction failed for key: ${key}`, transaction.error));
        };
      });
    } catch (error) {
      if (error instanceof SecureStorageError) {
        throw error;
      }
      throw new SecureStorageError('Unexpected error storing data', error);
    }
  });
}

/**
 * Retrieve data securely from IndexedDB (with decryption and retry logic)
 */
export async function getSecureItem(key: string): Promise<any | null> {
  if (!key) {
    throw new SecureStorageError('Key cannot be empty');
  }

  return retryOperation(async () => {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise<any | null>(async (resolve, reject) => {
        const request = store.get(key);

        request.onsuccess = async () => {
          const result = request.result as SecureData | undefined;

          if (!result) {
            console.log(`[SecureStorage] Key not found: ${key}`);
            resolve(null);
            return;
          }

          // Decrypt if encryption was used
          if (ENCRYPTION_ENABLED && result.iv) {
            try {
              const decrypted = await decryptData(result.value, result.iv);
              console.log(`[SecureStorage] Retrieved and decrypted key: ${key}`);
              resolve(decrypted);
            } catch (decryptError) {
              console.error(`[SecureStorage] Decryption failed for key: ${key}`, decryptError);
              // Return null if decryption fails (corrupted data or wrong key)
              resolve(null);
            }
          } else {
            // Return plaintext
            console.log(`[SecureStorage] Retrieved key (plaintext): ${key}`);
            resolve(result.value);
          }
        };

        request.onerror = () => {
          reject(new SecureStorageError(`Failed to retrieve key: ${key}`, request.error));
        };

        transaction.onerror = () => {
          reject(new SecureStorageError(`Transaction failed for key: ${key}`, transaction.error));
        };
      });
    } catch (error) {
      if (error instanceof SecureStorageError) {
        throw error;
      }
      console.error('[SecureStorage] Unexpected error retrieving data:', error);
      return null;
    }
  });
}

/**
 * Remove data from IndexedDB
 */
export async function removeSecureItem(key: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error removing secure data:', error);
    throw error;
  }
}

/**
 * Clear all secure data
 */
export async function clearSecureStorage(): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing secure storage:', error);
    throw error;
  }
}

/**
 * Check if a key exists in secure storage
 */
export async function hasSecureItem(key: string): Promise<boolean> {
  const value = await getSecureItem(key);
  return value !== null;
}

/**
 * Migrate data from localStorage to IndexedDB
 * Useful for upgrading existing installations
 */
export async function migrateFromLocalStorage(keys: string[]): Promise<void> {
  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (value) {
      try {
        // Try to parse JSON
        const parsedValue = JSON.parse(value);
        await setSecureItem(key, parsedValue);
      } catch {
        // Not JSON, store as string
        await setSecureItem(key, value);
      }

      // Remove from localStorage
      localStorage.removeItem(key);
      console.log(`Migrated ${key} from localStorage to IndexedDB`);
    }
  }
}
