import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginSignupViewProps {
  storeName: string;
  storeLogo: string | undefined;
  storeInitial: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, fullName: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onForgotPassword: () => void;
}

export function LoginSignupView({
  storeName, storeLogo, storeInitial, loading,
  onLogin, onSignup, onGoogleSignIn, onForgotPassword,
}: LoginSignupViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); await onLogin(loginData.email, loginData.password); };
  const handleSignup = async (e: React.FormEvent) => { e.preventDefault(); await onSignup(signupData.email, signupData.password, signupData.fullName); };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Button variant="ghost" className="mb-6" asChild>
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back To Home</Link>
      </Button>
      <Card>
        <CardHeader className="space-y-1 text-center">
          {(storeLogo || storeName) && (
            <div className="flex items-center justify-center mb-4">
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="w-16 h-16 rounded-full object-contain" />
              ) : storeName ? (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-store-primary to-store-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{storeInitial}</span>
                </div>
              ) : null}
            </div>
          )}
          <CardTitle className="text-2xl font-bold">{t('store.welcome')}</CardTitle>
          <CardDescription>Sign In Or Sign Up</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="you@example.com" className="pl-10" value={loginData.email} onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button type="button" onClick={onForgotPassword} className="text-xs text-store-primary hover:underline">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" value={loginData.password} onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))} required />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-store-primary hover:bg-store-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? t('store.signingIn') : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" type="text" placeholder="John Doe" value={signupData.fullName} onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-10" value={signupData.email} onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" value={signupData.password} onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))} required minLength={6} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>
                <Button type="submit" className="w-full bg-store-primary hover:bg-store-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? t('store.creatingAccount') : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('store.or')}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={onGoogleSignIn}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-6">
            {t('store.byContinuing')}{" "}
            <Link to="/terms" className="text-store-primary hover:underline">{t('store.termsOfService')}</Link>
            {" "}{t('store.and')}{" "}
            <Link to="/privacy" className="text-store-primary hover:underline">{t('store.privacyPolicy')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
