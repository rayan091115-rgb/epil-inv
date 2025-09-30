-- Create enum types for equipment
CREATE TYPE equipment_category AS ENUM (
  'PC',
  'Écran',
  'Clavier',
  'Souris',
  'Imprimante',
  'Switch',
  'Routeur',
  'Autre'
);

CREATE TYPE equipment_status AS ENUM ('OK', 'Panne', 'HS');

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poste TEXT NOT NULL,
  category equipment_category NOT NULL,
  marque TEXT,
  modele TEXT,
  numero_serie TEXT,
  etat equipment_status NOT NULL DEFAULT 'OK',
  date_achat DATE,
  fin_garantie DATE,
  notes TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scan history table
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scanner_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_equipment_poste ON public.equipment(poste);
CREATE INDEX idx_equipment_category ON public.equipment(category);
CREATE INDEX idx_equipment_etat ON public.equipment(etat);
CREATE INDEX idx_scan_history_equipment_id ON public.scan_history(equipment_id);
CREATE INDEX idx_scan_history_scanned_at ON public.scan_history(scanned_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all authenticated users (technicians) to manage equipment
CREATE POLICY "Technicians can view all equipment"
  ON public.equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Technicians can insert equipment"
  ON public.equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Technicians can update equipment"
  ON public.equipment FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Technicians can delete equipment"
  ON public.equipment FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for scan_history
CREATE POLICY "Technicians can view scan history"
  ON public.scan_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Technicians can insert scan history"
  ON public.scan_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Technicians can delete scan history"
  ON public.scan_history FOR DELETE
  TO authenticated
  USING (true);