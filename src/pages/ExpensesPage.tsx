import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Expense } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Receipt } from 'lucide-react';

const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !amount || !category) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      label,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString(),
      userId: user?.id || '',
    };

    const expenses = JSON.parse(localStorage.getItem('gv_expenses') || '[]');
    expenses.push(expense);
    localStorage.setItem('gv_expenses', JSON.stringify(expenses));

    setLabel('');
    setAmount('');
    setCategory('');
    setRefreshKey(k => k + 1);
    toast({ title: 'Dépense enregistrée' });
  };

  const monthlyExpenses = useMemo(() => {
    const all: Expense[] = JSON.parse(localStorage.getItem('gv_expenses') || '[]');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return all.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

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
              <p className="text-xs text-muted-foreground">
                📎 La pièce jointe (justificatif) sera disponible avec le backend.
              </p>
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
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucune dépense ce mois
                      </TableCell>
                    </TableRow>
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
