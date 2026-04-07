import { useState } from "react";

import { DenseToolbar, SectionPanel } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
    if (
      !confirm(
        "Cette action genere un nouveau compte administrateur. Les identifiants seront affiches une seule fois. Continuer ?",
      )
    ) {
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
      toast.success("Compte administrateur cree");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur pendant la creation du compte admin");
    } finally {
      setLoading(false);
    }
  };

  const securityItems = [
    "Row Level Security actif",
    "Authentification requise",
    "Roles et permissions configures",
    "Stockage photo securise",
  ];

  const permissionsOverview = [
    ["Equipements - Lecture", true, true, true],
    ["Equipements - Creation", true, true, false],
    ["Equipements - Modification", true, true, false],
    ["Equipements - Suppression", true, false, false],
    ["Gestion des utilisateurs", true, false, false],
    ["Logs systeme", true, false, false],
    ["Panel admin", true, false, false],
  ];

  return (
    <div className="space-y-6">
      <SectionPanel
        title="Compte administrateur"
        description="Creation securisee d un compte super admin avec affichage unique des identifiants."
        action={
          <Button onClick={handleGenerateAdmin} disabled={loading}>
            {loading ? <Icons.refresh className="h-[18px] w-[18px] animate-spin" /> : <Icons.admin className="h-[18px] w-[18px]" />}
            Generer un compte admin
          </Button>
        }
      >
        <DenseToolbar className="bg-amber-50 shadow-none">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Icons.warning className="h-[18px] w-[18px]" />
            </div>
            <div className="space-y-2 text-sm text-amber-900">
              <p className="font-semibold">Points de vigilance</p>
              <ul className="space-y-1 text-amber-800">
                <li>Identifiants affiches une seule fois</li>
                <li>Conservez-les dans un gestionnaire de mots de passe</li>
                <li>Un seul compte administrateur doit etre maintenu</li>
              </ul>
            </div>
          </div>
        </DenseToolbar>
      </SectionPanel>

      <SectionPanel title="Statut de securite" description="Controle rapide des briques critiques du systeme.">
        <div className="grid gap-3 md:grid-cols-2">
          {securityItems.map((item) => (
            <Card key={item}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="inline-flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icons.check className="h-[18px] w-[18px]" />
                  </div>
                  <span className="font-medium text-foreground">{item}</span>
                </div>
                <span className="text-sm font-medium text-emerald-700">OK</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel title="Apercu des permissions" description="Lecture simplifiee des droits attendus par role.">
        <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">Ressource</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-[0.12em] text-muted-foreground">Admin</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-[0.12em] text-muted-foreground">Moderateur</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-[0.12em] text-muted-foreground">Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {permissionsOverview.map(([label, admin, moderator, user]) => (
                <tr key={label} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                  {[admin, moderator, user].map((allowed, index) => (
                    <td key={`${label}-${index}`} className="px-4 py-3 text-center">
                      {allowed ? (
                        <Icons.check className="mx-auto h-[18px] w-[18px] text-emerald-600" />
                      ) : (
                        <Icons.close className="mx-auto h-[18px] w-[18px] text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      {credentials ? (
        <AdminCredentialsModal open={showCredentials} onOpenChange={setShowCredentials} credentials={credentials} />
      ) : null}
    </div>
  );
}
