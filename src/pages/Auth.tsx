import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { IconBadge, Icons } from "@/components/app/icons";
import { PageShell, SurfaceBadge } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caracteres" }),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [navigate, user]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }

      return false;
    }
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : error.message,
        variant: "destructive",
      });
      return;
    }

    navigate("/");
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Compte existant",
          description: "Cet email est deja enregistre. Connectez-vous avec ce compte.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur d inscription",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Compte cree",
      description: "Vous pouvez maintenant acceder a l application.",
    });
    navigate("/");
  };

  return (
    <PageShell className="flex items-center justify-center">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[32px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(241,243,246,0.9))] p-8 shadow-[0_28px_80px_rgba(16,24,40,0.10)] lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <SurfaceBadge>Inventaire produit</SurfaceBadge>
            <div className="space-y-3">
              <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-foreground">
                Une entree plus nette pour un parc plus facile a piloter.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Acces technicien, inventaire unifie, scans QR et outils IA dans une interface plus propre et plus stable.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Inventaire", text: "Recherche rapide, detail propre et actions mieux alignees.", icon: "inventory" as const },
              { title: "QR", text: "Verification terrain plus lisible et export direct.", icon: "qr" as const },
              { title: "Admin", text: "Espace unifie pour utilisateurs, activite et securite.", icon: "admin" as const },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-border/70 bg-background/80 p-5">
                <IconBadge icon={item.icon} className="mb-4 h-12 w-12" />
                <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-lg">
          <CardHeader className="space-y-4 border-b border-border/70 pb-6 text-left">
            <div className="flex items-center gap-4">
              <IconBadge icon="lock" className="h-12 w-12 rounded-[18px] bg-foreground text-background" iconClassName="h-5 w-5" />
              <div className="space-y-1">
                <CardTitle className="text-2xl">Inventaire CIEL</CardTitle>
                <CardDescription>Acces reserve aux techniciens et administrateurs.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Icons.mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="technicien@epil.local"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <div className="relative">
                      <Icons.lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Icons.refresh className="h-[18px] w-[18px] animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <Icons.logout className="h-[18px] w-[18px]" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Icons.mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="technicien@epil.local"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Icons.lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={loading}
                        placeholder="Minimum 6 caracteres"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Icons.refresh className="h-[18px] w-[18px] animate-spin" />
                        Creation...
                      </>
                    ) : (
                      <>
                        <Icons.plus className="h-[18px] w-[18px]" />
                        Creer un compte
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};

export default Auth;
