import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Eye } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const SalesListPage: React.FC = () => {
  const [sales, setSales] = useState<Tables<'sales'>[]>([]);
  const [weeklySales, setWeeklySales] = useState<Tables<'sales'>[]>([]);
  const [detailSale, setDetailSale] = useState<Tables<'sales'> | null>(null);
  const [saleLines, setSaleLines] = useState<Tables<'sale_lines'>[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(new Date(today).getTime() + 86400000).toISOString().split('T')[0];

    // Weekly: last 7 days
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    Promise.all([
      supabase.from('sales').select('*').gte('date', today).lt('date', tomorrow).order('date', { ascending: false }),
      supabase.from('sales').select('*').gte('date', weekAgo).order('date', { ascending: false }),
    ]).then(([dayRes, weekRes]) => {
      if (dayRes.data) setSales(dayRes.data);
      if (weekRes.data) setWeeklySales(weekRes.data);
    });
  }, []);

  const formatCurrency = (amount: number) => `${amount.toFixed(0)} FCFA`;

  const openDetail = async (sale: Tables<'sales'>) => {
    setDetailSale(sale);
    const { data } = await supabase.from('sale_lines').select('*').eq('sale_id', sale.id);
    if (data) setSaleLines(data);
  };

  const renderCreditInfo = (sale: Tables<'sales'>) => {
    if (sale.credit_note_id) {
      const creditAmount = sale.total_ttc - (sale.amount_received - sale.amount_returned);
      return <span className="text-accent-foreground">Avoir: {formatCurrency(Math.max(0, sale.total_ttc - sale.amount_received + sale.amount_returned))}</span>;
    }
    return <span className="text-muted-foreground">Avoir = 0</span>;
  };

  const renderSalesTable = (salesData: Tables<'sales'>[]) => (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Avoir</TableHead>
              <TableHead className="text-right">Encaissé</TableHead>
              <TableHead className="text-right">Total TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesData.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune vente</TableCell></TableRow>
            )}
            {salesData.map(sale => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                <TableCell>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                <TableCell>{sale.client_id || '—'}</TableCell>
                <TableCell>{renderCreditInfo(sale)}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.amount_received)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(sale.total_ttc)}</TableCell>
                <TableCell>
                  <Badge variant={sale.status === 'completed' ? 'default' : 'destructive'}>
                    {sale.status === 'completed' ? 'Complétée' : 'Annulée'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openDetail(sale)}>
                    <Eye className="h-4 w-4 mr-1" /> Détails
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const completedDaySales = sales.filter(s => s.status === 'completed');
  const completedWeeklySales = weeklySales.filter(s => s.status === 'completed');

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <List className="h-5 w-5" /> Consultation Ventes
      </h2>

      <Tabs defaultValue="day">
        <TabsList className="mb-4">
          <TabsTrigger value="day">Ventes du jour</TabsTrigger>
          <TabsTrigger value="week">Ventes de la semaine</TabsTrigger>
        </TabsList>

        <TabsContent value="day">
          {renderSalesTable(sales)}
          {completedDaySales.length > 0 && (
            <div className="mt-4 text-right">
              <p className="text-lg font-bold">
                Total du jour : <span className="text-primary">{formatCurrency(completedDaySales.reduce((sum, s) => sum + s.total_ttc, 0))}</span>
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="week">
          {renderSalesTable(weeklySales)}
          {completedWeeklySales.length > 0 && (
            <div className="mt-4 text-right">
              <p className="text-lg font-bold">
                Total de la semaine : <span className="text-primary">{formatCurrency(completedWeeklySales.reduce((sum, s) => sum + s.total_ttc, 0))}</span>
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailSale} onOpenChange={() => setDetailSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la vente {detailSale?.invoice_number}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Qté</TableHead>
                <TableHead className="text-right">P.U. TTC</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleLines.map(line => (
                <TableRow key={line.id}>
                  <TableCell>{line.product_name}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.price_ttc)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(line.total_ttc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {detailSale && (
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Total TTC</span><span className="font-bold">{formatCurrency(detailSale.total_ttc)}</span></div>
              <div className="flex justify-between"><span>Encaissé</span><span>{formatCurrency(detailSale.amount_received)}</span></div>
              <div className="flex justify-between"><span>Rendu</span><span>{formatCurrency(detailSale.amount_returned)}</span></div>
              <div className="flex justify-between"><span>Avoir</span><span>{detailSale.credit_note_id ? 'Oui' : 'Non (0)'}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesListPage;
