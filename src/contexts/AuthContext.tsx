import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'manager' | 'support' | 'user';

interface LockoutInfo {
  locked: boolean;
  locked_until?: string;
  failed_attempts?: number;
  remaining_attempts?: number;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; lockout?: LockoutInfo }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  checkAccountLockout: (email: string) => Promise<LockoutInfo>;
  isAdmin: boolean;
  isManager: boolean;
  isSupport: boolean;
  isCustomer: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get device info for tracking
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }
  
  return { browser, os, device, isMobile: device !== 'Desktop' };
};

// Cache helpers
const ROLE_CACHE_KEY = 'auth_role_cache';
const PROFILE_CHECKED_KEY = 'auth_profile_checked';

function getCachedRole(userId: string): AppRole | null {
  try {
    const cached = sessionStorage.getItem(ROLE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.userId === userId) return parsed.role as AppRole;
    }
  } catch {}
  return null;
}

function setCachedRole(userId: string, role: AppRole) {
  try {
    sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, role }));
  } catch {}
}

function isProfileChecked(userId: string): boolean {
  try {
    return sessionStorage.getItem(PROFILE_CHECKED_KEY) === userId;
  } catch {}
  return false;
}

function setProfileChecked(userId: string) {
  try {
    sessionStorage.setItem(PROFILE_CHECKED_KEY, userId);
  } catch {}
}

function clearAuthCache() {
  try {
    sessionStorage.removeItem(ROLE_CACHE_KEY);
    sessionStorage.removeItem(PROFILE_CHECKED_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, _setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const initDone = useRef(false);
  const roleRef = useRef<AppRole | null>(null);

  const setRole = (r: AppRole | null) => {
    roleRef.current = r;
    _setRole(r);
  };

  // Fetch user role from database
  const fetchUserRole = async (userId: string, useCache = false) => {
    // Try cache first
    if (useCache) {
      const cached = getCachedRole(userId);
      if (cached) {
        setRole(cached);
        setRoleLoading(false);
        // Background re-verify
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single()
          .then(({ data }) => {
            if (data?.role && data.role !== cached) {
              setRole(data.role as AppRole);
              setCachedRole(userId, data.role as AppRole);
            }
          });
        return;
      }
    }

    try {
      setRoleLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        setRole('user');
        setCachedRole(userId, 'user');
      } else {
        const r = (data?.role as AppRole) || 'user';
        setRole(r);
        setCachedRole(userId, r);
      }
    } catch {
      setRole('user');
    } finally {
      setRoleLoading(false);
    }
  };

  // Ensure profile exists for user
  const ensureProfile = async (userId: string, email: string, fullName?: string) => {
    // Skip if already checked this session
    if (isProfileChecked(userId)) return;
    
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!existing) {
        await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email,
            full_name: fullName || email.split('@')[0],
          });
      }
      setProfileChecked(userId);
    } catch (error) {
      console.log('Profile check:', error);
    }
  };

  // Log login activity - only called from actual signIn/signInWithGoogle
  const logLoginActivity = async (userId: string, email: string, status: 'success' | 'failed', failureReason?: string) => {
    const deviceInfo = getDeviceInfo();
    try {
      await supabase
        .from('login_activity')
        .insert({
          user_id: status === 'success' ? userId : null,
          email: email,
          status: status,
          failure_reason: failureReason,
          user_agent: navigator.userAgent,
          device_info: deviceInfo,
        });
    } catch (error) {
      console.error('Error logging login activity:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        if (currentSession?.user) {
          const userId = currentSession.user.id;
          
          // Skip redundant DB calls if role is already loaded (TOKEN_REFRESHED or duplicate SIGNED_IN)
          if (roleRef.current !== null && (event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && initDone.current))) {
            return;
          }
          
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            // INITIAL_SESSION or SIGNED_IN — use cache for fast render
            const useCache = event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED';
            fetchUserRole(userId, useCache);
            ensureProfile(userId, currentSession.user.email || '', currentSession.user.user_metadata?.full_name);
          }, 0);
        } else {
          setRole(null);
          setRoleLoading(false);
          if (event === 'SIGNED_OUT') {
            clearAuthCache();
          }
        }
        
        initDone.current = true;
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAccountLockout = async (email: string): Promise<LockoutInfo> => {
    try {
      const { data, error } = await supabase
        .from('account_lockouts')
        .select('*')
        .eq('email', email)
        .eq('is_unlocked', false)
        .gte('unlock_at', new Date().toISOString())
        .single();
      
      if (error || !data) {
        return { locked: false };
      }
      
      return { 
        locked: true, 
        locked_until: data.unlock_at,
        message: `Account locked after ${data.failed_attempts} failed attempts`
      };
    } catch {
      return { locked: false };
    }
  };

  const sendLockoutAlert = async (email: string, failedAttempts: number, lockedUntil: string, deviceInfo: any) => {
    try {
      await supabase.functions.invoke('send-lockout-alert', {
        body: { email, failedAttempts, lockedUntil, deviceInfo },
      });
    } catch (error) {
      console.error('Failed to send lockout alert:', error);
    }
  };

  const recordFailedLogin = async (email: string, reason: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      await supabase
        .from('failed_login_attempts')
        .insert({ email, reason, user_agent: navigator.userAgent });
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('failed_login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', oneHourAgo);
      
      const failedAttempts = count || 0;
      const maxAttempts = 5;
      
      if (failedAttempts >= maxAttempts) {
        const lockoutDuration = 30 * 60 * 1000;
        const unlockAt = new Date(Date.now() + lockoutDuration).toISOString();
        
        await supabase
          .from('account_lockouts')
          .insert({ email, reason: 'Too many failed login attempts', unlock_at: unlockAt });
        
        sendLockoutAlert(email, failedAttempts, unlockAt, deviceInfo);
        
        return { locked: true, locked_until: unlockAt, failed_attempts: failedAttempts };
      }
      
      return { locked: false, remaining_attempts: maxAttempts - failedAttempts };
    } catch {
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    const lockoutStatus = await checkAccountLockout(email);
    
    if (lockoutStatus.locked) {
      logLoginActivity('', email, 'failed', 'Account locked');
      return { 
        error: new Error(`Account is locked until ${new Date(lockoutStatus.locked_until!).toLocaleString()}. Too many failed login attempts.`),
        lockout: lockoutStatus 
      };
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      logLoginActivity('', email, 'failed', error.message);
      
      const lockoutResult = await recordFailedLogin(email, error.message);
      
      if (lockoutResult?.locked) {
        return { 
          error: new Error(`Account is now locked for 30 minutes due to too many failed attempts. A notification email has been sent.`),
          lockout: lockoutResult 
        };
      }
      
      if (lockoutResult?.remaining_attempts !== undefined) {
        const remainingMsg = lockoutResult.remaining_attempts > 0 
          ? ` (${lockoutResult.remaining_attempts} attempts remaining before lockout)`
          : '';
        return { error: new Error(error.message + remainingMsg), lockout: lockoutResult };
      }
    } else if (data?.user) {
      // Log successful login only on actual sign-in action
      logLoginActivity(data.user.id, email, 'success');
    }
    
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    clearAuthCache();
    await supabase.auth.signOut();
    setRole(null);
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=update-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isSupport = role === 'support';
  const isCustomer = role === 'user';
  const isStaff = isAdmin || isManager || isSupport;

  return (
    <AuthContext.Provider
      value={{
        user, session, loading, role, roleLoading,
        signIn, signUp, signInWithGoogle, signOut,
        resetPassword, updatePassword, checkAccountLockout,
        isAdmin, isManager, isSupport, isCustomer, isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
