import React, { useState, useEffect } from 'react';
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const ExpenseTypesPage: React.FC = () => {
  const [items, setItems] = useState<Tables<'expense_types'>[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<'expense_types'> | null>(null);
  const [label, setLabel] = useState('');

  const fetchData = async () => {
    const { data } = await supabase.from('expense_types').select('*').order('label');
    if (data) setItems(data);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setLabel(''); setOpen(true); };
  const openEdit = (i: Tables<'expense_types'>) => { setEditing(i); setLabel(i.label); setOpen(true); };

  const handleSave = async () => {
    if (!label.trim()) {
      toast({ title: 'Erreur', description: 'Le libellé est requis.', variant: 'destructive' });
      return;
    }
    if (editing) {
      const { error } = await supabase.from('expense_types').update({ label: label.trim() }).eq('id', editing.id);
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Type de dépense modifié' });
    } else {
      const { error } = await supabase.from('expense_types').insert({ label: label.trim() });
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Type de dépense ajouté' });
    }
    setOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('expense_types').delete().eq('id', id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Type de dépense supprimé' });
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><Tags className="h-5 w-5" /> Types de dépense</h2>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé dépense</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Aucun type de dépense</TableCell></TableRow>
              )}
              {items.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.label}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(i.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Ajouter'} un type de dépense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Libellé dépense</Label><Input value={label} onChange={e => setLabel(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Ajouter'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseTypesPage;
