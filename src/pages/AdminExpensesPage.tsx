import React, { useMemo, useState } from 'react';
import { Expense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';

const AdminExpensesPage: React.FC = () => {
  const allExpenses: Expense[] = useMemo(() => {
    return JSON.parse(localStorage.getItem('gv_expenses') || '[]');
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    allExpenses.forEach(e => {
      const d = new Date(e.date);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [allExpenses]);

  // Group expenses by day for selected month
  const dailyExpenses = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const filtered = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    // Group by day
    const byDay: Record<string, Expense[]> = {};
    filtered.forEach(e => {
      const dayKey = new Date(e.date).toLocaleDateString('fr-FR');
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(e);
    });

    return Object.entries(byDay)
      .sort(([a], [b]) => {
        // Parse fr-FR date for sorting
        const parseDate = (s: string) => {
          const [d, m, y] = s.split('/').map(Number);
          return new Date(y, m - 1, d).getTime();
        };
        return parseDate(b) - parseDate(a);
      })
      .map(([date, expenses]) => ({
        date,
        expenses,
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
      }));
  }, [allExpenses, selectedMonth]);

  const monthTotal = dailyExpenses.reduce((sum, d) => sum + d.total, 0);
  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;

  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-').map(Number);
    const d = new Date(year, month - 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5" /> Les Dépenses
      </h2>

      <div className="flex items-center gap-4 mb-6">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(m => (
              <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Card className="border-border/50 px-4 py-2">
          <p className="text-sm text-muted-foreground">Total du mois</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(monthTotal)}</p>
        </Card>
      </div>

      {dailyExpenses.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune dépense pour ce mois
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dailyExpenses.map(day => (
            <Card key={day.date} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{day.date}</span>
                  <span className="text-primary">{formatCurrency(day.total)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {day.expenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.label}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExpensesPage;
