import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { CalendarCheck, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Tables } from '@/integrations/supabase/types';

const DayClosurePage: React.FC = () => {
  const { user } = useAuth();
  const [todaySales, setTodaySales] = useState<Tables<'sales'>[]>([]);
  const [siteSettings, setSiteSettings] = useState<Tables<'site_settings'> | null>(null);

  const fetchData = async () => {
    const { start, end } = businessDayRange();
    const [salesRes, settingsRes] = await Promise.all([
      supabase.from('sales').select('*')
        .gte('date', start.toISOString())
        .lt('date', end.toISOString())
        .eq('status', 'completed')
        .order('date', { ascending: true }),
      supabase.from('site_settings').select('*').limit(1).single(),
    ]);
    if (salesRes.data) setTodaySales(salesRes.data);
    if (settingsRes.data) setSiteSettings(settingsRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const totalGeneral = todaySales.reduce((sum, s) => sum + s.total_ttc, 0);
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(18);
    doc.text(siteSettings?.restaurant_name || 'Restaurant', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Feuille de journée — ${today}`, 105, 30, { align: 'center' });
    doc.text(`Caissier(ère): ${user?.name || ''}`, 14, 45);

    autoTable(doc, {
      startY: 55,
      head: [['N° Facture', 'Heure', 'Client', 'Total TTC']],
      body: todaySales.map(s => [
        s.invoice_number,
        new Date(s.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        s.client_id || '—',
        formatCurrency(s.total_ttc),
      ]),
      foot: [['', '', 'TOTAL GÉNÉRAL', formatCurrency(totalGeneral)]],
    });

    doc.save(`cloture-${new Date().toISOString().split('T')[0]}.pdf`);
  };

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

    // Set opening_sale.is_open = false
    const { data: existing } = await supabase
      .from('opening_sale')
      .select('id')
      .eq('user_id', user!.id)
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('opening_sale')
        .update({ is_open: false, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    }

    // Generate PDF before clearing
    generatePDF();

    toast({ title: 'Journée clôturée', description: `Total: ${formatCurrency(totalGeneral)}. PDF téléchargé.` });
    setTodaySales([]);
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
          <Button variant="outline" onClick={generatePDF} disabled={todaySales.length === 0}>
            <FileDown className="h-4 w-4 mr-2" /> Télécharger PDF
          </Button>
          <Button onClick={handleClose} disabled={todaySales.length === 0}>Terminer la journée</Button>
        </div>
      </div>
    </div>
  );
};

export default DayClosurePage;
