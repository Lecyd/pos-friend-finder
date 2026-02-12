import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { CalendarCheck, Printer } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const DayClosurePage: React.FC = () => {
  const { user } = useAuth();
  const [todaySales, setTodaySales] = useState<Tables<'sales'>[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('sales')
      .select('*')
      .gte('date', today)
      .eq('status', 'completed')
      .order('date', { ascending: true })
      .then(({ data }) => { if (data) setTodaySales(data); });
  }, []);

  const totalGeneral = todaySales.reduce((sum, s) => sum + s.total_ttc, 0);
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  const handleClose = async () => {
    const { error } = await supabase.from('day_closures').insert({
      date: new Date().toISOString().split('T')[0],
      total_general: totalGeneral,
      user_id: user!.id,
    });

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de clôturer.', variant: 'destructive' });
      return;
    }
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
                  <TableCell className="font-medium">{s.invoice_number}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(s.total_ttc)}</TableCell>
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
