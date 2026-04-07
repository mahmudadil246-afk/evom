import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginVerificationModal } from '@/components/auth/LoginVerificationModal';
import { useLoginVerification } from '@/hooks/useLoginVerification';
import { useSiteContent } from '@/hooks/useSiteContent';
import { toast } from 'sonner';
import { ForgotPasswordView } from '@/components/auth/ForgotPasswordView';
import { ResetPasswordView } from '@/components/auth/ResetPasswordView';
import { LoginSignupView } from '@/components/auth/LoginSignupView';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword, user, role, roleLoading } = useAuth();
  const { section: headerSection } = useSiteContent("header");
  const headerCont = headerSection("main_content")?.content;

  const storeName = headerCont?.store_name || "";
  const storeLogo = headerCont?.store_logo || null;
  const storeInitial = storeName ? storeName.charAt(0).toUpperCase() : "";

  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { verificationState, resetVerification } = useLoginVerification();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'forgot') setAuthMode('forgot');
    else if (mode === 'update-password') setAuthMode('reset');
    else setAuthMode('login');
  }, [searchParams]);

  useEffect(() => {
    if (user && !roleLoading && role && authMode !== 'reset') {
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'manager') navigate('/manager/dashboard');
      else if (role === 'support') navigate('/support/dashboard');
      else navigate('/myaccount');
    }
  }, [user, role, roleLoading, navigate, authMode]);

  const goBackToLogin = () => {
    setAuthMode('login');
    navigate('/login');
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    else toast.success('Welcome back!');
    setLoading(false);
  };

  const handleSignup = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) toast.error(error.message);
    else toast.success('Account created! Please check your email to verify your account.');
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  const handleForgotPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) { toast.error(error.message); return false; }
    toast.success('Password reset email sent! Check your inbox.');
    return true;
  };

  const handleResetPassword = async (password: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) { toast.error(error.message); return false; }
    toast.success('Password updated successfully!');
    return true;
  };

  if (authMode === 'forgot') {
    return <ForgotPasswordView onSubmit={handleForgotPassword} onBack={goBackToLogin} loading={loading} />;
  }

  if (authMode === 'reset') {
    return <ResetPasswordView onSubmit={handleResetPassword} onBack={goBackToLogin} loading={loading} />;
  }

  return (
    <>
      {verificationState.isBlocked && verificationState.verificationToken && (
        <LoginVerificationModal
          isOpen={verificationState.isBlocked}
          onClose={resetVerification}
          email={verificationState.email}
          onVerified={resetVerification}
          verificationToken={verificationState.verificationToken}
          reason={verificationState.reason}
        />
      )}
      <LoginSignupView
        storeName={storeName}
        storeLogo={storeLogo}
        storeInitial={storeInitial}
        loading={loading}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGoogleSignIn={handleGoogleSignIn}
        onForgotPassword={() => setAuthMode('forgot')}
      />
    </>
  );
}
