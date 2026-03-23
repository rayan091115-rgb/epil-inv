import QRCode from "qrcode";
import JSZip from "jszip";

const DEFAULT_BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin + "/equip/";

export const qrGenerator = {
  generate: async (equipmentId: string, baseUrl: string = DEFAULT_BASE_URL): Promise<string> => {
    try {
      // Ensure baseUrl ends with a slash
      const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const url = `${normalizedBaseUrl}${equipmentId}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw error;
    }
  },

  downloadQR: (dataUrl: string, filename: string): void => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  downloadMultipleQR: async (equipmentItems: { id: string; poste: string }[], baseUrl: string = DEFAULT_BASE_URL): Promise<void> => {
    const zip = new JSZip();
    const folder = zip.folder("qr_codes");

    for (const item of equipmentItems) {
      const qrCodeDataUrl = await qrGenerator.generate(item.id, baseUrl);
      // Remove the data:image/png;base64, part
      const base64Data = qrCodeDataUrl.split(',')[1];
      folder?.file(`QR_${item.poste.replace(/[^a-z0-9]/gi, '_')}.png`, base64Data, { base64: true });
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventaire_qr_codes_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
