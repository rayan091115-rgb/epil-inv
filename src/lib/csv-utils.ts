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

    const detectSeparator = (line: string): string => {
      const commaCount = (line.match(/,/g) || []).length;
      const semicolonCount = (line.match(/;/g) || []).length;
      return semicolonCount > commaCount ? ";" : ",";
    };

    const separator = detectSeparator(lines[0]);

    const normalizeDate = (val: string): string | undefined => {
      if (!val) return undefined;
      const trimmed = val.trim();

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const d = m[1].padStart(2, "0");
        const mo = m[2].padStart(2, "0");
        const y = m[3];
        return `${y}-${mo}-${d}`;
      }

      return undefined;
    };

    const splitLine = (line: string): string[] => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
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

    const headerLine = splitLine(lines[0]);
    const headerMap = new Map<string, number>();
    headerLine.forEach((h, i) => {
      headerMap.set(h.toLowerCase().trim(), i);
    });

    const getVal = (values: string[], key: string): string | undefined => {
      const idx = headerMap.get(key.toLowerCase());
      if (idx === undefined) return undefined;
      const raw = values[idx]?.replace(/^"|"$/g, "").trim();
      return raw === "" ? undefined : raw;
    };

    return lines.slice(1).map((line) => {
      const values = splitLine(line);
      
      const marqueModele = getVal(values, "marque et modèle");
      let marque = getVal(values, "marque");
      let modele = getVal(values, "modèle");

      if (marqueModele && !marque && !modele) {
        const parts = marqueModele.split(/\s+/);
        marque = parts[0];
        modele = parts.slice(1).join(" ");
      }

      return {
        poste: getVal(values, "poste") || getVal(values, "n° de poste") || "",
        category: "PC" as Equipment["category"],
        marque,
        modele,
        numeroSerie: getVal(values, "n° série") || getVal(values, "numéro de série"),
        etat: "OK" as Equipment["etat"],
        dateAchat: normalizeDate(getVal(values, "date achat") || ""),
        finGarantie: normalizeDate(getVal(values, "fin garantie") || ""),
        processeur: getVal(values, "processeur"),
        ram: getVal(values, "ram"),
        capaciteDd: getVal(values, "capacité dd") || getVal(values, "disque dur"),
        alimentation: true,
        os: getVal(values, "os") || getVal(values, "système d'exploitation"),
        adresseMac: getVal(values, "adresse mac") || getVal(values, "mac"),
        notes: getVal(values, "notes") || getVal(values, "remarques"),
      };
    });
  },
};
