import React, { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ImageUpload';
import type { Tables } from '@/integrations/supabase/types';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Tables<'categories'>[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<'categories'> | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => {
    setEditing(null);
    setName(''); setDescription(''); setImageUrl('');
    setOpen(true);
  };

  const openEdit = (cat: Tables<'categories'>) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Erreur', description: 'Le nom est requis.', variant: 'destructive' });
      return;
    }
    if (editing) {
      await supabase.from('categories').update({ name, description, image_url: imageUrl || null }).eq('id', editing.id);
      toast({ title: 'Catégorie modifiée' });
    } else {
      await supabase.from('categories').insert({ name, description, image_url: imageUrl || null });
      toast({ title: 'Catégorie ajoutée' });
    }
    setOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast({ title: 'Catégorie supprimée' });
    fetchCategories();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="h-5 w-5" /> Gestion des Catégories</h2>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.image_url ? <img src={c.image_url} alt={c.name} className="h-10 w-10 rounded object-cover" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.description || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Ajouter'} une catégorie</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload currentUrl={imageUrl} onUpload={setImageUrl} folder="categories" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Ajouter'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;
