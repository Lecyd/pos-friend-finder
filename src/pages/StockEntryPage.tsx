import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import type { Tables } from '@/integrations/supabase/types';

const StockEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Tables<'products'>[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !supplier || !invoiceUrl) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs et ajouter une pièce justificative.', variant: 'destructive' });
      return;
    }

    const product = products.find(p => p.id === productId);
    const { error } = await supabase.from('stock_entries').insert({
      product_id: productId,
      product_name: product?.name || '',
      quantity: parseInt(quantity),
      supplier,
      invoice_url: invoiceUrl,
      user_id: user!.id,
    });

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'enregistrer.', variant: 'destructive' });
      return;
    }

    setProductId('');
    setQuantity('');
    setSupplier('');
    setInvoiceUrl('');
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
                  {products.map(p => (
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
            <div className="space-y-2">
              <Label>Pièce justificative *</Label>
              <ImageUpload
                currentUrl={invoiceUrl}
                onUpload={setInvoiceUrl}
                folder="stock-invoices"
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">Enregistrer le stock</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockEntryPage;
