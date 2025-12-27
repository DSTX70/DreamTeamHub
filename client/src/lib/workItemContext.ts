export const WORK_ITEM_ID_PARAM = "workItemId";
export const CONTEXT_PARAM = "context";
export const Q_PARAM = "q";

export type WorkItemContext = {
  workItemId?: string;
  context?: string;
  q?: string;
};

export function readWorkItemContext(sp: URLSearchParams): WorkItemContext {
  const workItemId = sp.get(WORK_ITEM_ID_PARAM)?.trim() || undefined;
  const context = sp.get(CONTEXT_PARAM)?.trim() || undefined;
  const q = sp.get(Q_PARAM)?.trim() || undefined;
  return { workItemId, context, q };
}

export function hasWorkItemContext(ctx: WorkItemContext): boolean {
  return Boolean(ctx.workItemId || ctx.context || ctx.q);
}

export function contextToSearch(ctx: WorkItemContext): string {
  const sp = new URLSearchParams();
  if (ctx.workItemId) sp.set(WORK_ITEM_ID_PARAM, ctx.workItemId);
  if (ctx.context) sp.set(CONTEXT_PARAM, ctx.context);
  if (ctx.q) sp.set(Q_PARAM, ctx.q);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function clearWorkItemContextFromParams(sp: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(sp);
  next.delete(WORK_ITEM_ID_PARAM);
  next.delete(CONTEXT_PARAM);
  next.delete(Q_PARAM);
  return next;
}

export function getSearchParamsFromLocation(location: string): URLSearchParams {
  const idx = location.indexOf("?");
  return new URLSearchParams(idx >= 0 ? location.slice(idx + 1) : "");
}
