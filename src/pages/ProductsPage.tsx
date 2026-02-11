import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Product, Category } from '@/types';
import { mockProducts as defaultProducts, mockCategories as defaultCategories } from '@/data/mock-data';

const PROD_KEY = 'gv_products';
const CAT_KEY = 'gv_categories';

const getProducts = (): Product[] => {
  const saved = localStorage.getItem(PROD_KEY);
  return saved ? JSON.parse(saved) : defaultProducts;
};

const getCategories = (): Category[] => {
  const saved = localStorage.getItem(CAT_KEY);
  return saved ? JSON.parse(saved) : defaultCategories;
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(getProducts);
  const categories = getCategories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceHT, setPriceHT] = useState('');
  const [tvaRate, setTvaRate] = useState('20');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    localStorage.setItem(PROD_KEY, JSON.stringify(products));
  }, [products]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '—';
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setEditing(null);
    setName(''); setCategoryId(''); setPriceHT(''); setTvaRate('20'); setStock('0'); setImageUrl('');
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name); setCategoryId(p.categoryId); setPriceHT(String(p.priceHT)); setTvaRate(String(p.tvaRate)); setStock(String(p.stock)); setImageUrl(p.imageUrl || '');
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !categoryId || !priceHT) {
      toast({ title: 'Erreur', description: 'Remplissez tous les champs requis.', variant: 'destructive' });
      return;
    }
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, name, categoryId, priceHT: parseFloat(priceHT), tvaRate: parseFloat(tvaRate), stock: parseInt(stock), imageUrl } : p));
      toast({ title: 'Produit modifié' });
    } else {
      const newProd: Product = { id: crypto.randomUUID(), name, categoryId, priceHT: parseFloat(priceHT), tvaRate: parseFloat(tvaRate), stock: parseInt(stock), active: true, imageUrl };
      setProducts(prev => [...prev, newProd]);
      toast({ title: 'Produit ajouté' });
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Produit supprimé' });
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
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{getCategoryName(p.categoryId)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.priceHT)}</TableCell>
                  <TableCell className="text-right">{p.tvaRate}%</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(p.priceHT * (1 + p.tvaRate / 100))}</TableCell>
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
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {imageUrl && <img src={imageUrl} alt="preview" className="h-20 w-20 rounded object-cover mt-2" />}
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editing ? 'Enregistrer' : 'Ajouter'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
