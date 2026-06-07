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

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — SentinelAI" },
      { name: "description", content: "Create your SentinelAI account." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    await signUp(name.trim(), email.trim(), password);
    navigate({ to: "/dashboard" });
  }

  function oauth(provider: string) {
    toast.success(`Signing up with ${provider}…`);
    void signIn(`demo@${provider.toLowerCase()}.com`, "x").then(() => navigate({ to: "/dashboard" }));
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start analyzing deployments in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/signin" className="text-foreground hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Work Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={fieldCls} />
        </div>
        <button type="submit" disabled={busy} className={primaryBtnCls}>
          {busy ? "Creating account…" : "Create Account"}
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
