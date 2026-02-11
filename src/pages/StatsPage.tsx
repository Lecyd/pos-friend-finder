import React, { useMemo, useState } from 'react';
import { Sale } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StatsPage: React.FC = () => {
  const allSales: Sale[] = useMemo(() => {
    return (JSON.parse(localStorage.getItem('gv_sales') || '[]') as Sale[]).filter(s => s.status === 'completed');
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const today = new Date().toDateString();
  const todaySales = allSales.filter(s => new Date(s.date).toDateString() === today);
  const todayTotal = todaySales.reduce((sum, s) => sum + s.totalTTC, 0);

  const chartData = useMemo(() => {
    const days: { name: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const total = allSales
        .filter(s => new Date(s.date).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.totalTTC, 0);
      days.push({ name: dayName, total });
    }
    return days;
  }, [allSales]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return Array.from(months);
  }, []);

  const monthlySales = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return allSales.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [allSales, selectedMonth]);

  const monthlyTotal = monthlySales.reduce((sum, s) => sum + s.totalTTC, 0);

  const monthlyChartData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const data: { name: string; total: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dateStr = date.toDateString();
      const total = allSales
        .filter(s => new Date(s.date).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.totalTTC, 0);
      data.push({ name: String(d), total });
    }
    return data;
  }, [allSales, selectedMonth]);

  const formatCurrency = (v: number) => `${v.toFixed(0)} FCFA`;
  const formatMonth = (m: string) => {
    const [year, month] = m.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" /> Tableau de Bord
      </h2>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">CA du jour</p>
                <p className="text-2xl font-bold">{formatCurrency(todayTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3"><ShoppingCart className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Ventes du jour</p>
                <p className="text-2xl font-bold">{todaySales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">CA mensuel ({formatMonth(selectedMonth)})</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 mb-6">
        <CardHeader><CardTitle>Ventes des 7 derniers jours</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="total" fill="hsl(215, 80%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ventes mensuelles</CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableMonths.map(m => (
                  <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{monthlySales.length} ventes — Total: <span className="font-bold text-foreground">{formatCurrency(monthlyTotal)}</span></p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="total" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPage;
