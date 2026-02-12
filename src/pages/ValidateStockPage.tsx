import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CheckSquare } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const ValidateStockPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Tables<'stock_entries'>[]>([]);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('stock_entries')
      .select('*')
      .order('date', { ascending: false });
    if (data) setEntries(data);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleValidate = async (entryId: string) => {
    const { error } = await supabase
      .from('stock_entries')
      .update({ status: 'validated', validated_by: user!.id })
      .eq('id', entryId);

    if (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
      return;
    }
    toast({ title: 'Stock validé' });
    fetchEntries();
  };

  const handleReject = async (entryId: string) => {
    const { error } = await supabase
      .from('stock_entries')
      .update({ status: 'rejected' })
      .eq('id', entryId);

    if (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
      return;
    }
    toast({ title: 'Stock rejeté' });
    fetchEntries();
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
                  <TableCell className="font-medium">{entry.product_name}</TableCell>
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
