/**
 * Canonical fallback list of selectable pods for Curated-Cast.
 * Intentionally curated to avoid exposing every internal construct.
 *
 * These are "user-meaningful" pods that map to outcomes and real workflows.
 */

export type CanonPod = { slug: string; label: string };

export const CANON_PODS: CanonPod[] = [
  { slug: "pod_os", label: "OS / System" },
  { slug: "pod_product_ux", label: "Product + UX" },
  { slug: "pod_engineering", label: "Engineering" },
  { slug: "pod_brand_marketing", label: "Brand + Marketing" },
  { slug: "pod_narrative_pr", label: "Narrative + PR" },
  { slug: "pod_ip_legal", label: "IP / Legal" },
  { slug: "pod_security_risk", label: "Security / Risk" },
  { slug: "pod_evidence_qa", label: "Evidence / QA" },
  { slug: "pod_ops_delivery", label: "Ops / Delivery" },
  { slug: "pod_medical", label: "Medical" },
];

export function canonPodsAsOptions() {
  return CANON_PODS.map((p) => ({ slug: p.slug, label: p.label }));
}
