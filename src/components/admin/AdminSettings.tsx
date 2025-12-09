import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Key, AlertTriangle, CheckCircle, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminCredentialsModal from "./AdminCredentialsModal";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    userId: string;
  } | null>(null);

  const handleGenerateAdmin = async () => {
    if (!confirm("⚠️ ATTENTION: Cette action va générer un nouveau compte administrateur. Les identifiants ne seront affichés qu'UNE SEULE FOIS. Êtes-vous sûr de vouloir continuer ?")) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-admin");

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setCredentials(data.credentials);
      setShowCredentials(true);

      // Also log to console for backup
      console.log("=".repeat(80));
      console.log("🔐 IDENTIFIANTS ADMINISTRATEUR - CONSERVEZ-LES !");
      console.log("=".repeat(80));
      console.log(`📧 Email: ${data.credentials.email}`);
      console.log(`🔑 Mot de passe: ${data.credentials.password}`);
      console.log(`🆔 User ID: ${data.credentials.userId}`);
      console.log("=".repeat(80));

      toast.success("Compte administrateur créé avec succès !");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la création du compte admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Account Generation */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Génération du compte Administrateur
          </CardTitle>
          <CardDescription>
            Créez un compte super-administrateur avec des identifiants sécurisés générés automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Important</h4>
                <ul className="mt-1 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Les identifiants ne seront affichés qu'<strong>une seule fois</strong></li>
                  <li>• Un seul compte administrateur peut exister</li>
                  <li>• Conservez les identifiants dans un gestionnaire de mots de passe sécurisé</li>
                  <li>• Le mot de passe contient 20 caractères avec majuscules, minuscules, chiffres et symboles</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGenerateAdmin} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Génération en cours...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Générer le compte Administrateur
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statut de sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Row Level Security (RLS)</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Activé</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Authentification requise</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Activé</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Rôles et permissions</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Configuré</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Stockage sécurisé des photos</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Activé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Aperçu des permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Ressource</th>
                  <th className="text-center py-2 px-3">Admin</th>
                  <th className="text-center py-2 px-3">Modérateur</th>
                  <th className="text-center py-2 px-3">Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Équipements - Lecture</td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Équipements - Création</td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Équipements - Modification</td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Équipements - Suppression</td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Gestion des utilisateurs</td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Logs système</td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Panel Admin</td>
                  <td className="text-center py-2 px-3"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                  <td className="text-center py-2 px-3"><span className="text-red-500">✗</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Modal */}
      {credentials && (
        <AdminCredentialsModal
          open={showCredentials}
          onOpenChange={setShowCredentials}
          credentials={credentials}
        />
      )}
    </div>
  );
}
