'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand',
  'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Austria',
  'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'Malaysia',
  'India', 'Indonesia', 'Philippines', 'Vietnam', 'Thailand',
  'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile',
  'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Uganda',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Israel',
  'Russia', 'Ukraine', 'Poland', 'Czech Republic', 'Romania',
  'Other',
];

interface ProfileData {
  username: string;
  email: string;
  avatar_url: string | null;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  role: string;
  migrationNeeded?: boolean;
}

interface KycData {
  status: string;
  documentType: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

interface AdminSubmission {
  id: number;
  username: string;
  email: string | null;
  kyc_status: string;
  kyc_document_type: string | null;
  kyc_document_url: string | null;
  kyc_selfie_url: string | null;
  kyc_submitted_at: string | null;
  full_name: string | null;
}

export default function ProfilePage() {
  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState('');

  // Edit state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // KYC state
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycDocType, setKycDocType] = useState('passport');
  const [kycDocUrl, setKycDocUrl] = useState('');
  const [kycSelfieUrl, setKycSelfieUrl] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycMsg, setKycMsg] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<'document' | 'selfie' | null>(null);

  // Admin state
  const [adminSubmissions, setAdminSubmissions] = useState<AdminSubmission[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  // Fetch profile and KYC on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setMigrationNeeded(data.migrationNeeded || false);
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setDateOfBirth(data.date_of_birth || '');
          setCountry(data.country || '');
          setCity(data.city || '');
          setAddress(data.address || '');
        }
      } catch {} finally {
        setProfileLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadKyc() {
      try {
        const res = await fetch('/api/profile/kyc');
        if (res.ok) {
          const data = await res.json();
          setKyc(data);
          if (data.documentType) setKycDocType(data.documentType);
        }
      } catch {} finally {
        setKycLoading(false);
      }
    }
    loadKyc();
  }, []);

  // Fetch admin submissions
  useEffect(() => {
    if (profile?.role !== 'admin') return;
    setAdminLoading(true);
    fetch('/api/admin/kyc')
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) setAdminSubmissions(data.submissions);
      })
      .catch(() => {})
      .finally(() => setAdminLoading(false));
  }, [profile?.role]);

  // Avatar upload
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : prev);
      }
    } catch {} finally {
      setAvatarUploading(false);
    }
  }, []);

  // Save profile
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          date_of_birth: dateOfBirth,
          country,
          city,
          address,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg('Profile saved.');
        setProfile((prev) => prev ? { ...prev, full_name: fullName, phone, date_of_birth: dateOfBirth, country, city, address } : prev);
      } else {
        setSaveMsg(data.error || 'Save failed.');
      }
    } catch {
      setSaveMsg('Network error.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }, [fullName, phone, dateOfBirth, country, city, address]);

  // KYC file upload
  const handleKycUpload = useCallback(async (type: 'document' | 'selfie', file: File) => {
    setUploadingDoc(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const res = await fetch('/api/profile/kyc/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        if (type === 'document') setKycDocUrl(data.url);
        else setKycSelfieUrl(data.url);
      } else {
        setKycMsg(data.error || 'Upload failed.');
        setTimeout(() => setKycMsg(''), 4000);
      }
    } catch {
      setKycMsg('Upload error.');
      setTimeout(() => setKycMsg(''), 4000);
    } finally {
      setUploadingDoc(null);
    }
  }, []);

  // Submit KYC
  const handleKycSubmit = useCallback(async () => {
    if (!kycDocUrl || !kycSelfieUrl) {
      setKycMsg('Please upload both document and selfie.');
      setTimeout(() => setKycMsg(''), 4000);
      return;
    }
    setKycSubmitting(true);
    setKycMsg('');
    try {
      const res = await fetch('/api/profile/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: kycDocType,
          document_url: kycDocUrl,
          selfie_url: kycSelfieUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setKyc({ status: 'pending', documentType: kycDocType, submittedAt: new Date().toISOString(), reviewedAt: null, rejectionReason: null });
        setKycMsg('KYC submitted successfully.');
      } else {
        setKycMsg(data.error || 'Submission failed.');
      }
    } catch {
      setKycMsg('Network error.');
    } finally {
      setKycSubmitting(false);
      setTimeout(() => setKycMsg(''), 4000);
    }
  }, [kycDocType, kycDocUrl, kycSelfieUrl]);

  // Admin actions
  const handleAdminAction = useCallback(async (userId: number, action: 'approve' | 'reject', reason?: string) => {
    setAdminMsg('');
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminSubmissions((prev) => prev.filter((s) => s.id !== userId));
        setAdminMsg(`${action === 'approve' ? 'Approved' : 'Rejected'} user #${userId}`);
      } else {
        setAdminMsg(data.error || 'Action failed.');
      }
    } catch {
      setAdminMsg('Network error.');
    } finally {
      setTimeout(() => setAdminMsg(''), 4000);
    }
  }, []);

  // Run migration (admin only)
  const handleRunMigration = useCallback(async () => {
    setMigrationRunning(true);
    setMigrationMsg('');
    try {
      const res = await fetch('/api/profile/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMigrationMsg('Migration complete. Profile features are now available.');
        setMigrationNeeded(false);
        // Re-fetch profile
        const profileRes = await fetch('/api/profile/me');
        if (profileRes.ok) {
          const fresh = await profileRes.json();
          setProfile(fresh);
          setFullName(fresh.full_name || '');
          setPhone(fresh.phone || '');
          setDateOfBirth(fresh.date_of_birth || '');
          setCountry(fresh.country || '');
          setCity(fresh.city || '');
          setAddress(fresh.address || '');
        }
      } else {
        setMigrationMsg(data.message || 'Migration failed.');
      }
    } catch {
      setMigrationMsg('Network error.');
    } finally {
      setMigrationRunning(false);
      setTimeout(() => setMigrationMsg(''), 6000);
    }
  }, []);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-temple-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="py-20 text-center text-text-muted">Failed to load profile.</div>;
  }

  const avatarLetter = profile.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-white mb-8">My Profile</h1>

      {/* Migration banner */}
      {migrationNeeded && (
        <div className="mb-8 p-5 rounded-xl flex items-start justify-between gap-4 flex-wrap" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div>
            <p className="text-temple-gold text-sm font-semibold">Database Migration Required</p>
            <p className="text-text-muted text-sm mt-1">Profile features require a database migration. Ask your admin to run it.</p>
          </div>
          {profile.role === 'admin' && (
            <div className="flex items-center gap-3">
              {migrationMsg && (
                <span className={`text-sm ${migrationMsg.includes('complete') ? 'text-green-400' : 'text-red-400'}`}>
                  {migrationMsg}
                </span>
              )}
              <button
                onClick={handleRunMigration}
                disabled={migrationRunning}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex-shrink-0"
                style={{ background: '#FFD700', color: '#0e0b1a' }}
              >
                {migrationRunning ? 'Running...' : 'Run Migration'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN — Avatar + Profile Fields */}
        <div>
          {/* Avatar */}
          <div className="p-6 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Avatar</h2>
            <div className="flex items-center gap-5">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="rounded-full object-cover flex-shrink-0"
                  style={{ width: 96, height: 96, border: '2px solid #FFD700' }}
                />
              ) : (
                <span
                  className="inline-flex items-center justify-center rounded-full text-3xl font-bold flex-shrink-0"
                  style={{
                    width: 96,
                    height: 96,
                    border: '2px solid #FFD700',
                    background: 'rgba(255,215,0,0.12)',
                    color: '#FFD700',
                  }}
                >
                  {avatarLetter}
                </span>
              )}
              <div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                  style={{ background: '#FFD700', color: '#0e0b1a' }}
                >
                  {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-text-muted text-xs mt-2">JPG, PNG or WebP. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Profile Details</h2>

            <div className="space-y-4">
              {/* Username (read-only) */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">Email</label>
                <input
                  type="text"
                  value={profile.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full legal name"
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition"
                  style={{
                    background: '#0e0b1a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Your city"
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-text-muted text-xs mb-1.5">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your address"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>
            </div>

            {/* Save button + message */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition"
                style={{ background: '#FFD700', color: '#0e0b1a' }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              {saveMsg && (
                <span className={`text-sm ${saveMsg.includes('saved') ? 'text-green-400' : 'text-red-400'}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — KYC Verification */}
        <div>
          <div className="p-6 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">KYC Verification</h2>

            {/* Status badge */}
            {kycLoading ? (
              <div className="w-5 h-5 border-2 border-temple-gold border-t-transparent rounded-full animate-spin" />
            ) : kyc ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background:
                        kyc.status === 'verified' ? 'rgba(34,197,94,0.12)' :
                        kyc.status === 'pending' ? 'rgba(255,215,0,0.12)' :
                        kyc.status === 'rejected' ? 'rgba(239,68,68,0.12)' :
                        'rgba(255,255,255,0.06)',
                      color:
                        kyc.status === 'verified' ? '#22c55e' :
                        kyc.status === 'pending' ? '#FFD700' :
                        kyc.status === 'rejected' ? '#ef4444' :
                        'rgba(255,255,255,0.5)',
                    }}
                  >
                    {kyc.status === 'verified' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {kyc.status === 'pending' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )}
                    {kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)}
                  </span>
                </div>

                {/* Feature gating info */}
                <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {kyc.status === 'unverified' && (
                    <div className="text-text-secondary text-sm space-y-1">
                      <p><span className="text-temple-gold font-medium">$500/day</span> withdrawal limit (unverified)</p>
                      <p><span className="text-green-400 font-medium">Full access</span> after verification</p>
                    </div>
                  )}
                  {kyc.status === 'pending' && (
                    <p className="text-text-secondary text-sm">
                      Your documents are being reviewed. This typically takes <span className="text-temple-gold font-medium">24-48 hours</span>.
                    </p>
                  )}
                  {kyc.status === 'verified' && (
                    <div className="text-green-400 text-sm space-y-1">
                      <p>Your identity has been verified.</p>
                      <p>Full access to all platform features.</p>
                      {kyc.reviewedAt && (
                        <p className="text-text-muted text-xs mt-1">Verified on {new Date(kyc.reviewedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                  {kyc.status === 'rejected' && (
                    <div className="text-red-400 text-sm space-y-1">
                      <p className="font-medium">Verification rejected</p>
                      {kyc.rejectionReason && (
                        <p className="text-text-muted text-xs">Reason: {kyc.rejectionReason}</p>
                      )}
                      <p className="text-text-secondary text-xs mt-2">You can resubmit below.</p>
                    </div>
                  )}
                </div>

                {/* KYC form (unverified or rejected) */}
                {(kyc.status === 'unverified' || kyc.status === 'rejected') && (
                  <div className="space-y-4">
                    {/* Document type */}
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">Document Type</label>
                      <select
                        value={kycDocType}
                        onChange={(e) => setKycDocType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                        style={{
                          background: '#0e0b1a',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                        }}
                      >
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="drivers_license">Driver&apos;s License</option>
                      </select>
                    </div>

                    {/* Government ID upload */}
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">Government ID</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleKycUpload('document', file);
                        }}
                        className="w-full text-sm"
                        style={{ color: '#fff' }}
                      />
                      {uploadingDoc === 'document' && (
                        <p className="text-text-muted text-xs mt-1">Uploading...</p>
                      )}
                      {kycDocUrl && (
                        <p className="text-green-400 text-xs mt-1 truncate">Uploaded: {kycDocUrl.split('/').pop()}</p>
                      )}
                    </div>

                    {/* Selfie upload */}
                    <div>
                      <label className="block text-text-muted text-xs mb-1.5">Selfie with ID</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleKycUpload('selfie', file);
                        }}
                        className="w-full text-sm"
                        style={{ color: '#fff' }}
                      />
                      {uploadingDoc === 'selfie' && (
                        <p className="text-text-muted text-xs mt-1">Uploading...</p>
                      )}
                      {kycSelfieUrl && (
                        <p className="text-green-400 text-xs mt-1 truncate">Uploaded: {kycSelfieUrl.split('/').pop()}</p>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleKycSubmit}
                        disabled={kycSubmitting || !kycDocUrl || !kycSelfieUrl}
                        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40"
                        style={{ background: '#FFD700', color: '#0e0b1a' }}
                      >
                        {kycSubmitting ? 'Submitting...' : 'Submit for Verification'}
                      </button>
                      {kycMsg && (
                        <span className={`text-sm ${kycMsg.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                          {kycMsg}
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs">Verification typically takes 24-48 hours.</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-text-muted text-sm">Failed to load KYC status.</p>
            )}
          </div>

          {/* Admin KYC Review */}
          {profile.role === 'admin' && (
            <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.15)' }}>
              <h2 className="text-sm font-semibold text-temple-gold uppercase tracking-wider mb-4">Admin: KYC Review</h2>

              {adminMsg && (
                <div className={`px-3 py-2 rounded-lg text-xs mb-4 ${adminMsg.includes('Failed') || adminMsg.includes('error') ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400'}`}>
                  {adminMsg}
                </div>
              )}

              {adminLoading ? (
                <p className="text-text-muted text-sm">Loading...</p>
              ) : adminSubmissions.length === 0 ? (
                <p className="text-text-muted text-sm">No pending KYC submissions.</p>
              ) : (
                <div className="space-y-4">
                  {adminSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-text-primary text-sm font-semibold">
                            {sub.full_name || sub.username}
                            <span className="text-text-muted text-xs ml-2">#{sub.id}</span>
                          </p>
                          {sub.email && <p className="text-text-muted text-xs">{sub.email}</p>}
                          <p className="text-text-muted text-xs mt-1">
                            {sub.kyc_document_type} &middot; Submitted {sub.kyc_submitted_at ? new Date(sub.kyc_submitted_at).toLocaleString() : 'unknown'}
                          </p>
                        </div>
                      </div>

                      {/* Document links */}
                      <div className="flex gap-4 mb-3">
                        {sub.kyc_document_url && (
                          <a
                            href={sub.kyc_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-temple-gold text-xs hover:underline"
                          >
                            View ID Document
                          </a>
                        )}
                        {sub.kyc_selfie_url && (
                          <a
                            href={sub.kyc_selfie_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-temple-gold text-xs hover:underline"
                          >
                            View Selfie
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      {rejectUserId === sub.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason..."
                            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#fff',
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { handleAdminAction(sub.id, 'reject', rejectReason); setRejectUserId(null); setRejectReason(''); }}
                              disabled={!rejectReason}
                              className="px-3 py-1.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 disabled:opacity-40"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => { setRejectUserId(null); setRejectReason(''); }}
                              className="px-3 py-1.5 rounded text-xs text-text-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdminAction(sub.id, 'approve')}
                            className="px-4 py-1.5 rounded text-xs font-semibold"
                            style={{ background: '#22c55e', color: '#fff' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectUserId(sub.id)}
                            className="px-4 py-1.5 rounded text-xs font-semibold"
                            style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
