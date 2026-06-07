import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthLayout, fieldCls, labelCls, primaryBtnCls } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — SentinelAI" },
      { name: "description", content: "Reset your SentinelAI password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <AuthLayout
      title={sent ? "Check your email" : "Forgot your password?"}
      subtitle={
        sent
          ? "We've sent a reset link to your inbox."
          : "Enter the email tied to your account and we'll send a reset link."
      }
      footer={
        <Link to="/signin" className="inline-flex items-center gap-1 text-foreground hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-md border border-border bg-canvas-soft px-4 py-5 text-center space-y-2">
          <CheckCircle2 className="h-6 w-6 text-[oklch(0.78_0.17_155)] mx-auto" />
          <p className="text-sm text-foreground font-medium">Check your email for a reset link</p>
          <p className="text-xs text-muted-foreground">
            Sent to <span className="text-foreground font-mono">{email}</span>
          </p>
        </div>
      ) : (
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
          <button type="submit" className={primaryBtnCls}>
            Send Reset Link
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
