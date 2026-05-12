import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const uploadsRoot = path.join(root, "public/legacy-uploads");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_LEGACY_BUCKET || "legacy-uploads";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before uploading assets.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const { error: bucketError } = await supabase.storage.createBucket(bucket, {
  public: true,
  fileSizeLimit: "20MB"
});

if (bucketError && !/already exists/i.test(bucketError.message)) {
  throw bucketError;
}

const files = await listFiles(uploadsRoot);
for (const file of files) {
  const body = await readFile(file.fullPath);
  const { error } = await supabase.storage.from(bucket).upload(file.key, body, {
    upsert: true,
    contentType: contentTypeFor(file.key)
  });

  if (error) throw error;
  console.log(`Uploaded ${file.key}`);
}

console.log(`Uploaded ${files.length} legacy assets into bucket "${bucket}".`);

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const key = path.join(prefix, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, key)));
    } else if (entry.isFile()) {
      files.push({ fullPath, key });
    }
  }

  return files;
}

function contentTypeFor(key) {
  const ext = path.extname(key).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".html") return "text/html; charset=utf-8";
  return "application/octet-stream";
}
