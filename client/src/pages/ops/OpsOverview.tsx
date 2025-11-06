import { useQuery } from "@tanstack/react-query";
import StatCard from "./components/StatCard";
import { Package, Image, UserCheck, FileCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type OverviewData = {
  inventory: { lowStockCount: number };
  images: {
    bucket: string;
    region: string;
    defaultCacheControl: string;
    hasBucketEnv: boolean;
    probeOk: boolean;
  };
  affiliates: {
    clicks: number;
    uniqueVisitors: number;
    orders: number;
    revenue: number;
    commission: number;
    window: { fromISO: string; toISO: string };
  };
  linter: { ruleCount: number };
};

export default function OpsOverview() {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/ops/overview"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Ops Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Ops Overview</h1>
        <p className="text-muted-foreground mt-4">Failed to load overview data</p>
      </div>
    );
  }

  const inventoryStats = [
    { label: "Low-stock SKUs", value: data.inventory.lowStockCount },
  ];

  const imagesStats = [
    { label: "Bucket", value: data.images.bucket || "(unset)" },
    { label: "Probe", value: data.images.probeOk ? "✓ OK" : "✗ Failed" },
    { label: "Cache-Control", value: data.images.defaultCacheControl ? "Set" : "(unset)" },
  ];

  const affiliatesStats = [
    { label: "Clicks (7d)", value: data.affiliates.clicks },
    { label: "Uniques (7d)", value: data.affiliates.uniqueVisitors },
    { label: "Orders (7d)", value: data.affiliates.orders },
    { label: "Revenue (7d)", value: `$${data.affiliates.revenue.toFixed(2)}` },
    { label: "Commission (7d)", value: `$${data.affiliates.commission.toFixed(2)}` },
  ];

  const linterStats = [
    { label: "Active Rules", value: data.linter.ruleCount },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="page-ops-overview">
      <h1 className="text-2xl font-bold">Ops Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Inventory"
          icon={Package}
          stats={inventoryStats}
          href="/ops/inventory"
        />
        <StatCard
          title="Images"
          icon={Image}
          stats={imagesStats}
          href="/ops/images"
        />
        <StatCard
          title="Affiliates"
          icon={UserCheck}
          stats={affiliatesStats}
          href="/ops/affiliates"
        />
        <StatCard
          title="LLM Linter"
          icon={FileCheck}
          stats={linterStats}
          href="/llm/provider/linter"
        />
      </div>
    </div>
  );
}
