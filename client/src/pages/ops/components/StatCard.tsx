import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Link } from "wouter";

type StatCardProps = {
  title: string;
  icon: LucideIcon;
  stats: { label: string; value: string | number }[];
  href: string;
};

export default function StatCard({ title, icon: Icon, stats, href }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="hover-elevate cursor-pointer" data-testid={`card-ops-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-semibold" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
