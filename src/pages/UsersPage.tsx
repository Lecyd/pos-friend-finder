import React, { useState, useEffect } from 'react';
import { Users, Plus, Power } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import type { Tables, Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole extends Tables<'profiles'> {
  role: AppRole;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('caissiere');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    if (profiles) {
      const usersWithRoles: UserWithRole[] = profiles.map(p => {
        const userRole = roles?.find(r => r.user_id === p.id);
        return { ...p, role: userRole?.role || 'caissiere' };
      });
      setUsers(usersWithRoles);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
    }
    toast({ title: 'Rôle mis à jour' });
    fetchUsers();
  };

  const handleToggleActive = async (userId: string, currentActive: boolean, userRole: AppRole) => {
    if (userRole === 'admin' && currentActive) {
      toast({ title: 'Interdit', description: 'Un administrateur ne peut pas être désactivé.', variant: 'destructive' });
      return;
    }
    await supabase.from('profiles').update({ active: !currentActive }).eq('id', userId);
    toast({ title: currentActive ? 'Utilisateur désactivé' : 'Utilisateur activé' });
    fetchUsers();
  };

  const handleAddUser = async () => {
    if (!newName || !newEmail || !newPassword) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('create-user', {
        body: { name: newName, email: newEmail, password: newPassword, role: newRole },
      });
      if (res.error || res.data?.error) {
        toast({ title: 'Erreur', description: res.data?.error || 'Impossible de créer l\'utilisateur.', variant: 'destructive' });
      } else {
        toast({ title: 'Utilisateur créé avec succès' });
        setOpen(false);
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('caissiere');
        fetchUsers();
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const roleLabel: Record<AppRole, string> = { caissiere: 'Caissière', manager: 'Manager', admin: 'Administrateur' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" /> Gestion des Utilisateurs
        </h2>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Ajouter un utilisateur</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(val: AppRole) => handleRoleChange(u.id, val)}>
                      <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caissiere">Caissière</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? 'default' : 'destructive'}>
                      {u.active ? 'Actif' : 'Désactivé'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={u.active ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleToggleActive(u.id, u.active, u.role)}
                      disabled={u.role === 'admin' && u.active}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {u.active ? 'Désactiver' : 'Activer'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nom complet</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Mot de passe</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={newRole} onValueChange={(v: AppRole) => setNewRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="caissiere">Caissière</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddUser} disabled={creating}>{creating ? 'Création...' : 'Créer l\'utilisateur'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
