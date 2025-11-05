import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles, Copy, CheckCircle2, Zap, ExternalLink, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface QuickAction {
  id: string;
  label: string;
  utterance: string;
  description: string;
}

interface CopilotPanelProps {
  admin?: boolean;
  customGptUrl?: string;
}

export default function CopilotPanel({ admin = false, customGptUrl }: CopilotPanelProps) {
  const [msgs, setMsgs] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your Agent Lab Copilot. Use quick actions below or ask me anything about roles and agents."
    }
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load quick actions
  useEffect(() => {
    fetch("/data/copilot_prompts.json")
      .then(r => r.json())
      .then(data => setQuickActions(data))
      .catch(console.error);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  async function send(text: string) {
    if (!text.trim() || busy) return;

    setMsgs(m => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    try {
      const r = await fetch("/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const body = await r.json();

      if (!r.ok) {
        const err = body?.error?.message || `HTTP ${r.status}`;
        setMsgs(m => [...m, { role: "assistant", text: `⚠️ ${err}` }]);
      } else {
        setMsgs(m => [...m, { role: "assistant", text: body.reply }]);
      }
    } catch (e: any) {
      setMsgs(m => [...m, { role: "assistant", text: `⚠️ Network error: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleQuickAction(action: QuickAction) {
    send(action.utterance);
  }

  function copyGptLink() {
    if (customGptUrl) {
      navigator.clipboard.writeText(customGptUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Agent Lab Copilot</CardTitle>
          </div>
          {admin && customGptUrl && (
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={customGptUrl}
                className="w-72 text-xs"
                data-testid="input-custom-gpt-url"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyGptLink}
                data-testid="button-copy-gpt-link"
              >
                {copiedLink ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(customGptUrl, "_blank")}
                data-testid="button-open-custom-gpt"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription className="text-muted-foreground">
          Ask questions about roles and agents using natural language or quick actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <TooltipProvider key={action.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action)}
                        disabled={busy}
                        className="gap-1"
                        data-testid={`button-quick-${action.id}`}
                      >
                        {action.label}
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">{action.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea 
          ref={scrollRef}
          className="h-[400px] pr-4 border rounded-md"
        >
          <div className="space-y-4 p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${m.role}-${i}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-foreground [&_th]:text-foreground [&_td]:text-foreground">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-primary-foreground">{m.text}</p>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Form */}
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about roles or agent summaries..."
            disabled={busy}
            data-testid="input-copilot-message"
          />
          <Button 
            type="submit" 
            disabled={busy || !input.trim()}
            data-testid="button-send-message"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        {/* Status Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Read-only
            </Badge>
            <span>Powered by OpenAI</span>
          </div>
          {customGptUrl && !admin && (
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open(customGptUrl, "_blank")}
              className="h-auto p-0 text-xs"
              data-testid="link-open-chatgpt"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open in ChatGPT
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
