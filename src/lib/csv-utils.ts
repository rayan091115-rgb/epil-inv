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
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  parseCSV: (csvContent: string): Partial<Equipment>[] => {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data: Partial<Equipment>[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle CSV parsing with proper quote handling
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const item: any = { category: "PC" };

      headers.forEach((header, index) => {
        const value = values[index]?.replace(/"/g, "").trim() || "";
        
        // Match headers from the CSV file
        if (header.includes("Numéro attribué") || header === "Poste") {
          item.poste = value;
        } else if (header.includes("marque et le modèle")) {
          // Split "marque et modèle" into separate fields
          const parts = value.split(" ");
          item.marque = parts[0] || value;
          item.modele = parts.slice(1).join(" ") || value;
        } else if (header === "Marque") {
          item.marque = value;
        } else if (header === "Modèle") {
          item.modele = value;
        } else if (header.includes("Processeur")) {
          item.processeur = value;
        } else if (header.includes("RAM")) {
          item.ram = value;
        } else if (header.includes("DD") || header.includes("capacité")) {
          item.capaciteDd = value;
        } else if (header.includes("alimentation")) {
          item.alimentation = value.toLowerCase().includes("oui") || value.toLowerCase().includes("yes");
        } else if (header.includes("OS")) {
          item.os = value;
        } else if (header.includes("MAC")) {
          item.adresseMac = value;
        } else if (header === "Catégorie") {
          item.category = value;
        } else if (header === "N° Série") {
          item.numeroSerie = value;
        } else if (header === "État") {
          item.etat = value as any;
        } else if (header === "Date Achat") {
          item.dateAchat = value;
        } else if (header === "Fin Garantie") {
          item.finGarantie = value;
        } else if (header === "Notes") {
          item.notes = value;
        }
      });

      // Only add items that have at least a poste
      if (item.poste) {
        data.push(item);
      }
    }

    return data;
  },
};
