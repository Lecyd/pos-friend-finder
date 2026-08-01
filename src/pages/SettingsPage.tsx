import React, { useState, useEffect } from 'react';
import { Settings, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ImageUpload';
import type { Tables } from '@/integrations/supabase/types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Tables<'site_settings'> | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');
  const [defaultTvaRate, setDefaultTvaRate] = useState('');
  const [currency, setCurrency] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).single().then(({ data }) => {
      if (data) {
        setSettings(data);
        setRestaurantName(data.restaurant_name);
        setAddress(data.address);
        setPhone(data.phone);
        setDefaultTvaRate(String(data.default_tva_rate));
        setCurrency(data.currency);
        setLogoUrl(data.logo_url || '');
      }
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    const { error } = await supabase.from('site_settings').update({
      restaurant_name: restaurantName,
      address,
      phone,
      default_tva_rate: parseFloat(defaultTvaRate),
      currency,
      logo_url: logoUrl || null,
    }).eq('id', settings.id);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Paramètres sauvegardés' });
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5" /> Paramètres Système
      </h2>
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Logo du restaurant</Label>
            <ImageUpload currentUrl={logoUrl} onUpload={setLogoUrl} folder="logo" />
          </div>
          <div className="space-y-2">
            <Label>Nom du restaurant</Label>
            <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>TVA par défaut (%)</Label>
              <Input type="number" value={defaultTvaRate} onChange={e => setDefaultTvaRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={handleSave}>Enregistrer</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
