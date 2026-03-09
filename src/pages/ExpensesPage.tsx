import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Receipt } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import type { Tables } from '@/integrations/supabase/types';

const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState<Tables<'expenses'>[]>([]);

  const fetchExpenses = async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', start)
      .lt('date', end)
      .order('date', { ascending: false });
    if (data) setMonthlyExpenses(data);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !amount || !category || !invoiceUrl) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs et ajouter une pièce justificative.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('expenses').insert({
      label,
      amount: parseFloat(amount),
      category,
      invoice_url: invoiceUrl,
      user_id: user!.id,
    });

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'enregistrer.', variant: 'destructive' });
      return;
    }

    setLabel('');
    setAmount('');
    setCategory('');
    setInvoiceUrl('');
    fetchExpenses();
    toast({ title: 'Dépense enregistrée' });
  };

  const totalMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5" /> Saisie des Dépenses
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Libellé</Label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Achat ingrédients" />
              </div>
              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Fournitures" />
              </div>
              <div className="space-y-2">
                <Label>Pièce justificative *</Label>
                <ImageUpload
                  currentUrl={invoiceUrl}
                  onUpload={setInvoiceUrl}
                  folder="expense-invoices"
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full">Enregistrer la dépense</Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-3">
            Dépenses du mois ({new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})
          </h3>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyExpenses.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucune dépense ce mois</TableCell></TableRow>
                  )}
                  {monthlyExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="font-medium">{expense.label}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(expense.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {monthlyExpenses.length > 0 && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={3} className="font-bold">Total du mois</TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatCurrency(totalMonth)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
