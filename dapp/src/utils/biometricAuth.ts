/**
 * Biometric Authentication Utilities
 *
 * Handles Face ID, Touch ID, and other biometric authentication
 * using the Web Authentication API (WebAuthn).
 *
 * SECURITY: Uses IndexedDB for secure storage of credential IDs
 * instead of localStorage to prevent XSS attacks.
 */

import { setSecureItem, getSecureItem, removeSecureItem, migrateFromLocalStorage } from './secureStorage';

const CREDENTIAL_ID_KEY = 'biometric-credential-id';
const USER_ADDRESS_KEY = 'biometric-user-address';

export interface BiometricCredential {
  id: string;
  rawId: ArrayBuffer;
  response: AuthenticatorAttestationResponse;
  type: 'public-key';
}

export interface BiometricAuthResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

/**
 * Check if biometric authentication is supported
 */
export const isBiometricSupported = async (): Promise<boolean> => {
  // Check for WebAuthn API
  if (!window.PublicKeyCredential) {
    return false;
  }

  // Check for platform authenticator (Face ID, Touch ID, etc.)
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
};

/**
 * Register biometric authentication
 */
export const registerBiometric = async (
  userAddress: string,
  displayName: string = 'Based User'
): Promise<BiometricAuthResult> => {
  try {
    // Check support
    const supported = await isBiometricSupported();
    if (!supported) {
      return {
        success: false,
        error: 'Biometric authentication not supported on this device',
      };
    }

    // Generate challenge (should come from server in production)
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Based',
        id: window.location.hostname,
      },
      user: {
        id: stringToArrayBuffer(userAddress),
        name: userAddress,
        displayName,
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // ES256
        },
        {
          type: 'public-key',
          alg: -257, // RS256
        },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Platform authenticator (Face ID, Touch ID)
        requireResidentKey: false,
        userVerification: 'required', // Requires biometric
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Create credential
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return {
        success: false,
        error: 'Failed to create biometric credential',
      };
    }

    // Store credential ID in secure storage (IndexedDB)
    await setSecureItem(CREDENTIAL_ID_KEY, credential.id);
    await setSecureItem(USER_ADDRESS_KEY, userAddress);

    console.log('Biometric credential registered securely:', credential.id);

    return {
      success: true,
      credential: credential as any,
    };
  } catch (error: any) {
    console.error('Error registering biometric:', error);

    let errorMessage = 'Failed to register biometric authentication';

    if (error.name === 'NotAllowedError') {
      errorMessage = 'Biometric authentication was cancelled';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'Biometric credential already exists';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Authenticate using biometrics
 */
export const authenticateWithBiometric = async (): Promise<BiometricAuthResult> => {
  try {
    // Check support
    const supported = await isBiometricSupported();
    if (!supported) {
      return {
        success: false,
        error: 'Biometric authentication not supported',
      };
    }

    // Get stored credential ID from secure storage
    const credentialId = await getSecureItem(CREDENTIAL_ID_KEY);
    if (!credentialId) {
      return {
        success: false,
        error: 'No biometric credential found. Please register first.',
      };
    }

    // Generate challenge (should come from server in production)
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // Create assertion options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: base64ToArrayBuffer(credentialId),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      timeout: 60000,
      userVerification: 'required',
    };

    // Get credential
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!assertion) {
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }

    console.log('Biometric authentication successful');

    return {
      success: true,
      credential: assertion as any,
    };
  } catch (error: any) {
    console.error('Error authenticating with biometric:', error);

    let errorMessage = 'Biometric authentication failed';

    if (error.name === 'NotAllowedError') {
      errorMessage = 'Authentication was cancelled';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'No biometric credential found';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Remove biometric authentication
 */
export const removeBiometric = async (): Promise<void> => {
  await removeSecureItem(CREDENTIAL_ID_KEY);
  await removeSecureItem(USER_ADDRESS_KEY);
  console.log('Biometric credential removed securely');
};

/**
 * Check if biometric is registered
 */
export const isBiometricRegistered = async (): Promise<boolean> => {
  const credentialId = await getSecureItem(CREDENTIAL_ID_KEY);
  return credentialId !== null;
};

/**
 * Get biometric type (Face ID, Touch ID, etc.)
 */
export const getBiometricType = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  // iOS devices with Face ID
  if (
    userAgent.includes('iphone') &&
    (userAgent.includes('iphone12') ||
      userAgent.includes('iphone13') ||
      userAgent.includes('iphone14') ||
      userAgent.includes('iphone15') ||
      userAgent.includes('iphone x'))
  ) {
    return 'Face ID';
  }

  // iOS devices with Touch ID
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'Touch ID';
  }

  // Android devices
  if (userAgent.includes('android')) {
    return 'Fingerprint';
  }

  // Windows Hello
  if (userAgent.includes('windows')) {
    return 'Windows Hello';
  }

  return 'Biometric';
};

/**
 * Helper functions
 */

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Prompt user to enable biometric authentication
 */
export const promptBiometricSetup = async (
  _userAddress: string
): Promise<boolean> => {
  const supported = await isBiometricSupported();

  if (!supported) {
    return false;
  }

  const registered = await isBiometricRegistered();
  if (registered) {
    return true;
  }

  // Check if user dismissed setup before (OK to use localStorage for UI preferences)
  const dismissed = localStorage.getItem('biometric-setup-dismissed');
  if (dismissed) {
    return false;
  }

  return true;
};

/**
 * Migrate old localStorage credentials to secure IndexedDB storage
 * Call this on app initialization to upgrade existing users
 */
export const migrateBiometricStorage = async (): Promise<void> => {
  const keys = ['biometric-credential-id', 'biometric-user-address'];
  await migrateFromLocalStorage(keys);
};
