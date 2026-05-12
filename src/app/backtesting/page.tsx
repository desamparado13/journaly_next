import Link from "next/link";
import { formatDate, formatR, loadJournalyDashboard } from "@/lib/journaly-data";

export default async function BacktestingPage() {
  const journaly = await loadJournalyDashboard();

  return (
    <main className="modulePage">
      <header className="moduleHeader">
        <div>
          <p className="eyebrow">Replay Data</p>
          <h1>Backtesting</h1>
        </div>
        <Link href="/">Back home</Link>
      </header>
      <section className="cardGrid">
        {journaly.backtests.map((trade) => (
          <article className="compactCard" key={trade.id}>
            <p>{formatDate(trade.trade_date)}</p>
            <h2>{trade.pair} {trade.direction}</h2>
            <span>{trade.setup_type}</span>
            <strong className={Number(trade.pnl_r) >= 0 ? "positive" : "negative"}>{formatR(trade.pnl_r)}</strong>
          </article>
        ))}
        {journaly.backtests.length === 0 ? <p className="emptyText">No backtests found. Import SQL into Supabase first.</p> : null}
      </section>
    </main>
  );
}
