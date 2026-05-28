const STATGM_REFERENCE_STORAGE_KEY = "statgm-reference-settings";

const STATGM_REFERENCE_GROUPS = [
  {
    id: "minerals",
    title: "Mineur",
    description: "Blocs ou minerais par heure de reference pour le rendement du mineur.",
    entries: [
      { key: "stone", label: "Stone" },
      { key: "coal", label: "Charbon" },
      { key: "copper", label: "Cuivre" },
      { key: "lapis", label: "Lapis" },
      { key: "quartz", label: "Quartz" },
      { key: "redstone", label: "Redstone" },
      { key: "iron", label: "Fer" },
      { key: "gold", label: "Or" },
      { key: "diamond", label: "Diamant" },
      { key: "emerald", label: "Emeraude" },
      { key: "gem", label: "Gemme" }
    ]
  },
  {
    id: "woods",
    title: "Bucheron",
    description: "Buches par heure de reference pour le rendement du bucheron.",
    entries: [
      { key: "oak", label: "Chene" },
      { key: "birch", label: "Bouleau" },
      { key: "acacia", label: "Acacia" },
      { key: "darkOak", label: "Chene noir" },
      { key: "spruce", label: "Sapin" },
      { key: "mahogany", label: "Acajou" },
      { key: "crimson", label: "Carmin" },
      { key: "warped", label: "Biscornue" }
    ]
  },
  {
    id: "crops",
    title: "Fermier",
    description: "Items par heure de reference pour le rendement du fermier.",
    entries: [
      { key: "wheat", label: "Ble" },
      { key: "carrot", label: "Carotte" },
      { key: "potato", label: "Pomme de terre" },
      { key: "pumpkin", label: "Citrouille" },
      { key: "sugarCane", label: "Canne a sucre" },
      { key: "beetroot", label: "Betterave" },
      { key: "netherWart", label: "Verrue de Nether" },
      { key: "cocoaBeans", label: "Feves de cacao" },
      { key: "vine", label: "Liane" },
      { key: "brownMushroom", label: "Champignon marron" },
      { key: "redMushroom", label: "Champignon rouge" }
    ]
  },
  {
    id: "mobs",
    title: "Chasseur",
    description: "Mobs par heure de reference pour le rendement du chasseur.",
    entries: [
      { key: "zombie", label: "Zombie" },
      { key: "angel", label: "Ange" },
      { key: "aspic", label: "Aspic" },
      { key: "asseche", label: "Asseche" },
      { key: "assoife", label: "Assoife" },
      { key: "dracorne", label: "Dracorne" },
      { key: "aragnis", label: "Aragnis" },
      { key: "mutant", label: "Mutant" },
      { key: "demon", label: "Demon" },
      { key: "sylphe", label: "Sylphe" },
      { key: "manticort", label: "Manticort" }
    ]
  }
];

const STATGM_DEFAULT_REFERENCE_SETTINGS = {
  _meta: {
    betaProjectionMinFarmSeconds: 3600
  },
  minerals: {
    stone: 65280,
    coal: 65280,
    copper: 65280,
    lapis: 65280,
    quartz: 65280,
    redstone: 65280,
    iron: 65280,
    gold: 65280,
    diamond: 65280,
    emerald: 65280,
    gem: 20
  },
  woods: {
    oak: 6000,
    birch: 6000,
    acacia: 6000,
    darkOak: 7260,
    spruce: 5400,
    mahogany: 6840,
    crimson: 6480,
    warped: 6480
  },
  crops: {
    wheat: 60000,
    carrot: 60000,
    potato: 60000,
    pumpkin: 37440,
    sugarCane: 75600,
    beetroot: 60000,
    netherWart: 60000,
    cocoaBeans: 48000,
    vine: 7800,
    brownMushroom: 4,
    redMushroom: 4
  },
  mobs: {
    zombie: 114000,
    angel: 114000,
    aspic: 114000,
    asseche: 114000,
    assoife: 114000,
    dracorne: 114000,
    aragnis: 114000,
    mutant: 114000,
    demon: 114000,
    sylphe: 114000,
    manticort: 114000
  }
};

const cloneReferenceSettings = (settings) => JSON.parse(JSON.stringify(settings));

const mergeReferenceSettings = (storedSettings = {}) => {
  const merged = cloneReferenceSettings(STATGM_DEFAULT_REFERENCE_SETTINGS);

  const storedMeta = storedSettings._meta;
  if (storedMeta && typeof storedMeta === "object") {
    const candidate = Number(storedMeta.betaProjectionMinFarmSeconds);
    if (Number.isFinite(candidate) && candidate >= 0) {
      merged._meta.betaProjectionMinFarmSeconds = candidate;
    }
  }

  Object.keys(merged).forEach((groupKey) => {
    if (groupKey === "_meta") return;
    const storedGroup = storedSettings[groupKey];
    if (!storedGroup || typeof storedGroup !== "object") return;

    Object.keys(merged[groupKey]).forEach((entryKey) => {
      const candidate = Number(storedGroup[entryKey]);
      if (Number.isFinite(candidate) && candidate >= 0) {
        merged[groupKey][entryKey] = candidate;
      }
    });
  });

  return merged;
};

const readReferenceSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STATGM_REFERENCE_STORAGE_KEY) || "{}");
    return mergeReferenceSettings(stored);
  } catch {
    return cloneReferenceSettings(STATGM_DEFAULT_REFERENCE_SETTINGS);
  }
};

const writeReferenceSettings = (settings) => {
  const merged = mergeReferenceSettings(settings);
  localStorage.setItem(STATGM_REFERENCE_STORAGE_KEY, JSON.stringify(merged));
  return merged;
};

const resetReferenceSettings = () => {
  localStorage.setItem(
    STATGM_REFERENCE_STORAGE_KEY,
    JSON.stringify(cloneReferenceSettings(STATGM_DEFAULT_REFERENCE_SETTINGS))
  );
  return cloneReferenceSettings(STATGM_DEFAULT_REFERENCE_SETTINGS);
};

window.ReferenceConfig = {
  storageKey: STATGM_REFERENCE_STORAGE_KEY,
  groups: STATGM_REFERENCE_GROUPS,
  defaultSettings: cloneReferenceSettings(STATGM_DEFAULT_REFERENCE_SETTINGS),
  read: readReferenceSettings,
  write: writeReferenceSettings,
  reset: resetReferenceSettings,
  merge: mergeReferenceSettings
};
