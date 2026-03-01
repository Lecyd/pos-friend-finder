import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users2, Plus, Pencil, Trash2 } from 'lucide-react';

interface EmployeeRole { id: string; name: string; }
interface Employee {
  id: string; nom: string; prenoms: string; telephone: string | null;
  photo_url: string | null; salaire: number; role_id: string | null;
  active: boolean; created_at: string;
}

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const [nom, setNom] = useState('');
  const [prenoms, setPrenoms] = useState('');
  const [telephone, setTelephone] = useState('');
  const [salaire, setSalaire] = useState('');
  const [roleId, setRoleId] = useState('');

  const fetchAll = async () => {
    const [{ data: emps }, { data: rls }] = await Promise.all([
      supabase.from('employees').select('*').order('nom'),
      supabase.from('employee_roles').select('*').order('name'),
    ]);
    if (emps) setEmployees(emps);
    if (rls) setRoles(rls);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setNom(''); setPrenoms(''); setTelephone(''); setSalaire(''); setRoleId(''); setEditEmployee(null); };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setNom(emp.nom); setPrenoms(emp.prenoms); setTelephone(emp.telephone || '');
    setSalaire(String(emp.salaire)); setRoleId(emp.role_id || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenoms || !salaire) {
      toast({ title: 'Erreur', description: 'Nom, prénoms et salaire sont obligatoires.', variant: 'destructive' });
      return;
    }
    const payload = {
      nom, prenoms, telephone: telephone || null,
      salaire: parseFloat(salaire), role_id: roleId || null,
    };

    if (editEmployee) {
      const { error } = await supabase.from('employees').update(payload).eq('id', editEmployee.id);
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Employé modifié' });
    } else {
      const { error } = await supabase.from('employees').insert(payload);
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Employé ajouté' });
    }
    resetForm(); setDialogOpen(false); fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    fetchAll(); toast({ title: 'Employé supprimé' });
  };

  const getRoleName = (roleId: string | null) => roles.find(r => r.id === roleId)?.name || '-';
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users2 className="h-5 w-5" /> Employés
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editEmployee ? 'Modifier' : 'Nouvel'} Employé</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nom</Label><Input value={nom} onChange={e => setNom(e.target.value)} /></div>
                <div className="space-y-2"><Label>Prénoms</Label><Input value={prenoms} onChange={e => setPrenoms(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Téléphone</Label><Input value={telephone} onChange={e => setTelephone(e.target.value)} /></div>
                <div className="space-y-2"><Label>Salaire (FCFA)</Label><Input type="number" min="0" value={salaire} onChange={e => setSalaire(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{editEmployee ? 'Modifier' : 'Créer'}</Button>
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
                <TableHead>Prénoms</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Salaire</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun employé</TableCell></TableRow>
              )}
              {employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.nom}</TableCell>
                  <TableCell>{emp.prenoms}</TableCell>
                  <TableCell>{emp.telephone || '-'}</TableCell>
                  <TableCell>{getRoleName(emp.role_id)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(emp.salaire)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(emp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
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

export default EmployeesPage;
