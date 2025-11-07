export type AffiliateAdminRow = {
  code: string;
  name?: string;
  commissionRate: number | null; // null means use default
  status: "active" | "suspended" | string;
};

export type AffiliatePayoutRow = {
  code: string;
  name: string;
  status: string;
  revenue: number;
  rate: number;
  commission: number;
};
