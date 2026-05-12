const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const bucket = process.env.NEXT_PUBLIC_SUPABASE_LEGACY_BUCKET ?? "legacy-uploads";

export function legacyAssetUrl(path: string | null | undefined) {
  if (!path) return null;

  const normalized = path.replace(/^\/+/, "").replace(/^uploads\//, "");

  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${normalized}`;
  }

  return `/legacy-uploads/${normalized}`;
}
