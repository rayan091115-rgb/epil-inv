import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://eqnzuuefxcrydmqxselk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbnp1dWVmeGNyeWRtcXhzZWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc5NjUsImV4cCI6MjA3NDc1Mzk2NX0.0XVwA4Ag2O_9oacdRcdH3lcAAK_I7stLIvbuRaxKg58";
const ADMIN_EMAIL = "epil@gmail.com";
const ADMIN_PASSWORD = "epil@gmail.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Equipment data extracted from the document
const equipment = [
  {
    poste: "PC 1",
    marque: "HP",
    modele: null,
    processeur: "Intel Core i3",
    ram: "DDR3",
    etat: "Panne",
    notes: "Ne détecte pas Windows sur la clé USB. Ventilateur.",
  },
  {
    poste: "PC 2",
    marque: "Lenovo",
    modele: null,
    processeur: "Intel Pentium",
    ram: "DDR3",
    etat: "Panne",
    notes: "Processeur manquant. Barrette de RAM DDR3.",
  },
  {
    poste: "PC 3",
    marque: "Acer",
    modele: null,
    processeur: "AMD",
    ram: "2x 512Mo DDR2",
    etat: "Panne",
    notes: "Disque dur inclus. Carte graphique. Pas d'affichage.",
  },
  {
    poste: "PC 4",
    marque: "Dell",
    modele: "Optiplex 790",
    processeur: null,
    ram: "DDR3",
    etat: "Panne",
    notes: "RAM DDR3 ajoutée. Disque dur. Redémarrage répétitif. Réinstallation Windows 7.",
  },
  {
    poste: "PC 5",
    marque: null,
    modele: null,
    processeur: "Intel Core 2 vPro",
    ram: "2x 2Go DDR2",
    etat: "OK",
    notes: "Disque dur piqué. Poussière. Disque non détecté. Carte graphique.",
  },
  {
    poste: "PC 6",
    marque: "HP",
    modele: null,
    processeur: "Intel Core 2 Duo",
    ram: "1x 1Go DDR3",
    etat: "OK",
    notes: "Disque dur.",
  },
  {
    poste: "PC 7",
    marque: "Acer",
    modele: "Veriton",
    processeur: null,
    ram: "DDR3",
    etat: "OK",
    notes: "Disque dur. RAM DDR3. Windows 10.",
  },
  {
    poste: "PC 8",
    marque: "HP",
    modele: null,
    processeur: "Intel Core i5 3570",
    ram: "2x DDR3",
    etat: "OK",
    notes: "Disque dur. Windows 10. RAM liée au disque dur.",
  },
  {
    poste: "PC 9",
    marque: "Dell",
    modele: "Optiplex 790",
    processeur: null,
    ram: "1x 2Go DDR3",
    etat: "Panne",
    notes: "Disque dur cassé. Disque dur ajouté. Pile bouton morte.",
  },
  {
    poste: "PC 10",
    marque: null,
    modele: null,
    processeur: null,
    ram: "4x 1Go DDR2",
    etat: "OK",
    notes: "Disque dur. Pile bouton.",
  },
  {
    poste: "PC 11",
    marque: "HP",
    modele: "ProDesk",
    processeur: null,
    ram: "DDR3",
    etat: "OK",
    notes: "Disque dur. RAM ajoutée. Processeur. Pile bouton. Lent. Mot de passe BIOS.",
  },
  {
    poste: "PC 12",
    marque: null,
    modele: null,
    processeur: null,
    ram: "2x 4Go DDR3",
    etat: "OK",
    notes: "Disque dur. Pile bouton.",
  },
  {
    poste: "PC 13",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: "2x DDR3",
    etat: "OK",
    notes: "Disque dur. Pile bouton morte. Pile bouton changée.",
  },
  {
    poste: "PC 14",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: "3x 2Go DDR3 + 1x 4Go DDR3",
    etat: "OK",
    notes: "Disque dur. Pile bouton.",
  },
  {
    poste: "PC 15",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "2x 2Go DDR2",
    etat: "OK",
    notes: "Disque dur. Pile bouton.",
  },
  {
    poste: "PC 16",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "2x 2Go DDR3",
    etat: "Panne",
    notes: "Disque dur. Ne démarre pas (bip bip). Pile bouton.",
  },
  {
    poste: "PC 17",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: "2x DDR3",
    etat: "Panne",
    notes: "Pile bouton. Disque dur. Processeur. Ne démarre pas (bip bip).",
  },
  {
    poste: "PC 18",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: "DDR3",
    etat: "Panne",
    notes: "Boîtier plié. Disque dur. Bip au démarrage. Pas d'affichage.",
  },
  {
    poste: "PC 19",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "2x 2Go DDR3",
    etat: "Panne",
    notes: "Disque dur du PC 18 ajouté. Pile bouton. Bip au démarrage. Pas d'affichage.",
  },
  {
    poste: "PC 20",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: "2x 2Go DDR3",
    etat: "OK",
    notes: "Disque dur. Pile bouton.",
  },
  {
    poste: "PC 21",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "2x 4Go DDR3",
    etat: "OK",
    notes: "Disque dur. Pile bouton morte. Pile bouton ajoutée.",
  },
  {
    poste: "PC 22",
    marque: "Lenovo",
    modele: null,
    processeur: null,
    ram: "2x 4Go DDR4",
    etat: "Panne",
    notes: "Disque dur. Pile bouton. Ne détecte pas un pilote pour le lecteur DVD.",
  },
  {
    poste: "PC 23",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "DDR3",
    etat: "Panne",
    notes: "Disque dur ajouté. Lecteur DVD ajouté. Pas d'affichage. Ne détecte pas le clavier/souris.",
  },
  {
    poste: "PC 24",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "DDR3",
    etat: "Panne",
    notes: "Disque dur ajouté. Pile bouton. Ne démarre pas.",
  },
  {
    poste: "PC 25",
    marque: "Lenovo",
    modele: null,
    processeur: null,
    ram: "DDR2",
    etat: "Panne",
    notes: "Disque dur ajouté. Bip bip.",
  },
  {
    poste: "PC 26",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: null,
    etat: "Panne",
    notes: "Pas d'alimentation.",
  },
  {
    poste: "PC 27",
    marque: null,
    modele: null,
    processeur: null,
    ram: "DDR3",
    etat: "OK",
    notes: "RAM DDR3 ajoutée. Disque dur ajouté. Pile bouton.",
  },
  {
    poste: "PC 28",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: null,
    etat: "Panne",
    notes: "Boîtier bloqué, ne peut pas l'ouvrir. Pas d'affichage.",
  },
  {
    poste: "PC 29",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "2x 2Go DDR2",
    etat: "Panne",
    notes: "Disque dur inclus. Pile bouton. Bip bip.",
  },
  {
    poste: "PC 30",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "DDR3",
    etat: "Panne",
    notes: "Disque dur ajouté. DDR3 ajouté. Bip bip. À vérifier.",
  },
  {
    poste: "PC 30b",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "DDR3",
    etat: "Panne",
    notes: "RAM. Processeur. Alimentation. (doublon numéro dans document)",
  },
  {
    poste: "PC 31",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: null,
    etat: "Panne",
    notes: "RAM. Processeur. Alimentation.",
  },
  {
    poste: "PC 32",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: null,
    etat: "Panne",
    notes: "RAM. Processeur. Alimentation.",
  },
  {
    poste: "PC 33",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: "4Go DDR3",
    capacite_dd: "500 Go",
    etat: "OK",
    notes: "Disque dur 500Go. Pile bouton. PC fonctionnel.",
  },
  {
    poste: "PC 34",
    marque: "Lenovo",
    modele: null,
    processeur: null,
    ram: "2x 4Go",
    etat: "OK",
    notes: "Disque dur. Pile bouton. PC fonctionnel.",
  },
  {
    poste: "PC 35",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: null,
    etat: "Panne",
    notes: "Pas de RAM. Alimentation détachée, ne marche pas quand on branche.",
  },
  {
    poste: "PC 36",
    marque: null,
    modele: null,
    processeur: null,
    ram: "2x 4Go",
    capacite_dd: "500 Go",
    etat: "OK",
    notes: "Disque dur 500Go. PC fonctionnel.",
  },
  {
    poste: "PC 37",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "12 Go",
    etat: "Panne",
    notes: "Pile bouton. Disque dur. Pas d'affichage.",
  },
  {
    poste: "PC 38",
    marque: "HP",
    modele: "Compaq",
    processeur: null,
    ram: "2 Go",
    capacite_dd: "160 Go",
    etat: "Panne",
    notes: "PC non fonctionnel.",
  },
  {
    poste: "PC 39",
    marque: "Acer",
    modele: null,
    processeur: null,
    ram: "8 Go",
    etat: "Panne",
    notes: "Pile bouton. Pas de disque dur visible. Alimentation à changer.",
  },
  {
    poste: "PC 40",
    marque: "Dell",
    modele: null,
    processeur: "Intel Core i5",
    ram: "2Go DDR3",
    etat: "Panne",
    notes: "Pas de disque. Barrette de RAM DDR3 de 2Go.",
  },
  {
    poste: "PC 41",
    marque: "HP",
    modele: null,
    processeur: null,
    ram: "4Go DDR3",
    etat: "OK",
    notes: "Disque dur. Pile bouton. Ne détecte pas la clé USB Windows.",
  },
  {
    poste: "PC 42",
    marque: null,
    modele: null,
    processeur: null,
    ram: "2x 4Go DDR3",
    etat: "OK",
    notes: "Disque dur ajouté. Pas de pile bouton, pile ajoutée. À revérifier.",
  },
  {
    poste: "PC 43",
    marque: "Dell",
    modele: null,
    processeur: null,
    ram: "1x 2Go DDR3",
    etat: "Panne",
    notes: "Disque dur. BIOS bloqué.",
  },
];

