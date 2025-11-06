import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type OpsSummaryData = {
  window: string;
  publish_count_24h: number;
  draft_count_24h: number;
  wo_runs_24h: number;
};

type BuMiniAnalyticsProps = {
  buId: string;
};

export default function BuMiniAnalytics({ buId }: BuMiniAnalyticsProps) {
  const [data, setData] = useState<OpsSummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/ops/summary?owner_type=BU&owner_id=${buId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch ops summary");
        const json = await response.json();
        if (!aborted) setData(json);
      } catch (error) {
        console.error("Error fetching ops summary:", error);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [buId]);

  const metrics = [
    {
      label: "Publishes (24h)",
      value: data?.publish_count_24h,
      testId: "metric-publishes",
    },
    {
      label: "Draft uploads (24h)",
      value: data?.draft_count_24h,
      testId: "metric-drafts",
    },
    {
      label: "WO runs (24h)",
      value: data?.wo_runs_24h,
      testId: "metric-wo-runs",
    },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-4" data-testid="bu-mini-analytics">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{metric.label}</div>
            <div
              className="text-2xl font-semibold mt-2"
              data-testid={metric.testId}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : data ? (
                metric.value
              ) : (
                "—"
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
