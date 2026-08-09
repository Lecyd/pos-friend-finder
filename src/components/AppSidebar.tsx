import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  ShoppingCart, List, Package, Receipt, CalendarCheck,
  XCircle, CheckSquare, BarChart3, Settings, Users,
  Tag, UtensilsCrossed, LogOut, CreditCard, UserCircle, DollarSign,
  Users2, Briefcase, FileText, Truck, Tags, Clock, Printer
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  { label: 'Ventes', path: '/dashboard/sales', icon: <ShoppingCart className="h-5 w-5" />, roles: ['caissiere'] },
  { label: 'Consultation Ventes', path: '/dashboard/sales-list', icon: <List className="h-5 w-5" />, roles: ['caissiere', 'manager'] },
  { label: 'Saisie Stock', path: '/dashboard/stock-entry', icon: <Package className="h-5 w-5" />, roles: ['caissiere'] },
  { label: 'Dépenses', path: '/dashboard/expenses', icon: <Receipt className="h-5 w-5" />, roles: ['caissiere', 'manager'] },
  { label: 'Ticket Avoir', path: '/dashboard/credit-notes', icon: <CreditCard className="h-5 w-5" />, roles: ['caissiere'] },
  { label: 'Factures en attente', path: '/dashboard/pending-invoices', icon: <Clock className="h-5 w-5" />, roles: ['caissiere'] },
  { label: 'Clôture Journée', path: '/dashboard/day-closure', icon: <CalendarCheck className="h-5 w-5" />, roles: ['caissiere'] },
  { label: 'Annuler Ventes', path: '/dashboard/cancel-sales', icon: <XCircle className="h-5 w-5" />, roles: ['manager'] },
  { label: 'Valider Stocks', path: '/dashboard/validate-stock', icon: <CheckSquare className="h-5 w-5" />, roles: ['manager'] },
  { label: 'Tableau de Bord', path: '/dashboard/stats', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Les Dépenses', path: '/dashboard/admin-expenses', icon: <DollarSign className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Paramètres', path: '/dashboard/settings', icon: <Settings className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Utilisateurs', path: '/dashboard/users', icon: <Users className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Catégories', path: '/dashboard/categories', icon: <Tag className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Produits', path: '/dashboard/products', icon: <UtensilsCrossed className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Employés', path: '/dashboard/employees', icon: <Users2 className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Rôles Employés', path: '/dashboard/employee-roles', icon: <Briefcase className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Bilan', path: '/dashboard/bilan', icon: <FileText className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Fournisseurs', path: '/dashboard/suppliers', icon: <Truck className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Types de dépense', path: '/dashboard/expense-types', icon: <Tags className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Imprimantes', path: '/dashboard/printers', icon: <Printer className="h-5 w-5" />, roles: ['admin'] },
  { label: 'Mon Profil', path: '/dashboard/profile', icon: <UserCircle className="h-5 w-5" />, roles: ['caissiere', 'manager', 'admin'] },
];

const AppSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dayOpen, setDayOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('opening_sale')
        .select('is_open')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      setDayOpen(data?.is_open === true);
    };
    fetchStatus();

    const channel = supabase
      .channel(`opening_sale_sidebar_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opening_sale' }, (payload: any) => {
        if (payload.new?.user_id === user.id) {
          setDayOpen(payload.new.is_open === true);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel: Record<AppRole, string> = {
    caissiere: 'Caissière',
    manager: 'Manager',
    admin: 'Administrateur',
  };

  return (
    <aside className="flex h-full max-h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">Gestion Ventes</h1>
          <p className="text-xs text-sidebar-foreground/60">{roleLabel[user.role]}</p>
        </div>
      </div>

      {user.role === 'caissiere' && dayOpen !== null && (
        <div className={cn(
          'mx-3 mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
          dayOpen
            ? 'bg-green-500/15 text-green-700 dark:text-green-400'
            : 'bg-destructive/15 text-destructive'
        )}>
          <span className={cn('h-2 w-2 rounded-full', dayOpen ? 'bg-green-500 animate-pulse' : 'bg-destructive')} />
          {dayOpen ? 'Journée ouverte' : 'Journée fermée'}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-1">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
