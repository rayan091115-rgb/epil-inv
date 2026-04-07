import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icons } from "@/components/app/icons";
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

export default function AdminCredentialsModal({ open, onOpenChange, credentials }: AdminCredentialsModalProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copie dans le presse-papier`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <Icons.warning className="h-[18px] w-[18px]" />
            Identifiants administrateur
          </DialogTitle>
          <DialogDescription>
            Ces identifiants ne seront affiches qu une seule fois. Conservez-les dans un endroit securise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 rounded-[24px] bg-secondary/40 p-4">
            {[
              { label: "Email", value: credentials.email },
              { label: "Mot de passe", value: credentials.password },
              { label: "User ID", value: credentials.userId },
            ].map((item) => (
              <div key={item.label}>
                <label className="text-sm font-medium text-foreground">{item.label}</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-[14px] border border-border/70 bg-background px-3 py-2 text-sm break-all">
                    {item.value}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.value, item.label)}>
                    Copier
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <strong>Important :</strong> ces identifiants donnent un acces complet au systeme.
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            J ai sauvegarde les identifiants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
