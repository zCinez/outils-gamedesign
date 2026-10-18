import { createService } from "./service.js";

Deno.serve(createService({
  supabaseUrl: Deno.env.get("SUPABASE_URL") || "",
  supabaseKey: Deno.env.get("SUPABASE_ANON_KEY") || "",
  tursoUrl: Deno.env.get("TURSO_DATABASE_URL") || "",
  tursoToken: Deno.env.get("TURSO_AUTH_TOKEN") || ""
}));
