import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SENTINEL_API_BASE } from "@/lib/sentinelBackend";
import { toast } from "sonner";
import { Copy, Plus, Key, Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SentinelAI" },
      { name: "description", content: "Manage your SentinelAI projects and API keys." },
    ],
  }),
  component: ProjectsPage,
});

const SENTINEL_API = `${SENTINEL_API_BASE}/api/v1`;

interface Project {
  id: number;
  name: string;
  api_key: string;
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${SENTINEL_API}/projects/`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch(`${SENTINEL_API}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project = await res.json();
      setProjects([...projects, project]);
      setNewProjectName("");
      toast.success("Project created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error creating project");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <PageWrapper
      title="Projects & API Keys"
      description="Create a project to generate a Sentinel API key for your CI/CD pipelines."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-md border border-border bg-canvas p-6 shadow-[0_1px_1px_#00000005,0_2px_2px_#0000000a]">
            <h3 className="text-lg font-semibold text-foreground mb-4">New Project</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-10 px-3 rounded-sm border border-border bg-canvas text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. user-auth-service"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full inline-flex justify-center items-center h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreating ? "Generating..." : "Generate API Key"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="rounded-md border border-border bg-canvas-soft p-12 text-center shadow-[0_1px_1px_#00000005,0_2px_2px_#0000000a]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-md border border-border bg-canvas-soft p-12 text-center shadow-[0_1px_1px_#00000005,0_2px_2px_#0000000a]">
              <div className="mx-auto w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center mb-4">
                <Key className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first project to get an API key.
              </p>
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id} className="rounded-md border border-border bg-canvas p-6 shadow-[0_1px_1px_#00000005,0_2px_2px_#0000000a]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Project ID: {p.id}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block px-3 py-2 bg-canvas-soft-2 text-foreground font-mono text-sm rounded-sm border border-border">
                      {p.api_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(p.api_key)}
                      className="p-2 border border-border rounded-md hover:bg-canvas-soft"
                    >
                      <Copy className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
                    GitHub Action Integration
                  </h4>
                  <pre className="p-4 bg-[#171717] text-white rounded-md text-xs font-mono overflow-x-auto">
{`jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Sentinel.AI Risk Check
        uses: SentinelAI/risk-gatekeeper-action@v1
        with:
          api-key: \${{ secrets.SENTINEL_API_KEY }}
          service: '${p.name}'
          environment: 'production'
          change-type: 'code-deploy'`}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
