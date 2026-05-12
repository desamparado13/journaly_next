import Link from "next/link";
import { formatDate, loadJournalyDashboard } from "@/lib/journaly-data";

export default async function TrialsPage() {
  const journaly = await loadJournalyDashboard();

  return (
    <main className="modulePage">
      <header className="moduleHeader">
        <div>
          <p className="eyebrow">Challenge Tracker</p>
          <h1>Trials</h1>
        </div>
        <Link href="/">Back home</Link>
      </header>
      <section className="cardGrid two">
        {journaly.trials.map((trial) => (
          <article className="compactCard" key={trial.id}>
            <p>{trial.status}</p>
            <h2>{trial.title}</h2>
            <span>Started {formatDate(trial.start_date)}</span>
            <strong>${Number(trial.starting_balance).toLocaleString()}</strong>
          </article>
        ))}
        {journaly.trials.length === 0 ? <p className="emptyText">No trials found. Import SQL into Supabase first.</p> : null}
      </section>
    </main>
  );
}
