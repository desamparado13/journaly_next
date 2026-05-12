import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sqlPath = path.join(root, "database/source/if0_41403040_journaly_v2.sql");
const uploadsPath = path.join(root, "public/legacy-uploads");
const manifestPath = path.join(root, "database/manifest.json");

const sql = await readFile(sqlPath, "utf8");
const tables = {};
for (const match of sql.matchAll(/INSERT INTO `([^`]+)`[\s\S]*?;\n/g)) {
  const table = match[1];
  tables[table] = (tables[table] ?? 0) + countValueRows(match[0]);
}

const assets = await listFiles(uploadsPath);
const manifest = {
  generatedAt: new Date().toISOString(),
  sourceSql: path.relative(root, sqlPath).replaceAll("\\", "/"),
  tableRows: tables,
  assets: {
    root: "public/legacy-uploads",
    count: assets.length,
    totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    byFolder: assets.reduce((folders, asset) => {
      const folder = asset.path.split("/")[0] || "root";
      folders[folder] ??= { count: 0, bytes: 0 };
      folders[folder].count++;
      folders[folder].bytes += asset.bytes;
      return folders;
    }, {}),
    files: assets
  }
};

await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Wrote ${manifestPath}`);
console.table(manifest.tableRows);
console.log(`Assets: ${manifest.assets.count} files, ${manifest.assets.totalBytes} bytes`);

function countValueRows(insertSql) {
  const values = insertSql.slice(insertSql.indexOf("VALUES") + "VALUES".length);
  let rows = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (const char of values) {
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

    if (char === "'") {
      quote = char;
      continue;
    }

    if (char === "(") {
      if (depth === 0) rows++;
      depth++;
    } else if (char === ")") {
      depth--;
    }
  }

  return rows;
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.join(prefix, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, relativePath)));
    } else if (entry.isFile()) {
      const details = await stat(fullPath);
      const bytes = await readFile(fullPath);
      files.push({
        path: relativePath,
        bytes: details.size,
        sha256: createHash("sha256").update(bytes).digest("hex")
      });
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}
