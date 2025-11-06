import { makeProvider } from "@shared/llm/providers";
import type { WorkOrder } from "@shared/schema";

export interface WorkOrderExecutionResult {
  status: "success" | "failed" | "partial";
  output: string;
  ms: number;
  cost: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class WorkOrderExecutor {
  /**
   * Execute a work order using its playbook and configuration
   */
  async execute(
    workOrder: WorkOrder,
    agentName: string
  ): Promise<WorkOrderExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Parse playbook to extract execution instructions
      const instructions = this.parsePlaybook(workOrder.playbook);
      
      // Determine which LLM provider to use based on autonomy level
      const provider = this.selectProvider(workOrder.autonomy);
      
      // Build the prompt from inputs and playbook
      const prompt = this.buildPrompt(workOrder, instructions);
      
      // Execute using LLM provider
      const llmProvider = makeProvider({
        provider: provider.name,
        model: provider.model,
      });
      
      const response = await llmProvider.infer({
        prompt,
        temperature: 0.7,
        max_tokens: 2000,
      });
      
      // Calculate actual execution time and cost
      const ms = Date.now() - startTime;
      const cost = this.calculateCost(provider, response.raw?.usage);
      
      // Check stop conditions
      const shouldStop = this.checkStopConditions(workOrder.stop, response.text);
      
      // Format output according to work order configuration
      const output = this.formatOutput(workOrder.output, response.text);
      
      return {
        status: shouldStop ? "partial" : "success",
        output,
        ms,
        cost: cost.toFixed(4),
        metadata: {
          provider: provider.name,
          model: provider.model,
          usage: response.raw?.usage,
          agent: agentName,
          stopTriggered: shouldStop,
        }
      };
    } catch (error: any) {
      const ms = Date.now() - startTime;
      
      return {
        status: "failed",
        output: "",
        ms,
        cost: "0.0000",
        error: error.message || "Unknown error during execution",
        metadata: {
          agent: agentName,
          errorType: error.constructor.name,
        }
      };
    }
  }
  
  /**
   * Parse playbook markdown to extract executable instructions
   */
  private parsePlaybook(playbookMd: string): string[] {
    // Extract steps from markdown (e.g., numbered lists, code blocks)
    const lines = playbookMd.split('\n');
    const instructions: string[] = [];
    
    for (const line of lines) {
      // Look for numbered steps: "1. Do something"
      const stepMatch = line.match(/^\d+\.\s+(.+)$/);
      if (stepMatch) {
        instructions.push(stepMatch[1]);
      }
      
      // Look for bullet points: "- Do something"
      const bulletMatch = line.match(/^[-*]\s+(.+)$/);
      if (bulletMatch) {
        instructions.push(bulletMatch[1]);
      }
    }
    
    // If no structured steps found, treat entire playbook as single instruction
    if (instructions.length === 0) {
      instructions.push(playbookMd.trim());
    }
    
    return instructions;
  }
  
  /**
   * Select appropriate LLM provider based on autonomy level
   */
  private selectProvider(autonomy: string): { name: "openai" | "anthropic" | "vertex" | "mock", model: string } {
    switch (autonomy) {
      case "L3": // Highest autonomy - use most capable model
        return { name: "openai", model: "gpt-4o" };
      
      case "L2": // Medium autonomy - balanced model
        return { name: "openai", model: "gpt-4o-mini" };
      
      case "L1": // Low autonomy - faster model
        return { name: "openai", model: "gpt-4o-mini" };
      
      case "L0": // No autonomy - mock execution
      default:
        return { name: "mock", model: "test" };
    }
  }
  
  /**
   * Build execution prompt from work order configuration
   */
  private buildPrompt(workOrder: WorkOrder, instructions: string[]): string {
    const parts = [
      `# Work Order: ${workOrder.title}`,
      ``,
      `## Context`,
      `Agent: ${workOrder.owner}`,
      `Autonomy Level: ${workOrder.autonomy}`,
      ``,
      `## Input Sources`,
      workOrder.inputs,
      ``,
      `## Instructions`,
      ...instructions.map((inst, i) => `${i + 1}. ${inst}`),
      ``,
      `## Output Requirements`,
      `Format the response according to: ${workOrder.output}`,
      ``,
      `## Constraints`,
      `Stop if: ${workOrder.stop}`,
      ``,
      `Execute the instructions above and provide the output in the specified format.`,
    ];
    
    return parts.join('\n');
  }
  
  /**
   * Calculate cost based on provider and token usage
   */
  private calculateCost(
    provider: { name: string; model: string },
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  ): number {
    if (!usage || provider.name === "mock") {
      return 0.001; // Minimal cost for mock
    }
    
    // Pricing as of 2024 (approximate)
    const pricing: Record<string, { input: number; output: number }> = {
      "gpt-4o": { input: 0.005 / 1000, output: 0.015 / 1000 },
      "gpt-4o-mini": { input: 0.00015 / 1000, output: 0.0006 / 1000 },
      "gpt-4": { input: 0.03 / 1000, output: 0.06 / 1000 },
      "claude-3-5-sonnet-20241022": { input: 0.003 / 1000, output: 0.015 / 1000 },
      "claude-opus": { input: 0.015 / 1000, output: 0.075 / 1000 },
      "gemini-1.5-pro": { input: 0.00125 / 1000, output: 0.005 / 1000 },
      "gemini-1.5-flash": { input: 0.000075 / 1000, output: 0.0003 / 1000 },
    };
    
    const modelPricing = pricing[provider.model] || { input: 0.001 / 1000, output: 0.002 / 1000 };
    
    const inputCost = (usage.prompt_tokens || 0) * modelPricing.input;
    const outputCost = (usage.completion_tokens || 0) * modelPricing.output;
    
    return inputCost + outputCost;
  }
  
  /**
   * Check if any stop conditions are met
   */
  private checkStopConditions(stopConfig: string, output: string): boolean {
    // Parse stop conditions (could be JSON, keywords, etc.)
    const stopKeywords = stopConfig.toLowerCase().split(',').map(s => s.trim());
    const outputLower = output.toLowerCase();
    
    for (const keyword of stopKeywords) {
      if (keyword && outputLower.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Format output according to work order specification
   */
  private formatOutput(outputSpec: string, rawOutput: string): string {
    // If output spec is a path, indicate where to save
    if (outputSpec.includes('/') || outputSpec.includes('\\')) {
      return `Output ready for: ${outputSpec}\n\n${rawOutput}`;
    }
    
    // If output spec specifies format (json, markdown, etc.)
    if (outputSpec.toLowerCase().includes('json')) {
      try {
        // Try to extract JSON from the output
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.stringify(JSON.parse(jsonMatch[0]), null, 2);
        }
      } catch {
        // If parsing fails, return as-is
      }
    }
    
    // Default: return raw output with spec note
    return `[${outputSpec}]\n\n${rawOutput}`;
  }
}

// Singleton instance
export const workOrderExecutor = new WorkOrderExecutor();
