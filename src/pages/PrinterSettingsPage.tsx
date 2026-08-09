import React, { useEffect, useState } from 'react';
import { Printer, Usb, Bluetooth, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

type Connection = 'usb' | 'bluetooth';

interface PrinterConfig {
  id: string;
  name: string;
  connection: Connection;
  paperWidth: number;
  isDefault: boolean;
  details?: string;
}

const STORAGE_KEY = 'printer_configs';

const load = (): PrinterConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PrinterConfig[]) : [];
  } catch {
    return [];
  }
};

const PrinterSettingsPage: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [name, setName] = useState('');
  const [connection, setConnection] = useState<Connection>('usb');
  const [paperWidth, setPaperWidth] = useState('58');

  useEffect(() => { setPrinters(load()); }, []);

  const persist = (next: PrinterConfig[]) => {
    setPrinters(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addPrinter = (details?: string, detectedName?: string) => {
    const label = (detectedName || name).trim();
    if (!label) {
      toast({ title: 'Nom requis', description: "Saisissez un nom d'imprimante.", variant: 'destructive' });
      return;
    }
    const next: PrinterConfig[] = [
      ...printers,
      {
        id: crypto.randomUUID(),
        name: label,
        connection,
        paperWidth: parseInt(paperWidth) || 58,
        isDefault: printers.length === 0,
        details,
      },
    ];
    persist(next);
    setName('');
    toast({ title: 'Imprimante enregistrée', description: label });
  };

  const pairUsb = async () => {
    const nav = navigator as any;
    if (!nav.usb) {
      toast({ title: 'WebUSB non disponible', description: 'Utilisez Chrome/Edge sur ordinateur, ou ajoutez l’imprimante manuellement.', variant: 'destructive' });
      return;
    }
    try {
      const device = await nav.usb.requestDevice({ filters: [] });
      setConnection('usb');
      addPrinter(
        `Vendor ${device.vendorId} / Product ${device.productId}`,
        device.productName || `Imprimante USB ${device.productId}`
      );
    } catch {
      toast({ title: 'Appairage annulé', variant: 'destructive' });
    }
  };

  const pairBluetooth = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      toast({ title: 'Bluetooth non disponible', description: 'Utilisez Chrome/Edge ou Android, ou ajoutez l’imprimante manuellement.', variant: 'destructive' });
      return;
    }
    try {
      const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true });
      setConnection('bluetooth');
      addPrinter(device.id ? `Device ${device.id}` : undefined, device.name || 'Imprimante Bluetooth');
    } catch {
      toast({ title: 'Appairage annulé', variant: 'destructive' });
    }
  };

  const setDefault = (id: string) => {
    persist(printers.map(p => ({ ...p, isDefault: p.id === id })));
  };

  const remove = (id: string) => {
    persist(printers.filter(p => p.id !== id));
  };

  const testPrint = (p: PrinterConfig) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`<html><head><title>Test</title><style>
      @page { size: ${p.paperWidth}mm auto; margin: 0; }
      body { width: ${p.paperWidth}mm; margin: 0; padding: 3mm; font-family: monospace; font-size: 11px; text-align: center; }
    </style></head><body>
      <p><b>TEST D'IMPRESSION</b></p>
      <p>${p.name}</p>
      <p>${p.connection.toUpperCase()} — ${p.paperWidth}mm</p>
      <p>${new Date().toLocaleString('fr-FR')}</p>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Printer className="h-5 w-5" /> Configuration des imprimantes
      </h2>

      <Card className="border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-base">Ajouter une imprimante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nom</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Caisse principale" />
            </div>
            <div className="space-y-2">
              <Label>Largeur papier (mm)</Label>
              <Select value={paperWidth} onValueChange={setPaperWidth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58 mm</SelectItem>
                  <SelectItem value="80">80 mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type de connexion</Label>
            <Select value={connection} onValueChange={(v) => setConnection(v as Connection)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usb">USB</SelectItem>
                <SelectItem value="bluetooth">Bluetooth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => addPrinter()}>Enregistrer</Button>
            <Button variant="outline" onClick={pairUsb}><Usb className="h-4 w-4 mr-2" /> Détecter USB</Button>
            <Button variant="outline" onClick={pairBluetooth}><Bluetooth className="h-4 w-4 mr-2" /> Détecter Bluetooth</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Les tickets Facture et Avoir sont imprimés en 58 mm par défaut.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Imprimantes enregistrées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {printers.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune imprimante enregistrée.</p>
          )}
          {printers.map(p => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {p.connection === 'usb' ? <Usb className="h-4 w-4" /> : <Bluetooth className="h-4 w-4" />}
                  <span className="font-medium truncate">{p.name}</span>
                  {p.isDefault && <Badge>Par défaut</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.connection.toUpperCase()} — {p.paperWidth} mm{p.details ? ` — ${p.details}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {!p.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => setDefault(p.id)}>Par défaut</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => testPrint(p)}>Test</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrinterSettingsPage;
