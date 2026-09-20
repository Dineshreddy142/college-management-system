import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Trash2, KeyRound, AlertCircle, CheckCircle2, Loader2, Camera } from 'lucide-react';
import client from '../api/client';
import { FaceAuthModal } from './FaceAuthModal';

export const BiometricSecuritySettings: React.FC = () => {
  const [faceRegistered, setFaceRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Password confirmation modal state
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'enroll' | 'remove'>('enroll');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Face auth capture modal state
  const [showFaceModal, setShowFaceModal] = useState<boolean>(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await client.get('/auth/face/status');
      if (res.data && res.data.data) {
        setFaceRegistered(Boolean(res.data.data.face_registered));
      }
    } catch (e: any) {
      console.error('Failed to fetch biometric status:', e);
      setError('Unable to load biometric status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleOpenConfirmModal = (action: 'enroll' | 'remove') => {
    setActionType(action);
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowPasswordModal(true);
  };

  const handlePasswordReAuthConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword) {
      setError('Please enter your account password to confirm.');
      return;
    }

    if (actionType === 'remove') {
      setIsSubmitting(true);
      setError('');
      try {
        const res = await client.post('/auth/face/remove', { confirmPassword });
        if (res.data && res.data.success) {
          setSuccess('Face biometric template removed successfully.');
          setFaceRegistered(false);
          setShowPasswordModal(false);
        } else {
          setError(res.data?.message || 'Failed to remove face biometrics.');
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Password confirmation failed.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (actionType === 'enroll') {
      // For enrollment, proceed to face modal with verified confirmPassword
      setShowPasswordModal(false);
      setShowFaceModal(true);
    }
  };

  const handleEnrollSuccess = () => {
    setShowFaceModal(false);
    setSuccess('Face biometrics registered successfully!');
    setFaceRegistered(true);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Face Biometric Authentication
            </h3>
            <p className="text-sm text-slate-550 dark:text-slate-400">
              Secure face login factor with AES-256-GCM encrypted template storage.
            </p>
          </div>
        </div>

        {isLoading ? (
          <Loader2 className="animate-spin text-slate-400" size={18} />
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
            faceRegistered
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${faceRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {faceRegistered ? 'Registered' : 'Not Enrolled'}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-lg flex items-center gap-2 border border-red-200 dark:border-red-900">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg flex items-center gap-2 border border-emerald-200 dark:border-emerald-900">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {faceRegistered ? (
          <>
            <button
              onClick={() => handleOpenConfirmModal('enroll')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Camera size={16} />
              Re-enroll Face
            </button>

            <button
              onClick={() => handleOpenConfirmModal('remove')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Remove Biometrics
            </button>
          </>
        ) : (
          <button
            onClick={() => handleOpenConfirmModal('enroll')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <UserCheck size={16} />
            Enroll Face Biometrics
          </button>
        )}
      </div>

      {/* Password Confirmation Re-Auth Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
                <KeyRound size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Password Confirmation Required
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {actionType === 'remove'
                    ? 'Confirm your password to delete your biometric template.'
                    : 'Confirm your password to authorize face enrollment.'}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordReAuthConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                  Confirm & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Auth Modal */}
      {showFaceModal && (
        <FaceAuthModal
          mode="register"
          onSuccess={handleEnrollSuccess}
          onCancel={() => setShowFaceModal(false)}
        />
      )}
    </div>
  );
};
