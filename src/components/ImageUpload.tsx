import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  folder?: string;
  className?: string;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_SIZE = 5 * 1024 * 1024;

const ImageUpload: React.FC<ImageUploadProps> = ({ currentUrl, onUpload, folder = 'images', className }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: 'Erreur', description: 'Formats acceptés : PNG, JPEG, WebP.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: 'Erreur', description: 'Image trop volumineuse (max 5 Mo).', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = EXT_BY_TYPE[file.type];
    const fileName = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, { contentType: file.type });
    if (error) {
      toast({ title: 'Erreur', description: "Échec de l'upload.", variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
    onUpload(publicUrl);
    setUploading(false);
    toast({ title: 'Image uploadée' });
  };


  return (
    <div className={className}>
      {currentUrl && (
        <img src={currentUrl} alt="Preview" className="h-20 w-20 rounded object-cover mb-2" />
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
        {uploading ? 'Upload...' : 'Choisir une image'}
      </Button>
    </div>
  );
};

export default ImageUpload;
