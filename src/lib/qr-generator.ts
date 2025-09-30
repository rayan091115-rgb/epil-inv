import QRCode from "qrcode";

const DEFAULT_BASE_URL = "http://epil.local/equip/";

export const qrGenerator = {
  generate: async (equipmentId: string, baseUrl: string = DEFAULT_BASE_URL): Promise<string> => {
    try {
      const url = `${baseUrl}${equipmentId}`;
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

  downloadMultipleQR: async (equipmentIds: string[], baseUrl: string = DEFAULT_BASE_URL): Promise<void> => {
    // For now, download individually. In production, you'd use JSZip
    for (const id of equipmentIds) {
      const qrCode = await qrGenerator.generate(id, baseUrl);
      qrGenerator.downloadQR(qrCode, `qr_${id}`);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  },
};
