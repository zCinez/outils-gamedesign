window.NEODIUM_SUPABASE_CONFIG = Object.freeze({
  url: "https://koslfxkbmcnbgtcyshmh.supabase.co",
  anonKey: "sb_publishable_ZznjWeKWsCpq-Aws7fbwxQ_1KWzlJAD",
  mode: "shared_team_auth",
  storageTable: "neodium_shared_storage",
  workspaceId: "global",
  cloudCompressionEnabled: true,
  cloudCompressionMinLength: 1024,
  syncKeyPrefixes: ["neodium_", "neodium-", "statgm-"],
  syncKeys: [],
  localOnlyKeys: [
    "neodium-cdc-recovery-draft",
    "neodium-cdc-theme",
    "statgm-theme",
    "neodium-cdc-project-history",
    "neodium-cdc-projects",
    "neodium-cdc-active-project",
    "neodium-cdc-active-history-projects"
  ],
  cleanupKeys: [
    "neodium-cdc-recovery-draft",
    "neodium-cdc-theme",
    "statgm-theme"
  ],
  emailRedirectTo: window.location.origin + window.location.pathname
});
