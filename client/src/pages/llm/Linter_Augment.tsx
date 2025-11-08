import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function LinterAugment() {
  const [family, setFamily] = useState<"gpt" | "claude" | "gemini">("gpt");
  const [prompt, setPrompt] = useState("");
  const [augmentedPrompt, setAugmentedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleAugment = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a prompt to augment",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest<{ augmentedPrompt: string }>(
        "/api/llm/augment",
        "POST",
        { family, prompt }
      );
      
      setAugmentedPrompt(response.augmentedPrompt);
      toast({
        title: "Success",
        description: "Prompt augmented with family-specific tips"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to augment prompt",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    setPrompt(augmentedPrompt);
    toast({
      title: "Applied",
      description: "Suggested fixes applied to prompt"
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(augmentedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Augmented prompt copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">LLM Linter & Augment</h1>
        <p className="text-muted-foreground mt-2">
          Enhance your prompts with family-specific tips and augment lines
        </p>
      </div>

      <div className="grid gap-6">
        <Card data-testid="card-input">
          <CardHeader>
            <CardTitle>Input Prompt</CardTitle>
            <CardDescription>
              Enter your prompt and select the LLM family to get augmentation suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family-select">LLM Family</Label>
              <Select 
                value={family} 
                onValueChange={(v) => setFamily(v as typeof family)}
              >
                <SelectTrigger id="family-select" data-testid="select-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt">GPT (OpenAI)</SelectItem>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                  <SelectItem value="gemini">Gemini (Google)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt-input">Your Prompt</Label>
              <Textarea
                id="prompt-input"
                data-testid="textarea-prompt"
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleAugment}
              disabled={isLoading || !prompt.trim()}
              className="w-full"
              data-testid="button-augment"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isLoading ? "Augmenting..." : "Augment Prompt"}
            </Button>
          </CardContent>
        </Card>

        {augmentedPrompt && (
          <Card data-testid="card-output">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Augmented Prompt</CardTitle>
                <Badge variant="secondary">{family.toUpperCase()}</Badge>
              </div>
              <CardDescription>
                Enhanced with family-specific tips and augment lines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  data-testid="textarea-augmented"
                  value={augmentedPrompt}
                  readOnly
                  rows={12}
                  className="font-mono text-sm bg-muted"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApply}
                  variant="default"
                  className="flex-1"
                  data-testid="button-apply-fixes"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Suggested Fixes
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-copy"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
