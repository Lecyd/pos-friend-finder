import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { UserCircle } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' });
      return;
    }
    await updateProfile({ name, phone, address });
    if (password) {
      const success = await updatePassword(password);
      if (!success) {
        toast({ title: 'Erreur', description: 'Impossible de changer le mot de passe.', variant: 'destructive' });
        return;
      }
    }
    toast({ title: 'Profil mis à jour' });
    setPassword('');
    setConfirmPassword('');
  };

  if (!user) return null;

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <UserCircle className="h-5 w-5" /> Mon Profil
      </h2>
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+237 ..." />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Votre adresse" />
          </div>
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" />
          </div>
          <div className="space-y-2">
            <Label>Confirmer le mot de passe</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSave}>Enregistrer</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
