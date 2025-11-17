import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSettings() {
  const handleCreateAdmin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-admin-account");

      if (error) throw error;

      // Show credentials in alert
      alert(
        `⚠️ CONSERVEZ CES IDENTIFIANTS ⚠️\n\n` +
          `Email: ${data.credentials.email}\n` +
          `Mot de passe: ${data.credentials.password}\n\n` +
          `Ces identifiants ne seront affichés qu'une seule fois!`
      );

      console.log("=".repeat(80));
      console.log("IDENTIFIANTS ADMINISTRATEUR");
      console.log("=".repeat(80));
      console.log(`Email: ${data.credentials.email}`);
      console.log(`Mot de passe: ${data.credentials.password}`);
      console.log(`User ID: ${data.credentials.userId}`);
      console.log("=".repeat(80));
      console.log("⚠️ CONSERVEZ CES IDENTIFIANTS DE MANIÈRE SÉCURISÉE ⚠️");
      console.log("=".repeat(80));

      toast.success("Compte administrateur créé avec succès");
    } catch (error: any) {
      toast.error("Erreur lors de la création du compte admin");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gestion des comptes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Créer un compte administrateur</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Génère automatiquement un compte administrateur avec des identifiants
              sécurisés. Les identifiants seront affichés une seule fois.
            </p>
            <Button onClick={handleCreateAdmin} variant="default">
              <Shield className="h-4 w-4 mr-2" />
              Créer un compte admin
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Protection des mots de passe</h3>
              <p className="text-sm text-muted-foreground mb-2">
                La protection contre les mots de passe compromis doit être activée
                dans les paramètres d'authentification Supabase.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir la documentation
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}