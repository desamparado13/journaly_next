import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return createClient(supabaseUrl, supabasePublishableKey);
}

export const legacyTables = [
  "users",
  "trades",
  "backtest_trades",
  "research",
  "research_backtests",
  "trials",
  "trial_trades",
  "trade_boards",
  "quick_notes",
  "monthly_reports",
  "optimizer_trades",
  "prop_firm_accounts",
  "edgefinder_scores"
] as const;
