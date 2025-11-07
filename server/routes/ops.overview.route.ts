import { Router } from "express";
import { inventoryDao } from "../db/inventoryDao";
import { affiliateDao } from "../db/affiliateDao";
import { s3List } from "../images/s3";
import {
  ruleAdditionalProperties,
  ruleUnconstrainedPrimitives,
  ruleAnyLike,
  ruleDeepUnions,
} from "../../shared/lint/rules";

export const router = Router();

router.get("/api/ops/overview", async (_req, res) => {
  try {
    const [lowStockItems, affReport] = await Promise.all([
      inventoryDao.getLowStock(),
      affiliateDao.getReport({
        fromISO: new Date(Date.now() - 7 * 86400000).toISOString(),
        toISO: new Date().toISOString(),
        commissionRate: 0.10,
      }),
    ]);

    const bucket = process.env.AWS_S3_BUCKET || "";
    const region = process.env.AWS_REGION || "us-east-1";
    const defaultCacheControl = process.env.DEFAULT_CACHE_CONTROL || "public, max-age=31536000, immutable";
    let probeOk = false;
    try {
      await s3List("");
      probeOk = true;
    } catch {
      probeOk = false;
    }

    const linterRuleCount = 4;

    const envHealth = {
      databaseUrl: !!process.env.DATABASE_URL,
      s3Bucket: !!process.env.AWS_S3_BUCKET,
      opsToken: !!process.env.OPS_API_TOKEN,
      awsRegion: !!process.env.AWS_REGION,
    };

    res.json({
      inventory: {
        lowStockCount: lowStockItems.length,
      },
      images: {
        bucket,
        region,
        defaultCacheControl,
        hasBucketEnv: !!bucket,
        probeOk,
      },
      affiliates: {
        clicks: affReport.totals.clicks,
        uniqueVisitors: affReport.totals.uniqueVisitors,
        orders: affReport.totals.orders,
        revenue: affReport.totals.revenue,
        commission: affReport.totals.commission,
        window: affReport.window,
      },
      linter: {
        ruleCount: linterRuleCount,
      },
      env: envHealth,
    });
  } catch (error: any) {
    console.error("[OpsOverview] Error fetching overview:", error);
    res.status(500).json({ error: "Failed to fetch ops overview" });
  }
});
