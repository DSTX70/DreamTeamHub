import { makeProvider } from "../../shared/llm/providers";
import type { LLMConfig } from "../../shared/llm/types";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { maybeAugmentUserPromptWithPilotCContext } from "./context/pilotC_gigsterGarageContext";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SkillDefinition {
  name: string;
  description: string;
  system_prompt: string;
  input_schema: any;
  output_schema?: any;
}

interface RunSkillOptions {
  skillName: string;
  input: Record<string, any>;
  provider?: string;
  model?: string;
}

function loadSkillDefinition(skillName: string): SkillDefinition {
  const skillPath = join(__dirname, "skills", `${skillName}.json`);
  try {
    const content = readFileSync(skillPath, "utf-8");
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error(`Failed to load skill "${skillName}": ${error.message}`);
  }
}

export async function runSkill(options: RunSkillOptions): Promise<any> {
  const { skillName, input, provider = "openai", model } = options;

  const skill = loadSkillDefinition(skillName);

  const llmConfig: LLMConfig = {
    provider: provider as any,
    model: model || (provider === "openai" ? "gpt-4o" : "gpt-4o-mini"),
  };

  const llmProvider = makeProvider(llmConfig);

  const baseUserPrompt = `Work Item Input:\n${JSON.stringify(input, null, 2)}\n\nRespond with JSON ONLY matching the output schema.`;

  const userPrompt = await maybeAugmentUserPromptWithPilotCContext(baseUserPrompt, {
    skillName,
    input,
  });

  const fullPrompt = `${skill.system_prompt}\n\n${userPrompt}`;

  const response = await llmProvider.infer({
    prompt: fullPrompt,
    temperature: 0.7,
    max_tokens: 8000,
  });

  const jsonMatch = response.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
}
