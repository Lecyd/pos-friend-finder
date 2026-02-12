import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Tables<'products'>[]>([]);
  const [categories, setCategories] = useState<Tables<'categories'>[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<'products'> | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceHT, setPriceHT] = useState('');
  const [tvaRate, setTvaRate] = useState('20');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');

  const fetchData = async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || '—';
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  const openAdd = () => {
    setEditing(null);
    setName(''); setCategoryId(''); setPriceHT(''); setTvaRate('20'); setStock('0'); setImageUrl('');
    setOpen(true);
  };

  const openEdit = (p: Tables<'products'>) => {
    setEditing(p);
    setName(p.name); setCategoryId(p.category_id || ''); setPriceHT(String(p.price_ht)); setTvaRate(String(p.tva_rate)); setStock(String(p.stock)); setImageUrl(p.image_url || '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId || !priceHT) {
      toast({ title: 'Erreur', description: 'Remplissez tous les champs requis.', variant: 'destructive' });
      return;
    }
    const payload = {
      name,
      category_id: categoryId,
      price_ht: parseFloat(priceHT),
      tva_rate: parseFloat(tvaRate),
      stock: parseInt(stock),
      image_url: imageUrl || null,
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
      toast({ title: 'Produit modifié' });
    } else {
      await supabase.from('products').insert(payload);
      toast({ title: 'Produit ajouté' });
    }
    setOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Produit supprimé' });
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><UtensilsCrossed className="h-5 w-5" /> Gestion des Produits</h2>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prix HT</TableHead>
                <TableHead className="text-right">TVA</TableHead>
                <TableHead className="text-right">Prix TTC</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{getCategoryName(p.category_id)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.price_ht)}</TableCell>
                  <TableCell className="text-right">{p.tva_rate}%</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(p.price_ht * (1 + p.tva_rate / 100))}</TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Ajouter'} un produit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Prix HT</Label><Input type="number" value={priceHT} onChange={e => setPriceHT(e.target.value)} /></div>
              <div className="space-y-2"><Label>TVA %</Label><Input type="number" value={tvaRate} onChange={e => setTvaRate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Stock</Label><Input type="number" value={stock} onChange={e => setStock(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>URL Image</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Ajouter'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
