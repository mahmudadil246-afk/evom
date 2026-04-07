import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { History, Monitor, Smartphone, Tablet, CheckCircle, XCircle, Globe, Shield, Clock, LogOut, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useToast } from '@/hooks/use-toast';

interface LoginActivityItem {
  id: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_info: any;
  location: any;
  status: string;
  failure_reason: string | null;
  created_at: string;
}

export default function SessionsActivityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<LoginActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    activeSessions,
    loading: sessionsLoading,
    revokeSession,
    revokeAllOtherSessions,
    refreshSessions,
  } = useSessionManagement();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    if (user) fetchActivities();
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setActivities(data as LoginActivityItem[]);
    } catch (err) {
      console.error('Error fetching login activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    const result = await revokeSession(sessionId);
    toast(result.success
      ? { title: 'Session Revoked', description: 'The session has been logged out.' }
      : { variant: 'destructive', title: 'Failed', description: result.error }
    );
    setRevokingId(null);
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    const result = await revokeAllOtherSessions();
    toast(result.success
      ? { title: 'All Other Sessions Revoked', description: 'Logged out from all other devices.' }
      : { variant: 'destructive', title: 'Failed', description: result.error }
    );
    setRevokingAll(false);
  };

  const getDeviceType = (activity: LoginActivityItem): string => {
    const deviceInfo = activity.device_info;
    if (deviceInfo?.device) return deviceInfo.device;
    if (activity.user_agent?.includes('Mobile')) return 'Mobile';
    if (activity.user_agent?.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getDeviceIcon = (activity: LoginActivityItem) => {
    const dt = getDeviceType(activity).toLowerCase();
    if (dt.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (dt.includes('tablet')) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const parseUA = (ua: string | null) => {
    if (!ua) return { browser: 'Unknown', os: 'Unknown' };
    let browser = 'Unknown', os = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';
    return { browser, os };
  };

  const parseSessionUA = (ua: string | null) => {
    if (!ua) return { device: 'Desktop', browser: 'Unknown', os: 'Unknown' };
    const l = ua.toLowerCase();
    let device = 'Desktop';
    if (l.includes('mobile')) device = 'Mobile';
    else if (l.includes('tablet') || l.includes('ipad')) device = 'Tablet';
    let browser = 'Unknown';
    if (l.includes('chrome')) browser = 'Chrome';
    else if (l.includes('firefox')) browser = 'Firefox';
    else if (l.includes('safari')) browser = 'Safari';
    else if (l.includes('edge')) browser = 'Edge';
    let os = 'Unknown';
    if (l.includes('windows')) os = 'Windows';
    else if (l.includes('mac')) os = 'macOS';
    else if (l.includes('linux')) os = 'Linux';
    else if (l.includes('android')) os = 'Android';
    else if (l.includes('iphone') || l.includes('ipad')) os = 'iOS';
    return { device, browser, os };
  };

  const getSessionDeviceIcon = (ua: string | null) => {
    const { device } = parseSessionUA(ua);
    if (device === 'Mobile') return <Smartphone className="h-5 w-5" />;
    if (device === 'Tablet') return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const otherSessionsCount = activeSessions.filter(s => !s.is_current).length;

  if (isLoading || sessionsLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-60 mt-2" /></div>
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Active Sessions
                    <Badge variant="secondary" className="text-xs">{activeSessions.length} active</Badge>
                  </CardTitle>
                  <CardDescription>
                    Manage your active sessions across all devices. You can log out from any session.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No Active Sessions</p>
                <p className="text-sm mt-1">No active sessions found on any device</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session) => {
                  const info = parseSessionUA(session.user_agent);
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        session.is_current ? "border-primary/40 bg-primary/5" : "bg-background hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          session.is_current ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {getSessionDeviceIcon(session.user_agent)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{info.browser} on {info.os}</p>
                            {session.is_current && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                <Shield className="h-3 w-3 mr-1" />This Device
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{session.is_current ? 'Active now' : `Last active ${formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}`}</span>
                            <span>• Started {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      {!session.is_current && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" disabled={revokingId === session.id}>
                              {revokingId === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogOut className="h-4 w-4 mr-1" />Log out</>}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Log out this session?</AlertDialogTitle>
                              <AlertDialogDescription>This will immediately log out the session on {info.browser} on {info.os}.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevokeSession(session.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Log out session</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
                {otherSessionsCount > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-destructive hover:text-destructive mt-2" disabled={revokingAll}>
                        {revokingAll
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging out...</>
                          : <><LogOut className="mr-2 h-4 w-4" />Log out all other sessions ({otherSessionsCount})</>}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Log out all other sessions?</AlertDialogTitle>
                        <AlertDialogDescription>This will immediately log out all sessions except the current one.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevokeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Log out all</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Login Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Login Activity</CardTitle>
                <CardDescription>
                  Recent login attempts and activity on your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No Login Activity</p>
                <p className="text-sm mt-1">No login activity recorded yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const { browser, os } = parseUA(activity.user_agent);
                    const successful = activity.status === 'success';
                    const locationStr = typeof activity.location === 'object' && activity.location
                      ? activity.location.city || activity.location.country || '' : '';
                    return (
                      <div key={activity.id} className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        successful ? "bg-background hover:bg-muted/50" : "bg-destructive/5 border-destructive/20"
                      )}>
                        <div className={cn("p-1.5 rounded-full shrink-0", successful ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                          {successful ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{successful ? 'Successful login' : 'Failed login'}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{getDeviceType(activity)}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {getDeviceIcon(activity)}
                            <span>{browser} on {os}</span>
                          </div>
                          {!successful && activity.failure_reason && <p className="text-xs text-destructive mt-1">{activity.failure_reason}</p>}
                          {activity.ip_address && (
                            <p className="text-xs text-muted-foreground mt-1">IP: {activity.ip_address.toString()}{locationStr && ` • ${locationStr}`}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            <span className="mx-1">•</span>
                            {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
