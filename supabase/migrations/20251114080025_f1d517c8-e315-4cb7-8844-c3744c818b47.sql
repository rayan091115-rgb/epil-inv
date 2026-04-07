-- Add PC-specific fields to equipment table
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS processeur text,
ADD COLUMN IF NOT EXISTS ram text,
ADD COLUMN IF NOT EXISTS capacite_dd text,
ADD COLUMN IF NOT EXISTS alimentation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS os text,
ADD COLUMN IF NOT EXISTS adresse_mac text;