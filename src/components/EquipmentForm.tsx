import { useState } from "react";
import { Equipment, EquipmentCategory, EquipmentStatus } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodeScanner } from "@/components/BarcodeScanner";

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (equipment: Partial<Equipment>) => void;
  onCancel: () => void;
}

const categories: EquipmentCategory[] = [
  "PC", 
  "Serveur",
  "Écran", 
  "Clavier", 
  "Souris", 
  "Imprimante", 
  "Switch", 
  "Routeur",
  "Processeur",
  "Carte mère",
  "RAM",
  "Carte graphique",
  "Disque dur",
  "Alimentation",
  "Onduleur",
  "Boîtier",
  "Ventilateur",
  "Câble",
  "Webcam",
  "Casque",
  "Microphone",
  "Composant",
  "Autre"
];
const statuses: EquipmentStatus[] = ["OK", "Panne", "HS"];

export const EquipmentForm = ({ equipment, onSubmit, onCancel }: EquipmentFormProps) => {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    poste: equipment?.poste || "",
    category: equipment?.category || "PC",
    marque: equipment?.marque || "",
    modele: equipment?.modele || "",
    numeroSerie: equipment?.numeroSerie || "",
    etat: equipment?.etat || "OK",
    dateAchat: equipment?.dateAchat || "",
    finGarantie: equipment?.finGarantie || "",
    notes: equipment?.notes || "",
    processeur: equipment?.processeur || "",
    ram: equipment?.ram || "",
    capaciteDd: equipment?.capaciteDd || "",
    alimentation: equipment?.alimentation ?? true,
    os: equipment?.os || "",
    adresseMac: equipment?.adresseMac || "",
  });

  const isPCCategory = formData.category === "PC";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poste || !formData.category) {
      return;
    }
    
    // Clean up empty strings to undefined for optional fields
    const cleanedData = {
      ...formData,
      marque: formData.marque?.trim() || undefined,
      modele: formData.modele?.trim() || undefined,
      numeroSerie: formData.numeroSerie?.trim() || undefined,
      dateAchat: formData.dateAchat || undefined,
      finGarantie: formData.finGarantie || undefined,
      notes: formData.notes?.trim() || undefined,
      processeur: formData.processeur?.trim() || undefined,
      ram: formData.ram?.trim() || undefined,
      capaciteDd: formData.capaciteDd?.trim() || undefined,
      os: formData.os?.trim() || undefined,
      adresseMac: formData.adresseMac?.trim() || undefined,
    };
    
    onSubmit(cleanedData);
  };

  const handleBarcodeScanned = (code: string) => {
    setFormData({ ...formData, numeroSerie: code });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{equipment ? "Modifier le matériel" : "Ajouter un matériel"}</CardTitle>
        <CardDescription>
          Les champs marqués d'un * sont obligatoires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poste">Numéro attribué au {isPCCategory ? 'PC' : 'matériel'} *</Label>
              <Input
                id="poste"
                value={formData.poste}
                onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                placeholder="Ex: PC135"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as EquipmentCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marque">Marque {isPCCategory ? '*' : '(optionnel)'}</Label>
              <Input
                id="marque"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                placeholder="Ex: HP, Dell, Lenovo..."
                required={isPCCategory}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modele">Modèle {isPCCategory ? '*' : '(optionnel)'}</Label>
              <Input
                id="modele"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                placeholder="Ex: ThinkCentre, Compaq 6200..."
                required={isPCCategory}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSerie">Numéro de série (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  id="numeroSerie"
                  value={formData.numeroSerie}
                  onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                  placeholder="Scanner ou saisir manuellement"
                />
                <BarcodeScanner onScan={handleBarcodeScanned} />
              </div>
            </div>

            {isPCCategory && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="processeur">Type du Processeur *</Label>
                  <Input
                    id="processeur"
                    value={formData.processeur}
                    onChange={(e) => setFormData({ ...formData, processeur: e.target.value })}
                    placeholder="Ex: i3-4130, Intel Pentium..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ram">RAM installée *</Label>
                  <Input
                    id="ram"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    placeholder="Ex: 4G, 8G, 2x2GB DDR3..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capaciteDd">Capacité du DD *</Label>
                  <Input
                    id="capaciteDd"
                    value={formData.capaciteDd}
                    onChange={(e) => setFormData({ ...formData, capaciteDd: e.target.value })}
                    placeholder="Ex: 500GB, 250Go..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alimentation">Alimentation *</Label>
                  <Select
                    value={formData.alimentation ? "oui" : "non"}
                    onValueChange={(value) => setFormData({ ...formData, alimentation: value === "oui" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oui">Oui</SelectItem>
                      <SelectItem value="non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="os">OS installé *</Label>
                  <Input
                    id="os"
                    value={formData.os}
                    onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                    placeholder="Ex: Windows 10, Windows 7, Linux..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresseMac">Adresse MAC *</Label>
                  <Input
                    id="adresseMac"
                    value={formData.adresseMac}
                    onChange={(e) => setFormData({ ...formData, adresseMac: e.target.value })}
                    placeholder="Ex: 44-8A-0D-96-C6"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="etat">État *</Label>
              <Select
                value={formData.etat}
                onValueChange={(value) => setFormData({ ...formData, etat: value as EquipmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateAchat">Date d'achat (optionnel)</Label>
              <Input
                id="dateAchat"
                type="date"
                value={formData.dateAchat}
                onChange={(e) => setFormData({ ...formData, dateAchat: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finGarantie">Fin de garantie (optionnel)</Label>
              <Input
                id="finGarantie"
                type="date"
                value={formData.finGarantie}
                onChange={(e) => setFormData({ ...formData, finGarantie: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {equipment ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
