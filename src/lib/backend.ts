/**
 * True when this build was given the backend connection settings.
 * If a published build is missing them, pages fall back to built-in demo data instead of crashing.
 */
export const backendConfigured = Boolean(
  import.meta.env['VITE_SUPABASE_URL'] && import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'],
);
