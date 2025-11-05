import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function CopilotPanel() {
  const [msgs, setMsgs] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! Ask me about roles or agents. Try:\n\n• \"List L1 Support agents (limit 5)\"\n• \"Show role by handle product_owner\"\n• \"List pilot agents in Support pod\""
    }
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Agent Lab Copilot</CardTitle>
        </div>
        <CardDescription>
          Ask questions about roles and agents using natural language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea 
          ref={scrollRef}
          className="h-[500px] pr-4 border rounded-md"
        >
          <div className="space-y-4 p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${m.role}-${i}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{m.text}</p>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

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
      </CardContent>
    </Card>
  );
}
