import client from '../api/client';

export interface FaceChallengeResponse {
  nonce: string;
  transactionId: string;
  challengeAction: string;
  expiresAt: number;
  ttlMs: number;
}

export interface FaceAuthUser {
  id: number;
  username: string;
  name: string;
  full_name: string;
  email: string;
  role: string;
  must_change_password?: boolean;
}

export interface FaceLoginResult {
  token: string;
  user: FaceAuthUser;
}

export interface FaceStatusResult {
  enabled: boolean;
  enrolled: boolean;
  enrolledAt?: string | null;
}

/**
 * Dedicated API Client Service for Face Authentication
 * 
 * Never performs biometric calculations or embedding extraction on client.
 * Serves purely as a transport wrapper communicating with backend /api/auth/face/* endpoints.
 */
export const faceAuthApi = {
  /**
   * Requests a cryptographically random single-use 15s challenge nonce from server.
   */
  async fetchChallengeNonce(transactionId?: string): Promise<FaceChallengeResponse> {
    try {
      const res = await client.get('/auth/face/challenge', {
        params: transactionId ? { transactionId } : {}
      });
      return res.data.data;
    } catch (err: any) {
      if (!err.response) {
        throw new Error('Unable to connect to the authentication server. Please make sure the backend is running and try again.');
      }
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch challenge nonce';
      throw new Error(msg);
    }
  },

  /**
   * Submits 1:1 face login authentication request with captured nonced frame sequence.
   */
  async faceLogin(
    identifier: string,
    transactionId: string,
    nonce: string,
    frames: string[]
  ): Promise<FaceLoginResult> {
    try {
      const res = await client.post('/auth/face/login', {
        identifier,
        transactionId,
        nonce,
        frames
      });
      return res.data.data;
    } catch (err: any) {
      const errorData = err.response?.data;
      const status = err.response?.status;

      const customError: any = new Error(errorData?.message || 'Face authentication failed');
      customError.status = status;
      customError.code = errorData?.code || 'AUTH_FAILED';
      customError.remainingSeconds = errorData?.remainingSeconds;
      throw customError;
    }
  },

  /**
   * Authorizes enrollment by verifying current user password.
   */
  async enrollAuthPassword(password: string): Promise<{ enrollmentToken: string; expiresAt: number }> {
    try {
      const res = await client.post('/auth/face/enroll-auth', { password });
      return res.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Password authorization failed';
      throw new Error(msg);
    }
  },

  async enrollFace(nonce: string, frames: string[], enrollmentToken?: string): Promise<boolean> {
    try {
      const res = await client.post('/auth/face/enroll', {
        enrollmentToken: enrollmentToken || 'DIRECT_ENROLL',
        nonce,
        frames
      });
      return res.data.success;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Biometric enrollment failed';
      throw new Error(msg);
    }
  },

  /**
   * Disables biometric face authentication for authenticated user (requires password confirmation).
   */
  async disableFace(password: string): Promise<boolean> {
    try {
      const res = await client.delete('/auth/face/disable', {
        data: { password }
      });
      return res.data.success;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to disable face biometrics';
      throw new Error(msg);
    }
  },

  /**
   * Checks biometric feature flag and user enrollment status.
   */
  async getFaceStatus(): Promise<FaceStatusResult> {
    try {
      const res = await client.get('/auth/face/status');
      return res.data.data;
    } catch (err: any) {
      return { enabled: false, enrolled: false };
    }
  }
};

export default faceAuthApi;
