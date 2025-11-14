toast({
  title: "Erreur",
  description: "Impossible d'ajouter le matériel.",
  variant: "destructive",
});
``` :contentReference[oaicite:7]{index=7}  

Et comme tu fais ça **pour chaque ligne du CSV**, tu te retrouves avec le même toast qui se répète.

---

## ✅ Ce qu’il faut corriger

On ne va plus envoyer de chaînes vides `""` pour les dates (et d’autres champs optionnels).  
On va :

- convertir `""` → `undefined` → Supabase ne les envoie pas → DB met `NULL` (OK).
- éventuellement normaliser un peu les dates si un jour tu tapes `14/11/2025` dans Excel.

On corrige ça **dans `csv-utils.ts`**, au niveau de `parseCSV`.

---

## 🟢 FICHIER `src/lib/csv-utils.ts` COMPLET À COPIER-COLLER

Remplace **tout le contenu** de `src/lib/csv-utils.ts` par ceci :

```ts
import { Equipment } from "@/types/equipment";

export const csvUtils = {
  exportToCSV: (equipment: Equipment[]): string => {
    const headers = [
      "ID",
      "Poste",
      "Catégorie",
      "Marque",
      "Modèle",
      "N° Série",
      "État",
      "Date Achat",
      "Fin Garantie",
      "Processeur",
      "RAM",
      "Capacité DD",
      "Alimentation",
      "OS",
      "Adresse MAC",
      "Notes",
    ];

    const rows = equipment.map((e) => [
      e.id,
      e.poste,
      e.category,
      e.marque || "",
      e.modele || "",
      e.numeroSerie || "",
      e.etat,
      e.dateAchat || "",
      e.finGarantie || "",
      e.processeur || "",
      e.ram || "",
      e.capaciteDd || "",
      e.alimentation ? "Oui" : "Non",
      e.os || "",
      e.adresseMac || "",
      e.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
  },

  downloadCSV: (equipment: Equipment[], filename: string = "inventaire_epil"): void => {
    const csv = csvUtils.exportToCSV(equipment);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  parseCSV: (csvContent: string): Partial<Equipment>[] => {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Détection automatique du séparateur ("," ou ";")
    const detectSeparator = (line: string): string => {
      const commaCount = (line.match(/,/g) || []).length;
      const semicolonCount = (line.match(/;/g) || []).length;
      if (semicolonCount > commaCount) return ";";
      return ",";
    };

    const separator = detectSeparator(lines[0]);

    // Normalisation des dates vers "YYYY-MM-DD" ou undefined
    const normalizeDate = (val: string): string | undefined => {
      if (!val) return undefined;
      const trimmed = val.trim();

      // format déjà OK
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      // formats du style 14/11/2025 ou 14-11-2025
      const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const d = m[1].padStart(2, "0");
        const mo = m[2].padStart(2, "0");
        const y = m[3];
        return `${y}-${mo}-${d}`;
      }

      // Format inconnu -> on ne prend pas le risque de casser l'insert
      return undefined;
    };

    // Split avec gestion des guillemets
    const splitLine = (line: string): string[] => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    const headers = splitLine(lines[0]).map((h) =>
      h.trim().replace(/"/g, "")
    );
    const data: Partial<Equipment>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = splitLine(line);

      const item: any = { category: "PC" };

      headers.forEach((header, index) => {
        const raw = values[index] ?? "";
        const value = raw.replace(/"/g, "").trim();

        // --- Mapping des headers vers les champs de Equipment ---

        // ID (CSV export "pro")
        if (header === "ID") {
          item.id = value || undefined;

        // Poste (formulaire ou format pro)
        } else if (header.includes("Numéro attribué") || header === "Poste") {
          item.poste = value;

        // Marque + modèle combinés (Google Forms)
        } else if (header.includes("marque et le modèle")) {
          const parts = value.split(" ");
          item.marque = (parts[0] || "").trim() || undefined;
          item.modele = parts.slice(1).join(" ").trim() || undefined;

        // Marque / Modèle séparés (CSV pro)
        } else if (header === "Marque") {
          item.marque = value || undefined;
        } else if (header === "Modèle") {
          item.modele = value || undefined;

        // Processeur
        } else if (header.includes("Processeur")) {
          item.processeur = value || undefined;

        // RAM
        } else if (header.includes("RAM")) {
          item.ram = value || undefined;

        // Capacité disque
        } else if (header.includes("DD") || header.toLowerCase().includes("capacité")) {
          item.capaciteDd = value || undefined;

        // Alimentation (Oui/Non, Yes/No)
        } else if (header.toLowerCase().includes("alimentation")) {
          const v = value.toLowerCase();
          item.alimentation = v.includes("oui") || v.includes("yes");

        // OS
        } else if (header.includes("OS")) {
          item.os = value || undefined;

        // Adresse MAC
        } else if (header.toLowerCase().includes("mac")) {
          item.adresseMac = value || undefined;

        // Catégorie, numéro de série, état, dates, notes
        } else if (header === "Catégorie") {
          item.category = value || "PC";
        } else if (header === "N° Série") {
          item.numeroSerie = value || undefined;
        } else if (header === "État") {
          item.etat = (value as any) || undefined;
        } else if (header === "Date Achat") {
          item.dateAchat = normalizeDate(value);
        } else if (header === "Fin Garantie") {
          item.finGarantie = normalizeDate(value);
        } else if (header === "Notes") {
          item.notes = value || undefined;
        }
      });

      // On n'ajoute que si un poste est défini (obligatoire en DB)
      if (item.poste) {
        data.push(item);
      }
    }

    return data;
  },
};
