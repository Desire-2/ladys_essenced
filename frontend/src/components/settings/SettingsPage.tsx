import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { DashboardLayout } from '../layout/DashboardLayout';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { UmwariLanguagePicker } from '../umwari/UmwariLanguagePicker';
import { useAuthStore } from '../../stores/authStore';
import { useUmwariStore } from '../../stores/umwariStore';
import {
  fetchSettings,
  updateAccount,
  updateParentAccess,
  updatePrivacyPreferences,
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPreferences,
  type LinkedParent,
} from '../../lib/settingsApi';
import type { User } from '../../types';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

const NOTIFICATION_LABELS: { key: keyof NotificationPreferences; label: string; hint: string }[] = [
  { key: 'cycle_reminders', label: 'Cycle reminders', hint: 'Period start and prediction alerts' },
  { key: 'appointment_reminders', label: 'Appointment reminders', hint: 'Clinic bookings and schedule changes' },
  { key: 'health_tips', label: 'Wellness tips', hint: 'Personalized health insights' },
  { key: 'new_features', label: 'Product updates', hint: 'New Lady\'s Essence features' },
  { key: 'email', label: 'Email notifications', hint: 'When email is on your profile' },
  { key: 'sms', label: 'SMS notifications', hint: 'Text messages to your phone' },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, setUser, logout } = useAuthStore();
  const { apiKey, setApiKey } = useUmwariStore();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(() => user?.first_name ?? '');
  const [lastName, setLastName] = useState(() => user?.last_name ?? '');
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [phone, setPhone] = useState(() => user?.phone_number ?? '');
  const [allowParentAccess, setAllowParentAccess] = useState(() => user?.allow_parent_access ?? false);
  const [linkedParents, setLinkedParents] = useState<LinkedParent[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [dataSharingConsent, setDataSharingConsent] = useState(false);
  const [enablePinAuth, setEnablePinAuth] = useState(false);
  const [serverGeminiConfigured, setServerGeminiConfigured] = useState(false);

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  const [showSetKey, setShowSetKey] = useState(false);
  const [setKeyInput, setSetKeyInput] = useState('');
  const [keyTestStatus, setKeyTestStatus] = useState<'success' | 'error' | null>(null);
  const [testingConn, setTestingConn] = useState(false);

  const applyBundleToForm = (
    account: User,
    privacy: Awaited<ReturnType<typeof fetchSettings>>['privacy'],
    umwari: { server_key_configured: boolean },
  ) => {
    setFirstName(account.first_name);
    setLastName(account.last_name);
    setEmail(account.email ?? '');
    setPhone(account.phone_number);
    setAllowParentAccess(account.allow_parent_access);
    setEnablePinAuth(Boolean(account.enable_pin_auth));
    setNotifPrefs(privacy.notification_preferences);
    setDataSharingConsent(privacy.data_sharing_consent);
    setLinkedParents(privacy.linked_parents ?? []);
    setServerGeminiConfigured(umwari.server_key_configured);
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      setLoading(true);
      setLoadError(null);

      // Safety timeout: if the fetch hangs for 20 seconds (e.g. auth refresh fetch()
      // without a timeout in authSession.ts), release the loading state gracefully.
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadError('Request timed out. Check that the backend server is running.');
        toast.error('Settings request timed out. Please try again.');
      }, 20_000);

      try {
        const bundle = await fetchSettings();
        if (cancelled) return;
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        applyBundleToForm(bundle.account, bundle.privacy, bundle.umwari);
        setUser(bundle.account);
      } catch (err: unknown) {
        if (cancelled) return;
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        const cachedUser = useAuthStore.getState().user;
        if (cachedUser) {
          setFirstName(cachedUser.first_name);
          setLastName(cachedUser.last_name ?? '');
          setEmail(cachedUser.email ?? '');
          setPhone(cachedUser.phone_number);
          setAllowParentAccess(cachedUser.allow_parent_access);
        }
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Could not load settings from the server.';
        setLoadError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // Load once on mount — do not depend on user?.id or setUser (would retrigger forever)
  }, []);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const updated = await updateAccount({
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone_number: phone,
        enable_pin_auth: enablePinAuth,
        ...(newPassword
          ? { current_password: currentPassword, new_password: newPassword }
          : {}),
        ...(newPin ? { new_pin: newPin } : {}),
      });
      setUser(updated);
      setCurrentPassword('');
      setNewPassword('');
      setNewPin('');
      toast.success('Account settings saved.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to save account settings.';
      toast.error(message);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleToggleParentAccess = async (checked: boolean) => {
    const previous = allowParentAccess;
    setAllowParentAccess(checked);
    try {
      const updated = await updateParentAccess(checked);
      setUser(updated);
      setAllowParentAccess(updated.allow_parent_access);
      toast.success(
        checked
          ? 'Linked parents can view your shared health data.'
          : 'Parent visibility is now private.'
      );
    } catch (err: unknown) {
      setAllowParentAccess(previous);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to update parent access.';
      toast.error(message);
    }
  };

  const handleNotifToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const previous = { ...notifPrefs };
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    setSavingPrivacy(true);
    try {
      const privacy = await updatePrivacyPreferences(next);
      setNotifPrefs(privacy.notification_preferences);
      toast.success('Notification preferences updated.');
    } catch {
      setNotifPrefs(previous);
      toast.error('Failed to save notification preferences.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleDataSharingToggle = async (checked: boolean) => {
    const previous = dataSharingConsent;
    setDataSharingConsent(checked);
    setSavingPrivacy(true);
    try {
      const privacy = await updatePrivacyPreferences(notifPrefs, checked);
      setDataSharingConsent(privacy.data_sharing_consent);
      toast.success('Research sharing preference saved.');
    } catch {
      setDataSharingConsent(previous);
      toast.error('Failed to update data sharing setting.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleSaveKeyInput = () => {
    if (setKeyInput.trim()) {
      setApiKey(setKeyInput.trim());
      setSetKeyInput('');
      setKeyTestStatus(null);
      toast.success('Gemini key saved locally.');
    }
  };

  const handleTestConnection = async () => {
    const targetKey = setKeyInput.trim() || apiKey;
    if (!targetKey) {
      toast.error('Enter a key or configure GEMINI_API_KEY in backend/.env.');
      return;
    }
    setTestingConn(true);
    setKeyTestStatus(null);
    try {
      const testAI = new GoogleGenerativeAI(targetKey);
      const model = testAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('Respond with: OK');
      if (result.response.text()) {
        setKeyTestStatus('success');
        toast.success('Gemini key verified.');
      } else {
        throw new Error('Empty response');
      }
    } catch {
      setKeyTestStatus('error');
      toast.error('Key verification failed.');
    } finally {
      setTestingConn(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPath="/settings" onNavigate={onNavigate}>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted">Loading your settings…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError && !user) {
    return (
      <DashboardLayout currentPath="/settings" onNavigate={onNavigate}>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center px-4">
          <p className="text-sm text-mauve">{loadError}</p>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPath="/settings" onNavigate={onNavigate}>
      <div className="space-y-6 text-left animate-[fadeInUp_0.15s_ease-out] select-none max-w-4xl">
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-extrabold font-heading text-ink">Account & privacy</h2>
          <p className="text-xs text-muted mt-0.5">
            Profile, notifications, parent sharing, and Umwari AI — synced with your account on the server.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <Card className="p-5">
              <h3 className="text-sm font-extrabold uppercase text-muted tracking-wider border-b border-border pb-2.5 mb-4">
                Profile
              </h3>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <Input label="First name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <Input label="Phone number *" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">Security</p>
                  <Input
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required to change password"
                  />
                  <Input
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                  {user?.user_type === 'adolescent' && (
                    <>
                      <Input
                        label="New 4-digit PIN"
                        type="password"
                        autoComplete="new-password"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Optional — enables PIN sign-in"
                      />
                      <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enablePinAuth}
                          onChange={(e) => setEnablePinAuth(e.target.checked)}
                          className="rounded border-border text-terracotta focus:ring-terracotta"
                        />
                        Allow sign-in with PIN on this device
                      </label>
                    </>
                  )}
                </div>

                <Button type="submit" isLoading={savingAccount} className="w-full">
                  Save account
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-extrabold uppercase text-muted tracking-wider border-b border-border pb-2.5 mb-4">
                Notifications
              </h3>
              <div className="space-y-3">
                {NOTIFICATION_LABELS.map(({ key, label, hint }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-ink block">{label}</span>
                      <span className="text-[10px] text-muted">{hint}</span>
                    </div>
                    <button
                      type="button"
                      disabled={savingPrivacy}
                      onClick={() => handleNotifToggle(key, !notifPrefs[key])}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-50 ${
                        notifPrefs[key] ? 'bg-sage' : 'bg-muted/40'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-surface transition-transform ${
                          notifPrefs[key] ? 'translate-x-[20px]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {user?.user_type === 'adolescent' && (
              <Card className="p-4 border-l-4 border-l-terracotta bg-terracotta/5">
                <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider border-b border-border/80 pb-2 mb-3">
                  Parent access
                </h3>
                <div className="space-y-3 text-xs">
                  <p className="text-[11px] text-muted leading-relaxed">
                    Control whether linked parents can view your cycle and wellness logs you choose to share.
                  </p>
                  {linkedParents.length > 0 ? (
                    <ul className="text-[11px] text-ink space-y-1">
                      {linkedParents.map((p) => (
                        <li key={p.id}>
                          <strong>{p.name}</strong>
                          {p.relationship ? ` · ${p.relationship}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-muted italic">No parents linked to your account yet.</p>
                  )}
                  <div className="flex items-center justify-between p-3.5 bg-surface border border-border rounded-xl">
                    <span className="font-bold text-ink">Share with linked parents</span>
                    <button
                      type="button"
                      onClick={() => handleToggleParentAccess(!allowParentAccess)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        allowParentAccess ? 'bg-sage' : 'bg-muted/40'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-surface transition-transform ${
                          allowParentAccess ? 'translate-x-[20px]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="text-sm font-extrabold uppercase text-muted tracking-wider border-b border-border pb-2 mb-3">
                Research & privacy
              </h3>
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl text-xs">
                <span className="font-bold text-ink">Anonymous research data</span>
                <button
                  type="button"
                  disabled={savingPrivacy}
                  onClick={() => handleDataSharingToggle(!dataSharingConsent)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    dataSharingConsent ? 'bg-sage' : 'bg-muted/40'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-surface transition-transform ${
                      dataSharingConsent ? 'translate-x-[20px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-[#7A4F6D] space-y-4">
              <h3 className="text-sm font-extrabold uppercase text-ink tracking-wider border-b border-border/80 pb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#7A4F6D]" />
                Umwari AI
              </h3>
              {serverGeminiConfigured ? (
                <p className="text-[11px] text-sage font-semibold bg-sage/10 p-2 rounded-lg border border-sage/20">
                  Server Gemini key loaded from backend <code className="text-[10px]">.env</code> — chat works without a browser key.
                </p>
              ) : (
                <p className="text-[11px] text-muted leading-relaxed">
                  Add <code className="text-[10px]">GEMINI_API_KEY</code> to <code className="text-[10px]">backend/.env</code> or save a personal key below.
                </p>
              )}
              <div>
                <span className="block text-xs font-bold text-ink mb-2">Language</span>
                <UmwariLanguagePicker />
              </div>
              {!serverGeminiConfigured && (
                <div className="border-t border-border/60 pt-3 space-y-3">
                  <span className="block text-xs font-bold text-ink">Personal Gemini API key</span>
                  <div className="relative">
                    <input
                      type={showSetKey ? 'text' : 'password'}
                      value={setKeyInput}
                      onChange={(e) => {
                        setSetKeyInput(e.target.value);
                        setKeyTestStatus(null);
                      }}
                      placeholder={apiKey ? '••••••••••••••••' : 'AIzaSy…'}
                      className="w-full px-3 py-2 bg-surface border border-border text-xs font-mono rounded-lg pr-10 focus:outline-none focus:border-terracotta"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetKey(!showSetKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                    >
                      {showSetKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" onClick={handleTestConnection} disabled={testingConn || (!setKeyInput.trim() && !apiKey)} className="text-xs h-9">
                      {testingConn ? 'Testing…' : 'Test'}
                    </Button>
                    <Button type="button" onClick={handleSaveKeyInput} disabled={!setKeyInput.trim()} className="text-xs h-9">
                      Save key
                    </Button>
                  </div>
                  {keyTestStatus === 'success' && (
                    <p className="text-emerald-600 text-[10.5px] font-bold">Key verified.</p>
                  )}
                  {keyTestStatus === 'error' && (
                    <p className="text-rose-600 text-[10.5px] font-bold">Key invalid.</p>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-cream/15 text-xs text-muted space-y-2">
              <span className="font-bold text-ink block">Session</span>
              <p>Signed in as <strong className="text-ink">{user?.first_name} {user?.last_name}</strong> ({user?.user_type?.replace('_', ' ')})</p>
              <button
                type="button"
                onClick={logout}
                className="w-full mt-2 h-10 border border-mauve/20 bg-surface hover:bg-mauve/10 text-mauve cursor-pointer rounded-xl font-bold transition-colors"
              >
                Sign out
              </button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
