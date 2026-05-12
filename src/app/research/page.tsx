import Link from "next/link";
import { loadJournalyDashboard } from "@/lib/journaly-data";

export default async function ResearchPage() {
  const journaly = await loadJournalyDashboard();

  return (
    <main className="modulePage">
      <header className="moduleHeader">
        <div>
          <p className="eyebrow">Playbook Lab</p>
          <h1>Research</h1>
        </div>
        <Link href="/">Back home</Link>
      </header>
      <section className="cardGrid two">
        {journaly.research.map((idea) => (
          <article className="compactCard" key={idea.id}>
            <p>{idea.category ?? "Research"}</p>
            <h2>{idea.title}</h2>
            <span>{idea.hypothesis ?? "No hypothesis written yet."}</span>
          </article>
        ))}
        {journaly.research.length === 0 ? <p className="emptyText">No research ideas found. Import SQL into Supabase first.</p> : null}
      </section>
    </main>
  );
}
