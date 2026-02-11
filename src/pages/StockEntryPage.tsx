import React, { useState } from 'react';
import { mockProducts } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { StockEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

const StockEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !supplier) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }

    const product = mockProducts.find(p => p.id === productId);
    const entry: StockEntry = {
      id: crypto.randomUUID(),
      productId,
      productName: product?.name || '',
      quantity: parseInt(quantity),
      supplier,
      date: new Date().toISOString(),
      status: 'pending',
      userId: user?.id || '',
    };

    const entries = JSON.parse(localStorage.getItem('gv_stock_entries') || '[]');
    entries.push(entry);
    localStorage.setItem('gv_stock_entries', JSON.stringify(entries));

    setProductId('');
    setQuantity('');
    setSupplier('');
    toast({ title: 'Stock enregistré', description: 'En attente de validation par le manager.' });
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" /> Saisie de Stock Fournisseur
      </h2>
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                <SelectContent>
                  {mockProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nom du fournisseur" />
            </div>
            <p className="text-xs text-muted-foreground">
              📎 La pièce jointe (facture fournisseur) sera disponible avec le backend.
            </p>
            <Button type="submit" className="w-full">Enregistrer le stock</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockEntryPage;
