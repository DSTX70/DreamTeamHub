type SkuMapRow = {
  id: number;
  brand: string;
  shot_key: string;
  label: string;
  base_key: string;
};

export async function listSkuMap(brand = 'fcc'): Promise<{ items: SkuMapRow[] }> {
  const res = await fetch(`/api/fcc/sku-map?brand=${encodeURIComponent(brand)}`);
  if (!res.ok) throw new Error(`Failed to fetch SKU map: ${res.statusText}`);
  return res.json();
}

export async function upsertSkuMap(params: {
  brand: string;
  shot_key: string;
  label: string;
  base_key: string;
}): Promise<void> {
  const res = await fetch('/api/fcc/sku-map', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to upsert SKU map: ${res.statusText}`);
}
