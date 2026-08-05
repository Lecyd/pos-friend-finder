import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Clock, CreditCard } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Sale = Tables<'sales'>;
type CreditNote = { id: string; amount: number; date: string };

const PendingInvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState('');
  const [generateCreditNote, setGenerateCreditNote] = useState(false);
  const [newCreditNoteAmount, setNewCreditNoteAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (v: number) => `${Number(v).toFixed(0)} FCFA`;

  const fetchData = async () => {
    const [salesRes, cnRes] = await Promise.all([
      supabase.from('sales').select('*').eq('status', 'deferred').order('date', { ascending: false }),
      supabase.rpc('list_available_credit_notes'),
    ]);
    setSales(salesRes.data || []);
    setCreditNotes((cnRes.data as CreditNote[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const openPayment = (sale: Sale) => {
    setSelected(sale);
    setAmountReceived('');
    setSelectedCreditNoteId('');
    setGenerateCreditNote(false);
    setNewCreditNoteAmount('');
  };

  const creditAmount = useMemo(() => {
    const cn = creditNotes.find(c => c.id === selectedCreditNoteId);
    return cn ? Number(cn.amount) : 0;
  }, [creditNotes, selectedCreditNoteId]);

  const newCreditAmount = generateCreditNote ? (parseFloat(newCreditNoteAmount) || 0) : 0;
  const received = parseFloat(amountReceived) || 0;
  const totalTTC = selected ? Number(selected.total_ttc) : 0;
  const amountDue = Math.max(0, totalTTC - creditAmount);
  const amountReturned = Math.max(0, received - totalTTC + creditAmount - newCreditAmount);

  const handlePay = async () => {
    if (!selected || !user) return;
    if (received < amountDue) {
      toast({ title: 'Erreur', description: 'La somme reçue est insuffisante.', variant: 'destructive' });
      return;
    }
    if (generateCreditNote && newCreditAmount <= 0) {
      toast({ title: 'Erreur', description: 'Saisissez le montant du nouveau avoir.', variant: 'destructive' });
      return;
    }
    if (newCreditAmount > received - amountDue) {
      toast({ title: 'Erreur', description: 'Le nouveau avoir dépasse le surplus encaissé.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const creditNoteId = selectedCreditNoteId && selectedCreditNoteId !== 'none' ? selectedCreditNoteId : null;

    if (creditNoteId) {
      const { error } = await supabase.rpc('mark_credit_note_used', { _credit_note_id: creditNoteId });
      if (error) {
        setCreditNotes(prev => prev.filter(c => c.id !== creditNoteId));
        setSelectedCreditNoteId('');
        setSubmitting(false);
        toast({ title: 'Ticket Avoir invalide', description: 'Cet avoir a déjà été utilisé.', variant: 'destructive' });
        return;
      }
    }

    const { error: settleError } = await supabase.rpc('settle_deferred_sale', {
      _sale_id: selected.id,
      _amount_received: received,
      _amount_returned: amountReturned,
      _credit_note_id: creditNoteId,
    });

    if (settleError) {
      setSubmitting(false);
      toast({ title: 'Erreur', description: 'Le paiement n\'a pas pu être appliqué.', variant: 'destructive' });
      return;
    }

    if (creditNoteId) {
      await supabase.rpc('attach_credit_note_to_sale', { _credit_note_id: creditNoteId, _sale_id: selected.id });
      setCreditNotes(prev => prev.filter(c => c.id !== creditNoteId));
    }

    if (newCreditAmount > 0) {
      const { data: cn } = await supabase
        .from('credit_notes')
        .insert({ amount: newCreditAmount, client_id: selected.client_id, created_by: user.id })
        .select('id, amount, date')
        .single();
      if (cn) {
        setCreditNotes(prev => [{ id: cn.id, amount: Number(cn.amount), date: cn.date }, ...prev]);
        toast({ title: 'Nouveau Ticket Avoir créé', description: formatCurrency(newCreditAmount) });
      }
    }

    setSales(prev => prev.filter(s => s.id !== selected.id));
    toast({ title: 'Paiement effectué', description: `Facture ${selected.invoice_number} : statut « Complétée ».` });
    setSelected(null);
    setSubmitting(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" /> Factures en attente
      </h2>

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chargement...</TableCell></TableRow>
              )}
              {!loading && sales.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune facture en attente</TableCell></TableRow>
              )}
              {sales.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.invoice_number}</TableCell>
                  <TableCell>{new Date(s.date).toLocaleString('fr-FR')}</TableCell>
                  <TableCell>{s.client_id || '—'}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(s.total_ttc)}</TableCell>
                  <TableCell><Badge variant="secondary">En attente</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => openPayment(s)}>Appliquer un paiement</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paiement de la facture</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">N° Facture</span>
                <span className="font-medium">{selected.invoice_number}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{formatCurrency(selected.total_ttc)}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1"><CreditCard className="h-3 w-3" /> Avoir disponible</label>
                <Select value={selectedCreditNoteId} onValueChange={setSelectedCreditNoteId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Appliquer un avoir..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {creditNotes.map(cn => (
                      <SelectItem key={cn.id} value={cn.id}>
                        {formatCurrency(cn.amount)} — {new Date(cn.date).toLocaleDateString('fr-FR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {creditAmount > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <span>Reste à payer</span>
                  <span className="text-primary">{formatCurrency(amountDue)}</span>
                </div>
              )}

              <Input
                type="number"
                placeholder="Somme reçue"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="pending-gen-avoir"
                  checked={generateCreditNote}
                  onCheckedChange={v => { setGenerateCreditNote(v === true); if (v !== true) setNewCreditNoteAmount(''); }}
                />
                <label htmlFor="pending-gen-avoir" className="text-sm font-medium cursor-pointer">Générer un avoir</label>
              </div>

              {generateCreditNote && (
                <Input
                  type="number"
                  placeholder="Montant du nouveau avoir"
                  value={newCreditNoteAmount}
                  onChange={e => setNewCreditNoteAmount(e.target.value)}
                />
              )}

              {received > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <span>Monnaie à rendre</span>
                  <span className="text-success">{formatCurrency(amountReturned)}</span>
                </div>
              )}

              <Button className="w-full" onClick={handlePay} disabled={submitting}>
                {submitting ? 'Traitement...' : 'Faire le paiement'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingInvoicesPage;
