"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { FarnaviLogo } from "@/components/farnavi-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientPanel, Field } from "@/components/shared";
import { apiLogin, apiLoginDemo, apiRegister } from "@/lib/api/workspace-client";
import { Loader2, Sparkles, Lock, UserPlus, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeAuthRedirect = () => {
    try {
      localStorage.removeItem("farnavi_store_v35");
    } catch (err) {
      console.warn("[login] localStorage clear warning:", err);
    }
    window.location.assign("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const res = await apiRegister(name.trim(), email.trim(), password);
        toast.success(`Welcome to Farnavi, ${res.user.name}!`);
      } else {
        const res = await apiLogin(email.trim(), password);
        toast.success(`Welcome back, ${res.user.name}!`);
      }
      completeAuthRedirect();
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await apiLoginDemo();
      toast.success(`Signed into demo workspace (${res.user.name})`);
      completeAuthRedirect();
    } catch (err: any) {
      setError(err?.message || "Could not start demo workspace");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <GradientPanel className="w-full max-w-md p-1.5">
        <div className="glass rounded-xl bg-white/90 p-8">
          <div className="flex justify-center">
            <FarnaviLogo size="lg" />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Your resumes, personal websites & global career tools — synced securely to your account.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors",
                mode === "signin" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors",
                mode === "register" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" /> Create Account
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <Field label="Full Name">
                <Input
                  type="text"
                  required
                  minLength={2}
                  placeholder="Sara Mohammadi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            )}
            <Field label="Email">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
              ) : mode === "register" ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" disabled={busy} className="w-full rounded-full" onClick={handleDemo}>
            <Lock className="mr-2 h-3.5 w-3.5" />
            Continue with Demo Workspace
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Encrypted session cookies · Multi-user workspace isolation.
          </p>
        </div>
      </GradientPanel>
    </div>
  );
}