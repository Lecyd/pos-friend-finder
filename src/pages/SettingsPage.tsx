import React from 'react';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5" /> Paramètres Système
      </h2>
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            La gestion complète des paramètres (nom du restaurant, adresse, TVA, devise, logo) sera disponible avec le backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
