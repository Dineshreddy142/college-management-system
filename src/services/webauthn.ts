import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import client from '../api/client';

export interface WebAuthnStatus {
  supported: boolean;
  hasPlatformAuthenticator: boolean;
}

export const checkWebAuthnCapability = async (): Promise<WebAuthnStatus> => {
  const supported = browserSupportsWebAuthn();
  let hasPlatformAuthenticator = false;
  if (supported) {
    try {
      hasPlatformAuthenticator = await platformAuthenticatorIsAvailable();
    } catch (e) {
      hasPlatformAuthenticator = false;
    }
  }
  return { supported, hasPlatformAuthenticator };
};

/**
 * Register WebAuthn / Passkey for a user
 */
export const registerPasskey = async (identifier?: string, deviceLabel?: string) => {
  // 1. Request options from server
  const optRes = await client.post('/webauthn/register/options', { identifier });
  if (!optRes.data?.success) {
    throw new Error(optRes.data?.message || 'Failed to get WebAuthn registration options.');
  }

  const { options, userId } = optRes.data.data;

  // 2. Pass options to browser WebAuthn API (triggers Face ID / Touch ID / Fingerprint / PIN)
  const registrationResponse = await startRegistration({ optionsJSON: options });

  // 3. Post verification response to server
  const verifyRes = await client.post('/webauthn/register/verify', {
    userId,
    response: registrationResponse,
    deviceLabel: deviceLabel || (window.innerWidth < 768 ? 'Mobile Passkey' : 'Desktop Passkey'),
  });

  if (!verifyRes.data?.success) {
    throw new Error(verifyRes.data?.message || 'WebAuthn biometric verification failed on server.');
  }

  return verifyRes.data;
};

/**
 * Authenticate (Login) via WebAuthn / Passkey for a user
 */
export const authenticatePasskey = async (identifier: string) => {
  if (!identifier || !identifier.trim()) {
    throw new Error('Please enter your College ID, Username, or Email.');
  }

  // 1. Request options from server
  const optRes = await client.post('/webauthn/login/options', { identifier });
  if (!optRes.data?.success) {
    throw new Error(optRes.data?.message || 'Account not registered for Passkey authentication.');
  }

  const { options, userId } = optRes.data.data;

  // 2. Pass options to browser WebAuthn API (triggers Face ID / Touch ID / Fingerprint / PIN)
  const assertionResponse = await startAuthentication({ optionsJSON: options });

  // 3. Post verification response to server
  const verifyRes = await client.post('/webauthn/login/verify', {
    userId,
    response: assertionResponse,
  });

  if (!verifyRes.data?.success) {
    throw new Error(verifyRes.data?.message || 'Biometric Passkey login failed.');
  }

  return verifyRes.data.data; // { token, user }
};
