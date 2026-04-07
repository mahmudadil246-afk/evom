import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2, AlertTriangle, Clock, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { TwoFactorSetup } from '@/components/profile/TwoFactorSetup';
import { RecoveryCodes } from '@/components/profile/RecoveryCodes';
import { formatDistanceToNow } from 'date-fns';

interface DeletionRequest {
  id: string;
  status: string;
  reason: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export function SecurityTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [existingRequest, setExistingRequest] = useState<DeletionRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    if (user) fetchDeletionRequest();
  }, [user]);

  const fetchDeletionRequest = async () => {
    if (!user) return;
    setLoadingRequest(true);
    try {
      const { data } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setExistingRequest(data as DeletionRequest | null);
    } catch (error) {
      console.error('Error fetching deletion request:', error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleSubmitDeletionRequest = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('account_deletion_requests').insert({
        user_id: user.id,
        reason: deleteReason || null,
        status: 'pending',
      });
      if (error) throw error;
      toast({
        title: 'Deletion Request Submitted',
        description: 'Your request is now pending admin review.',
      });
      setDeleteConfirmText('');
      setDeleteReason('');
      setShowApprovalMessage(true);
      fetchDeletionRequest();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800"><Clock className="h-3 w-3" />Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasPendingRequest = existingRequest?.status === 'pending';

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Left: 2FA + Delete Account */}
        <div className="space-y-6">
          <TwoFactorSetup />

          {/* Delete Account */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Submit a request to permanently delete your account. Admin approval is required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing request status */}
              {loadingRequest ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />Checking status...
                </div>
              ) : existingRequest ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Request Status</span>
                    {getStatusBadge(existingRequest.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Submitted {formatDistanceToNow(new Date(existingRequest.created_at), { addSuffix: true })}</span>
                    </div>
                    {existingRequest.reason && (
                      <p className="text-sm"><span className="font-medium">Reason:</span> {existingRequest.reason}</p>
                    )}
                    {existingRequest.admin_notes && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm"><span className="font-medium">Admin Response:</span> {existingRequest.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  {existingRequest.status === 'rejected' && (
                    <p className="text-xs text-muted-foreground">Your previous request was rejected. You can submit a new request if needed.</p>
                  )}
                </div>
              ) : null}

              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={hasPendingRequest}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {hasPendingRequest ? 'Request Pending...' : 'Request Account Deletion'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recovery Codes */}
        <div className="space-y-6">
          <RecoveryCodes />
        </div>
      </div>

      {/* Deletion Request Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) { setShowApprovalMessage(false); setDeleteConfirmText(''); setDeleteReason(''); } }}>
        <AlertDialogContent>
          {showApprovalMessage ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-primary">
                  <ShieldAlert className="h-5 w-5" />
                  Admin Approval Required
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-primary">Request Submitted Successfully</p>
                        <p className="text-muted-foreground mt-1">
                          Your account deletion request has been submitted and is now pending admin review. You will be notified once a decision has been made.
                        </p>
                      </div>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Request Account Deletion
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    {/* Warning inside modal */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-destructive">Warning</p>
                        <p className="text-muted-foreground mt-1">
                          Account deletion requires admin approval. Once approved, all your data including orders, addresses,
                          wishlist items, and preferences will be permanently removed.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-medium text-foreground text-sm">Reason (optional)</label>
                      <Textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Tell us why you want to delete your account..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-foreground text-sm">
                        Type <span className="font-mono text-destructive">DELETE</span> to confirm:
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setDeleteConfirmText(''); setDeleteReason(''); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSubmitDeletionRequest}
                  disabled={deleteConfirmText !== 'DELETE' || submitting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>) : 'Submit Deletion Request'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