// Mapping: PC index (0-based) → image numbers
const imageMapping = [
  [1],           // PC 1
  [2],           // PC 2
  [3],           // PC 3
  [4, 5, 6],     // PC 4
  [7, 8, 9],     // PC 5
  [10, 11],      // PC 6
  [12, 13],      // PC 7
  [14, 15],      // PC 8
  [16, 17, 18],  // PC 9
  [19, 20, 21],  // PC 10
  [22, 23],      // PC 11
  [24, 25],      // PC 12
  [26, 27],      // PC 13
  [28, 29],      // PC 14
  [30, 31],      // PC 15
  [32],          // PC 16
  [33],          // PC 17
  [34],          // PC 18
  [35, 36],      // PC 19
  [37, 38],      // PC 20
  [39],          // PC 21
  [40, 41],      // PC 22
  [42],          // PC 23
  [43],          // PC 24
  [44],          // PC 25
  [45],          // PC 26
  [46, 47],      // PC 27
  [48],          // PC 28
  [49, 50],      // PC 29
  [51],          // PC 30
  [52, 53],      // PC 30b
  [54, 55],      // PC 31
  [56, 57],      // PC 32
  [58, 59],      // PC 33
  [60, 61],      // PC 34
  [62, 63],      // PC 35
  [64],          // PC 36
  [65, 66],      // PC 37
  [67, 68],      // PC 38
  [69, 70],      // PC 39
  [71, 72],      // PC 40
  [73, 74],      // PC 41
  [75],          // PC 42
  [76, 77],      // PC 43
];

