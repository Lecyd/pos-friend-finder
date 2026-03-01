import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BilanLine {
  designation: string;
  entree: number;
  sortie: number;
}

const BilanPage: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<BilanLine[]>([]);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;
  const pad = (n: number) => String(n).padStart(2, '0');

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(startDate);
      const to = new Date(endDate); to.setHours(23, 59, 59, 999);
      const fromISO = from.toISOString();
      const toISO = to.toISOString();

      // 1. Commandes (stock_entries validated in period) grouped by product
      const { data: stockEntries } = await supabase
        .from('stock_entries')
        .select('product_name, quantity')
        .eq('status', 'validated')
        .gte('date', fromISO)
        .lte('date', toISO);

      // We need product prices to compute cost
      const { data: products } = await supabase.from('products').select('id, name, price_ht, tva_rate');
      const productMap = new Map((products || []).map(p => [p.name, p]));

      const commandeMap = new Map<string, number>();
      (stockEntries || []).forEach(se => {
        const prod = productMap.get(se.product_name);
        const priceTTC = prod ? prod.price_ht * (1 + prod.tva_rate / 100) : 0;
        const total = priceTTC * se.quantity;
        commandeMap.set(se.product_name, (commandeMap.get(se.product_name) || 0) + total);
      });

      const commandeLines: BilanLine[] = Array.from(commandeMap.entries()).map(([name, total]) => ({
        designation: `Commande ${name}`,
        entree: 0,
        sortie: total,
      }));

      // 2. Ventes journalières
      const { data: sales } = await supabase
        .from('sales')
        .select('date, total_ttc')
        .eq('status', 'completed')
        .gte('date', fromISO)
        .lte('date', toISO);

      const ventesMap = new Map<string, number>();
      (sales || []).forEach(s => {
        const d = new Date(s.date);
        const key = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}`;
        ventesMap.set(key, (ventesMap.get(key) || 0) + s.total_ttc);
      });

      const venteLines: BilanLine[] = Array.from(ventesMap.entries())
        .sort()
        .map(([key, total]) => ({ designation: `Vente ${key}`, entree: total, sortie: 0 }));

      // 3. Dépenses journalières
      const { data: expenses } = await supabase
        .from('expenses')
        .select('date, amount')
        .gte('date', fromISO)
        .lte('date', toISO);

      const depenseMap = new Map<string, number>();
      (expenses || []).forEach(e => {
        const d = new Date(e.date);
        const key = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}`;
        depenseMap.set(key, (depenseMap.get(key) || 0) + e.amount);
      });

      const depenseLines: BilanLine[] = Array.from(depenseMap.entries())
        .sort()
        .map(([key, total]) => ({ designation: `Dépense ${key}`, entree: 0, sortie: total }));

      // 4. Salaires employés
      const { data: employees } = await supabase
        .from('employees')
        .select('nom, prenoms, salaire')
        .eq('active', true);

      const salaireLines: BilanLine[] = (employees || []).map(emp => ({
        designation: `Salaire ${emp.nom}-${emp.prenoms}`,
        entree: 0,
        sortie: emp.salaire,
      }));

      setLines([...commandeLines, ...venteLines, ...depenseLines, ...salaireLines]);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de générer le bilan.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { generate(); }, [generate]);

  const totalEntree = lines.reduce((s, l) => s + l.entree, 0);
  const totalSortie = lines.reduce((s, l) => s + l.sortie, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    const dateLabel = new Date(endDate).toLocaleDateString('fr-FR');
    doc.setFontSize(16);
    doc.text(`Bilan à la date du ${dateLabel}`, 14, 20);

    const body = lines.map(l => [
      l.designation,
      l.entree ? formatCurrency(l.entree) : '',
      l.sortie ? formatCurrency(l.sortie) : '',
    ]);
    body.push(['Total', formatCurrency(totalEntree), formatCurrency(totalSortie)]);

    autoTable(doc, {
      startY: 30,
      head: [['Désignations', 'Entrée', 'Sortie']],
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      foot: [],
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [236, 240, 241];
        }
      },
    });

    doc.save(`Bilan_${startDate}_${endDate}.pdf`);
    toast({ title: 'PDF téléchargé' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" /> Rapport Bilan
      </h2>

      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={generate} disabled={loading}>Générer</Button>
            <Button variant="outline" onClick={exportPDF} disabled={lines.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Exporter PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Désignations</TableHead>
                <TableHead className="text-right">Entrée</TableHead>
                <TableHead className="text-right">Sortie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Aucune donnée</TableCell></TableRow>
              )}
              {lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{l.designation}</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">{l.entree ? formatCurrency(l.entree) : ''}</TableCell>
                  <TableCell className="text-right text-destructive">{l.sortie ? formatCurrency(l.sortie) : ''}</TableCell>
                </TableRow>
              ))}
              {lines.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400 font-bold">{formatCurrency(totalEntree)}</TableCell>
                  <TableCell className="text-right text-destructive font-bold">{formatCurrency(totalSortie)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BilanPage;
