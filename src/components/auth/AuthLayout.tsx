import { Triangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <div className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <Link to="/signin" className="flex items-center justify-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-md bg-foreground text-background grid place-items-center">
              <Triangle className="h-4 w-4 fill-background" strokeWidth={0} />
            </div>
            <span className="text-lg font-semibold tracking-tight">SentinelAI</span>
          </Link>
          <p className="text-center text-xs text-muted-foreground mb-7">
            Memory-driven DevOps Intelligence
          </p>

          {/* Card */}
          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <div className="mb-5">
              <h1 className="text-base font-semibold text-foreground tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {children}
          </div>

          {footer && (
            <p className="text-center text-xs text-muted-foreground mt-5">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const fieldCls =
  "w-full h-9 px-3 rounded-sm bg-canvas-soft border border-border text-sm text-foreground placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-hairline-strong";

export const labelCls =
  "block text-[11px] uppercase tracking-wider font-mono text-mute mb-1.5";

export const primaryBtnCls =
  "w-full h-9 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50";

export const oauthBtnCls =
  "w-full h-9 rounded-sm border border-border bg-transparent text-sm text-foreground hover:bg-canvas-soft inline-flex items-center justify-center gap-2 transition-colors";

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] uppercase tracking-wider font-mono text-mute">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
