import Link from "next/link";
import { formatDate, formatR, loadJournalyDashboard } from "@/lib/journaly-data";
import { legacyAssetUrl } from "@/lib/assets";

const navItems = ["Overview", "Trades", "Backtesting", "Research", "Trials"];

export default async function Home() {
  const journaly = await loadJournalyDashboard();
  const latestTrade = journaly.trades[0];

  return (
    <main className="appShell">
      <aside className="appSidebar">
        <Link className="appBrand" href="/">
          <span>J2</span>
          <div>
            <strong>Journaly V2</strong>
            <small>Trading command center</small>
          </div>
        </Link>

        <nav className="appNav" aria-label="Journaly navigation">
          {navItems.map((item) => (
            <Link key={item} href={item === "Overview" ? "/" : `/${item.toLowerCase()}`}>
              {item}
            </Link>
          ))}
          <Link href="/migration">Migration</Link>
        </nav>

        <div className="sidebarNote">
          <p>Supabase</p>
          <strong>{journaly.connected ? "Connected" : "Waiting for import"}</strong>
        </div>
      </aside>

      <section className="appMain">
        <header className="appHeader">
          <div>
            <p className="eyebrow">Live Workspace</p>
            <h1>Good data, calm execution.</h1>
            <p>
              Track real trades, backtests, research ideas, quick notes, and challenge
              progress from your migrated Journaly database.
            </p>
          </div>
          <Link className="primaryAction" href="/trades">
            Review trades
          </Link>
        </header>

        {journaly.error ? (
          <section className="noticePanel">
            <strong>Supabase import check</strong>
            <p>{journaly.error}</p>
            <Link href="/migration">Open migration steps</Link>
          </section>
        ) : null}

        <section className="metricStrip" aria-label="Journaly metrics">
          <article>
            <p>Total R</p>
            <strong>{formatR(journaly.stats.totalR)}</strong>
          </article>
          <article>
            <p>Win Rate</p>
            <strong>{journaly.stats.winRate.toFixed(1)}%</strong>
          </article>
          <article>
            <p>Trades</p>
            <strong>{journaly.counts.trades}</strong>
          </article>
          <article>
            <p>Backtests</p>
            <strong>{journaly.counts.backtests}</strong>
          </article>
        </section>

        <section className="dashboardGrid">
          <article className="featurePanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Latest Trade</p>
                <h2>{latestTrade ? `${latestTrade.pair} ${latestTrade.direction}` : "No trade loaded"}</h2>
              </div>
              {latestTrade ? <span className={latestTrade.result === "Win" ? "pillWin" : "pillLoss"}>{latestTrade.result}</span> : null}
            </div>
            {latestTrade ? (
              <>
                <div className="tradeHero">
                  {legacyAssetUrl(latestTrade.screenshot_path) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={legacyAssetUrl(latestTrade.screenshot_path) ?? ""} alt="" />
                  ) : (
                    <div className="emptyImage">No screenshot</div>
                  )}
                </div>
                <div className="tradeMeta">
                  <span>{formatDate(latestTrade.trade_date)}</span>
                  <span>{latestTrade.setup_type}</span>
                  <strong>{formatR(latestTrade.pnl_r)}</strong>
                </div>
              </>
            ) : (
              <p className="emptyText">Import your SQL in Supabase to populate the dashboard.</p>
            )}
          </article>

          <article className="listPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Recent Trades</p>
                <h2>Execution log</h2>
              </div>
              <Link href="/trades">View all</Link>
            </div>
            <div className="rowList">
              {journaly.trades.slice(0, 6).map((trade) => (
                <div className="dataRow" key={trade.id}>
                  <div>
                    <strong>{trade.pair}</strong>
                    <span>{trade.setup_type} · {formatDate(trade.trade_date)}</span>
                  </div>
                  <b className={Number(trade.pnl_r) >= 0 ? "positive" : "negative"}>{formatR(trade.pnl_r)}</b>
                </div>
              ))}
              {journaly.trades.length === 0 ? <p className="emptyText">No trades found yet.</p> : null}
            </div>
          </article>

          <article className="listPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Research</p>
                <h2>Active ideas</h2>
              </div>
              <Link href="/research">Open</Link>
            </div>
            <div className="tagList">
              {journaly.research.map((idea) => (
                <span key={idea.id}>{idea.title}</span>
              ))}
              {journaly.research.length === 0 ? <p className="emptyText">No research ideas found yet.</p> : null}
            </div>
          </article>

          <article className="listPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Quick Notes</p>
                <h2>Desk notes</h2>
              </div>
            </div>
            <div className="noteStack">
              {journaly.notes.slice(0, 3).map((note) => (
                <div className="noteCard" key={note.id}>
                  <strong>{note.title}</strong>
                  <p>{note.note_text || "Empty note"}</p>
                </div>
              ))}
              {journaly.notes.length === 0 ? <p className="emptyText">No notes found yet.</p> : null}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
