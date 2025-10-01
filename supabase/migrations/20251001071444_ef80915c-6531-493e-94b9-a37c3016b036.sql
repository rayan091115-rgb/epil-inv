-- Add new equipment categories to the enum
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Composant';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Processeur';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Alimentation';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Serveur';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Onduleur';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Câble';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Disque dur';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'RAM';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Carte graphique';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Carte mère';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Boîtier';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Ventilateur';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Webcam';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Casque';
ALTER TYPE equipment_category ADD VALUE IF NOT EXISTS 'Microphone';