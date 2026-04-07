import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Loader2, UserX, AlertTriangle, Shield } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface DeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AccountDeletionRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['account-deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DeletionRequest[];
    },
  });

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;
    setProcessing(true);
    try {
      if (actionType === 'approve') {
        // Call edge function to permanently delete the user account
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.access_token) {
          throw new Error('No active session. Please sign in again.');
        }
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-account`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionData.session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              request_id: selectedRequest.id,
              admin_notes: adminNotes || null,
            }),
          }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to delete account');
        toast({
          title: 'Account Deleted',
          description: 'The user account and all associated data have been permanently deleted.',
        });
      } else {
        // Reject - just update status
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('account_deletion_requests')
          .update({
            status: 'rejected',
            admin_notes: adminNotes || null,
            reviewed_by: user?.id || null,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedRequest.id);
        if (error) throw error;
        toast({
          title: 'Request Rejected',
          description: 'The account deletion request has been rejected.',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['account-deletion-requests'] });
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Account Deletion Requests"
        description="Review and manage user account deletion requests"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: pendingCount, icon: Clock, border: "border-l-warning", iconBg: "bg-warning/10 text-warning", cardBg: "bg-warning/5 dark:bg-warning/10" },
          { label: "Approved", value: requests.filter(r => r.status === 'approved').length, icon: CheckCircle, border: "border-l-success", iconBg: "bg-success/10 text-success", cardBg: "bg-success/5 dark:bg-success/10" },
          { label: "Rejected", value: requests.filter(r => r.status === 'rejected').length, icon: XCircle, border: "border-l-destructive", iconBg: "bg-destructive/10 text-destructive", cardBg: "bg-destructive/5 dark:bg-destructive/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-border/50 p-4 border-l-[3px] transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5 ${stat.border} ${stat.cardBg}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${stat.iconBg}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Deletion Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No deletion requests yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Reviewed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate">
                        {request.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm">{request.reason || <span className="text-muted-foreground italic">No reason provided</span>}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {request.reviewed_at
                          ? format(new Date(request.reviewed_at), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                              onClick={() => { setSelectedRequest(request); setActionType('approve'); }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => { setSelectedRequest(request); setActionType('reject'); }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {request.admin_notes && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setSelectedRequest(request); setActionType(null); }}
                              >
                                View Notes
                              </Button>
                            )}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setActionType(null); setAdminNotes(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <><AlertTriangle className="h-5 w-5 text-yellow-500" />Approve Account Deletion</>
              ) : (
                <><XCircle className="h-5 w-5 text-red-500" />Reject Deletion Request</>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Are you sure you want to approve this account deletion? This action will mark the account for deletion.'
                : 'Provide a reason for rejecting this request. The user will be able to see your notes.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {selectedRequest.reason && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">User's Reason</p>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes {actionType === 'reject' && <span className="text-muted-foreground">(recommended)</span>}</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Optional notes...' : 'Reason for rejection...'}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedRequest(null); setActionType(null); setAdminNotes(''); }}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : actionType === 'approve' ? (
                <><CheckCircle className="h-4 w-4 mr-2" />Confirm Approval</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" />Confirm Rejection</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Notes Dialog */}
      <Dialog open={!!selectedRequest && !actionType} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>
              {selectedRequest.reason && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">User's Reason</p>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>
              )}
              {selectedRequest.admin_notes && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm">{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
