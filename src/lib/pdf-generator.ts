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
  const labels: QRLabel[] = await Promise.all(
    equipmentList.map(async (equipment) => ({
      qrCode: await qrGenerator.generate(equipment.id, baseUrl),
      poste: equipment.poste,
      id: equipment.id.slice(0, 8),
      category: equipment.category,
      etat: equipment.etat,
    }))
  );

  const pages: QRLabel[][] = [];
  for (let i = 0; i < labels.length; i += ITEMS_PER_PAGE) {
    pages.push(labels.slice(i, i + ITEMS_PER_PAGE));
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Inventaire QR - ${new Date().toLocaleDateString()}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
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
          padding: 12mm 5mm; 
          display: grid;
          grid-template-columns: repeat(4, 50mm); 
          grid-template-rows: repeat(8, 33.3mm); 
          page-break-after: always;
          margin: 0 auto; 
        }

        .sheet:last-child {
          page-break-after: auto;
        }
        
        .label {
          width: 50mm;
          height: 33.3mm; /* Nouvelle hauteur */
          border: 0.2mm solid #ccc;
          border-radius: 3mm;
          padding: 2mm; /* Padding interne légèrement réduit */
          
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 2mm;
          
          overflow: hidden;
          position: relative;
          background: white;
        }
        
        .qr-container {
          width: 26mm; /* QR code un peu plus petit pour tenir */
          height: 26mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          image-rendering: pixelated;
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

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};
