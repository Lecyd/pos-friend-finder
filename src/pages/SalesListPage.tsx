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
import { businessDayRange, businessDayKey, currentBusinessDate } from '@/lib/business-day';

type SaleWithCredit = Tables<'sales'> & { credit_amount?: number };

interface DaySummary {
  date: string;
  totalTTC: number;
  totalEncaisse: number;
  totalAvoir: number;
  sales: SaleWithCredit[];
}

const SalesListPage: React.FC = () => {
  const [sales, setSales] = useState<SaleWithCredit[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<DaySummary[]>([]);
  const [detailSale, setDetailSale] = useState<SaleWithCredit | null>(null);
  const [saleLines, setSaleLines] = useState<Tables<'sale_lines'>[]>([]);
  const [weekDetailDay, setWeekDetailDay] = useState<DaySummary | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      const { start, end } = businessDayRange();
      const weekStart = businessDayRange(new Date(currentBusinessDate().getTime() - 6 * 86400000)).start;

      const [dayRes, weekRes] = await Promise.all([
        supabase.from('sales').select('*').gte('date', start.toISOString()).lt('date', end.toISOString()).order('date', { ascending: false }),
        supabase.from('sales').select('*').gte('date', weekStart.toISOString()).order('date', { ascending: false }),
      ]);

      // Collect all credit_note_ids to fetch amounts
      const allSales = [...(dayRes.data || []), ...(weekRes.data || [])];
      const creditNoteIds = [...new Set(allSales.filter(s => s.credit_note_id).map(s => s.credit_note_id!))];

      let creditAmounts: Record<string, number> = {};
      if (creditNoteIds.length > 0) {
        const { data: cnData } = await supabase.from('credit_notes').select('id, amount').in('id', creditNoteIds);
        if (cnData) {
          cnData.forEach(cn => { creditAmounts[cn.id] = cn.amount; });
        }
      }

      const enrichSale = (s: Tables<'sales'>): SaleWithCredit => ({
        ...s,
        credit_amount: s.credit_note_id ? (creditAmounts[s.credit_note_id] || 0) : 0,
      });

      if (dayRes.data) setSales(dayRes.data.map(enrichSale));

      // Build weekly summaries grouped by day
      if (weekRes.data) {
        const enrichedWeek = weekRes.data.map(enrichSale);
        const grouped: Record<string, SaleWithCredit[]> = {};
        enrichedWeek.forEach(s => {
          const day = businessDayKey(s.date);
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push(s);
        });

        const summaries: DaySummary[] = Object.entries(grouped)
          .map(([date, daySales]) => ({
            date,
            totalTTC: daySales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total_ttc, 0),
            totalEncaisse: daySales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount_received, 0),
            totalAvoir: daySales.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.credit_amount || 0), 0),
            sales: daySales,
          }))
          .sort((a, b) => b.date.localeCompare(a.date));

        setWeeklySummaries(summaries);
      }
    };

    fetchSales();
  }, []);

  const formatCurrency = (amount: number) => `${amount.toFixed(0)} FCFA`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

  const openDetail = async (sale: SaleWithCredit) => {
    setDetailSale(sale);
    const { data } = await supabase.from('sale_lines').select('*').eq('sale_id', sale.id);
    if (data) setSaleLines(data);
  };

  const completedDaySales = sales.filter(s => s.status === 'completed');

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

        {/* === DAILY TAB === */}
        <TabsContent value="day">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
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
                  {sales.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucune vente</TableCell></TableRow>
                  )}
                  {sales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell>{sale.client_id || '—'}</TableCell>
                      <TableCell>
                        {sale.credit_amount && sale.credit_amount > 0
                          ? <span className="text-accent-foreground">{formatCurrency(sale.credit_amount)}</span>
                          : <span className="text-muted-foreground">Avoir = 0</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.amount_received)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(sale.total_ttc)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'completed' ? 'default' : sale.status === 'deferred' ? 'secondary' : 'destructive'}>
                          {sale.status === 'completed' ? 'Complétée' : sale.status === 'deferred' ? 'En attente' : 'Annulée'}
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
          {completedDaySales.length > 0 && (
            <div className="mt-4 text-right">
              <p className="text-lg font-bold">
                Total du jour : <span className="text-primary">{formatCurrency(completedDaySales.reduce((sum, s) => sum + s.total_ttc, 0))}</span>
              </p>
            </div>
          )}
        </TabsContent>

        {/* === WEEKLY TAB === */}
        <TabsContent value="week">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                    <TableHead className="text-right">Encaissé</TableHead>
                    <TableHead className="text-right">Total Avoir</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklySummaries.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune vente</TableCell></TableRow>
                  )}
                  {weeklySummaries.map(summary => (
                    <TableRow key={summary.date}>
                      <TableCell className="font-medium">{formatDate(summary.date)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(summary.totalTTC)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.totalEncaisse)}</TableCell>
                      <TableCell className="text-right">
                        {summary.totalAvoir > 0
                          ? <span className="text-accent-foreground">{formatCurrency(summary.totalAvoir)}</span>
                          : <span className="text-muted-foreground">0</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setWeekDetailDay(summary)}>
                          <Eye className="h-4 w-4 mr-1" /> Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {weeklySummaries.length > 0 && (
            <div className="mt-4 text-right">
              <p className="text-lg font-bold">
                Total de la semaine : <span className="text-primary">{formatCurrency(weeklySummaries.reduce((sum, s) => sum + s.totalTTC, 0))}</span>
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sale detail dialog */}
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
              <div className="flex justify-between">
                <span>Avoir</span>
                <span>{detailSale.credit_amount && detailSale.credit_amount > 0 ? formatCurrency(detailSale.credit_amount) : '0 FCFA'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Weekly day drill-down dialog */}
      <Dialog open={!!weekDetailDay} onOpenChange={() => setWeekDetailDay(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ventes du {weekDetailDay ? formatDate(weekDetailDay.date) : ''}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>N° Facture</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Avoir</TableHead>
                <TableHead className="text-right">Encaissé</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekDetailDay?.sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>{sale.client_id || '—'}</TableCell>
                  <TableCell>
                    {sale.credit_amount && sale.credit_amount > 0
                      ? <span className="text-accent-foreground">{formatCurrency(sale.credit_amount)}</span>
                      : <span className="text-muted-foreground">0</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.amount_received)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(sale.total_ttc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesListPage;
