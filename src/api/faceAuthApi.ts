import client from './client';

export interface FaceAuthStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    face_auth_enabled: boolean;
    is_enrolled: boolean;
  };
  error?: string;
}

export interface FaceNonceResponse {
  success: boolean;
  message?: string;
  data?: {
    nonce: string;
    expires_in: number;
  };
  error?: string;
}

export interface FaceVerifyResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
      role_id: number;
      must_change_password?: boolean | number;
    };
  };
  error?: string;
}

export interface FaceEnrollResponse {
  success: boolean;
  message?: string;
  data?: {
    enrolled: boolean;
  };
  error?: string;
}

/**
 * Fetch face authentication service status and enrollment status
 */
export async function getFaceAuthStatus(identifier?: string): Promise<FaceAuthStatusResponse> {
  try {
    const res = await client.get('/face/status', {
      params: { identifier }
    });
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to check face auth status'
    };
  }
}

/**
 * Request a 256-bit single-use 15-second nonce for face verification
 */
export async function requestFaceNonce(identifier: string): Promise<FaceNonceResponse> {
  try {
    const res = await client.post('/face/nonce', { identifier });
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to generate face authentication challenge'
    };
  }
}

/**
 * Verify captured face frames against 1:1 user biometric template
 */
export async function verifyFaceLogin(
  identifier: string,
  nonce: string,
  frames: string[]
): Promise<FaceVerifyResponse> {
  try {
    const res = await client.post('/face/verify', {
      identifier,
      nonce,
      frames
    });
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || 'Face verification failed'
    };
  }
}

/**
 * Enroll user face biometrics (authenticated route)
 */
export async function enrollFaceBiometrics(frames: string[]): Promise<FaceEnrollResponse> {
  try {
    const res = await client.post('/face/enroll', { frames });
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || 'Face enrollment failed'
    };
  }
}
