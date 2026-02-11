import React, { useState, useMemo } from 'react';
import { Sale } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { List } from 'lucide-react';

const SalesListPage: React.FC = () => {
  const sales: Sale[] = useMemo(() => {
    const all: Sale[] = JSON.parse(localStorage.getItem('gv_sales') || '[]');
    const today = new Date().toDateString();
    return all.filter(s => new Date(s.date).toDateString() === today);
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
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucune vente aujourd'hui
                  </TableCell>
                </TableRow>
              )}
              {sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>{sale.clientId || '—'}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(sale.totalTTC)}</TableCell>
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
            Total du jour : <span className="text-primary">{formatCurrency(sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalTTC, 0))}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SalesListPage;
