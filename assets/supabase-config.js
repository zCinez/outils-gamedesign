window.NEODIUM_SUPABASE_CONFIG = Object.freeze({
  url: "https://koslfxkbmcnbgtcyshmh.supabase.co",
  anonKey: "sb_publishable_ZznjWeKWsCpq-Aws7fbwxQ_1KWzlJAD",
  mode: "shared_team_auth",
  storageTable: "neodium_shared_storage",
  workspaceId: "global",
  syncKeyPrefixes: ["neodium_", "neodium-", "statgm-"],
  syncKeys: [],
  localOnlyKeys: ["neodium-cdc-recovery-draft", "neodium-cdc-theme", "statgm-theme"],
  cleanupKeys: ["neodium-cdc-recovery-draft", "neodium-cdc-theme", "statgm-theme"],
  emailRedirectTo: window.location.origin + window.location.pathname
});
