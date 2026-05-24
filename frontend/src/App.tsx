import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Heart, Utensils, CalendarDays, Bell, Settings, 
  Users, ShieldAlert, BookOpen, Clock, AlertTriangle, 
  Search, Lock, Phone, User, Check, Eye, HelpCircle, 
  FileText, Plus, CheckCircle, RefreshCcw, ThumbsUp, Trash2, Pencil,
  Sparkles, Apple
} from 'lucide-react';

import { formatDateTime } from './lib/utils';
import { useAuthStore } from './stores/authStore';
import { api } from './lib/axios';
import {
  refreshAccessToken,
  fetchUserProfile,
  dashboardPathForUserType,
} from './lib/authSession';
import { isPublicPath, normalizeHashPath } from './lib/authRoutes';
import { mapNotification } from './lib/notificationsApi';
import { asArray } from './lib/apiHelpers';
import {
  mapCycleLog,
  mapMealLog,
  mapCycleStats,
  mapPredictions,
  mapTodayNutrition,
  mapInsights,
  mapAnomaly,
  type DashboardCycleStats,
  type DashboardPredictions,
  type DashboardNutritionStats,
} from './lib/apiMappers';
import {
  createCycleLog,
  updateCycleLog,
  deleteCycleLog,
  getApiErrorMessage,
  formatPredictionToast,
  type CycleLogFormData,
} from './lib/cycleLogsApi';
import {
  createMealLog,
  type MealLogFormData,
} from './lib/mealLogsApi';
import {
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  mapAppointment,
  type AppointmentFormData,
} from './lib/appointmentsApi';
import {
  fetchHealthProviders,
  type HealthProviderSummary,
} from './lib/healthProvidersApi';
import { HealthProviderCard } from './components/features/HealthProviderCard';
import { 
  User as UserType, CycleLog, MealLog, Appointment, 
  Notification, ContentItem, Course
} from './types';

// UI components
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Modal } from './components/ui/Modal';
import { Avatar } from './components/ui/Avatar';
import { Spinner } from './components/ui/Spinner';
import { EmptyState } from './components/ui/EmptyState';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Features
import { CycleRing } from './components/features/CycleRing';
import { CycleCalendar } from './components/features/CycleCalendar';
import { NutritionDonut } from './components/features/NutritionDonut';
import { AppointmentCard } from './components/features/AppointmentCard';
import { InsightCard } from './components/features/InsightCard';

// Forms
import { CycleLogForm } from './components/forms/CycleLogForm';
import { MealLogForm } from './components/forms/MealLogForm';
import { AppointmentForm } from './components/forms/AppointmentForm';
// Umwari AI Companion Components & Stores
import { useUmwariStore } from './stores/umwariStore';
import { UmwariFab } from './components/umwari/UmwariFab';
import { UmwariChat } from './components/umwari/UmwariChat';
import { UmwariFullPage } from './components/umwari/UmwariFullPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AdminShell } from './pages/admin/AdminShell';
import { ProviderShell } from './pages/providers/ProviderShell';
import { ParentShell } from './pages/parent/ParentShell';

