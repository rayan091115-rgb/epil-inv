import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AdminCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: {
    email: string;
    password: string;
    userId: string;
  };
}

export default function AdminCredentialsModal({
  open,
  onOpenChange,
  credentials,
}: AdminCredentialsModalProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Identifiants Administrateur
          </DialogTitle>
          <DialogDescription>
            ⚠️ Ces identifiants ne seront affichés qu'une seule fois. Conservez-les
            de manière sécurisée !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-background rounded text-sm">
                  {credentials.email}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credentials.email, "Email")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Mot de passe</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-background rounded text-sm break-all">
                  {credentials.password}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(credentials.password, "Mot de passe")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">User ID</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-background rounded text-sm text-xs">
                  {credentials.userId}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credentials.userId, "User ID")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Important :</strong> Ces identifiants donnent un accès complet
              au système. Conservez-les dans un gestionnaire de mots de passe sécurisé.
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            J'ai sauvegardé les identifiants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}