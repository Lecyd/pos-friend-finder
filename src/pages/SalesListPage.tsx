import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { List } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const SalesListPage: React.FC = () => {
  const [sales, setSales] = useState<Tables<'sales'>[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('sales')
      .select('*')
      .gte('date', today)
      .lt('date', new Date(new Date(today).getTime() + 86400000).toISOString().split('T')[0])
      .order('date', { ascending: false })
      .then(({ data }) => { if (data) setSales(data); });
  }, []);

  const formatCurrency = (amount: number) => `${amount.toFixed(0)} FCFA`;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <List className="h-5 w-5" /> Ventes du jour
      </h2>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune vente aujourd'hui</TableCell></TableRow>
              )}
              {sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>{sale.client_id || '—'}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(sale.total_ttc)}</TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'destructive'}>
                      {sale.status === 'completed' ? 'Complétée' : 'Annulée'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {sales.length > 0 && (
        <div className="mt-4 text-right">
          <p className="text-lg font-bold">
            Total du jour : <span className="text-primary">{formatCurrency(sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total_ttc, 0))}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SalesListPage;
