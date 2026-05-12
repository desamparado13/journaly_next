import Link from "next/link";
import { formatDate, formatR, loadJournalyDashboard } from "@/lib/journaly-data";

export default async function TradesPage() {
  const journaly = await loadJournalyDashboard();

  return (
    <main className="modulePage">
      <ModuleHeader title="Trades" kicker="Execution Journal" href="/" />
      <section className="modulePanel">
        <div className="tableHeader">
          <span>Date</span>
          <span>Pair</span>
          <span>Setup</span>
          <span>Direction</span>
          <span>Result</span>
          <span>R</span>
        </div>
        {journaly.trades.map((trade) => (
          <div className="tableRow" key={trade.id}>
            <span>{formatDate(trade.trade_date)}</span>
            <strong>{trade.pair}</strong>
            <span>{trade.setup_type}</span>
            <span>{trade.direction}</span>
            <span>{trade.result}</span>
            <b className={Number(trade.pnl_r) >= 0 ? "positive" : "negative"}>{formatR(trade.pnl_r)}</b>
          </div>
        ))}
        {journaly.trades.length === 0 ? <p className="emptyText">No trades found. Import SQL into Supabase first.</p> : null}
      </section>
    </main>
  );
}

function ModuleHeader({ title, kicker, href }: { title: string; kicker: string; href: string }) {
  return (
    <header className="moduleHeader">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
      </div>
      <Link href={href}>Back home</Link>
    </header>
  );
}
