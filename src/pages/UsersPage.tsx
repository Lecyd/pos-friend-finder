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
    // Upsert role
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

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    await supabase.from('profiles').update({ active: !currentActive }).eq('id', userId);
    toast({ title: currentActive ? 'Utilisateur désactivé' : 'Utilisateur activé' });
    fetchUsers();
  };

  const handleAddUser = () => {
    if (!newName || !newEmail || !newPassword) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }
    // Note: Creating users requires admin API - for now show info
    toast({ title: 'Info', description: 'La création d\'utilisateurs nécessite une invitation par email. Demandez à l\'utilisateur de s\'inscrire.' });
    setOpen(false);
  };

  const roleLabel: Record<AppRole, string> = { caissiere: 'Caissière', manager: 'Manager', admin: 'Administrateur' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" /> Gestion des Utilisateurs
        </h2>
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
                      {u.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={u.active ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleToggleActive(u.id, u.active)}
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
    </div>
  );
};

export default UsersPage;
