import CopilotPanel from "@/components/CopilotPanel";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileCode, Book, Download, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function IntegrationsPage() {
  const { user } = useAuth();
  
  // For now, use environment variable for Custom GPT URL
  // In production, this could be fetched from admin config API
  const customGptUrl = import.meta.env.VITE_CUSTOM_GPT_URL || "";
  
  const pinnedLinks = [
    {
      title: "OpenAPI Spec (v0.1.1)",
      filename: "API_SPEC_v0.1.1.yaml",
      icon: FileCode,
      description: "Complete OpenAPI 3.0 specification for DTH API endpoints"
    },
    {
      title: "GPT Actions Schema (v0.1.1)",
      filename: "GPT_ACTIONS_SCHEMA.yaml",
      icon: Book,
      description: "ChatGPT Actions configuration for Custom GPT integration"
    },
    {
      title: "Postman Collection (v0.1.1)",
      filename: "POSTMAN_COLLECTION.json",
      icon: Download,
      description: "Import into Postman for API testing and exploration"
    }
  ];

  const handleDownloadDoc = async (filename: string) => {
    try {
      const response = await fetch(`/api/docs/${filename}`);
      if (!response.ok) throw new Error('Failed to download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect with external tools and services to extend Dream Team Hub capabilities
        </p>
      </div>

      {/* DTH Copilot Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">DTH Copilot</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered assistant for querying roles and agents using natural language
          </p>
        </div>
        <CopilotPanel 
          admin={!!user?.id} 
          customGptUrl={customGptUrl}
        />
      </section>

      {/* Validation Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Validation Rules</CardTitle>
          </div>
          <CardDescription>
            Security and data integrity enforcement for all Copilot queries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Hard Stops</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>HTTP status ≠ 200 → Stop with error message</li>
              <li>Non-JSON response → Report upstream error</li>
              <li>Wrong top-level type (array/object mismatch) → Stop</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Identity Checks (Required Fields)</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Roles:</strong> name, handle (missing → skip item with diagnostic)</li>
              <li><strong>Agents:</strong> name, autonomy_level, status (missing → skip item with diagnostic)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Numeric Fields</h4>
            <p className="text-sm text-muted-foreground">
              Optional or malformed numeric fields display as "—" with diagnostic footer
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Error Messages</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>401/403 → "Auth failed… check DTH_API_TOKEN"</li>
              <li>404 (single) → "Not found: [handle]"</li>
              <li>≥500 / shape mismatch → "DTH API error / unexpected response shape; stopping"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Pinned Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Technical specifications and integration guides (v0.1.1)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {pinnedLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card key={link.filename} className="hover-elevate">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{link.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleDownloadDoc(link.filename)}
                      data-testid={`button-doc-${link.filename.split('.')[0]}`}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin Custom GPT Section */}
      {user?.id && customGptUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Custom GPT Integration</CardTitle>
            <CardDescription>
              Deep link to ChatGPT Actions for external stakeholders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Admin Only</Badge>
              <Badge variant="outline">Read-Only</Badge>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={customGptUrl}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                data-testid="input-admin-gpt-url"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(customGptUrl);
                }}
                data-testid="button-copy-admin-gpt"
              >
                Copy
              </Button>
              <Button
                variant="default"
                onClick={() => window.open(customGptUrl, "_blank")}
                data-testid="button-open-admin-gpt"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
