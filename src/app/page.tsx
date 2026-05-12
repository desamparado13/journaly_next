import Link from "next/link";
import { formatDate, formatR, loadJournalyDashboard } from "@/lib/journaly-data";
import { legacyAssetUrl } from "@/lib/assets";

const navItems = ["Overview", "Trades", "Backtesting", "Research", "Trials"];

export default async function Home() {
  const journaly = await loadJournalyDashboard();
  const latestTrade = journaly.trades[0];
  const latestImage = legacyAssetUrl(latestTrade?.screenshot_path);

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
          <p>Database</p>
          <strong>{journaly.connected ? "Connected" : "Waiting for import"}</strong>
        </div>
      </aside>

      <section className="appMain">
        <header className="appHeader">
          <div>
            <p className="eyebrow">Journaly V2</p>
            <h1>Trading Command Center</h1>
            <p>
              Review execution quality, backtest evidence, research notes, and challenge
              progress from the migrated Supabase database.
            </p>
          </div>
          <div className="headerActions">
            <Link className="ghostAction" href="/migration">Migration</Link>
            <Link className="primaryAction" href="/trades">Trades</Link>
          </div>
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
            <span>Imported trade sample</span>
          </article>
          <article>
            <p>Win Rate</p>
            <strong>{journaly.stats.winRate.toFixed(1)}%</strong>
            <span>{journaly.stats.wins} wins · {journaly.stats.losses} losses</span>
          </article>
          <article>
            <p>Trades</p>
            <strong>{journaly.counts.trades}</strong>
            <span>Live Supabase rows</span>
          </article>
          <article>
            <p>Backtests</p>
            <strong>{journaly.counts.backtests}</strong>
            <span>Replay database</span>
          </article>
        </section>

        <section className="dashboardGrid">
          <article className="listPanel widePanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Recent Trades</p>
                <h2>Execution log</h2>
              </div>
              <Link href="/trades">View all</Link>
            </div>
            <div className="tradeTable">
              <div className="tradeTableHead">
                <span>Date</span>
                <span>Pair</span>
                <span>Setup</span>
                <span>Side</span>
                <span>Result</span>
                <span>R</span>
              </div>
              {journaly.trades.slice(0, 8).map((trade) => (
                <div className="tradeTableRow" key={trade.id}>
                  <span>{formatDate(trade.trade_date)}</span>
                  <strong>{trade.pair}</strong>
                  <span>{trade.setup_type}</span>
                  <span>{trade.direction}</span>
                  <span className={trade.result === "Win" ? "resultWin" : "resultLoss"}>{trade.result}</span>
                  <b className={Number(trade.pnl_r) >= 0 ? "positive" : "negative"}>{formatR(trade.pnl_r)}</b>
                </div>
              ))}
              {journaly.trades.length === 0 ? <p className="emptyText">Import your SQL in Supabase to populate the dashboard.</p> : null}
            </div>
          </article>

          <article className="featurePanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Latest Capture</p>
                <h2>{latestTrade ? `${latestTrade.pair} ${latestTrade.direction}` : "No trade loaded"}</h2>
              </div>
              {latestTrade ? <span className={latestTrade.result === "Win" ? "pillWin" : "pillLoss"}>{latestTrade.result}</span> : null}
            </div>
            {latestTrade ? (
              <div className="captureCard">
                <div className="tradeHero">
                  {latestImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={latestImage} alt="" />
                  ) : (
                    <div className="emptyImage">No screenshot</div>
                  )}
                </div>
                <dl className="tradeStats">
                  <div><dt>Date</dt><dd>{formatDate(latestTrade.trade_date)}</dd></div>
                  <div><dt>Setup</dt><dd>{latestTrade.setup_type}</dd></div>
                  <div><dt>Return</dt><dd>{formatR(latestTrade.pnl_r)}</dd></div>
                </dl>
              </div>
            ) : <p className="emptyText">No latest trade found yet.</p>}
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
