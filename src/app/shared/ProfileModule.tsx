import { useState, useEffect } from "react";
import { Save, Download, Phone, MapPin, HeartPulse, Shield, Smartphone, Activity, ScanFace, CheckCircle2, AlertCircle, Trash2, Camera } from "lucide-react";
import { Card, Avatar, Badge, Btn } from "../App";
import client from "../../api/client";
import { FaceAuthModal } from "../../components/FaceAuthModal";

export function ProfileModule() {
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({ phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // Face Biometrics state
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceRegisteredAt, setFaceRegisteredAt] = useState<string | null>(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceActionLoading, setFaceActionLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchFaceStatus();
  }, []);

  const fetchProfile = () => {
    client.get('/profile').then(res => {
      setProfile(res.data);
      setFormData({ phone: res.data.phone || '', address: res.data.address || '' });
      setLoading(false);
    }).catch(error => {
      console.error(error);
      setLoading(false);
    });
  };

  const fetchFaceStatus = () => {
    client.get('/auth/face-status').then(res => {
      if (res.data?.success) {
        setFaceRegistered(res.data.data.registered);
        setFaceRegisteredAt(res.data.data.registered_at);
      }
    }).catch(err => {
      console.error("Face status error:", err);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await client.put('/profile', formData);
      setMessage('Profile updated successfully!');
      setProfile({ ...profile, ...formData });
    } catch (error) {
      console.error(error);
      setMessage('Failed to update profile.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRemoveFace = async () => {
    if (!confirm("Are you sure you want to remove your registered Face Biometrics?")) return;
    setFaceActionLoading(true);
    try {
      await client.delete('/auth/face-remove');
      setFaceRegistered(false);
      setFaceRegisteredAt(null);
      setMessage('Face biometric data removed successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to remove face data.');
    } finally {
      setFaceActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleFaceSuccess = () => {
    setShowFaceModal(false);
    fetchFaceStatus();
    setMessage('Face biometrics registered successfully! You can now use Login with Face.');
    setTimeout(() => setMessage(''), 4000);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Profile</h2>
          <p className="text-sm text-slate-500">View and update your personal details and security.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" icon={<Download size={14} />}>ID Card</Btn>
          <Btn variant="primary" icon={<Save size={14} />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Btn>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm border font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'}`}>
          {message}
        </div>
      )}

      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          General Information
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Shield size={14} /> Security & Biometrics
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-5">
            <Card className="p-6 text-center flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar name={profile?.name || 'User'} size="xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile?.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{profile?.roll_number || 'No Roll Number'}</p>
              <div className="mb-2">
                <Badge variant="success">Active Account</Badge>
              </div>
            </Card>
            
            <Card className="p-5 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Academic Info</h4>
              <div className="text-sm"><span className="text-slate-500 block mb-1">Role</span> <span className="font-medium text-slate-900 dark:text-white capitalize">{profile?.role}</span></div>
              <div className="text-sm"><span className="text-slate-500 block mb-1">Semester</span> <span className="font-medium text-slate-900 dark:text-white">{profile?.current_semester || 'N/A'}</span></div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <Card className="p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input type="text" value={profile?.name || ''} disabled className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input type="email" value={profile?.email || ''} disabled className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-slate-900 dark:text-white mt-8 mb-4">Emergency & Address</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Residential Address</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none"></textarea>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-5">
          {/* Face Biometrics Management Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ScanFace size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Face Biometrics Authentication</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    AES-256 encrypted vector templates with anti-duplicate enforcement & liveness detection.
                  </p>
                </div>
              </div>

              <div>
                {faceRegistered ? (
                  <Badge variant="success">Face ID Active</Badge>
                ) : (
                  <Badge variant="warning">Not Configured</Badge>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                {faceRegistered ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-medium">
                    <CheckCircle2 size={16} />
                    <span>Face registered {faceRegisteredAt ? `on ${new Date(faceRegisteredAt).toLocaleDateString()}` : ''}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <AlertCircle size={16} />
                    <span>No biometric face registered. Setup to enable 1-click passwordless login.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {faceRegistered && (
                  <button
                    type="button"
                    onClick={handleRemoveFace}
                    disabled={faceActionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Remove Face ID</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowFaceModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Camera size={14} />
                  <span>{faceRegistered ? 'Re-scan / Update Face' : 'Register Face ID'}</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Standard Authentication Info */}
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Shield size={16} className="text-slate-500" /> Account Security & Role Access
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your account is isolated with Role-Based Access Control (RBAC), signed JSON Web Tokens (JWT), and bcrypt password hashing.
            </p>
          </Card>
        </div>
      )}

      {/* FACE REGISTRATION MODAL */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <FaceAuthModal
            mode="register"
            onSuccess={handleFaceSuccess}
            onCancel={() => setShowFaceModal(false)}
          />
        </div>
      )}
    </div>
  );
}

