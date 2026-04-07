-- ========================================
-- SÉCURITÉ : Correction des politiques RLS pour equipment
-- ========================================

-- Supprimer les anciennes politiques trop permissives
DROP POLICY IF EXISTS "Technicians can view all equipment" ON public.equipment;
DROP POLICY IF EXISTS "Technicians can insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Technicians can update equipment" ON public.equipment;
DROP POLICY IF EXISTS "Technicians can delete equipment" ON public.equipment;

-- Nouvelles politiques sécurisées
CREATE POLICY "Everyone can view equipment" 
  ON public.equipment 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins and moderators can insert equipment" 
  ON public.equipment 
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Admins and moderators can update equipment" 
  ON public.equipment 
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Only admins can delete equipment" 
  ON public.equipment 
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ========================================
-- TABLE : locations (emplacements)
-- ========================================

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view locations" 
  ON public.locations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage locations" 
  ON public.locations 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Ajouter colonne location_id à equipment
ALTER TABLE public.equipment 
  ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX idx_equipment_location ON public.equipment(location_id);

-- ========================================
-- TABLE : maintenance_logs (historique maintenance)
-- ========================================

CREATE TABLE public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date timestamp with time zone DEFAULT now(),
  description_probleme text NOT NULL,
  actions_effectuees text,
  status text NOT NULL DEFAULT 'ouvert' CHECK (status IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view maintenance logs" 
  ON public.maintenance_logs 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance logs" 
  ON public.maintenance_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and moderators can update maintenance logs" 
  ON public.maintenance_logs 
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Only admins can delete maintenance logs" 
  ON public.maintenance_logs 
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_maintenance_equipment ON public.maintenance_logs(equipment_id);
CREATE INDEX idx_maintenance_user ON public.maintenance_logs(user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_maintenance_logs_updated_at
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- STORAGE : Bucket pour photos d'équipements
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment_photos',
  'equipment_photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Politiques RLS pour le bucket
CREATE POLICY "Everyone can view equipment photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'equipment_photos');

CREATE POLICY "Admins and moderators can upload equipment photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'equipment_photos' AND
    (public.has_role(auth.uid(), 'admin'::app_role) OR 
     public.has_role(auth.uid(), 'moderator'::app_role))
  );

CREATE POLICY "Admins and moderators can update equipment photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'equipment_photos' AND
    (public.has_role(auth.uid(), 'admin'::app_role) OR 
     public.has_role(auth.uid(), 'moderator'::app_role))
  );

CREATE POLICY "Only admins can delete equipment photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'equipment_photos' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Insérer quelques emplacements par défaut
INSERT INTO public.locations (name, description) VALUES
  ('Bureau Principal', 'Bureau de direction'),
  ('Salle Informatique', 'Salle serveurs et équipements réseau'),
  ('Atelier', 'Atelier de réparation et maintenance'),
  ('Stock', 'Zone de stockage du matériel'),
  ('Non assigné', 'Équipements sans emplacement défini');