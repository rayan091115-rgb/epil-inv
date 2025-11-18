import { Equipment } from "@/types/equipment";
import { qrGenerator } from "./qr-generator";

interface QRLabel {
  qrCode: string;
  poste: string;
  id: string;
  category: string;
  etat: string;
}

const ITEMS_PER_PAGE = 32; // 4 colonnes * 8 lignes

export const generateA4QRSheet = async (
  equipmentList: Equipment[],
  baseUrl: string = "http://epil.local/equip/"
): Promise<void> => {
  // 1. Générer tous les QR codes pour tout l'inventaire
  // On ne limite plus avec .slice(), on prend tout.
  const labels: QRLabel[] = await Promise.all(
    equipmentList.map(async (equipment) => ({
      qrCode: await qrGenerator.generate(equipment.id, baseUrl),
      poste: equipment.poste,
      id: equipment.id.slice(0, 8), // ID court pour l'affichage
      category: equipment.category,
      etat: equipment.etat,
    }))
  );

  // 2. Découper en pages de 32 étiquettes
  const pages: QRLabel[][] = [];
  for (let i = 0; i < labels.length; i += ITEMS_PER_PAGE) {
    pages.push(labels.slice(i, i + ITEMS_PER_PAGE));
  }

  // 3. Construire le HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Inventaire QR - ${new Date().toLocaleDateString()}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0; /* On gère les marges manuellement dans le body/sheet */
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: white;
          font-family: Arial, sans-serif;
          -webkit-print-color-adjust: exact;
        }
        
        .sheet {
          width: 210mm;
          height: 297mm;
          padding: 5mm; /* Marge extérieure 5mm */
          display: grid;
          /* 4 colonnes de 50mm */
          grid-template-columns: repeat(4, 50mm); 
          /* 8 lignes de ~35.8mm (ajusté pour tenir dans 287mm dispos sans saut de page) */
          grid-template-rows: repeat(8, 35.8mm); 
          page-break-after: always;
          /* Centrage de la grille dans la page si l'imprimante ajoute des marges */
          margin: 0 auto; 
        }

        .sheet:last-child {
          page-break-after: auto;
        }
        
        .label {
          width: 50mm;
          height: 35.8mm; /* Correspond à la hauteur de ligne */
          border: 0.2mm solid #ccc; /* Bordure fine pour visualiser la découpe */
          border-radius: 3mm;
          padding: 3mm; /* Marge interne de sécurité */
          
          display: flex;
          flex-direction: row; /* QR à gauche, Texte à droite ou inversement, ici on centre tout */
          align-items: center;
          justify-content: center;
          gap: 2mm;
          
          overflow: hidden;
          position: relative;
          background: white;
        }
        
        .qr-container {
          width: 28mm;
          height: 28mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          image-rendering: pixelated; /* Pour garder le QR net */
        }
        
        .info-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          text-align: left;
          height: 100%;
          overflow: hidden;
        }
        
        .poste {
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 1mm;
          white-space: nowrap;
        }
        
        .meta {
          font-size: 7pt;
          color: #333;
          line-height: 1.2;
        }
        
        .id-tag {
          font-family: monospace;
          font-size: 6pt;
          color: #666;
          margin-top: 1mm;
        }

        /* Status Badge visual indicator */
        .status-dot {
          position: absolute;
          top: 2mm;
          right: 2mm;
          width: 3mm;
          height: 3mm;
          border-radius: 50%;
        }
        .status-OK { background-color: #22c55e; }
        .status-Panne { background-color: #eab308; }
        .status-HS { background-color: #ef4444; }

      </style>
    </head>
    <body>
      ${pages
        .map(
          (pageItems) => `
        <div class="sheet">
          ${pageItems
            .map(
              (label) => `
            <div class="label">
              <div class="status-dot status-${label.etat}"></div>
              
              <div class="qr-container">
                <img src="${label.qrCode}" />
              </div>
              
              <div class="info-container">
                <div class="poste">${label.poste}</div>
                <div class="meta">${label.category}</div>
                <div class="meta">${label.etat}</div>
                <div class="id-tag">#${label.id}</div>
              </div>
            </div>
          `
            )
            .join("")}
            
            ${Array(ITEMS_PER_PAGE - pageItems.length)
              .fill(0)
              .map(
                () => `
              <div class="label" style="border: 0.2mm dashed #eee;"></div>
            `
              )
              .join("")}
        </div>
      `
        )
        .join("")}
    </body>
    </html>
  `;

  // 4. Ouvrir la fenêtre d'impression
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Attendre le chargement des images avant de lancer l'impression
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Optionnel : fermer après impression
        // printWindow.close();
      }, 500);
    };
  }
};
