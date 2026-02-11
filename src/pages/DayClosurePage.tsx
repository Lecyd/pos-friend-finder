import React, { useMemo } from 'react';
import { Sale } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { CalendarCheck, Printer } from 'lucide-react';

const DayClosurePage: React.FC = () => {
  const { user } = useAuth();

  const todaySales = useMemo(() => {
    const all: Sale[] = JSON.parse(localStorage.getItem('gv_sales') || '[]');
    const today = new Date().toDateString();
    return all.filter(s => new Date(s.date).toDateString() === today && s.status === 'completed');
  }, []);

  const totalGeneral = todaySales.reduce((sum, s) => sum + s.totalTTC, 0);
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  const handleClose = () => {
    const closure = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      sales: todaySales.map(s => ({ invoiceNumber: s.invoiceNumber, totalTTC: s.totalTTC })),
      totalGeneral,
      userId: user?.id || '',
    };
    const closures = JSON.parse(localStorage.getItem('gv_closures') || '[]');
    closures.push(closure);
    localStorage.setItem('gv_closures', JSON.stringify(closures));
    toast({ title: 'Journée clôturée', description: `Total: ${formatCurrency(totalGeneral)}` });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5" /> Clôture de Journée
      </h2>
      <Card className="border-border/50 mb-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaySales.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Aucune vente</TableCell></TableRow>
              )}
              {todaySales.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.invoiceNumber}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(s.totalTTC)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">Total Général : <span className="text-primary">{formatCurrency(totalGeneral)}</span></p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimer
          </Button>
          <Button onClick={handleClose}>Terminer la journée</Button>
        </div>
      </div>
    </div>
  );
};

export default DayClosurePage;
