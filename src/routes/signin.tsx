import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AuthLayout,
  Divider,
  GithubIcon,
  GoogleIcon,
  fieldCls,
  labelCls,
  oauthBtnCls,
  primaryBtnCls,
} from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — SentinelAI" },
      { name: "description", content: "Sign in to SentinelAI." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }
    setBusy(true);
    await signIn(email.trim(), password);
    navigate({ to: "/dashboard" });
  }

  function oauth(provider: string) {
    toast.success(`Signing in with ${provider}…`);
    void signIn(`demo@${provider.toLowerCase()}.com`, "x").then(() => navigate({ to: "/dashboard" }));
  }

  return (
    <AuthLayout
      title="Sign in to SentinelAI"
      subtitle="Welcome back. Enter your details below."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="text-foreground hover:underline">Sign up</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={fieldCls}
          />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldCls}
          />
          <div className="text-right mt-1.5">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <button type="submit" disabled={busy} className={primaryBtnCls}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <Divider label="or continue with" />

      <div className="space-y-2">
        <button type="button" onClick={() => oauth("GitHub")} className={oauthBtnCls}>
          <GithubIcon className="h-4 w-4" /> Continue with GitHub
        </button>
        <button type="button" onClick={() => oauth("Google")} className={oauthBtnCls}>
          <GoogleIcon className="h-4 w-4" /> Continue with Google
        </button>
      </div>
    </AuthLayout>
  );
}
