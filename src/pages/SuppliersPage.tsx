import React, { useState, useEffect } from 'react';
import { Truck, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Tables<'suppliers'>[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<'suppliers'> | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const fetchData = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setName(''); setAddress(''); setPhone('');
    setOpen(true);
  };

  const openEdit = (s: Tables<'suppliers'>) => {
    setEditing(s);
    setName(s.name); setAddress(s.address || ''); setPhone(s.phone || '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Erreur', description: 'Le nom du fournisseur est requis.', variant: 'destructive' });
      return;
    }
    const payload = { name: name.trim(), address: address.trim() || null, phone: phone.trim() || null };
    if (editing) {
      const { error } = await supabase.from('suppliers').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Fournisseur modifié' });
    } else {
      const { error } = await supabase.from('suppliers').insert(payload);
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Fournisseur ajouté' });
    }
    setOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Fournisseur supprimé' });
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="h-5 w-5" /> Fournisseurs</h2>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom fournisseur</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucun fournisseur</TableCell></TableRow>
              )}
              {suppliers.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.address || '—'}</TableCell>
                  <TableCell>{s.phone || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Ajouter'} un fournisseur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nom fournisseur</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Adresse</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Ajouter'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;
