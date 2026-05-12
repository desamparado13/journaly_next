import { legacyTables } from "@/lib/supabase";

const migrationSteps = [
  {
    eyebrow: "Schema",
    title: "Build Supabase SQL",
    detail: "Generate Postgres-safe tables, indexes, sequences, and legacy row inserts.",
    command: "npm run migration:build"
  },
  {
    eyebrow: "Database",
    title: "Apply Migration",
    detail: "Run the generated SQL against a fresh Supabase project before any traffic moves.",
    command: "supabase db push"
  },
  {
    eyebrow: "Storage",
    title: "Upload Legacy Assets",
    detail: "Move copied trade screenshots, backtests, avatars, and reports into Supabase Storage.",
    command: "npm run storage:upload"
  },
  {
    eyebrow: "Audit",
    title: "Verify Counts",
    detail: "Compare the local manifest against Supabase rows and asset totals.",
    command: "npm run migration:verify"
  }
];

const metrics = [
  ["Legacy Tables", legacyTables.length.toString()],
  ["Uploaded Files", "200"],
  ["Asset Folders", "7"],
  ["Protected Dump", "1"]
];

const integrityChecks = [
  "Legacy numeric IDs are preserved before sequences are advanced.",
  "Stored upload paths remain unchanged during the first migration.",
  "Private SQL, tokens, password hashes, and screenshots stay out of Git.",
  "The old host should remain online until Supabase counts are verified."
];

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <nav className="topbar" aria-label="Journaly V2">
          <div className="brandMark" aria-hidden="true">
            J2
          </div>
          <div>
            <p className="brandKicker">Journaly V2</p>
            <p className="brandSubline">Vercel + Supabase migration</p>
          </div>
          <div className="topbarStatus">Data locked</div>
        </nav>

        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Premium rebuild, zero data drift</p>
            <h1 className="title">Journaly V2</h1>
            <p className="subtitle">
              A cleaner trading journal foundation for Vercel and Supabase,
              shaped around one rule: your trades, screenshots, reports, notes,
              and account history move intact before the interface evolves.
            </p>
          </div>

          <aside className="heroPanel" aria-label="Migration snapshot">
            <div className="heroPanelHeader">
              <span>Migration Snapshot</span>
              <strong>Ready for Supabase</strong>
            </div>
            <div className="signalGrid">
              {metrics.map(([label, value]) => (
                <div className="signal" key={label}>
                  <p>{label}</p>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="workspace">
        <div className="sectionHeader">
          <p className="eyebrow">Execution Path</p>
          <h2>Move the database, then refine the product.</h2>
        </div>

        <div className="stepGrid">
          {migrationSteps.map((step, index) => (
            <article className="stepCard" key={step.command}>
              <div className="stepNumber">{String(index + 1).padStart(2, "0")}</div>
              <p className="cardEyebrow">{step.eyebrow}</p>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
              <code>{step.command}</code>
            </article>
          ))}
        </div>

        <div className="lowerGrid">
          <section className="panel dataPanel">
            <div>
              <p className="eyebrow">Data Integrity</p>
              <h2>No silent rewrites.</h2>
            </div>
            <ul className="checkList">
              {integrityChecks.map((item) => (
                <li key={item}>
                  <span aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel tablePanel">
            <div>
              <p className="eyebrow">Legacy Coverage</p>
              <h2>{legacyTables.length} tables tracked.</h2>
            </div>
            <div className="tableCloud">
              {legacyTables.map((table) => (
                <span key={table}>{table}</span>
              ))}
            </div>
          </section>
        </div>

        <section className="commandPanel" aria-label="Migration command block">
          <div>
            <p className="eyebrow">Current Guardrail</p>
            <h2>Keep the old Journaly live until verification passes.</h2>
          </div>
          <pre>
            <code>{`npm run migration:build
npm run migration:verify
npm run storage:upload`}</code>
          </pre>
        </section>
      </section>
    </main>
  );
}
