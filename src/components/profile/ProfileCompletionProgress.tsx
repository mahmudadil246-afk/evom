import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileCompletionProgress() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      setAvatarUrl(data?.avatar_url || null);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  if (loading) return null;

  const items = [
    { label: 'Avatar', done: !!avatarUrl },
    { label: 'Full Name', done: !!user?.user_metadata?.full_name },
    { label: 'Two-Factor', done: false }, // Could be enhanced later
    { label: 'Password', done: true },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percentage = Math.round((doneCount / items.length) * 100);

  if (percentage === 100) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground">Profile Completion</p>
        <span className="text-xs font-bold text-primary">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-1.5 mb-2" />
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.done ? (
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={cn("text-xs", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
