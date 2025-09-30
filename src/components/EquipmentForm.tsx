import { useState } from "react";
import { Equipment, EquipmentCategory, EquipmentStatus } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (equipment: Partial<Equipment>) => void;
  onCancel: () => void;
}

const categories: EquipmentCategory[] = ["PC", "Écran", "Clavier", "Souris", "Imprimante", "Switch", "Routeur", "Autre"];
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poste || !formData.category) {
      return;
    }
    onSubmit(formData);
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
              <Label htmlFor="poste">Poste *</Label>
              <Input
                id="poste"
                value={formData.poste}
                onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                placeholder="Ex: Poste-01"
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
              <Label htmlFor="marque">Marque</Label>
              <Input
                id="marque"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                placeholder="Ex: Dell"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modele">Modèle</Label>
              <Input
                id="modele"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                placeholder="Ex: OptiPlex 7090"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSerie">N° de série</Label>
              <Input
                id="numeroSerie"
                value={formData.numeroSerie}
                onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                placeholder="Ex: SN123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="etat">État</Label>
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
              <Label htmlFor="dateAchat">Date d'achat</Label>
              <Input
                id="dateAchat"
                type="date"
                value={formData.dateAchat}
                onChange={(e) => setFormData({ ...formData, dateAchat: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finGarantie">Fin de garantie</Label>
              <Input
                id="finGarantie"
                type="date"
                value={formData.finGarantie}
                onChange={(e) => setFormData({ ...formData, finGarantie: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Remarques, observations..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
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
