import React, { useState, useEffect } from 'react';
import { Users, Plus, Power } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types';
import { mockUsers as defaultUsers } from '@/data/mock-data';

const STORAGE_KEY = 'gv_users';

const getUsers = (): User[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : defaultUsers;
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(getUsers);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('caissiere');
  const roleLabel: Record<string, string> = { caissiere: 'Caissière', manager: 'Manager', admin: 'Administrateur' };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast({ title: 'Rôle mis à jour' });
  };

  const handleToggleActive = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
    const user = users.find(u => u.id === userId);
    toast({ title: user?.active ? 'Utilisateur désactivé' : 'Utilisateur activé' });
  };

  const handleAddUser = () => {
    if (!newName || !newEmail) {
      toast({ title: 'Erreur', description: 'Veuillez remplir le nom et l\'email.', variant: 'destructive' });
      return;
    }
    if (users.some(u => u.email === newEmail)) {
      toast({ title: 'Erreur', description: 'Cet email existe déjà.', variant: 'destructive' });
      return;
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name: newName,
      email: newEmail,
      role: newRole,
      active: true,
    };
    setUsers(prev => [...prev, newUser]);
    setNewName('');
    setNewEmail('');
    setNewRole('caissiere');
    setOpen(false);
    toast({ title: 'Utilisateur ajouté' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" /> Gestion des Utilisateurs
        </h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
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
                    <Select value={u.role} onValueChange={(val: UserRole) => handleRoleChange(u.id, val)}>
                      <SelectTrigger className="w-36 h-8">
                        <SelectValue />
                      </SelectTrigger>
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
                      onClick={() => handleToggleActive(u.id)}
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
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom complet" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={newRole} onValueChange={(val: UserRole) => setNewRole(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caissiere">Caissière</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleAddUser}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
