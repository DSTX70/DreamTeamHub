import { db } from "./db";
import { brands, products, projects, agents, pods } from "@shared/schema";
import { sql, or, ilike, desc } from "drizzle-orm";

export interface SearchResult {
  type: 'brand' | 'product' | 'project' | 'agent' | 'pod';
  id: number;
  title: string;
  subtitle?: string;
  url: string;
  context?: string;
}

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
  types?: string[]; // Filter by entity types
}

export async function universalSearch(params: SearchParams): Promise<{ results: SearchResult[]; total: number }> {
  const { q, limit = 20, offset = 0, types } = params;
  const query = `%${q}%`;
  
  const results: SearchResult[] = [];
  
  // Helper to check if type is enabled
  const isTypeEnabled = (type: string) => !types || types.includes(type);
  
  // Search brands
  if (isTypeEnabled('brand')) {
    const brandResults = await db
      .select()
      .from(brands)
      .where(ilike(brands.name, query));
      
    results.push(...brandResults.map(b => ({
      type: 'brand' as const,
      id: b.id,
      title: b.name,
      subtitle: b.businessUnit,
      url: `/bu/${b.businessUnit.toLowerCase()}?brand=${b.id}`,
      context: b.businessUnit,
    })));
  }
  
  // Search products
  if (isTypeEnabled('product')) {
    const productResults = await db
      .select({
        product: products,
        brand: brands,
      })
      .from(products)
      .leftJoin(brands, sql`${products.brandId} = ${brands.id}`)
      .where(ilike(products.name, query));
      
    results.push(...productResults.map(r => ({
      type: 'product' as const,
      id: r.product.id,
      title: r.product.name,
      subtitle: r.brand ? `${r.brand.name} • Product` : 'Product',
      url: r.brand ? `/bu/${r.brand.businessUnit.toLowerCase()}?product=${r.product.id}` : '#',
      context: r.brand?.name,
    })));
  }
  
  // Search projects
  if (isTypeEnabled('project')) {
    const projectResults = await db
      .select({
        project: projects,
        brand: brands,
      })
      .from(projects)
      .leftJoin(brands, sql`${projects.brandId} = ${brands.id}`)
      .where(
        or(
          ilike(projects.title, query),
          ilike(projects.description, query)
        )
      );
      
    results.push(...projectResults.map(r => ({
      type: 'project' as const,
      id: r.project.id,
      title: r.project.title,
      subtitle: r.project.category ? `${r.project.category} • ${r.project.status}` : r.project.status,
      url: `/project/${r.project.id}`,
      context: r.brand?.name,
    })));
  }
  
  // Search agents
  if (isTypeEnabled('agent')) {
    const agentResults = await db
      .select()
      .from(agents)
      .where(
        or(
          ilike(agents.id, query),
          ilike(agents.title, query)
        )
      );
      
    results.push(...agentResults.map(a => ({
      type: 'agent' as const,
      id: parseInt(a.id.replace(/[^0-9]/g, '') || '0'), // Extract number from agent ID
      title: a.title,
      subtitle: `${a.type} • ${a.autonomyLevel}`,
      url: `/agents?q=${encodeURIComponent(a.id)}`,
      context: a.podName || undefined,
    })));
  }
  
  // Search pods
  if (isTypeEnabled('pod')) {
    const podResults = await db
      .select()
      .from(pods)
      .where(ilike(pods.name, query));
      
    results.push(...podResults.map(p => ({
      type: 'pod' as const,
      id: p.id,
      title: p.name,
      subtitle: p.pillar || undefined,
      url: `/pods?pod=${p.id}`,
      context: p.pillar || undefined,
    })));
  }
  
  // Sort by relevance (exact matches first, then alphabetical)
  const sortedResults = results.sort((a, b) => {
    const aExact = a.title.toLowerCase() === q.toLowerCase();
    const bExact = b.title.toLowerCase() === q.toLowerCase();
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.title.localeCompare(b.title);
  });
  
  // Apply pagination
  const total = sortedResults.length;
  const paginatedResults = sortedResults.slice(offset, offset + limit);
  
  return {
    results: paginatedResults,
    total,
  };
}
