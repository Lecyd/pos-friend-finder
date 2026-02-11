import React, { useMemo } from 'react';
import { StockEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ValidateStockPage: React.FC = () => {
  const { user } = useAuth();
  const entries: StockEntry[] = useMemo(() => {
    return JSON.parse(localStorage.getItem('gv_stock_entries') || '[]');
  }, []);

  const handleValidate = (entryId: string) => {
    const all: StockEntry[] = JSON.parse(localStorage.getItem('gv_stock_entries') || '[]');
    const updated = all.map(e => e.id === entryId ? { ...e, status: 'validated' as const, validatedBy: user?.name } : e);
    localStorage.setItem('gv_stock_entries', JSON.stringify(updated));
    toast({ title: 'Stock validé' });
    window.location.reload();
  };

  const handleReject = (entryId: string) => {
    const all: StockEntry[] = JSON.parse(localStorage.getItem('gv_stock_entries') || '[]');
    const updated = all.map(e => e.id === entryId ? { ...e, status: 'rejected' as const } : e);
    localStorage.setItem('gv_stock_entries', JSON.stringify(updated));
    toast({ title: 'Stock rejeté' });
    window.location.reload();
  };

  const statusVariant = (status: string) => {
    if (status === 'validated') return 'default' as const;
    if (status === 'rejected') return 'destructive' as const;
    return 'secondary' as const;
  };

  const statusLabel = (status: string) => {
    if (status === 'validated') return 'Validé';
    if (status === 'rejected') return 'Rejeté';
    return 'En attente';
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CheckSquare className="h-5 w-5" /> Validation des Stocks
      </h2>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune entrée de stock</TableCell></TableRow>
              )}
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.productName}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>{entry.supplier}</TableCell>
                  <TableCell>{new Date(entry.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell><Badge variant={statusVariant(entry.status)}>{statusLabel(entry.status)}</Badge></TableCell>
                  <TableCell>
                    {entry.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleValidate(entry.id)}>Valider</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(entry.id)}>Rejeter</Button>
                      </div>
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

export default ValidateStockPage;
