import client from './client';

export interface FaceAuthStatusResponse {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    face_auth_enabled: boolean;
    is_enrolled: boolean;
  };
  error?: string;
}

export interface FaceNonceResponse {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    nonce: string;
    expires_in: number;
  };
  error?: string;
}

export interface FaceVerifyResponse {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
      full_name?: string;
      email: string;
      role: string;
      role_id: number;
      college_id?: string;
      must_change_password?: boolean | number;
    };
    matchDetails?: {
      matched_name: string;
      student_id: string;
      role: string;
      similarity_percent: string;
      verified: boolean;
    };
  };
  error?: string;
}

export interface FaceEnrollResponse {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    enrolled: boolean;
  };
  error?: string;
}

export interface FaceDeleteResponse {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    deleted: boolean;
  };
  error?: string;
}

/**
 * Fetch face authentication service status and enrollment status
 */
export async function getFaceAuthStatus(identifier?: string): Promise<FaceAuthStatusResponse> {
  try {
    const res = await client.get('/face/status', {
      params: { identifier: identifier || 'auto' }
    });
    return res.data;
  } catch (err: any) {
    const data = err.response?.data;
    return {
      success: false,
      code: data?.code || 'STATUS_ERROR',
      error: data?.message || data?.error || 'Failed to check face auth status'
    };
  }
}

/**
 * Request a 256-bit single-use 15-second nonce for face verification / auto-detection
 */
export async function requestFaceNonce(identifier?: string): Promise<FaceNonceResponse> {
  try {
    const res = await client.post('/face/nonce', { identifier: identifier || 'auto' });
    return res.data;
  } catch (err: any) {
    const data = err.response?.data;
    return {
      success: false,
      code: data?.code || 'NONCE_ERROR',
      error: data?.message || data?.error || 'Failed to generate face authentication challenge'
    };
  }
}

/**
 * Verify captured face frames against 1:1 user biometric template or 1:N auto-detection
 */
export async function verifyFaceLogin(
  identifier: string | undefined,
  nonce: string,
  frames: string[]
): Promise<FaceVerifyResponse> {
  try {
    const res = await client.post('/face/verify', {
      identifier: identifier || 'auto',
      nonce,
      frames
    });
    return res.data;
  } catch (err: any) {
    const data = err.response?.data;
    return {
      success: false,
      code: data?.code || 'VERIFICATION_ERROR',
      error: data?.message || data?.error || 'Face verification failed'
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
    const data = err.response?.data;
    return {
      success: false,
      code: data?.code || 'ENROLLMENT_ERROR',
      error: data?.message || data?.error || 'Face enrollment failed'
    };
  }
}

/**
 * Delete user face biometrics (authenticated route)
 */
export async function deleteFaceBiometrics(): Promise<FaceDeleteResponse> {
  try {
    const res = await client.delete('/face/delete');
    return res.data;
  } catch (err: any) {
    const data = err.response?.data;
    return {
      success: false,
      code: data?.code || 'DELETE_ERROR',
      error: data?.message || data?.error || 'Failed to delete face biometrics'
    };
  }
}

