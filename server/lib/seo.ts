import { db } from '../db';
import { seoMeta } from '../../shared/schema';
import { and, eq } from 'drizzle-orm';

export async function getSeoSection(route: string, sectionKey: string, locale = 'en') {
  const rows = await db.select({
      title: seoMeta.title,
      description: seoMeta.description,
      ogImage: seoMeta.ogImage,
      keywords: seoMeta.keywords,
    })
    .from(seoMeta)
    .where(and(eq(seoMeta.route, route), eq(seoMeta.sectionKey, sectionKey), eq(seoMeta.locale, locale)))
    .limit(1);
  return rows[0] ?? null;
}
