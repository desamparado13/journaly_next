import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "database/source/if0_41403040_journaly_v2.sql");
const outputPath = path.join(root, "supabase/migrations/001_legacy_schema_and_data.sql");

const sql = await readFile(sourcePath, "utf8");
const statements = splitStatements(sql);
const autoIncrements = new Map();
const converted = [
  "-- Generated from database/source/if0_41403040_journaly_v2.sql",
  "-- Keeps legacy table names, IDs, and stored upload paths intact.",
  "set standard_conforming_strings = off;",
  "create schema if not exists public;",
  "set search_path = public;",
  ""
];

for (const statement of statements) {
  const trimmed = statement.trim();
  if (!trimmed || shouldSkip(trimmed)) continue;

  if (/^CREATE TABLE `/i.test(trimmed)) {
    converted.push(convertCreateTable(trimmed), "");
    continue;
  }

  if (/^INSERT INTO `/i.test(trimmed)) {
    converted.push(convertInsert(trimmed) + ";", "");
    continue;
  }

  if (/^ALTER TABLE `/i.test(trimmed)) {
    const alters = convertAlterTable(trimmed, autoIncrements);
    if (alters.length > 0) {
      converted.push(...alters, "");
    }
  }
}

for (const [table, info] of autoIncrements.entries()) {
  const sequenceName = `${table}_${info.column}_seq`;
  converted.push(`create sequence if not exists "${sequenceName}";`);
  converted.push(
    `select setval('"${sequenceName}"', greatest((select coalesce(max("${info.column}"), 1) from "${table}"), ${Math.max(
      info.nextValue - 1,
      1
    )}), (select count(*) > 0 from "${table}"));`
  );
  converted.push(
    `alter table "${table}" alter column "${info.column}" set default nextval('"${sequenceName}"');`
  );
  converted.push(`alter sequence "${sequenceName}" owned by "${table}"."${info.column}";`, "");
}

converted.push(
  "-- Supabase storage bucket used by scripts/upload-legacy-assets-to-supabase.mjs",
  "insert into storage.buckets (id, name, public)",
  "values ('legacy-uploads', 'legacy-uploads', true)",
  "on conflict (id) do nothing;",
  ""
);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, converted.join("\n"), "utf8");
console.log(`Wrote ${outputPath}`);

function shouldSkip(statement) {
  return (
    /^SET /i.test(statement) ||
    /^START TRANSACTION/i.test(statement) ||
    /^COMMIT/i.test(statement) ||
    /^\/\*!/i.test(statement)
  );
}

function splitStatements(input) {
  const cleaned = input
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const result = [];
  let current = "";
  let quote = null;
  let escaped = false;

  for (const char of cleaned) {
    current += char;

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (char === ";") {
      result.push(current.slice(0, -1));
      current = "";
    }
  }

  if (current.trim()) result.push(current);
  return result;
}

function convertCreateTable(statement) {
  const match = statement.match(/^CREATE TABLE `([^`]+)` \(([\s\S]*)\)\s*ENGINE=/i);
  if (!match) {
    throw new Error(`Could not parse CREATE TABLE statement: ${statement.slice(0, 80)}`);
  }

  const [, tableName, body] = match;
  const lines = splitCommaLines(body)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(convertColumnLine);

  return [`create table if not exists "${tableName}" (`, lines.map((line) => `  ${line}`).join(",\n"), ");"].join("\n");
}

function splitCommaLines(body) {
  const lines = [];
  let current = "";
  let depth = 0;
  let quote = null;

  for (const char of body) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") depth++;
    if (char === ")") depth--;

    if (char === "," && depth === 0) {
      lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) lines.push(current);
  return lines;
}

function convertColumnLine(line) {
  const match = line.match(/^`([^`]+)`\s+(.+)$/);
  if (!match) return line;

  const [, columnName, rest] = match;
  let converted = rest
    .replace(/\bint\(\d+\)\s+UNSIGNED/gi, "integer")
    .replace(/\bint\(\d+\)/gi, "integer")
    .replace(/\btinyint\(\d+\)/gi, "smallint")
    .replace(/\bUNSIGNED\b/gi, "")
    .replace(/\blongtext\b/gi, "text")
    .replace(/\bdatetime\b/gi, "timestamp")
    .replace(/\btimestamp\b/gi, "timestamp")
    .replace(/\benum\([^)]+\)/gi, "text")
    .replace(/\s+CHARACTER SET\s+\w+/gi, "")
    .replace(/\s+COLLATE\s+\w+/gi, "")
    .replace(/\s+ON UPDATE current_timestamp\(\)/gi, "")
    .replace(/\bNOT NULL DEFAULT current_timestamp\(\)/gi, "not null default now()")
    .replace(/\bNULL DEFAULT current_timestamp\(\)/gi, "default now()")
    .replace(/\bDEFAULT current_timestamp\(\)/gi, "default now()")
    .replace(/\bDEFAULT NULL\b/gi, "default null")
    .replace(/\bAUTO_INCREMENT\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return `"${columnName}" ${converted}`;
}

function convertInsert(statement) {
  return statement.replace(/`([^`]+)`/g, '"$1"');
}

function convertAlterTable(statement, autoIncrements) {
  const match = statement.match(/^ALTER TABLE `([^`]+)`\s+([\s\S]+)$/i);
  if (!match) return [];

  const [, tableName, body] = match;
  const parts = splitCommaLines(body).map((part) => part.trim());
  const output = [];

  for (const part of parts) {
    const primary = part.match(/^ADD PRIMARY KEY \(`([^`]+)`\)$/i);
    if (primary) {
      output.push(`alter table "${tableName}" add primary key ("${primary[1]}");`);
      continue;
    }

    const unique = part.match(/^ADD UNIQUE KEY `([^`]+)` \(([^)]+)\)$/i);
    if (unique) {
      output.push(
        `create unique index if not exists "${indexName(tableName, unique[1])}" on "${tableName}" (${convertKeyList(
          unique[2]
        )});`
      );
      continue;
    }

    const key = part.match(/^ADD KEY `([^`]+)` \(([^)]+)\)$/i);
    if (key) {
      output.push(`create index if not exists "${indexName(tableName, key[1])}" on "${tableName}" (${convertKeyList(key[2])});`);
      continue;
    }

    const modify = part.match(/^MODIFY `([^`]+)` .+ AUTO_INCREMENT(?:, AUTO_INCREMENT=(\d+))?/i);
    if (modify) {
      autoIncrements.set(tableName, {
        column: modify[1],
        nextValue: Number(modify[2] ?? 1)
      });
      continue;
    }

    const constraint = part.match(
      /^ADD CONSTRAINT `([^`]+)` FOREIGN KEY \(([^)]+)\) REFERENCES `([^`]+)` \(([^)]+)\)(.*)$/i
    );
    if (constraint) {
      output.push(
        `alter table "${tableName}" add constraint "${constraint[1]}" foreign key (${convertKeyList(
          constraint[2]
        )}) references "${constraint[3]}" (${convertKeyList(constraint[4])})${constraint[5].toLowerCase()};`
      );
    }
  }

  return output;
}

function convertKeyList(input) {
  return input
    .split(",")
    .map((item) => item.trim().replace(/`([^`]+)`/g, '"$1"'))
    .join(", ");
}

function indexName(tableName, mysqlIndexName) {
  const name = `${tableName}_${mysqlIndexName}`;
  if (name.length <= 60) return name;
  const hash = [...name].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0).toString(16);
  return `${name.slice(0, 51)}_${hash}`;
}
