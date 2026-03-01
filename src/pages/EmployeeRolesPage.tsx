import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Briefcase, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface EmployeeRole {
  id: string;
  name: string;
  created_at: string;
}

const EmployeeRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRoles = async () => {
    const { data } = await supabase.from('employee_roles').select('*').order('name');
    if (data) setRoles(data);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const { error } = await supabase.from('employee_roles').insert({ name: newName.trim() });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    setNewName('');
    setDialogOpen(false);
    fetchRoles();
    toast({ title: 'Rôle ajouté' });
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from('employee_roles').update({ name: editName.trim() }).eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    setEditId(null);
    fetchRoles();
    toast({ title: 'Rôle modifié' });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('employee_roles').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: 'Ce rôle est peut-être utilisé par un employé.', variant: 'destructive' });
      return;
    }
    fetchRoles();
    toast({ title: 'Rôle supprimé' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="h-5 w-5" /> Rôles Employés
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau rôle</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du rôle</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Serveur" />
              </div>
              <Button type="submit" className="w-full">Créer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Aucun rôle</TableCell></TableRow>
              )}
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    {editId === role.id ? (
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8" />
                    ) : (
                      <span className="font-medium">{role.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editId === role.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => handleUpdate(role.id)}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => { setEditId(role.id); setEditName(role.name); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(role.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
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

export default EmployeeRolesPage;
