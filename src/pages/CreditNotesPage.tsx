import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Tables } from '@/integrations/supabase/types';

const CreditNotesPage: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [clientId, setClientId] = useState('');
  const [lastCreatedNote, setLastCreatedNote] = useState<Tables<'credit_notes'> | null>(null);
  const [creditNotes, setCreditNotes] = useState<Tables<'credit_notes'>[]>([]);
  const [siteSettings, setSiteSettings] = useState<Tables<'site_settings'> | null>(null);

  const fetchData = async () => {
    const [cnRes, settingsRes] = await Promise.all([
      supabase.from('credit_notes').select('*').order('date', { ascending: false }),
      supabase.from('site_settings').select('*').limit(1).single(),
    ]);
    if (cnRes.data) setCreditNotes(cnRes.data);
    if (settingsRes.data) setSiteSettings(settingsRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast({ title: 'Erreur', description: 'Veuillez saisir un montant.', variant: 'destructive' });
      return;
    }

    const { data, error } = await supabase
      .from('credit_notes')
      .insert({
        amount: parseFloat(amount),
        client_id: clientId || null,
        created_by: user!.id,
      })
      .select()
      .single();

    if (error || !data) {
      toast({ title: 'Erreur', description: 'Impossible de créer.', variant: 'destructive' });
      return;
    }

    setAmount('');
    setClientId('');
    setLastCreatedNote(data);
    fetchData();
    toast({ title: 'Ticket avoir créé' });
  };

  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  const printCreditNote = (note: Tables<'credit_notes'>) => {
    setLastCreatedNote(note);
    setTimeout(() => window.print(), 100);
  };

  const getQRData = (note: Tables<'credit_notes'>) => {
    return JSON.stringify({
      restaurant: siteSettings?.restaurant_name || '',
      montant: note.amount,
      devise: siteSettings?.currency || 'FCFA',
      id: note.id,
      date: note.date,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5" /> Tickets Avoir
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ID Client (optionnel)</Label>
                <Input value={clientId} onChange={e => setClientId(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Créer le ticket avoir</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditNotes.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun ticket avoir</TableCell></TableRow>
                )}
                {creditNotes.map(note => (
                  <TableRow key={note.id}>
                    <TableCell>{new Date(note.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(note.amount)}</TableCell>
                    <TableCell>{note.client_id || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={note.used ? 'secondary' : 'default'}>
                        {note.used ? 'Utilisé' : 'Disponible'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => printCreditNote(note)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {lastCreatedNote && siteSettings && (
        <div className="print-only fixed inset-0 bg-white p-4 text-black" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <div className="text-center mb-4">
            <p className="font-bold text-lg">{siteSettings.restaurant_name}</p>
            <p>{siteSettings.address}</p>
            <p>Tél: {siteSettings.phone}</p>
            <p>────────────────────────</p>
            <p className="font-bold text-base mt-2">TICKET AVOIR</p>
            <p>────────────────────────</p>
          </div>
          <p>N°: {lastCreatedNote.id.slice(0, 8).toUpperCase()}</p>
          <p>Date: {new Date(lastCreatedNote.date).toLocaleString('fr-FR')}</p>
          {lastCreatedNote.client_id && <p>Client: {lastCreatedNote.client_id}</p>}
          <p>────────────────────────</p>
          <p className="text-center font-bold text-lg my-2">{formatCurrency(lastCreatedNote.amount)}</p>
          <p>────────────────────────</p>
          <div className="flex justify-center my-4">
            <QRCodeSVG value={getQRData(lastCreatedNote)} size={120} />
          </div>
          <p className="text-center text-xs mt-2">Scannez ce QR code pour vérifier ce ticket avoir</p>
          <p className="text-center mt-4">Merci de votre visite !</p>
        </div>
      )}
    </div>
  );
};

export default CreditNotesPage;
