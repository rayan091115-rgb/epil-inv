import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { Lock, Mail } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }),
  password: z
    .string()
    .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: "Erreur de connexion",
        description:
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect"
            : error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Compte existant",
          description: "Cet email est déjà enregistré. Veuillez vous connecter.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Compte créé",
        description: "Vous pouvez maintenant vous connecter.",
      });
      navigate("/");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #d0d6e0",
    borderRadius: "6px",
    padding: "9px 12px 9px 36px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    fontFeatureSettings: '"cv01" 1, "ss03" 1',
    color: "#1a1a1e",
    outline: "none",
    transition: "border-color 0.12s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 510,
    color: "#3c3c43",
    marginBottom: "6px",
    letterSpacing: "-0.13px",
    fontFeatureSettings: '"cv01" 1, "ss03" 1',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#f7f8f8" }}
    >
      {/* Card */}
      <div
        className="w-full animate-scale-in"
        style={{
          maxWidth: "400px",
          background: "#ffffff",
          border: "1px solid #e6e6e6",
          borderRadius: "12px",
          boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 24px",
          padding: "32px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            className="mx-auto mb-4 flex items-center justify-center rounded-xl"
            style={{ width: "48px", height: "48px", background: "#5e6ad2" }}
          >
            <Lock style={{ width: "20px", height: "20px", color: "#ffffff" }} />
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 590,
              color: "#1a1a1e",
              letterSpacing: "-0.4px",
              marginBottom: "6px",
              fontFeatureSettings: '"cv01" 1, "ss03" 1',
            }}
          >
            Inventaire CIEL
          </h1>
          <p style={{ fontSize: "13px", color: "#8a8f98", letterSpacing: "-0.13px" }}>
            Accès réservé aux techniciens
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          {/* Tab switcher */}
          <TabsList
            className="ln-tabs w-full mb-6"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
          >
            <TabsTrigger value="signin" className="ln-tab" style={{ justifyContent: "center" }}>
              Connexion
            </TabsTrigger>
            <TabsTrigger value="signup" className="ln-tab" style={{ justifyContent: "center" }}>
              Inscription
            </TabsTrigger>
          </TabsList>

          {/* Sign In */}
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="signin-email" style={labelStyle}>Email</label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#8a8f98" }} />
                  <input
                    id="signin-email"
                    type="email"
                    placeholder="technicien@epil.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7170ff"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(113,112,255,0.18)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d6e0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signin-password" style={labelStyle}>Mot de passe</label>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#8a8f98" }} />
                  <input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7170ff"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(113,112,255,0.18)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d6e0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="ln-btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "14px", marginTop: "4px", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <>
                    <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                    Connexion…
                  </>
                ) : "Se connecter"}
              </button>
            </form>
          </TabsContent>

          {/* Sign Up */}
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="signup-email" style={labelStyle}>Email</label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#8a8f98" }} />
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="technicien@epil.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7170ff"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(113,112,255,0.18)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d6e0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-password" style={labelStyle}>Mot de passe</label>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#8a8f98" }} />
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Minimum 6 caractères"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7170ff"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(113,112,255,0.18)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d6e0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="ln-btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "14px", marginTop: "4px", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <>
                    <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                    Création…
                  </>
                ) : "Créer un compte"}
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Auth;