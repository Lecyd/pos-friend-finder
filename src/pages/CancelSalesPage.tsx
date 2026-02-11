import React, { useMemo } from 'react';
import { Sale } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { XCircle } from 'lucide-react';

const CancelSalesPage: React.FC = () => {
  const sales: Sale[] = useMemo(() => {
    return JSON.parse(localStorage.getItem('gv_sales') || '[]');
  }, []);

  const todaySales = sales.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.date).toDateString() === today;
  });

  const handleCancel = (saleId: string) => {
    const all: Sale[] = JSON.parse(localStorage.getItem('gv_sales') || '[]');
    const updated = all.map(s => s.id === saleId ? { ...s, status: 'cancelled' as const } : s);
    localStorage.setItem('gv_sales', JSON.stringify(updated));
    toast({ title: 'Vente annulée' });
    window.location.reload();
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
              {todaySales.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune vente</TableCell></TableRow>
              )}
              {todaySales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(sale.totalTTC)}</TableCell>
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
