import React, { useState, useMemo } from 'react';
import { mockProducts, mockCategories } from '@/data/mock-data';
import { CartItem, Product, Sale, SaleLine, CreditNote } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, CreditCard, XCircle } from 'lucide-react';

const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState<string>('');

  const availableCreditNotes: CreditNote[] = useMemo(() => {
    const all: CreditNote[] = JSON.parse(localStorage.getItem('gv_credit_notes') || '[]');
    return all.filter(cn => !cn.used);
  }, [cart]);

  const selectedCreditNote = availableCreditNotes.find(cn => cn.id === selectedCreditNoteId);
  const creditNoteAmount = selectedCreditNote?.amount || 0;

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = !selectedCategory || p.categoryId === selectedCategory;
      return matchSearch && matchCat && p.active;
    });
  }, [searchTerm, selectedCategory]);

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
    const totalHT = cart.reduce((sum, c) => sum + c.product.priceHT * c.quantity, 0);
    const totalTTC = cart.reduce((sum, c) => {
      const ttc = c.product.priceHT * (1 + c.product.tvaRate / 100);
      return sum + ttc * c.quantity;
    }, 0);
    return { totalHT, totalTTC };
  }, [cart]);

  const amountDue = Math.max(0, cartTotals.totalTTC - creditNoteAmount);

  const amountReturned = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - amountDue);
  }, [amountReceived, amountDue]);

  const validateSale = () => {
    if (cart.length === 0) {
      toast({ title: 'Erreur', description: 'Le panier est vide.', variant: 'destructive' });
      return;
    }
    const received = parseFloat(amountReceived) || 0;
    if (received < amountDue) {
      toast({ title: 'Erreur', description: 'La somme reçue est insuffisante.', variant: 'destructive' });
      return;
    }

    const lines: SaleLine[] = cart.map(c => {
      const priceTTC = c.product.priceHT * (1 + c.product.tvaRate / 100);
      return {
        productId: c.product.id,
        productName: c.product.name,
        quantity: c.quantity,
        priceHT: c.product.priceHT,
        tvaRate: c.product.tvaRate,
        priceTTC,
        totalTTC: priceTTC * c.quantity,
      };
    });

    const sale: Sale = {
      id: crypto.randomUUID(),
      invoiceNumber: `FAC-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      clientId: clientId || undefined,
      lines,
      totalHT: cartTotals.totalHT,
      totalTTC: cartTotals.totalTTC,
      amountReceived: received,
      amountReturned,
      creditNoteId: selectedCreditNoteId || undefined,
      status: 'completed',
      userId: user?.id || '',
    };

    const sales = JSON.parse(localStorage.getItem('gv_sales') || '[]');
    sales.push(sale);
    localStorage.setItem('gv_sales', JSON.stringify(sales));

    if (selectedCreditNoteId) {
      const allNotes: CreditNote[] = JSON.parse(localStorage.getItem('gv_credit_notes') || '[]');
      const updated = allNotes.map(cn =>
        cn.id === selectedCreditNoteId ? { ...cn, used: true, usedInSaleId: sale.id } : cn
      );
      localStorage.setItem('gv_credit_notes', JSON.stringify(updated));
    }

    setLastSale(sale);
    setCart([]);
    setAmountReceived('');
    setClientId('');
    setSelectedCreditNoteId('');
    toast({ title: 'Vente validée !', description: `Facture ${sale.invoiceNumber} créée.` });
  };

  const printReceipt = () => {
    if (!lastSale) return;
    window.print();
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(0)} FCFA`;

  return (
    <div className="flex gap-6 h-[calc(100vh-3rem)]">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col min-w-0">
        <h2 className="text-xl font-bold mb-4">Point de Vente</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={selectedCategory === null ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSelectedCategory(null)}>Tous</Badge>
          {mockCategories.map(cat => (
            <Badge key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Badge>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map(product => {
            const priceTTC = product.priceHT * (1 + product.tvaRate / 100);
            return (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow border-border/50" onClick={() => addToCart(product)}>
                <CardContent className="p-4">
                  {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-20 object-cover rounded mb-2" />}
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatCurrency(priceTTC)}</p>
                  <p className="text-xs text-muted-foreground">HT: {formatCurrency(product.priceHT)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="w-96 flex flex-col no-print border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Panier ({cart.length})
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="destructive" size="sm" onClick={clearCart}>
                <XCircle className="h-4 w-4 mr-1" />
                Vider
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {cart.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Panier vide</p>}
            {cart.map(item => {
              const priceTTC = item.product.priceHT * (1 + item.product.tvaRate / 100);
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

            {availableCreditNotes.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1"><CreditCard className="h-3 w-3" /> Ticket Avoir</label>
                <Select value={selectedCreditNoteId} onValueChange={setSelectedCreditNoteId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Appliquer un avoir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {availableCreditNotes.map(cn => (
                      <SelectItem key={cn.id} value={cn.id}>
                        {formatCurrency(cn.amount)} — {new Date(cn.date).toLocaleDateString('fr-FR')} {cn.clientId ? `(${cn.clientId})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {creditNoteAmount > 0 && (
              <div className="flex justify-between text-sm text-accent-foreground">
                <span>Avoir appliqué</span>
                <span>-{formatCurrency(creditNoteAmount)}</span>
              </div>
            )}

            {creditNoteAmount > 0 && (
              <div className="flex justify-between text-base font-bold">
                <span>Reste à payer</span>
                <span className="text-primary">{formatCurrency(amountDue)}</span>
              </div>
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
                <Printer className="h-4 w-4 mr-2" />
                Imprimer ticket ({lastSale.invoiceNumber})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Print Receipt (hidden) */}
      {lastSale && (
        <div className="print-only fixed inset-0 bg-white p-4 text-black" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <div className="text-center mb-4">
            <p className="font-bold text-lg">Le Bon Goût</p>
            <p>12 Rue de la Paix, 75002 Paris</p>
            <p>Tél: +33 1 42 00 00 00</p>
            <p>────────────────────────</p>
          </div>
          <p>Facture: {lastSale.invoiceNumber}</p>
          <p>Date: {new Date(lastSale.date).toLocaleString('fr-FR')}</p>
          {lastSale.clientId && <p>Client: {lastSale.clientId}</p>}
          <p>────────────────────────</p>
          {lastSale.lines.map((line, i) => (
            <div key={i}>
              <p>{line.productName}</p>
              <p className="flex justify-between">
                <span>{line.quantity} × {formatCurrency(line.priceTTC)}</span>
                <span>{formatCurrency(line.totalTTC)}</span>
              </p>
            </div>
          ))}
          <p>────────────────────────</p>
          <p className="flex justify-between font-bold"><span>TOTAL TTC</span><span>{formatCurrency(lastSale.totalTTC)}</span></p>
          {lastSale.creditNoteId && <p className="flex justify-between"><span>Avoir</span><span>-{formatCurrency(creditNoteAmount)}</span></p>}
          <p className="flex justify-between"><span>Reçu</span><span>{formatCurrency(lastSale.amountReceived)}</span></p>
          <p className="flex justify-between"><span>Rendu</span><span>{formatCurrency(lastSale.amountReturned)}</span></p>
          <p className="text-center mt-4">Merci de votre visite !</p>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
