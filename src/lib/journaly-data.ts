import { createClient } from "@/utils/supabase/server";

export type Trade = {
  id: number;
  trade_date: string;
  trade_time: string | null;
  pair: string;
  setup_type: string;
  direction: string;
  pnl_r: string | number;
  result: string;
  notes: string | null;
  screenshot_path?: string | null;
  board_capture_path?: string | null;
};

export type BacktestTrade = Trade & {
  scale_in?: string | null;
};

export type QuickNote = {
  id: number;
  title: string;
  note_text: string | null;
  is_pinned: number;
  updated_at: string;
};

export type ResearchIdea = {
  id: number;
  title: string;
  category: string | null;
  hypothesis: string | null;
  status: string | null;
  updated_at: string | null;
};

export type Trial = {
  id: number;
  title: string;
  status: string;
  starting_balance: string | number;
  profit_target_pct: string | number;
  max_total_drawdown_pct: string | number;
  start_date: string;
};

export type JournalyDashboard = {
  connected: boolean;
  error: string | null;
  counts: {
    trades: number;
    backtests: number;
    notes: number;
    research: number;
    trials: number;
  };
  stats: {
    totalR: number;
    winRate: number;
    wins: number;
    losses: number;
  };
  trades: Trade[];
  backtests: BacktestTrade[];
  notes: QuickNote[];
  research: ResearchIdea[];
  trials: Trial[];
};

const emptyDashboard: JournalyDashboard = {
  connected: false,
  error: null,
  counts: {
    trades: 0,
    backtests: 0,
    notes: 0,
    research: 0,
    trials: 0
  },
  stats: {
    totalR: 0,
    winRate: 0,
    wins: 0,
    losses: 0
  },
  trades: [],
  backtests: [],
  notes: [],
  research: [],
  trials: []
};

export async function loadJournalyDashboard(): Promise<JournalyDashboard> {
  try {
    const supabase = await createClient();

    const [trades, backtests, notes, research, trials] = await Promise.all([
      selectRows<Trade>(supabase, "trades", "trade_date", 12),
      selectRows<BacktestTrade>(supabase, "backtest_trades", "trade_date", 8),
      selectRows<QuickNote>(supabase, "quick_notes", "updated_at", 6),
      selectRows<ResearchIdea>(supabase, "research", "updated_at", 6),
      selectRows<Trial>(supabase, "trials", "created_at", 4)
    ]);

    const allTrades = trades.rows;
    const wins = allTrades.filter((trade) => trade.result?.toLowerCase() === "win").length;
    const losses = allTrades.filter((trade) => trade.result?.toLowerCase() === "loss").length;
    const totalR = allTrades.reduce((sum, trade) => sum + Number(trade.pnl_r ?? 0), 0);
    const closed = wins + losses;

    return {
      connected: trades.ok && backtests.ok && notes.ok && research.ok && trials.ok,
      error: [trades, backtests, notes, research, trials].find((result) => result.error)?.error ?? null,
      counts: {
        trades: trades.count,
        backtests: backtests.count,
        notes: notes.count,
        research: research.count,
        trials: trials.count
      },
      stats: {
        totalR,
        winRate: closed > 0 ? (wins / closed) * 100 : 0,
        wins,
        losses
      },
      trades: trades.rows,
      backtests: backtests.rows,
      notes: notes.rows,
      research: research.rows,
      trials: trials.rows
    };
  } catch (error) {
    return {
      ...emptyDashboard,
      error: error instanceof Error ? error.message : "Could not connect to Supabase."
    };
  }
}

async function selectRows<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  orderColumn: string,
  limit: number
) {
  const { data, error, count } = await supabase
    .from(table)
    .select("*", { count: "exact" })
    .order(orderColumn, { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return {
      ok: false,
      error: error.message,
      count: 0,
      rows: [] as T[]
    };
  }

  return {
    ok: true,
    error: null,
    count: count ?? data?.length ?? 0,
    rows: (data ?? []) as T[]
  };
}

export function formatR(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  const prefix = number > 0 ? "+" : "";
  return `${prefix}${number.toFixed(2)}R`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}
