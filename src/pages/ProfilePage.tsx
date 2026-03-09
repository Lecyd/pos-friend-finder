import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { UserCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ImageUpload from '@/components/ImageUpload';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [countryCode, setCountryCode] = useState('+237');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Séparer le numéro de téléphone et l'indicatif au chargement
  React.useEffect(() => {
    if (user?.phone) {
      const commonCodes = ['+237', '+33', '+1', '+49', '+44', '+39', '+34', '+32', '+41', '+31', '+221', '+223', '+225', '+226', '+228', '+229', '+230', '+235', '+236'];
      const foundCode = commonCodes.find(code => user.phone?.startsWith(code));
      if (foundCode) {
        setCountryCode(foundCode);
        setPhoneNumber(user.phone.substring(foundCode.length));
      } else {
        setPhoneNumber(user.phone);
      }
    }
  }, [user?.phone]);

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' });
      return;
    }
    await updateProfile({ name, phone, address, photoUrl });
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
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20">
              {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
              <AvatarFallback className="text-2xl">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <ImageUpload currentUrl={photoUrl} onUpload={(url) => setPhotoUrl(url)} folder="profiles" />
          </div>
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
