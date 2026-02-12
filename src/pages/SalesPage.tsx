import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, CreditCard, XCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;
type CreditNote = Tables<'credit_notes'>;

interface CartItem {
  product: Product;
  quantity: number;
}

const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [siteSettings, setSiteSettings] = useState<Tables<'site_settings'> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes, cnRes, settingsRes] = await Promise.all([
        supabase.from('products').select('*').eq('active', true),
        supabase.from('categories').select('*'),
        supabase.from('credit_notes').select('*').eq('used', false),
        supabase.from('site_settings').select('*').limit(1).single(),
      ]);
      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (cnRes.data) setCreditNotes(cnRes.data);
      if (settingsRes.data) setSiteSettings(settingsRes.data);
    };
    fetchData();
  }, []);

  const selectedCreditNote = creditNotes.find(cn => cn.id === selectedCreditNoteId);
  const creditNoteAmount = selectedCreditNote?.amount || 0;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = !selectedCategory || p.category_id === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.product.id === productId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountReceived('');
    setClientId('');
    setSelectedCreditNoteId('');
    toast({ title: 'Panier vidé' });
  };

  const cartTotals = useMemo(() => {
    const totalHT = cart.reduce((sum, c) => sum + c.product.price_ht * c.quantity, 0);
    const totalTTC = cart.reduce((sum, c) => {
      const ttc = c.product.price_ht * (1 + c.product.tva_rate / 100);
      return sum + ttc * c.quantity;
    }, 0);
    return { totalHT, totalTTC };
  }, [cart]);

  const amountDue = Math.max(0, cartTotals.totalTTC - creditNoteAmount);

  const amountReturned = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - amountDue);
  }, [amountReceived, amountDue]);

  const validateSale = async () => {
    if (cart.length === 0) {
      toast({ title: 'Erreur', description: 'Le panier est vide.', variant: 'destructive' });
      return;
    }
    const received = parseFloat(amountReceived) || 0;
    if (received < amountDue) {
      toast({ title: 'Erreur', description: 'La somme reçue est insuffisante.', variant: 'destructive' });
      return;
    }

    const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}`;

    // Insert sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        invoice_number: invoiceNumber,
        client_id: clientId || null,
        total_ht: cartTotals.totalHT,
        total_ttc: cartTotals.totalTTC,
        amount_received: received,
        amount_returned: amountReturned,
        credit_note_id: selectedCreditNoteId || null,
        user_id: user!.id,
      })
      .select()
      .single();

    if (saleError || !sale) {
      toast({ title: 'Erreur', description: 'Impossible de créer la vente.', variant: 'destructive' });
      return;
    }

    // Insert sale lines
    const lines = cart.map(c => {
      const priceTTC = c.product.price_ht * (1 + c.product.tva_rate / 100);
      return {
        sale_id: sale.id,
        product_id: c.product.id,
        product_name: c.product.name,
        quantity: c.quantity,
        price_ht: c.product.price_ht,
        tva_rate: c.product.tva_rate,
        price_ttc: priceTTC,
        total_ttc: priceTTC * c.quantity,
      };
    });

    await supabase.from('sale_lines').insert(lines);

    // Mark credit note as used
    if (selectedCreditNoteId) {
      await supabase
        .from('credit_notes')
        .update({ used: true, used_in_sale_id: sale.id })
        .eq('id', selectedCreditNoteId);
      setCreditNotes(prev => prev.filter(cn => cn.id !== selectedCreditNoteId));
    }

    setLastSale({ ...sale, lines });
    setCart([]);
    setAmountReceived('');
    setClientId('');
    setSelectedCreditNoteId('');
    toast({ title: 'Vente validée !', description: `Facture ${invoiceNumber} créée.` });
  };

  const printReceipt = () => {
    if (!lastSale) return;
    window.print();
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(0)} FCFA`;

  return (
    <div className="flex gap-6 h-[calc(100vh-3rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        <h2 className="text-xl font-bold mb-4">Point de Vente</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={selectedCategory === null ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSelectedCategory(null)}>Tous</Badge>
          {categories.map(cat => (
            <Badge key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Badge>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map(product => {
            const priceTTC = product.price_ht * (1 + product.tva_rate / 100);
            return (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow border-border/50" onClick={() => addToCart(product)}>
                <CardContent className="p-4">
                  {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-20 object-cover rounded mb-2" />}
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatCurrency(priceTTC)}</p>
                  <p className="text-xs text-muted-foreground">HT: {formatCurrency(product.price_ht)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="w-96 flex flex-col no-print border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" /> Panier ({cart.length})
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="destructive" size="sm" onClick={clearCart}>
                <XCircle className="h-4 w-4 mr-1" /> Vider
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {cart.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Panier vide</p>}
            {cart.map(item => {
              const priceTTC = item.product.price_ht * (1 + item.product.tva_rate / 100);
              return (
                <div key={item.product.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(priceTTC)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  <p className="text-sm font-bold w-20 text-right">{formatCurrency(priceTTC * item.quantity)}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total HT</span>
              <span className="font-medium">{formatCurrency(cartTotals.totalHT)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total TTC</span>
              <span className="text-primary">{formatCurrency(cartTotals.totalTTC)}</span>
            </div>

            {creditNotes.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1"><CreditCard className="h-3 w-3" /> Ticket Avoir</label>
                <Select value={selectedCreditNoteId} onValueChange={setSelectedCreditNoteId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Appliquer un avoir..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {creditNotes.map(cn => (
                      <SelectItem key={cn.id} value={cn.id}>
                        {formatCurrency(cn.amount)} — {new Date(cn.date).toLocaleDateString('fr-FR')} {cn.client_id ? `(${cn.client_id})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {creditNoteAmount > 0 && (
              <>
                <div className="flex justify-between text-sm text-accent-foreground">
                  <span>Avoir appliqué</span>
                  <span>-{formatCurrency(creditNoteAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Reste à payer</span>
                  <span className="text-primary">{formatCurrency(amountDue)}</span>
                </div>
              </>
            )}

            <Input placeholder="ID Client (optionnel)" value={clientId} onChange={e => setClientId(e.target.value)} />
            <Input type="number" placeholder="Somme reçue" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />

            {parseFloat(amountReceived) > 0 && (
              <div className="flex justify-between text-sm font-medium">
                <span>Monnaie à rendre</span>
                <span className="text-success">{formatCurrency(amountReturned)}</span>
              </div>
            )}

            <Button className="w-full" onClick={validateSale}>Valider la vente</Button>

            {lastSale && (
              <Button variant="outline" className="w-full" onClick={printReceipt}>
                <Printer className="h-4 w-4 mr-2" /> Imprimer ticket ({lastSale.invoice_number})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {lastSale && siteSettings && (
        <div className="print-only fixed inset-0 bg-white p-4 text-black" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <div className="text-center mb-4">
            <p className="font-bold text-lg">{siteSettings.restaurant_name}</p>
            <p>{siteSettings.address}</p>
            <p>Tél: {siteSettings.phone}</p>
            <p>────────────────────────</p>
          </div>
          <p>Facture: {lastSale.invoice_number}</p>
          <p>Date: {new Date(lastSale.date).toLocaleString('fr-FR')}</p>
          {lastSale.client_id && <p>Client: {lastSale.client_id}</p>}
          <p>────────────────────────</p>
          {lastSale.lines?.map((line: any, i: number) => (
            <div key={i}>
              <p>{line.product_name}</p>
              <p className="flex justify-between">
                <span>{line.quantity} × {formatCurrency(line.price_ttc)}</span>
                <span>{formatCurrency(line.total_ttc)}</span>
              </p>
            </div>
          ))}
          <p>────────────────────────</p>
          <p className="flex justify-between font-bold"><span>TOTAL TTC</span><span>{formatCurrency(lastSale.total_ttc)}</span></p>
          <p className="flex justify-between"><span>Reçu</span><span>{formatCurrency(lastSale.amount_received)}</span></p>
          <p className="flex justify-between"><span>Rendu</span><span>{formatCurrency(lastSale.amount_returned)}</span></p>
          <p className="text-center mt-4">Merci de votre visite !</p>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