export default function App() {
  const { user, accessToken, setUser, setAccessToken, logout } = useAuthStore();
  const umwariStore = useUmwariStore();
  
  // Custom SPA Hash Router
  const [currentPath, setCurrentPath] = useState('/login');
  const [isAuthHydrating, setIsAuthHydrating] = useState(
    () => Boolean(localStorage.getItem('refresh_token'))
  );

  const isAuthenticated = Boolean(user && accessToken);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizeHashPath(window.location.hash));
    };
    window.addEventListener('popstate', handlePopState);

    const initialPath = normalizeHashPath(window.location.hash);
    const hasStoredSession = Boolean(localStorage.getItem('refresh_token'));

    if (!hasStoredSession && !isPublicPath(initialPath)) {
      window.location.hash = '/login';
      setCurrentPath('/login');
    } else {
      setCurrentPath(initialPath);
      if (!window.location.hash) {
        window.location.hash = initialPath;
      }
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    setCurrentPath(normalized);
    window.location.hash = normalized;
  };

  // Redirect guests away from protected routes; signed-in users away from login/register
  useEffect(() => {
    if (isAuthHydrating) return;

    if (!isAuthenticated && !isPublicPath(currentPath)) {
      if (window.location.hash.replace('#', '') !== '/login') {
        navigate('/login');
      }
      return;
    }

    if (isAuthenticated && user && isPublicPath(currentPath)) {
      navigate(dashboardPathForUserType(user.user_type));
    }

    // Parents use the Family Health Hub — not adolescent dashboard routes
    if (isAuthenticated && user?.user_type === 'parent') {
      const parentOnly = currentPath.startsWith('/dashboard/parent') || currentPath === '/settings' || currentPath === '/dashboard/umwari';
      if (!parentOnly) {
        if (currentPath === '/dashboard/notifications') {
          navigate('/dashboard/parent/notifications');
        } else {
          navigate('/dashboard/parent');
        }
      }
    }
  }, [isAuthHydrating, isAuthenticated, currentPath, user?.user_type]);

  // Restore session from stored refresh token on load / refresh
  useEffect(() => {
    const resumeAuth = async () => {
      const storedRefreshToken = localStorage.getItem('refresh_token');

      if (!storedRefreshToken) {
        setIsAuthHydrating(false);
        return;
      }

      if (accessToken && user) {
        setIsAuthHydrating(false);
        return;
      }

      try {
        const newAccessToken = await refreshAccessToken(storedRefreshToken);
        setAccessToken(newAccessToken);
        const userData = await fetchUserProfile(newAccessToken);
        setUser(userData);
        navigate(dashboardPathForUserType(userData.user_type));
      } catch {
        localStorage.removeItem('refresh_token');
        logout();
      } finally {
        setIsAuthHydrating(false);
      }
    };

    resumeAuth();
  }, []);

  const AuthLoadingScreen = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream text-center font-sans">
      <Spinner className="mb-4" size="lg" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );

  /** Requires signed-in session (redirect to /login is handled globally). */
  const AuthRequired = ({ children }: { children: React.ReactNode }) => {
    if (isAuthHydrating) {
      return <AuthLoadingScreen message="Restoring your session…" />;
    }
    if (!isAuthenticated || !user) {
      return <AuthLoadingScreen message="Redirecting to sign in…" />;
    }
    return <>{children}</>;
  };

  // Role Gate security
  const RoleRequired = ({ children, allowed }: { children: React.ReactNode; allowed: string[] }) => {
    if (!isAuthenticated || !user) {
      return null;
    }

    if (!allowed.includes(user.user_type)) {
      return (
        <div className="p-8 bg-surface border border-border rounded-xl max-w-md mx-auto my-12 text-center font-sans space-y-4">
          <AlertTriangle className="w-12 h-12 text-mauve mx-auto" />
          <h2 className="text-lg font-bold font-heading text-ink text-center">Unauthorized Role Segment</h2>
          <p className="text-xs text-muted">Your account role is <strong>{user?.user_type.toUpperCase()}</strong>. This system view is protected.</p>
          <Button onClick={() => {
            if (user?.user_type === 'parent') navigate('/dashboard/parent');
            else if (user?.user_type === 'health_provider') navigate('/providers');
            else if (user?.user_type === 'admin') navigate('/dashboard/admin');
            else if (user?.user_type === 'content_writer') navigate('/dashboard/writer');
            else navigate('/dashboard');
          }} className="w-full">
            Return to Authorized Dashboard
          </Button>
        </div>
      );
    }

    return <>{children}</>;
  };

  // ==========================================
  // PAGE COMPONENT 1: /login
  // ==========================================
  const LoginPage = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isPinMode, setIsPinMode] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [shakeError, setShakeError] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setShakeError(false);
      try {
        const payload = isPinMode 
          ? { phone_number: phoneNumber, pin: password }
          : { phone_number: phoneNumber, password };

        const { data } = await api.post('/auth/login', payload);
        setAccessToken(data.access_token);
        setUser(data.user);
        if (rememberMe) {
          localStorage.setItem('refresh_token', data.refresh_token);
        } else {
          localStorage.removeItem('refresh_token');
        }
        toast.success(`Welcome back, ${data.user.first_name}!`);

        navigate(dashboardPathForUserType(data.user.user_type));
      } catch (err: any) {
        setShakeError(true);
        toast.error(err.response?.data?.message || 'Login credentials incorrect.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="flex min-h-screen bg-cream overflow-hidden">
        {/* Decorative left panel */}
        <div className="hidden lg:flex w-1/2 bg-[#7A4F6D] flex-col p-16 justify-between relative text-left overflow-hidden">
          {/* Organic Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#C4785A] opacity-30 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#8FAF8A] opacity-20 rounded-full blur-[100px]" />
          
          <div className="flex items-center gap-4 relative z-10 select-none group">
            <div className="logo-3d">
              <img src="/Logo.png" alt="Lady's Essence Logo" className="h-20 drop-shadow-lg" />
            </div>
          </div>

          <div className="space-y-6 max-w-lg relative z-10 my-auto select-none">
            <h2 className="text-6xl font-heading text-[#F5EDE0] leading-[1.1] mb-6">
              Your health journey, <br />
              <span className="italic font-light">shared with love.</span>
            </h2>
            <p className="text-[#F5EDE0]/80 text-lg leading-relaxed font-sans">
              A safe, private, and nurturing space for adolescent girls and their families to navigate health and wellness in Rwanda.
            </p>
          </div>

          <div className="mt-12 flex gap-4 items-center relative z-10 select-none">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#7A4F6D] bg-[#C4785A]" />
              <div className="w-10 h-10 rounded-full border-2 border-[#7A4F6D] bg-[#8FAF8A]" />
              <div className="w-10 h-10 rounded-full border-2 border-[#7A4F6D] bg-[#E8DDD4]" />
            </div>
            <span className="text-[#F5EDE0]/60 text-sm font-sans tracking-wide">Empowering thousands of girls across East Africa</span>
          </div>
        </div>

        {/* Right card form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
          <div className="organic-bg-blob lg:hidden w-72 h-72 bg-terracotta top-20 right-[-100px]" />
          
          <Card className={`max-w-md w-full p-8 space-y-7 bg-cream/40 backdrop-blur-md relative z-10 ${shakeError ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
            {/* Header */}
            <div className="text-center space-y-1.5 select-none">
              <h2 className="text-2.5xl font-extrabold font-heading text-ink">Sign In • Injira</h2>
              <p className="text-xs text-muted font-normal max-w-[280px] mx-auto">
                Access your private cycle logs or manage clinic entries safely.
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="tel"
                label="Phone Number (Inomero ya terefone)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                icon={<Phone className="w-4 h-4" />}
                placeholder="Your phone number"
                required
              />

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold uppercase text-muted tracking-wider">
                    {isPinMode ? '4-Digit PIN (Inomero ya PIN)' : 'Password (Ijambo ry’ibanga)'}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => { setPassword(''); setIsPinMode(!isPinMode); }}
                    className="text-[11px] text-terracotta font-semibold hover:underline cursor-pointer"
                  >
                    Switch to {isPinMode ? 'Password' : 'PIN'}
                  </button>
                </div>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder={isPinMode ? 'Your 4-digit PIN' : 'Your password'}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs select-none">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-terracotta focus:ring-terracotta"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full h-11 text-sm font-semibold mt-2">
                Sign In securely • Injira neza
              </Button>
            </form>

            <div className="text-center text-xs select-none pt-2 border-t border-border">
              <span className="text-muted font-medium">New to Lady's Essence? </span>
              <button 
                onClick={() => navigate('/register')}
                className="text-terracotta font-extrabold hover:underline cursor-pointer"
              >
                Create Account • Kwiyandikisha
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ==========================================
  // PAGE COMPONENT 2: /register
  // ==========================================
  const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<UserType['user_type']>('adolescent');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        const payload = {
          name: `${firstName} ${lastName}`.trim(),
          phone_number: phoneNumber,
          password,
          email: email || undefined,
          user_type: userType,
        };

        const { data } = await api.post('/auth/register', payload);
        setAccessToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('refresh_token', data.refresh_token);
        toast.success(`Account registered! Welcome ${firstName}.`);

        navigate(dashboardPathForUserType(userType));
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error occurred during registration.');
      } finally {
        setIsLoading(false);
      }
    };

    const rolesMap = [
      {
        type: 'adolescent' as const,
        title: 'I’m a Young Girl/Woman',
        kinya: 'Ndi umukobwa ukiri muto',
        desc: 'Log cycle start dates securely, visual nutrient summaries, and speaks to Dr. Agnes in comfort.',
        icon: '🌸'
      },
      {
        type: 'parent' as const,
        title: 'I’m a Supportive Parent',
        kinya: 'Ndi umubyeyi',
        desc: 'Monitor linked daughter logs in a privacy-first layout, ensuring dignified hygiene guidance and care.',
        icon: '🤱'
      }
    ];

    return (
      <div className="flex items-center justify-center min-h-screen bg-cream p-4">
        {/* Organic Background Blobs */}
        <div className="organic-bg-blob w-72 h-72 bg-terracotta top-[-50px] left-[-50px]" />
        <div className="organic-bg-blob w-80 h-80 bg-sage bottom-[-100px] right-[-100px]" />

        <Card className="max-w-xl w-full p-8 space-y-6 relative z-10 bg-cream/40 backdrop-blur-md">
          {/* Progress dots bar */}
          <div className="flex items-center justify-between pb-3 border-b border-border select-none">
            <span className="text-xs font-bold text-muted uppercase tracking-wider"> Kwiyandikisha • Register</span>
            <div className="flex gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-terracotta' : 'bg-border'}`} />
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-terracotta' : 'bg-border'}`} />
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-terracotta' : 'bg-border'}`} />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5 animate-[fadeInUp_0.2s_ease-out]">
              <div className="text-center select-none">
                <h3 className="text-xl font-bold font-heading text-ink">Choose Your Access Role</h3>
                <p className="text-xs text-muted mt-1">Select the option that mirrors your health journey.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rolesMap.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => setUserType(r.type)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative overflow-hidden ${
                      userType === r.type
                        ? 'border-terracotta bg-terracotta/5 ring-1 ring-terracotta'
                        : 'border-border bg-surface hover:border-muted'
                    }`}
                  >
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <p className="text-xs font-bold text-ink">{r.title}</p>
                    <p className="text-[10px] text-terracotta font-semibold leading-relaxed mt-0.5">{r.kinya}</p>
                    <p className="text-[11px] text-muted font-medium mt-1.5 leading-relaxed">{r.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} className="h-11 px-6">Continue • Komeza →</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-[fadeInUp_0.2s_ease-out] text-left">
              <div className="text-center select-none">
                <h3 className="text-xl font-bold font-heading text-ink">Your Personal Profile</h3>
                <p className="text-xs text-muted mt-1">Please write your human names exactly as preferred.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name (Izina ryawe)"
                  placeholder="e.g. Kezia"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Last Name (Izina ry’umuryango)"
                  placeholder="e.g. Uwase"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  required
                />
              </div>

              <Input
                label="Email Address - Optional (Imeri)"
                placeholder="e.g. uwase.kezia@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-11">← Back</Button>
                <Button 
                  onClick={() => {
                    if (!firstName || !lastName) {
                      toast.error('First and last name are required.');
                      return;
                    }
                    setStep(3);
                  }} 
                  className="h-11 px-6"
                >
                  Continue • Komeza →
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-5 animate-[fadeInUp_0.2s_ease-out] text-left">
              <div className="text-center select-none">
                <h3 className="text-xl font-bold font-heading text-ink">Secure Your Record</h3>
                <p className="text-xs text-muted mt-1">Choose a password that you will not forget.</p>
              </div>

              <Input
                type="tel"
                label="Phone Number (Terefone)"
                placeholder="Your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                icon={<Phone className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label="Password (Ijambo ry'ibanga)"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="h-11">← Back</Button>
                <Button type="submit" isLoading={isLoading} className="h-11 px-6">
                  Complete Setup • Kwiyandikisha
                </Button>
              </div>
            </form>
          )}

          <div className="text-center text-xs select-none pt-2 border-t border-border">
            <span className="text-muted font-medium">Already have an account? </span>
            <button 
              onClick={() => navigate('/login')}
              className="text-terracotta font-extrabold hover:underline cursor-pointer"
            >
              Sign In • Injira
            </button>
          </div>
        </Card>
      </div>
    );
  };

  // ==========================================
  // ADOLESCENT MODULE STATES & RE-FETCH TRIGGERS
  // ==========================================
  const [cycleLogsList, setCycleLogsList] = useState<CycleLog[]>([]);
  const [mealsList, setMealsList] = useState<MealLog[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [cycleStats, setCycleStats] = useState<DashboardCycleStats>({
    avgCycleLength: 28,
    avgPeriodLength: 5,
    regularityScore: 0,
    hasCycleData: false,
  });
  const [predictions, setPredictions] = useState<DashboardPredictions>({
    next_period_date: '',
    fertile_window_start: '',
    fertile_window_end: '',
    confidence_label: '',
  });
  const [insights, setInsights] = useState<any[]>([]);
  const [nutritionStats, setNutritionStats] = useState<DashboardNutritionStats>({
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
    total_calories: 0,
    hasMealData: false,
  });
  const [anomaly, setAnomaly] = useState({ anomaly_detected: false, alert_text: '' });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Modals trigger
  const [isLogCycleOpen, setIsLogCycleOpen] = useState(false);
  const [editingCycleLog, setEditingCycleLog] = useState<CycleLog | null>(null);
  const [cycleLogSaving, setCycleLogSaving] = useState(false);
  const [isLogMealOpen, setIsLogMealOpen] = useState(false);
  const [mealLogSaving, setMealLogSaving] = useState(false);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [healthProviders, setHealthProviders] = useState<HealthProviderSummary[]>([]);
  const [isBookAppOpen, setIsBookAppOpen] = useState(false);
  const [dashboardAppType, setDashboardAppType] = useState<'checkup' | 'consultation' | 'vaccination'>('consultation');

  // Sync adolescent states
  const syncAdolescentData = async () => {
    if (!user || user.user_type !== 'adolescent') return;
    setDashboardLoading(true);
    try {
      const [
        logsRes,
        mealsRes,
        appsRes,
        providersRes,
        statsRes,
        predsRes,
        insightsRes,
        anomalyRes,
      ] = await Promise.allSettled([
        api.get('/cycle-logs', { params: { per_page: 50 } }),
        api.get('/meal-logs', { params: { per_page: 50 } }),
        fetchAppointments(),
        fetchHealthProviders(),
        api.get('/cycle-logs/stats'),
        api.get('/cycle-logs/predictions'),
        api.get('/cycle-logs/insights'),
        api.get('/cycle-logs/anomaly-detection'),
      ]);

      const logsRaw = logsRes.status === 'fulfilled' ? asArray(logsRes.value.data) : [];
      const mappedLogs = logsRaw.map((l) => mapCycleLog(l as Record<string, unknown>));
      setCycleLogsList(mappedLogs);

      const mealsRaw = mealsRes.status === 'fulfilled'
        ? asArray(mealsRes.value.data)
        : [];
      const mappedMeals = mealsRaw.map((m) => mapMealLog(m as Record<string, unknown>));
      if (mealsRes.status === 'rejected') {
        console.warn('Meal logs fetch failed:', mealsRes.reason);
      }
      setMealsList(mappedMeals);
      setNutritionStats(mapTodayNutrition(mappedMeals));

      if (appsRes.status === 'fulfilled') {
        setAppointmentsList(appsRes.value as Appointment[]);
      }

      if (providersRes.status === 'fulfilled') {
        setHealthProviders(providersRes.value as HealthProviderSummary[]);
      } else {
        setHealthProviders([]);
      }

      const statsRaw = statsRes.status === 'fulfilled' ? statsRes.value.data : null;
      const mappedStats = mapCycleStats(statsRaw);
      setCycleStats(mappedStats);

      if (predsRes.status === 'fulfilled') {
        setPredictions(mapPredictions(predsRes.value.data, statsRaw));
      }

      if (insightsRes.status === 'fulfilled') {
        setInsights(mapInsights(insightsRes.value.data));
      }

      if (anomalyRes.status === 'fulfilled') {
        setAnomaly(mapAnomaly(anomalyRes.value.data));
      }
    } catch (err) {
      console.error('Failed to sync adolescent dashboard data:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.user_type === 'adolescent' && accessToken) {
       syncAdolescentData();
    }
  }, [user, accessToken, currentPath]);

  // Handler mutations
  const closeCycleLogModal = () => {
    setIsLogCycleOpen(false);
    setEditingCycleLog(null);
  };

  const openNewCycleLogModal = () => {
    setEditingCycleLog(null);
    setIsLogCycleOpen(true);
  };

  const openEditCycleLogModal = (log: CycleLog) => {
    setEditingCycleLog(log);
    setIsLogCycleOpen(true);
  };

  const handleSaveCycleLog = async (data: CycleLogFormData) => {
    setCycleLogSaving(true);
    try {
      if (editingCycleLog) {
        await updateCycleLog(editingCycleLog.id, data);
        toast.success('Period record updated.');
      } else {
        const res = await createCycleLog(data);
        toast.success('Period cycle saved to your health record.');
        const predictionHint = formatPredictionToast(res.prediction);
        if (predictionHint) {
          toast(predictionHint, { icon: '📅', duration: 6000 });
        }
        if (res.data_quality && !res.data_quality.has_enough_data) {
          toast(res.data_quality.recommendation, { icon: '💡', duration: 5000 });
        }
      }
      closeCycleLogModal();
      await syncAdolescentData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setCycleLogSaving(false);
    }
  };

  const handleDeleteCycleLog = async (id: number) => {
    if (!window.confirm('Delete this period record? This cannot be undone.')) return;
    try {
      await deleteCycleLog(id);
      toast.success('Record deleted.');
      if (editingCycleLog?.id === id) closeCycleLogModal();
      await syncAdolescentData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleAddNewMealLog = async (data: MealLogFormData) => {
    setMealLogSaving(true);
    try {
      await createMealLog(data);
      setIsLogMealOpen(false);
      toast.success('Nutrient meal logged!');
      await syncAdolescentData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setMealLogSaving(false);
    }
  };

  const handleAddNewAppointment = async (data: AppointmentFormData) => {
    setAppointmentSaving(true);
    try {
      await createAppointment(data);
      setIsBookAppOpen(false);
      toast.success('Appointment booked successfully!');
      await syncAdolescentData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setAppointmentSaving(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm('Cancel this appointment? This cannot be undone.')) return;
    try {
      await deleteAppointment(id);
      toast.success('Appointment successfully cancelled.');
      await syncAdolescentData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // ==========================================
  // VIEW: Adolescent Home Dashboard
  // ==========================================
  const AdolescentDashboard = () => {
    const latestLog = cycleLogsList[0];
    const periodStart =
      latestLog?.start_date ?? cycleStats.latestPeriodStart;
    const hasCycleTracking = cycleStats.hasCycleData && Boolean(periodStart);

    return (
      <DashboardLayout currentPath="/dashboard" onNavigate={navigate}>
        <div className="space-y-6 text-left animate-[fadeInUp_0.15s_ease-out]">
          
          {/* Welcome Alert banner if heavy bleeding anomaly detected */}
          {anomaly.anomaly_detected && (
            <div className="p-4 bg-terracotta/10 border border-terracotta/30 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-terracotta shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-terracotta uppercase tracking-wider">Health Alert • Imbura-shyu</span>
                <p className="text-xs text-ink font-semibold leading-relaxed mt-0.5">{anomaly.alert_text}</p>
              </div>
            </div>
          )}

          {/* Core dynamic widgets grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Cycle Progress Wheel */}
            <Card className="lg:col-span-4 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-ink border-b border-border pb-3 mb-4 flex items-center gap-1.5">
                  <Heart className="w-5 h-5 text-terracotta" /> Cycle Tracking
                </h3>
                {dashboardLoading ? (
                  <p className="text-xs text-muted text-center py-8">Loading cycle data…</p>
                ) : hasCycleTracking && periodStart ? (
                  <CycleRing
                    startDate={periodStart}
                    averageCycleLength={cycleStats.avgCycleLength}
                  />
                ) : (
                  <EmptyState
                    title="No tracking logged yet"
                    description="Log your last cycle to activate phase tracking from your real health records."
                    actionText="Log first period"
                    onAction={openNewCycleLogModal}
                  />
                )}
              </div>
              <div className="pt-2 border-t border-border mt-4">
                <Button variant="ghost" className="w-full text-xs font-bold" onClick={openNewCycleLogModal}>
                  + Log cycle start date
                </Button>
              </div>
            </Card>

            {/* Cycle predictions calendar */}
            <Card className="lg:col-span-4 select-none">
              <h3 className="text-lg font-bold font-heading text-ink border-b border-border pb-3 mb-4 flex items-center gap-1.5">
                <CalendarDays className="w-5 h-5 text-mauve" /> Menstrual Calendar
              </h3>
              {hasCycleTracking && periodStart ? (
                <CycleCalendar
                  lastPeriodStart={periodStart}
                  cycleLength={cycleStats.avgCycleLength}
                  periodLength={cycleStats.avgPeriodLength}
                />
              ) : (
                <EmptyState
                  title="Calendar unavailable"
                  description="Log a period start date to see your menstrual calendar and fertile window predictions."
                  actionText="Log period"
                  onAction={openNewCycleLogModal}
                />
              )}
              <div className="p-3 bg-cream/30 border border-border rounded-lg text-[10px] text-muted leading-relaxed mt-4 flex items-start gap-1.5">
                <HelpCircle className="w-4 h-4 text-terracotta shrink-0" />
                <span>Our estimations are based on organic averages. For changes/delays, make a friendly clinic checkup consultation.</span>
              </div>
            </Card>

            {/* Nutrition macro donut */}
            <Card className="lg:col-span-4 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-ink border-b border-border pb-3 mb-4 flex items-center gap-1.5">
                  <Utensils className="w-5 h-5 text-sage" /> Daily Nutrition
                </h3>
                <NutritionDonut
                  protein={nutritionStats.total_protein}
                  carbs={nutritionStats.total_carbs}
                  fats={nutritionStats.total_fats}
                  hasData={nutritionStats.hasMealData}
                />
              </div>
              <div className="pt-2 border-t border-border mt-4">
                <Button variant="ghost" className="w-full text-xs font-bold" onClick={() => setIsLogMealOpen(true)}>
                  + Log daily meal (Igikoma/Dodo)
                </Button>
              </div>
            </Card>

          </div>

          {/* AI insights and clinic appointment widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* AI Insights stack */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-bold font-heading text-ink pb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-terracotta" /> Personalized AI Clinical Insights
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {insights.map((ins) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            </div>

            {/* Upcoming consulting timelines */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#7A4F6D]/5 border border-[#7A4F6D]/10 rounded-[20px] p-4.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-heading text-ink flex items-center gap-2 select-none">
                    <Clock className="w-5 h-5 text-[#8FAF8A]" /> Clinical Booking
                  </h3>
                  <Button 
                    onClick={() => setIsBookAppOpen(true)} 
                    className="text-xs shrink-0 py-1.5 px-3 bg-[#7A4F6D] hover:bg-[#7A4F6D]/90 font-bold active:scale-95"
                  >
                    Book Slot
                  </Button>
                </div>

                {/* Dashboard appointment type selector cards or dropdown */}
                <div className="space-y-1.5 select-none">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted">
                    Choose Type (Ubwoko bwa Serivisi)
                  </label>
                  <select
                    value={dashboardAppType}
                    onChange={(e) => setDashboardAppType(e.target.value as 'checkup' | 'consultation' | 'vaccination')}
                    className="block w-full h-[40px] rounded-xl border border-border bg-surface px-3 text-xs font-bold text-ink focus:border-[#7A4F6D] focus:ring-1 focus:ring-[#7A4F6D] focus:outline-none cursor-pointer"
                  >
                    <option value="consultation">Friendly Consultation • Inama y’ubuzima</option>
                    <option value="checkup">Routine Checkup • Gupimwa busanzwe</option>
                    <option value="vaccination">HPV Vaccination • Gukingirwa mu Rwanda</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {appointmentsList.filter(a => a.status !== 'cancelled').slice(0, 2).map((app) => (
                  <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    onCancel={handleCancelAppointment} 
                  />
                ))}
                
                {appointmentsList.filter(a => a.status !== 'cancelled').length === 0 && (
                  <div className="p-6 text-center text-xs text-muted border border-dashed border-border rounded-xl bg-surface/40 select-none">
                    {healthProviders.length > 0
                      ? `No active clinic reservations. Book with ${healthProviders[0].name} or another verified clinician.`
                      : 'No active clinic reservations. Use Book Slot to request a consultation.'}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </DashboardLayout>
    );
  };

  // ==========================================
  // PAGE: /dashboard/cycle - Detailed Cycle panel
  // ==========================================
  const CycleTrackerPage = () => {
    return (
      <DashboardLayout currentPath="/dashboard/cycle" onNavigate={navigate}>
        <div className="space-y-6 text-left animate-[fadeInUp_0.15s_ease-out]">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4 select-none">
            <div>
              <h2 className="text-2xl font-extrabold font-heading text-ink">Cycle tracking & Predicts</h2>
              <p className="text-xs text-muted mt-0.5">Explore your historic cycle logs, forecasts, and confidence intervals.</p>
            </div>
            
            <Button onClick={openNewCycleLogModal} className="h-11">
              + Log New Period Start
            </Button>
          </div>

          {/* Cycle Stats summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverable className="p-4 flex flex-col justify-between border-l-4 border-l-terracotta text-left select-none">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block" title="Days between consecutive period start dates in your logs">Average cycle length</span>
                <span className="text-3xl font-extrabold text-ink font-heading mt-1.5 block">{cycleStats.avgCycleLength} Days</span>
              </div>
              <span className="text-[10px] text-muted mt-2 block">
                {cycleStats.computableCycles
                  ? `Calculated from ${cycleStats.computableCycles} cycle gap${cycleStats.computableCycles === 1 ? '' : 's'}`
                  : 'Log 2+ periods to calculate'}
              </span>
            </Card>

            <Card hoverable className="p-4 flex flex-col justify-between border-l-4 border-l-sage text-left select-none">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block" title="Average bleeding duration from logged start and end dates">Flow duration avg</span>
                <span className="text-3xl font-extrabold text-ink font-heading mt-1.5 block">{cycleStats.avgPeriodLength} Days</span>
              </div>
              <span className="text-[10px] text-muted mt-2 block">From logged period start and end dates</span>
            </Card>

            <Card hoverable className="p-4 flex flex-col justify-between border-l-4 border-l-mauve text-left select-none">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block" title="How consistent your cycle lengths are based on your history">Cycle regularity index</span>
                <span className="text-3xl font-extrabold text-ink font-heading mt-1.5 block">
                  {cycleStats.hasCycleData ? `${cycleStats.regularityScore}%` : '—'}
                </span>
              </div>
              <span className="text-[10px] text-muted mt-2 block">
                {cycleStats.regularityLabel ?? 'Regularity score'}
                {cycleStats.regularityStdDev != null ? ` · ±${cycleStats.regularityStdDev} day variation` : ''}
              </span>
            </Card>

            <Card hoverable className="p-4 flex flex-col justify-between border-l-4 border-l-[#7A4F6D] text-left select-none">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block" title="How reliably we can predict your next period from your logged history">Prediction confidence</span>
                <span className="text-3xl font-extrabold text-ink font-heading mt-1.5 flex items-center gap-2">
                  {cycleStats.confidenceLevel ? (
                    <>
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          cycleStats.confidenceLevel === 'Very High' || cycleStats.confidenceLevel === 'High'
                            ? 'bg-sage'
                            : cycleStats.confidenceLevel === 'Medium'
                              ? 'bg-terracotta'
                              : 'bg-muted'
                        }`}
                        aria-hidden
                      />
                      {cycleStats.confidenceLevel}
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <span className="text-[10px] text-muted mt-2 block">Based on data volume and cycle consistency</span>
            </Card>
          </div>

          {/* Personalized AI Clinical Insights Section */}
          <div className="p-6 rounded-[24px] border border-[#7A4F6D]/15 bg-gradient-to-br from-[#7A4F6D]/5 via-white to-[#C4785A]/5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#7A4F6D]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#7A4F6D]/10 flex items-center justify-center text-[#7A4F6D]">
                  <Sparkles className="w-5 h-5 fill-[#7A4F6D]/10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-ink">
                    Personalized AI Clinical Insights
                  </h3>
                  <p className="text-[11px] text-muted font-medium">Smart wellness suggestions tailored to your ongoing cycle phase</p>
                </div>
              </div>
              <span className="text-[10px] inline-flex items-center px-2.5 py-1 rounded-full font-extrabold bg-[#7A4F6D]/10 text-[#7A4F6D] uppercase tracking-wider self-start sm:self-center">
                ● Live AI recommendations
              </span>
            </div>

            {insights && insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((ins) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted/80 italic">
                Analyzing cycle trend data... Your recommendations will appear here.
              </div>
            )}
          </div>

          {/* Grid layout of forecasts and lists */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Forecast panel */}
            <Card className="lg:col-span-4 text-left space-y-4 select-none bg-cream/15">
              <h3 className="text-base font-bold font-heading text-ink border-b border-border pb-2 flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-terracotta animate-pulse" /> Wellness Predictions
              </h3>

              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Estimated next period start</span>
                  <span className="text-sm font-extrabold text-ink mt-0.5 block">
                    {predictions.next_period_date ? new Date(predictions.next_period_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending...'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Fertile window starts</span>
                    <span className="text-xs font-bold text-ink mt-0.5 block">
                      {predictions.fertile_window_start ? new Date(predictions.fertile_window_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending...'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Fertile window ends</span>
                    <span className="text-xs font-bold text-ink mt-0.5 block">
                      {predictions.fertile_window_end ? new Date(predictions.fertile_window_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending...'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-surface border border-border rounded-xl">
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Confidence metrics score</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="sage">
                      {predictions.confidence_label
                        ? `${predictions.confidence_label} confidence`
                        : 'Building predictions…'}
                    </Badge>
                    <span className="text-[10px] font-medium text-muted">Machine prediction validation active</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Log list */}
            <Card className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold font-heading text-ink border-b border-border pb-2 mb-4 flex items-center gap-1.5">
                  <Heart className="w-4.5 h-4.5 text-terracotta" /> Logged Menstrual History
                </h3>

                {cycleLogsList.length === 0 ? (
                  <EmptyState 
                    title="No logs found"
                    description="You have not submitted any cycle logs. Click Add period to log flow statistics instantly."
                    actionText="Add period"
                    onAction={openNewCycleLogModal}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-[20px] border border-border/80 shadow-sm bg-surface">
                    <table className="min-w-full divide-y divide-border text-left">
                      <thead className="bg-[#7A4F6D]/5">
                        <tr>
                          <th scope="col" className="px-5 py-4 text-xs font-bold text-[#7A4F6D] uppercase tracking-wider">Start Date (Umunsi utangiriraho)</th>
                          <th scope="col" className="px-5 py-4 text-xs font-bold text-[#7A4F6D] uppercase tracking-wider">End Date (Umunsi urangiriraho)</th>
                          <th scope="col" className="px-5 py-4 text-xs font-bold text-[#7A4F6D] uppercase tracking-wider">Flow Level (Umuvuduko)</th>
                          <th scope="col" className="px-5 py-4 text-xs font-bold text-[#7A4F6D] uppercase tracking-wider">Symptoms (Ibimenyetso)</th>
                          <th scope="col" className="relative px-5 py-4 text-right">
                            <span className="sr-only font-bold">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {cycleLogsList.map((log) => (
                          <tr key={log.id} className="hover:bg-cream/10 transition-all duration-150">
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-extrabold text-ink">
                              {new Date(log.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-muted">
                              {log.end_date ? (
                                <span className="font-semibold text-zinc-700">
                                  {new Date(log.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fcf5e9] border border-orange-150 text-[#C4785A]">
                                  Ongoing • Karacyakomeza
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm">
                              <Badge variant={log.flow_level === 'heavy' ? 'terracotta' : log.flow_level === 'medium' ? 'sage' : 'muted'}>
                                {log.flow_level.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm max-w-xs">
                              <div className="flex flex-col gap-1.5 text-left">
                                {log.symptoms.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {log.symptoms.map((sym, si) => (
                                      <span key={si} className="text-[10px] bg-cream border border-border px-2 py-0.5 rounded-full text-zinc-700 font-bold">{sym}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted/60 italic">No symptoms reported</span>
                                )}
                                {log.notes && (
                                  <p className="text-xs text-muted/80 italic leading-snug truncate max-w-[200px]" title={log.notes}>
                                    "{log.notes}"
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditCycleLogModal(log)}
                                  className="text-muted hover:text-terracotta transition-all p-2 hover:bg-terracotta/10 rounded-full cursor-pointer inline-flex items-center justify-center"
                                  title="Edit log"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCycleLog(log.id)}
                                  className="text-muted hover:text-mauve transition-all p-2 hover:bg-mauve/10 rounded-full cursor-pointer inline-flex items-center justify-center active:scale-90"
                                  title="Delete log"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>

          </div>

        </div>
      </DashboardLayout>
    );
  };

  // ==========================================
  // PAGE: /dashboard/meals - Nutritious meals log
  // ==========================================
  const MealsLogPage = () => {
    return (
      <DashboardLayout currentPath="/dashboard/meals" onNavigate={navigate}>
        <div className="space-y-6 text-left animate-[fadeInUp_0.15s_ease-out]">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4 select-none">
            <div>
              <h2 className="text-2xl font-extrabold font-heading text-ink">Menstrual nutrition tracker</h2>
              <p className="text-xs text-muted mt-0.5">Understand how iron, minerals, and dodo meals support your system strength.</p>
            </div>
            
            <Button onClick={() => setIsLogMealOpen(true)} className="h-11">
              + Log Daily Meal
            </Button>
          </div>

          {/* Macro Nutrition overview list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Pie donut card */}
            <Card className="lg:col-span-5 text-center flex flex-col justify-center select-none bg-cream/15">
              <h3 className="text-base font-bold font-heading text-ink border-b border-border pb-2 mb-4 flex items-center justify-center gap-1.5">
                <Utensils className="w-4.5 h-4.5 text-sage" /> Core Macor split
              </h3>
              <NutritionDonut
                protein={nutritionStats.total_protein}
                carbs={nutritionStats.total_carbs}
                fats={nutritionStats.total_fats}
                hasData={nutritionStats.hasMealData}
              />
              <div className="p-3 bg-surface border border-border rounded-xl mt-5 text-xs text-muted leading-relaxed">
                Total Calories Consumed Today:{' '}
                <strong className="text-ink">
                  {nutritionStats.hasMealData ? `${nutritionStats.total_calories} kcal` : 'No meals logged today'}
                </strong>
              </div>
            </Card>

            {/* Meals tracking timeline */}
            <Card className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold font-heading text-ink border-b border-border pb-2 mb-4 flex items-center gap-1.5">
                  <Apple className="w-4.5 h-4.5 text-sage" /> Logged meals timeline
                </h3>

                {mealsList.length === 0 ? (
                  <EmptyState 
                    title="No nutrition logs submitted"
                    description="You haven't tracked any meals. Support your progesterone cycle phases by logging porridge or amaranth dodo."
                    actionText="Log first meal"
                    onAction={() => setIsLogMealOpen(true)}
                  />
                ) : (
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {mealsList.map((meal) => (
                      <div key={meal.id} className="p-4 border border-border bg-surface rounded-xl flex items-start justify-between gap-4 text-left">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-sage bg-sage/5 px-2 py-0.5 rounded border border-sage/10">{meal.meal_type}</span>
                            <span className="text-[11px] text-muted font-bold">{new Date(meal.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {meal.food_items.map((item, ii) => (
                              <span key={ii} className="text-xs bg-cream/75 border border-border text-ink px-2.5 py-1 rounded-full font-semibold">{item}</span>
                            ))}
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold pt-1">
                            <span>Protein: <strong>{meal.protein || 0}g</strong></span>
                            <span>Carbs: <strong>{meal.carbs || 0}g</strong></span>
                            <span>Fats: <strong>{meal.fats || 0}g</strong></span>
                            <span>Calories: <strong>{meal.calories || 0} kcal</strong></span>
                          </div>

                          {meal.mood_after && (
                            <span className="inline-block text-[10px] bg-sage/10 text-sage font-extrabold px-2 py-0.5 rounded-full mt-1.5">
                              Wellness Mood: {meal.mood_after}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

          </div>

        </div>
      </DashboardLayout>
    );
  };

  // ==========================================
  // PAGE: /dashboard/appointments - Appointment desk
  // ==========================================
  const AppointmentsPage = () => {
    const primaryProvider = healthProviders[0];

    return (
      <DashboardLayout currentPath="/dashboard/appointments" onNavigate={navigate}>
        <div className="space-y-6 text-left animate-[fadeInUp_0.15s_ease-out]">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4 select-none">
            <div>
              <h2 className="text-2xl font-extrabold font-heading text-ink">Clinical Appointments Desks</h2>
              <p className="text-xs text-muted mt-0.5">
                {healthProviders.length > 0
                  ? `Book with verified clinicians — ${healthProviders.length} provider${healthProviders.length === 1 ? '' : 's'} available.`
                  : 'Request confidential adolescent health consultations and vaccinations.'}
              </p>
            </div>
            
            <Button onClick={() => setIsBookAppOpen(true)} className="h-11">
              + Request Appointment
            </Button>
          </div>

          {healthProviders.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-heading text-ink uppercase tracking-wider text-muted">
                Available clinicians
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthProviders.map((provider) => (
                  <HealthProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-4 border-l-4 border-l-terracotta text-left bg-cream/20">
              <p className="text-sm font-bold text-ink">No verified clinicians loaded</p>
              <p className="text-xs text-muted mt-1">
                You can still submit an appointment request. A provider will be assigned when one is available.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
            {primaryProvider && (
              <Card hoverable className="p-4 border-l-4 border-l-sage text-left bg-surface shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Featured clinician</span>
                <p className="text-sm font-bold mt-1 text-ink">{primaryProvider.name}</p>
                <span className="text-[10px] text-muted block mt-1.5 font-semibold">
                  {primaryProvider.specialization} · {primaryProvider.clinic}
                </span>
              </Card>
            )}
            <Card hoverable className="p-4 border-l-4 border-l-terracotta text-left bg-surface shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Privacy</span>
              <p className="text-sm font-bold mt-1 text-ink">Confidential & guarded</p>
              <span className="text-[10px] text-muted block mt-1.5 font-semibold">Your health data stays private</span>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-ink border-b border-border pb-2">Schedule booking history</h3>
            
            <div className="space-y-3.5 max-w-4xl">
              {appointmentsList.map((app) => (
                <AppointmentCard 
                  key={app.id} 
                  appointment={app} 
                  onCancel={handleCancelAppointment} 
                />
              ))}

              {appointmentsList.length === 0 && (
                <EmptyState 
                  title="No historical appointments registered"
                  description={
                    healthProviders.length > 0
                      ? `You do not have any appointments yet. Book with ${primaryProvider?.name ?? 'a clinician'} when you are ready.`
                      : 'You do not have any appointments yet. Request a consultation to speak with a clinician in safety.'
                  }
                  actionText="Book consultation"
                  onAction={() => setIsBookAppOpen(true)}
                />
              )}
            </div>
          </div>

        </div>
      </DashboardLayout>
    );
  };

  // ==========================================
  // CONTENT WRITER STATES & WRITING DESK
  // ==========================================
  const [writerContent, setWriterContent] = useState<ContentItem[]>([]);
  const [writerCourses, setWriterCourses] = useState<Course[]>([]);
  const [analytics, setAnalytics] = useState({ total_views: 760, total_likes: 205, average_engagement: '24%', popular_category: 'Puberty Education' });

  // Article creation form states
  const [artTitle, setArtTitle] = useState('');
  const [artBody, setArtBody] = useState('');
  const [artCat, setArtCat] = useState('Puberty');
  const [artLang, setArtLang] = useState<'English' | 'Kinyarwanda' | 'French'>('English');
  const [artImg, setArtImg] = useState('');

  const syncWriterDashboard = async () => {
    if (!user || user.user_type !== 'content_writer') return;
    try {
      const { data: contents } = await api.get<ContentItem[]>('/content-writer/content');
      setWriterContent(contents);

      const { data: crs } = await api.get<Course[]>('/content-writer/courses');
      setWriterCourses(crs);

      const { data: aly } = await api.get('/content-writer/analytics');
      setAnalytics(aly);
    } catch {}
  };

  useEffect(() => {
    if (user && user.user_type === 'content_writer' && accessToken) {
      syncWriterDashboard();
    }
  }, [user, accessToken, currentPath]);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artBody) {
       toast.error('Please enter article title and body.');
       return;
    }
    try {
      await api.post('/content-writer/content', {
        title: artTitle,
        body: artBody,
        category: artCat,
        language: artLang,
        media_url: artImg || undefined
      });
      // Clear forms
      setArtTitle('');
      setArtBody('');
      setArtImg('');
      toast.success('Course draft composed! Submitting click required below to moderate.');
      syncWriterDashboard();
    } catch {
       toast.error('Composition creation failed.');
    }
  };

  const handleSubmitToModerate = async (id: number) => {
    try {
      await api.patch(`/content-writer/content/${id}/submit`);
      toast.success('Composition successfully submitted to Admin moderation panel!');
      syncWriterDashboard();
    } catch {
       toast.error('Submission failed.');
    }
  };

  // ==========================================
  // VIEW: Writer Curation Dashboard
  // ==========================================
  const ContentWriterDashboardPage = () => {
    return (
      <RoleRequired allowed={['content_writer']}>
        <DashboardLayout currentPath="/dashboard/writer" onNavigate={navigate}>
          <div className="space-y-6 text-left animate-[fadeInUp_0.15s_ease-out]">
            
            <div className="border-b border-border pb-4 select-none">
              <h2 className="text-2xl font-extrabold font-heading text-ink">Literature curation desk</h2>
              <p className="text-xs text-muted mt-0.5">Author hygienic instructions, compose teen reproductive guides, write courses and track engagement metrics.</p>
            </div>

            {/* Writer stats metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
              <Card hoverable className="p-4 border-l-4 border-l-sage bg-surface">
                <span className="text-[10px] text-muted uppercase font-bold">Total Literature views</span>
                <p className="text-2.5xl font-extrabold font-heading mt-1 text-ink">{analytics.total_views} Reads</p>
              </Card>
              <Card hoverable className="p-4 border-l-4 border-l-terracotta bg-surface">
                <span className="text-[10px] text-muted uppercase font-bold">Total reader hearts</span>
                <p className="text-2.5xl font-extrabold font-heading mt-1 text-ink">{analytics.total_likes} Hearts</p>
              </Card>
              <Card hoverable className="p-4 border-l-4 border-l-mauve bg-surface">
                <span className="text-[10px] text-muted uppercase font-bold">Curation engagement average</span>
                <p className="text-2.5xl font-extrabold font-heading mt-1 text-ink">{analytics.average_engagement}</p>
              </Card>
              <Card hoverable className="p-4 border-l-4 border-l-muted bg-surface">
                <span className="text-[10px] text-muted uppercase font-bold">Popular topic</span>
                <p className="text-xs font-bold font-heading pr-1 line-clamp-1 mt-1.5 text-ink">{analytics.popular_category}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Write articles form */}
              <div className="lg:col-span-5">
                <Card className="p-5 flex flex-col h-full bg-cream/10">
                  <h3 className="text-base font-bold font-heading text-ink border-b border-border pb-2.5 mb-4">
                    ✍️ Draft new educational article
                  </h3>

                  <form onSubmit={handleCreateArticle} className="space-y-4">
                    <Input
                      label="Title * (Omutwe w’inyigsho)"
                      placeholder="e.g. Healthy Hygiene Tips"
                      value={artTitle}
                      onChange={(e) => setArtTitle(e.target.value)}
                      required
                    />

                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <label className="block text-muted tracking-wider uppercase mb-1">Language</label>
                        <select
                          value={artLang}
                          onChange={(e) => setArtLang(e.target.value as any)}
                          className="w-full h-10 border border-border rounded-lg bg-surface px-2 focus:ring-1 focus:ring-terracotta/40"
                        >
                          <option value="English">English</option>
                          <option value="Kinyarwanda">Kinyarwanda</option>
                          <option value="French">French</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-muted tracking-wider uppercase mb-1">Category</label>
                        <select
                          value={artCat}
                          onChange={(e) => setArtCat(e.target.value)}
                          className="w-full h-10 border border-border rounded-lg bg-surface px-2"
                        >
                          <option value="Puberty">Puberty Education</option>
                          <option value="Hygiene">Hygiene & Care</option>
                          <option value="Nutrition">Healthy Diet</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-muted uppercase">Image Media Url (Optional)</label>
                      <Input
                        placeholder="Image URL..."
                        value={artImg}
                        onChange={(e) => setArtImg(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-muted uppercase">Article content draft body *</label>
                      <textarea
                        rows={5}
                        required
                        value={artBody}
                        onChange={(e) => setArtBody(e.target.value)}
                        placeholder="Write helpful, comforting words in dignity..."
                        className="w-full p-2.5 border border-border bg-surface rounded-lg text-xs"
                      />
                    </div>

                    <Button type="submit" className="w-full py-2.5 text-xs">
                      Compose Article Draft
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Author article table draft list */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="p-4">
                  <h3 className="text-base font-bold font-heading text-ink border-b border-border pb-2 mb-4">
                    📚 Published Literature drafts
                  </h3>

                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto">
                    {writerContent.map((item) => (
                      <div key={item.id} className="p-3.5 border border-border bg-surface/50 rounded-xl flex items-start justify-between gap-4 text-left">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink leading-tight">{item.title}</span>
                            <Badge variant={item.status === 'approved' ? 'sage' : item.status === 'pending' ? 'muted' : 'mauve'}>
                              {item.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted">Topic: {item.category} • {item.language} • {item.views} Reads • {item.likes} Hearts</p>
                          <p className="text-xs text-muted/90 line-clamp-3 italic leading-relaxed pt-1">"{item.body}"</p>
                        </div>

                        {item.status === 'draft' && (
                          <Button onClick={() => handleSubmitToModerate(item.id)} className="text-[10px] py-1 px-2.5 shrink-0 bg-sage">
                            Submit Audit
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

            </div>

          </div>
        </DashboardLayout>
      </RoleRequired>
    );
  };

  // ==========================================
  // PAGE: /dashboard/notifications - Complete Center
  // ==========================================
  const NotificationsCentricPage = () => {
    const [notifItems, setNotifItems] = useState<Notification[]>([]);

    const syncNotifications = () => {
      api.get('/notifications', { params: { per_page: 50 } })
        .then((res) => {
          const rows = asArray<Record<string, unknown>>(res.data);
          setNotifItems(rows.map(mapNotification));
        })
        .catch(() => setNotifItems([]));
    };

    useEffect(() => {
      if (accessToken) {
        syncNotifications();
      }
    }, [accessToken, currentPath]);

    const markSingleRead = async (id: number) => {
      try {
        await api.put(`/notifications/${id}/read`);
        toast.success('Alert marked resolved.');
        syncNotifications();
      } catch {}
    };

    const deleteSingle = async (id: number) => {
      try {
        await api.delete(`/notifications/${id}`);
        toast.success('Alert dismissed.');
        syncNotifications();
      } catch {}
    };

    return (
      <DashboardLayout currentPath="/dashboard/notifications" onNavigate={navigate}>
        <div className="space-y-6 text-left animate-[fadeInUp_0.15s_ease-out] select-none">
          
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-extrabold font-heading text-ink">Notification center alerts</h2>
            <p className="text-xs text-muted mt-0.5 font-sans">Manage your daily cycle reminders, wellness micro prompts, and medical checkup reservations.</p>
          </div>

          <div className="space-y-3.5 max-w-4xl">
            {notifItems.map((item) => {
              const typeLabel = item.notification_type.replace(/_/g, ' ');
              return (
              <div 
                key={item.id} 
                className={`p-4 border rounded-xl bg-surface flex items-start gap-4 transition-all ${
                  !item.is_read ? 'border-l-4 border-l-terracotta bg-surface' : 'border-border/80 bg-surface/50 opacity-90'
                }`}
              >
                <div className={`p-2 rounded-full shrink-0 ${!item.is_read ? 'bg-terracotta/10 text-terracotta animate-pulse' : 'bg-cream text-muted'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                
                <div className="flex-grow space-y-1 text-left font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink leading-tight">{item.title}</span>
                    <Badge variant={item.notification_type === 'cycle' ? 'terracotta' : item.notification_type === 'appointment' ? 'sage' : 'muted'} className="text-[9px]">
                      {typeLabel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted/90">{item.message}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!item.is_read && (
                    <button 
                      onClick={() => markSingleRead(item.id)}
                      className="text-[10px] text-sage font-bold px-2 py-1 rounded bg-sage/10 hover:bg-sage/20 border border-sage/20 cursor-pointer"
                    >
                      Resolve
                    </button>
                  )}
                  <button 
                    onClick={() => deleteSingle(item.id)}
                    className="p-1 px-2 text-muted hover:text-mauve hover:bg-mauve/10 rounded cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
            })}

            {notifItems.length === 0 && (
              <EmptyState 
                title="Your notice board is clear"
                description="Everything looks peaceful. Notifications, period reminders, and clinic checkups will appear here."
              />
            )}
          </div>

        </div>
      </DashboardLayout>
    );
  };

  // ==========================================
  // ROUTER CONTROLLING THE APP VIEWPORTS
  // ==========================================
  const showGuestRedirect =
    !isAuthHydrating && !isAuthenticated && !isPublicPath(currentPath);

  if (isAuthHydrating && !isPublicPath(currentPath)) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <AuthLoadingScreen message="Restoring your session…" />
      </>
    );
  }

  if (showGuestRedirect) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <AuthLoadingScreen message="Redirecting to sign in…" />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      
      {currentPath === '/login' && <LoginPage />}
      {currentPath === '/register' && <RegisterPage />}

      {isAuthenticated && (
        <>
      {/* Adolescent Router views */}
      {currentPath === '/dashboard' && (
        <RoleRequired allowed={['adolescent']}>
          <AdolescentDashboard />
        </RoleRequired>
      )}
      {currentPath === '/dashboard/cycle' && (
        <RoleRequired allowed={['adolescent']}>
          <CycleTrackerPage />
        </RoleRequired>
      )}
      {currentPath === '/dashboard/meals' && (
        <RoleRequired allowed={['adolescent']}>
          <MealsLogPage />
        </RoleRequired>
      )}
      {currentPath === '/dashboard/appointments' && (
        <RoleRequired allowed={['adolescent']}>
          <AppointmentsPage />
        </RoleRequired>
      )}

      {/* Role dashboard routes */}
      {currentPath.startsWith('/dashboard/parent') && (
        <AuthRequired>
          <ParentShell currentPath={currentPath} onNavigate={navigate} />
        </AuthRequired>
      )}
      {(currentPath === '/dashboard/provider' ||
        currentPath === '/providers' ||
        currentPath.startsWith('/providers/')) && (
        <AuthRequired>
          <ProviderShell
            currentPath={currentPath === '/dashboard/provider' ? '/providers' : currentPath}
            onNavigate={navigate}
          />
        </AuthRequired>
      )}
      {currentPath.startsWith('/dashboard/admin') && (
        <AuthRequired>
          <AdminShell currentPath={currentPath} onNavigate={navigate} />
        </AuthRequired>
      )}
      {currentPath === '/dashboard/writer' && (
        <AuthRequired><ContentWriterDashboardPage /></AuthRequired>
      )}

      {/* Shared routes */}
      {currentPath === '/dashboard/notifications' && user?.user_type !== 'parent' && (
        <AuthRequired><NotificationsCentricPage /></AuthRequired>
      )}
      {currentPath === '/settings' && (
        <AuthRequired><SettingsPage onNavigate={navigate} /></AuthRequired>
      )}
      
      {currentPath === '/dashboard/umwari' && (
        <AuthRequired>
          <DashboardLayout currentPath="/dashboard/umwari" onNavigate={navigate}>
            <UmwariFullPage />
          </DashboardLayout>
        </AuthRequired>
      )}
        </>
      )}

      {isAuthenticated && (
        <>
      {/* MODAL WORKFLOW: Log Cycle Period starts */}
      <Modal
        isOpen={isLogCycleOpen}
        onClose={closeCycleLogModal}
        title={
          editingCycleLog
            ? 'Edit Period Record • Hindura amakuru'
            : 'Log Cycle Record • Igihe cy\'imihango'
        }
      >
        <CycleLogForm
          key={editingCycleLog?.id ?? 'new'}
          onSubmit={handleSaveCycleLog}
          isLoading={cycleLogSaving}
          submitLabel={
            editingCycleLog ? 'Update Record • Hindura' : 'Save Period Record • Gika Amakuru'
          }
          initialData={
            editingCycleLog
              ? {
                  start_date: editingCycleLog.start_date.split('T')[0],
                  end_date: editingCycleLog.end_date?.split('T')[0],
                  flow_level: editingCycleLog.flow_level,
                  symptoms: editingCycleLog.symptoms,
                  notes: editingCycleLog.notes,
                }
              : undefined
          }
        />
      </Modal>

      {/* MODAL WORKFLOW: Log Meal Nutrition logs */}
      <Modal isOpen={isLogMealOpen} onClose={() => setIsLogMealOpen(false)} title="Log Daily Nutrient Meal • Ibyo Uriye">
        <MealLogForm onSubmit={handleAddNewMealLog} isLoading={mealLogSaving} />
      </Modal>

      {/* MODAL WORKFLOW: Book Adolescent appointment */}
      <Modal isOpen={isBookAppOpen} onClose={() => setIsBookAppOpen(false)} title="Request Clinical appointment">
        <AppointmentForm
          onSubmit={handleAddNewAppointment}
          isLoading={appointmentSaving}
          providers={healthProviders}
          initialType={dashboardAppType}
          initialDate={(() => {
            const d = new Date();
            const pad = (num: number) => num.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          })()}
        />
      </Modal>

        </>
      )}

      {/* Umwari AI floating companion — signed-in users only */}
      {isAuthenticated && (
        <>
          {umwariStore.isOpen && <UmwariChat />}
          <UmwariFab />
        </>
      )}
    </>
  );
}
