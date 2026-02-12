import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { XCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const CancelSalesPage: React.FC = () => {
  const [sales, setSales] = useState<Tables<'sales'>[]>([]);

  const fetchSales = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('sales')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: false });
    if (data) setSales(data);
  };

  useEffect(() => { fetchSales(); }, []);

  const handleCancel = async (saleId: string) => {
    const { error } = await supabase
      .from('sales')
      .update({ status: 'cancelled' })
      .eq('id', saleId);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'annuler.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Vente annulée' });
    fetchSales();
  };

  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <XCircle className="h-5 w-5" /> Annuler des Ventes
      </h2>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune vente</TableCell></TableRow>
              )}
              {sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(sale.total_ttc)}</TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'destructive'}>
                      {sale.status === 'completed' ? 'Complétée' : 'Annulée'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.status === 'completed' && (
                      <Button variant="destructive" size="sm" onClick={() => handleCancel(sale.id)}>
                        Annuler
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelSalesPage;
