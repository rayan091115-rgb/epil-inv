import { Equipment } from "@/types/equipment";
import { qrGenerator } from "./qr-generator";

interface QRLabel {
  qrCode: string;
  poste: string;
  id: string;
  category: string;
  etat: string;
}

export const generateA4QRSheet = async (
  equipmentList: Equipment[],
  baseUrl: string = "http://epil.local/equip/"
): Promise<void> => {
  // Take first 16 equipment
  const selectedEquipment = equipmentList.slice(0, 16);
  
  // Generate QR codes for all equipment
  const labels: QRLabel[] = await Promise.all(
    selectedEquipment.map(async (equipment) => ({
      qrCode: await qrGenerator.generate(equipment.id, baseUrl),
      poste: equipment.poste,
      id: equipment.id.slice(0, 8),
      category: equipment.category,
      etat: equipment.etat,
    }))
  );

  // Create HTML for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Étiquettes QR - ${new Date().toLocaleDateString()}</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          width: 210mm;
          height: 297mm;
          padding: 5mm;
        }
        
        .sheet {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(4, 1fr);
          gap: 2mm;
          position: relative;
        }
        
        /* Vertical center divider */
        .sheet::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 1px;
          height: 100%;
          background: #000;
          border-left: 2px dashed #666;
          z-index: 10;
        }
        
        .label {
          border: 1px solid #ddd;
          padding: 3mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: white;
          page-break-inside: avoid;
        }
        
        .qr-code {
          width: 35mm;
          height: 35mm;
          margin-bottom: 2mm;
        }
        
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .poste {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 1mm;
          word-wrap: break-word;
          max-width: 100%;
        }
        
        .info {
          font-size: 7pt;
          color: #666;
          line-height: 1.3;
        }
        
        .etat {
          font-size: 7pt;
          padding: 1mm 2mm;
          border-radius: 2mm;
          margin-top: 1mm;
        }
        
        .etat-ok {
          background: #d4edda;
          color: #155724;
        }
        
        .etat-panne {
          background: #fff3cd;
          color: #856404;
        }
        
        .etat-hs {
          background: #f8d7da;
          color: #721c24;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 5mm;
          }
          
          .sheet {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        ${labels
          .map(
            (label) => `
          <div class="label">
            <div class="qr-code">
              <img src="${label.qrCode}" alt="QR Code ${label.poste}" />
            </div>
            <div class="poste">${label.poste}</div>
            <div class="info">${label.category}</div>
            <div class="info">ID: ${label.id}</div>
            <div class="etat etat-${label.etat.toLowerCase()}">${label.etat}</div>
          </div>
        `
          )
          .join("")}
      </div>
    </body>
    </html>
  `;

  // Open print window
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};
