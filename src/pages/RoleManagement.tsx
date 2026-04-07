import { useState, useEffect } from 'react';
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/lib/auditLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Shield, ShieldCheck, User, Crown, AlertTriangle } from 'lucide-react';

type AppRole = 'user' | 'admin' | 'manager' | 'support';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string;
}

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  user: { label: 'User', icon: <User className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
  support: { label: 'Support', icon: <ShieldCheck className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  manager: { label: 'Manager', icon: <Shield className="h-4 w-4" />, color: 'bg-blue-500 text-white' },
  admin: { label: 'Admin', icon: <Crown className="h-4 w-4" />, color: 'bg-primary text-primary-foreground' },
};

export default function RoleManagement() {
  const { user } = useAuth();
  
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    setIsAdmin(data?.role === 'admin');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: (userRole?.role as AppRole) || 'user',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to fetch users',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userToUpdate: UserWithRole) => {
    setSelectedUser(userToUpdate);
    setNewRole(userToUpdate.role);
    setIsDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    
    setUpdating(true);
    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', selectedUser.user_id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', selectedUser.user_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.user_id, role: newRole });

        if (error) throw error;
      }

      // Update local state
      setUsers(users.map((u) =>
        u.user_id === selectedUser.user_id ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Role Updated',
        description: `Role updated to ${roleConfig[newRole].label}`,
      });

      logAuditAction({
        action: 'update',
        resource_type: 'user_role',
        resource_id: selectedUser.user_id,
        description: `Role changed to ${roleConfig[newRole].label} for ${selectedUser.full_name || selectedUser.user_id}`,
        old_value: { role: selectedUser.role },
        new_value: { role: newRole },
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  if (!isAdmin) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            You don't have permission to access this page. Only admins can manage roles.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          title="Role Management"
          description="Manage user roles and permissions"
        />

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: "Users", value: users.filter((u) => u.role === 'user').length.toString(), icon: User, color: "primary" },
            { label: "Staff", value: users.filter((u) => u.role === 'support' || u.role === 'manager').length.toString(), icon: ShieldCheck, color: "accent" },
            { label: "Admins", value: users.filter((u) => u.role === 'admin').length.toString(), icon: Crown, color: "warning" },
          ].map((card) => {
            const IconComp = card.icon;
            const bgMap: Record<string,string> = { primary: "bg-primary/10 text-primary", accent: "bg-accent/10 text-accent", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning" };
            const borderMap: Record<string,string> = { primary: "border-l-primary", accent: "border-l-accent", success: "border-l-success", warning: "border-l-warning" };
            const cardBgMap: Record<string,string> = { primary: "bg-primary/5 dark:bg-primary/10", accent: "bg-accent/5 dark:bg-accent/10", success: "bg-success/5 dark:bg-success/10", warning: "bg-warning/5 dark:bg-warning/10" };
            return (
              <div key={card.label} className={`group relative rounded-xl border border-border/50 p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5 border-l-[3px] ${borderMap[card.color]} ${cardBgMap[card.color]} animate-fade-in`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${bgMap[card.color]}`}>
                    <IconComp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground truncate tracking-tight">{card.value}</h3>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Users List
            </CardTitle>
            <CardDescription>Manage roles for all registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={userItem.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(userItem.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {userItem.full_name || 'Unnamed User'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleConfig[userItem.role].color}>
                              {roleConfig[userItem.role].icon}
                              <span className="ml-1">{roleConfig[userItem.role].label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRoleChange(userItem)}
                              disabled={userItem.user_id === user?.id}
                            >
                              Change Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select a new role for <strong>{selectedUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User
                  </div>
                </SelectItem>
                <SelectItem value="support">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Support
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Manager
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRoleChange} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
