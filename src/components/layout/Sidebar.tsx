import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Rocket, AlertTriangle, MessageSquare, Triangle, LogOut, FolderKey } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/deployments", label: "Deployments", icon: Rocket },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/chat", label: "Agent Chat", icon: MessageSquare },
  { to: "/projects", label: "Projects & Keys", icon: FolderKey },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate({ to: "/signin", replace: true });
  }

  const initials = (user?.name ?? "U")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-sidebar">
      <Link to="/dashboard" className="h-14 flex items-center gap-2 px-4 border-b border-border hover:bg-sidebar-accent/40 transition-colors">
        <Triangle className="h-4 w-4 fill-foreground text-foreground" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          SentinelAI
        </span>
      </Link>
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-2 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm">
            <div className="h-7 w-7 rounded-full bg-canvas-soft-2 border border-border grid place-items-center text-[10px] font-mono text-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-mute font-mono truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <div className="pt-2 px-1 text-[10px] uppercase tracking-wider text-mute font-mono">
          v0.1.0 · alpha
        </div>
      </div>
    </aside>
  );
}
