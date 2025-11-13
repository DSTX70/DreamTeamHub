import type { Request, Response } from "express";
import type { ZodSchema } from "zod";
import { runSkill } from "../runSkill";
import { storage } from "../../storage";

type PersistFn<TOutput> = (workItemId: number, data: TOutput) => Promise<void>;

interface WorkItemActionOptions<TOutput> {
  skillName: string;
  outputSchema: ZodSchema<TOutput>;
  persist: PersistFn<TOutput>;
}

export function createWorkItemActionHandler<TOutput>(
  options: WorkItemActionOptions<TOutput>
) {
  const { skillName, outputSchema, persist } = options;

  return async function workItemActionHandler(req: Request, res: Response) {
    const workItemId = parseInt(req.params.id, 10);

    if (isNaN(workItemId)) {
      return res.status(400).json({ ok: false, error: "invalid_work_item_id" });
    }

    try {
      const wi = await storage.getWorkItem(workItemId);
      if (!wi) {
        return res
          .status(404)
          .json({ ok: false, error: "work_item_not_found" });
      }

      const skillInput = {
        work_item_id: String(workItemId),
        work_item_title: wi.title ?? "",
        work_item_body: wi.description ?? "",
        work_item_notes: "",
      };

      const DEBUG_LLM = process.env.DEBUG_LLM_ACTIONS === "true";
      
      if (DEBUG_LLM) {
        console.log(`[${skillName}] Calling LLM with input:`, JSON.stringify(skillInput, null, 2));
      } else {
        console.log(`[${skillName}] Invoking LLM for work item ${workItemId}`);
      }
      
      const rawResult = await runSkill({
        skillName,
        input: skillInput,
      });

      if (DEBUG_LLM) {
        console.log(`[${skillName}] LLM returned raw result:`, JSON.stringify(rawResult, null, 2));
      }
      
      const parsed = outputSchema.parse(rawResult);
      
      console.log(`[${skillName}] Action completed successfully for work item ${workItemId}`);

      await persist(workItemId, parsed);

      return res.json({
        ok: true,
        work_item_id: workItemId,
        pack: parsed,
      });
    } catch (err: any) {
      const DEBUG_LLM = process.env.DEBUG_LLM_ACTIONS === "true";
      
      console.error(`[${skillName}] Error for work item ${workItemId}:`, err.message);
      
      // If it's a Zod validation error, include details only in debug mode
      if (err.name === 'ZodError' && DEBUG_LLM) {
        console.error(`[${skillName}] Zod validation failed:`, JSON.stringify(err.errors, null, 2));
      }
      
      return res.status(500).json({ 
        ok: false, 
        error: "internal_error",
        message: err.message 
      });
    }
  };
}
