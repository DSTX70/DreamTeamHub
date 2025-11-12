// Landing page for unauthenticated users
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, Target, Lightbulb, FileCheck, 
  MessageSquare, Workflow, Shield, TrendingUp 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { HeadHome } from "@/components/HeadHome";

export default function Landing() {
  // Fetch SEO metadata for the homepage
  const { data: seoData } = useQuery({
    queryKey: ['/api/seo/meta/section', '/', 'home.lifestyle_ol1'],
    queryFn: async () => {
      const response = await fetch('/api/seo/meta/section?route=/&section_key=home.lifestyle_ol1&locale=en');
      const json = await response.json();
      return json.seo;
    },
  });

  return (
    <div className="min-h-screen bg-brand-dark">
      <HeadHome seo={seoData} />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grad-orchestra opacity-10"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 
            className="font-grotesk text-5xl md:text-6xl font-bold mb-6 bg-grad-orchestra bg-clip-text text-transparent"
            data-testid="hero-title"
          >
            Dream Team Hub
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-8">
            Multi-Pod Orchestration Platform for Distributed Teams
          </p>
          <p className="text-lg text-text-muted max-w-3xl mx-auto mb-12">
            A comprehensive control platform providing a single pane of glass for managing complex organizational workflows across distributed teams.
          </p>
          <Button 
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-grotesk font-bold text-center mb-12 text-text-primary">
          Platform Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-control-tower">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-pod-control/20 flex items-center justify-center">
                <Target className="w-6 h-6" style={{ color: 'var(--pod-control)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">Control Tower</h3>
              <p className="text-sm text-text-secondary">
                Live priorities, assignments, and actionable insights
              </p>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-roles">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-pod-roster/20 flex items-center justify-center">
                <Users className="w-6 h-6" style={{ color: 'var(--pod-roster)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">Dream Team Roles</h3>
              <p className="text-sm text-text-secondary">
                40 role cards with full metadata and responsibilities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-brainstorm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
                <Lightbulb className="w-6 h-6" style={{ color: 'var(--brand-yellow)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">Brainstorm Studio</h3>
              <p className="text-sm text-text-secondary">
                Structured ideation with LLM-assisted clustering
              </p>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-audit">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-pod-security/20 flex items-center justify-center">
                <FileCheck className="w-6 h-6" style={{ color: 'var(--pod-security)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">Audit Engine</h3>
              <p className="text-sm text-text-secondary">
                Cross-pod compliance with evidence capture
              </p>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-chat">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-brand-teal/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" style={{ color: 'var(--brand-teal)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">AI-Powered Chat</h3>
              <p className="text-sm text-text-secondary">
                32 role-based personas with context-aware responses
              </p>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-intake">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-pod-intake/20 flex items-center justify-center">
                <Workflow className="w-6 h-6" style={{ color: 'var(--pod-intake)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">Intake & Routing</h3>
              <p className="text-sm text-text-secondary">
                Work item lifecycle management and prioritization
              </p>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-decisions">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-pod-decision/20 flex items-center justify-center">
                <Shield className="w-6 h-6" style={{ color: 'var(--pod-decision)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">Decision Log</h3>
              <p className="text-sm text-text-secondary">
                Immutable record of key decisions with metadata
              </p>
            </CardContent>
          </Card>

          <Card className="bg-glass border-glass hover-elevate" data-testid="feature-agent-sync">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-brand-indigo/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" style={{ color: 'var(--brand-indigo)' }} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text-primary">Agent Spec Sync</h3>
              <p className="text-sm text-text-secondary">
                Two-way sync between roles and AI agent specifications
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary mb-6">
          Sign in to access the full platform
        </p>
        <Button 
          size="lg"
          variant="outline"
          className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
          onClick={() => window.location.href = "/api/login"}
          data-testid="button-login-footer"
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}
