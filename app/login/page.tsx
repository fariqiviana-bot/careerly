"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FarnaviLogo } from "@/components/farnavi-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientPanel, Field } from "@/components/shared";
import { Sparkles } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const go = () => { toast.success("Welcome back to Farnavi, Viana!"); router.push("/"); };
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <GradientPanel className="w-full max-w-md p-1.5">
        <div className="glass rounded-xl bg-white/85 p-8">
          <div className="flex justify-center">
            <FarnaviLogo size="lg" />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">Your resumes, personal websites & global career tools — in one calm place.</p>
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); go(); }}>
            <Field label="Email"><Input type="email" defaultValue="fariqiviana@gmail.com" /></Field>
            <Field label="Password"><Input type="password" placeholder="••••••••" /></Field>
            <Button type="submit" className="w-full rounded-full">Continue</Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
          <Button variant="outline" className="w-full rounded-full" onClick={go}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Continue with Google
          </Button>
          <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground"><Sparkles className="h-3 w-3" />We never share your data or use it for AI training.</p>
        </div>
      </GradientPanel>
    </div>
  );
}