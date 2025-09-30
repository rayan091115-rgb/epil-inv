export type EquipmentStatus = "OK" | "Panne" | "HS";

export type EquipmentCategory = 
  | "PC" 
  | "Écran" 
  | "Clavier" 
  | "Souris" 
  | "Imprimante" 
  | "Switch" 
  | "Routeur"
  | "Autre";

export interface Equipment {
  id: string;
  poste: string;
  category: EquipmentCategory;
  marque?: string;
  modele?: string;
  numeroSerie?: string;
  etat: EquipmentStatus;
  dateAchat?: string;
  finGarantie?: string;
  notes?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanResult {
  poste: string;
  timestamp: string;
  present: boolean;
}