const IMAGES_DIR = resolve(__dirname, "../images");

async function main() {
  console.log("🔐 Connexion admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError) {
    console.error("❌ Erreur de connexion:", authError.message);
    process.exit(1);
  }
  console.log("✅ Connecté en tant que:", authData.user.email);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < equipment.length; i++) {
    const eq = equipment[i];
    const images = imageMapping[i] || [];

    // Build insert payload
    const insertPayload = {
      poste: eq.poste,
      category: "PC",
      marque: eq.marque || null,
      modele: eq.modele || null,
      processeur: eq.processeur || null,
      ram: eq.ram || null,
      capacite_dd: eq.capacite_dd || null,
      etat: eq.etat,
      notes: eq.notes || null,
      alimentation: true,
    };

    // Insert equipment
    const { data: inserted, error: insertError } = await supabase
      .from("equipment")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError) {
      console.error(`❌ Erreur insertion ${eq.poste}:`, insertError.message);
      errorCount++;
      continue;
    }

    const equipmentId = inserted.id;
    console.log(`✅ ${eq.poste} inséré (${equipmentId})`);
    successCount++;

    // Upload photos
    for (const imgNum of images) {
      const imgPath = resolve(IMAGES_DIR, `image${imgNum}.jpg`);
      let fileBuffer;
      try {
        fileBuffer = readFileSync(imgPath);
      } catch (e) {
        console.warn(`  ⚠️  image${imgNum}.jpg introuvable, ignorée`);
        continue;
      }

      const storagePath = `${equipmentId}/image${imgNum}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("equipment_photos")
        .upload(storagePath, fileBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.warn(`  ⚠️  Upload image${imgNum}.jpg échoué:`, uploadError.message);
      } else {
        console.log(`  📸 image${imgNum}.jpg uploadée`);
      }
    }
  }

  console.log("\n=============================");
  console.log(`✅ ${successCount} PCs insérés`);
  if (errorCount > 0) console.log(`❌ ${errorCount} erreurs`);
  console.log("=============================");

  await supabase.auth.signOut();
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
