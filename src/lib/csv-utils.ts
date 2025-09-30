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
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const item: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || "";
        switch (header) {
          case "Poste":
            item.poste = value;
            break;
          case "Catégorie":
            item.category = value;
            break;
          case "Marque":
            item.marque = value;
            break;
          case "Modèle":
            item.modele = value;
            break;
          case "N° Série":
            item.numeroSerie = value;
            break;
          case "État":
            item.etat = value as any;
            break;
          case "Date Achat":
            item.dateAchat = value;
            break;
          case "Fin Garantie":
            item.finGarantie = value;
            break;
          case "Notes":
            item.notes = value;
            break;
        }
      });

      if (item.poste && item.category) {
        data.push(item);
      }
    }

    return data;
  },
};
