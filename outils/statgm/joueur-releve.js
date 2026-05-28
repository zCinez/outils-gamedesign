const releveTitle = document.querySelector("[data-releve-title]");
const releveSubtitle = document.querySelector("[data-releve-subtitle]");
const relevePlayer = document.querySelector("[data-releve-player]");
const releveBack = document.querySelector("[data-releve-back]");
const betaReleveCard = document.querySelector("[data-beta-releve-card]");
const betaReleveCheckbox = document.querySelector('input[name="betaReleve"]');
const betaDayField = document.querySelector("[data-beta-day-field]");
const releveForm = document.querySelector(".releve-form");
const releveFeedback = document.querySelector("[data-releve-feedback]");
const releveModal = document.querySelector(".releve-modal");
const releveCategoryLinks = document.querySelectorAll("[data-releve-category]");
const importJsonButton = document.querySelector("[data-import-json]");
const importJsonInput = document.querySelector("[data-import-json-input]");
const relevePanels = Array.from(releveCategoryLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const panelPrevButton = document.querySelector("[data-panel-prev]");
const panelNextButton = document.querySelector("[data-panel-next]");
const betaCategoryLink = document.querySelector("[data-category-beta]");
const questCalculatorInputs = document.querySelectorAll("[data-quest-calculator]");
const questCompletedInputs = document.querySelectorAll("[data-quest-completed]");
const questTotalInputs = document.querySelectorAll("[data-quest-total]");
const questTimeInputs = document.querySelectorAll("[data-quest-time]");
const questTotalTimeOutput = document.querySelector("[data-quest-total-time]");
const questCompletionOutput = document.querySelector("[data-quest-completion]");
const mineralsGrid = document.querySelector("[data-minerals-grid]");
const minerCaveTimeInputs = document.querySelectorAll("[data-miner-cave-time]");
const minerCaveOresInput = document.querySelector("[data-miner-cave-ores]");
const minerCaveRatioOutput = document.querySelector("[data-miner-cave-ratio]");
const woodGrid = document.querySelector("[data-wood-grid]");
const cropGrid = document.querySelector("[data-crop-grid]");
const mobGrid = document.querySelector("[data-mob-grid]");

const playersStorageKey = "statgm-players";
const relevesStorageKey = "statgm-releves";
const store = window.StatGMStore;
const minerMinerals = [
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
];
const lumberjackWoods = [
  { key: "oak", label: "Chene" },
  { key: "birch", label: "Bouleau" },
  { key: "acacia", label: "Acacia" },
  { key: "darkOak", label: "Chene noir" },
  { key: "spruce", label: "Sapin" },
  { key: "mahogany", label: "Acajou" },
  { key: "crimson", label: "Carmin" },
  { key: "warped", label: "Biscornue" }
];
const farmerCrops = [
  { key: "wheat", label: "Bl&eacute;" },
  { key: "carrot", label: "Carotte" },
  { key: "potato", label: "Pomme de terre" },
  { key: "pumpkin", label: "Citrouille" },
  { key: "sugarCane", label: "Canne a sucre" },
  { key: "beetroot", label: "Betterave" },
  { key: "netherWart", label: "Verrue de Nether" },
  { key: "cocoaBeans", label: "F&egrave;ves de cacao" },
  { key: "vine", label: "Liane" },
  { key: "brownMushroom", label: "Champignon marron" },
  { key: "redMushroom", label: "Champignon rouge" }
];
const hunterMobs = [
  { key: "zombie", label: "Zombie" },
  { key: "angel", label: "Ange" },
  { key: "aspic", label: "Aspic" },
  { key: "asseche", label: "Ass&eacute;ch&eacute;" },
  { key: "assoife", label: "Assoif&eacute;" },
  { key: "dracorne", label: "Dracorne" },
  { key: "aragnis", label: "Aragnis" },
  { key: "mutant", label: "Mutant" },
  { key: "demon", label: "Demon" },
  { key: "sylphe", label: "Sylphe" },
  { key: "manticort", label: "Manticort" }
];
const referenceConfig = window.ReferenceConfig;
const referenceSettings = referenceConfig ? referenceConfig.read() : {
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
const mineralYieldReferences = referenceSettings.minerals;
const woodYieldReferences = referenceSettings.woods;
const cropYieldReferences = referenceSettings.crops;
const mobYieldReferences = referenceSettings.mobs;
const fixedQuestTotals = {
  mainQuestsTotal: "9",
  secondaryQuestsTotal: "4",
  dailyQuestsTotal: "-"
};
let playersCache = [];
let relevesCache = [];

const readPlayers = () => {
  return Array.isArray(playersCache) ? [...playersCache] : [];
};

const readReleves = () => {
  return Array.isArray(relevesCache) ? [...relevesCache] : [];
};

const writeReleves = async (releves) => {
  relevesCache = Array.isArray(releves) ? [...releves] : [];
  if (store?.setList) {
    await store.setList(relevesStorageKey, relevesCache);
    return;
  }

  localStorage.setItem(relevesStorageKey, JSON.stringify(relevesCache));
};

const hydrateStorageCaches = async () => {
  if (store?.ready) {
    await store.ready();
    playersCache = store.getList(playersStorageKey);
    relevesCache = store.getList(relevesStorageKey);
    return;
  }

  try {
    playersCache = JSON.parse(localStorage.getItem(playersStorageKey) || "[]");
    relevesCache = JSON.parse(localStorage.getItem(relevesStorageKey) || "[]");
  } catch {
    playersCache = [];
    relevesCache = [];
  }
};

const createId = () => globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");
const releveId = params.get("releveId");
let player = null;
let editingReleve = null;

const updateBetaDayField = () => {
  if (!betaDayField || !betaReleveCheckbox) return;
  betaDayField.hidden = !betaReleveCheckbox.checked;
};

const applyFixedQuestTotals = () => {
  if (!releveForm) return;
  Object.entries(fixedQuestTotals).forEach(([fieldName, value]) => {
    if (releveForm.elements[fieldName]) {
      releveForm.elements[fieldName].value = value;
    }
  });
};

const getAvailableCategoryLinks = () => {
  return Array.from(releveCategoryLinks).filter((link) => !link.hidden);
};

const updatePanelNavButtons = (activeLink, availableLinks) => {
  const activeIndex = availableLinks.indexOf(activeLink);
  if (panelPrevButton) panelPrevButton.disabled = activeIndex <= 0;
  if (panelNextButton) panelNextButton.disabled = activeIndex < 0 || activeIndex >= availableLinks.length - 1;
};

const showRelevePanel = (requestedLink, shouldScrollTop = false) => {
  const availableLinks = getAvailableCategoryLinks();
  const activeLink = requestedLink && !requestedLink.hidden
    ? requestedLink
    : availableLinks.find((link) => link.classList.contains("is-active")) || availableLinks[0];

  if (!activeLink) return;

  const activePanel = document.querySelector(activeLink.getAttribute("href"));
  if (!activePanel) return;

  releveCategoryLinks.forEach((link) => {
    link.classList.toggle("is-active", link === activeLink);
  });

  relevePanels.forEach((panel) => {
    panel.hidden = panel !== activePanel;
  });

  updatePanelNavButtons(activeLink, availableLinks);

  if (shouldScrollTop && releveModal) {
    releveModal.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateBetaDayField();
};

const showAdjacentPanel = (direction) => {
  const availableLinks = getAvailableCategoryLinks();
  const currentIndex = availableLinks.findIndex((link) => link.classList.contains("is-active"));
  const fallbackIndex = currentIndex < 0 ? 0 : currentIndex;
  const targetIndex = Math.min(Math.max(fallbackIndex + direction, 0), availableLinks.length - 1);
  const targetLink = availableLinks[targetIndex];

  if (targetLink && targetIndex !== currentIndex) {
    showRelevePanel(targetLink, true);
  }
};

const getLastPlayerReleve = () => {
  return readReleves()
    .filter((releve) => String(releve.playerId) === String(playerId))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0];
};

const pad = (value) => String(value).padStart(2, "0");
const now = new Date();
const dateValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timeValue = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
const dateTimeValue = `${dateValue}T${timeValue}`;

const toFiniteNumber = (value) => {
  const normalizedValue = String(value || "").replace(",", ".");
  const numberValue = Number(normalizedValue);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeImportedNumberString = (value) => {
  if (value === null || value === undefined || value === "") return "";

  const rawValue = String(value).trim().replace(",", ".");
  if (!rawValue) return "";

  if (/e/i.test(rawValue)) {
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return "";
    const expanded = numericValue.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 20
    });
    return expanded.replace(/\.?0+$/, "").replace(".", ",");
  }

  return rawValue.replace(".", ",");
};

const normalizeImportedCoins = (value) => {
  const numericValue = toFiniteNumber(value);
  if (!Number.isFinite(numericValue)) return "";
  return normalizeImportedNumberString((numericValue / 1000).toFixed(3));
};

const normalizeImportedMoney = (value) => {
  const numericValue = toFiniteNumber(value);
  if (!Number.isFinite(numericValue)) return "";
  return normalizeImportedNumberString(numericValue.toFixed(2));
};

const normalizeImportedInteger = (value) => {
  const numericValue = toFiniteNumber(value);
  if (!Number.isFinite(numericValue)) return "";
  return normalizeImportedNumberString(Math.round(numericValue));
};

const importDurationSecondsToFields = (secondsValue, fieldNames = {}) => {
  applyDurationToFields(toFiniteNumber(secondsValue) * 1000, fieldNames);
};

const getAverage = (values) => {
  const safeValues = values.map(toFiniteNumber).filter((value) => Number.isFinite(value));
  if (!safeValues.length) return 0;
  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
};

const minerResourceKeyMap = {
  stone: "stone",
  coal: "coal",
  copper: "copper",
  lapis: "lapis",
  quartz: "quartz",
  redstone: "redstone",
  iron: "iron",
  gold: "gold",
  diamond: "diamond",
  emerald: "emerald",
  gemme: "gem"
};

const woodResourceKeyMap = {
  oak_log: "oak",
  birch_log: "birch",
  acacia_log: "acacia",
  dark_oak_log: "darkOak",
  spruce_log: "spruce",
  jungle_log: "mahogany",
  crimson_stem: "crimson",
  warped_stem: "warped"
};

const cropResourceKeyMap = {
  wheat: "wheat",
  carrots: "carrot",
  potatoes: "potato",
  pumpkin: "pumpkin",
  sugar_cane: "sugarCane",
  beetroots: "beetroot",
  nether_wart: "netherWart",
  cocoa_beans: "cocoaBeans",
  vines: "vine",
  brown_mushroom: "brownMushroom",
  red_mushroom: "redMushroom"
};

const mobResourceKeyMap = {
  zombie: "zombie",
  ange: "angel",
  angel: "angel",
  aspic: "aspic",
  asseche: "asseche",
  assoife: "assoife",
  dracorne: "dracorne",
  aragnis: "aragnis",
  mutant: "mutant",
  demon: "demon",
  sylphe: "sylphe",
  manticort: "manticort"
};

const formatDateTimeLocal = (timestampMs) => {
  const safeMs = toFiniteNumber(timestampMs);
  if (!safeMs) return "";
  const date = new Date(safeMs);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const applyDurationToFields = (durationMs, fieldNames = {}) => {
  const safeMs = Math.max(0, Math.floor(toFiniteNumber(durationMs)));
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (fieldNames.days) setFormValue(fieldNames.days, String(days));
  if (fieldNames.hours) setFormValue(fieldNames.hours, String(hours));
  if (fieldNames.minutes) setFormValue(fieldNames.minutes, String(minutes));
  if (fieldNames.seconds) setFormValue(fieldNames.seconds, String(seconds));
};

const handleImportedJson = (rawPayload) => {
  if (!releveForm) return;

  let parsed;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    if (releveFeedback) releveFeedback.textContent = "Le fichier JSON est invalide.";
    return;
  }

  const profile = parsed?.profile || {};
  const playerData = parsed?.player || {};
  const playtimeData = parsed?.playtime || {};
  const economyData = parsed?.economy || {};
  const questsData = parsed?.quests || {};
  const jobsLevelsData = parsed?.jobs_levels || {};
  const jobResourcesData = parsed?.job_resources || {};

  setFormValue("grade", profile.luckperms_primary_group || "");
  setFormValue("argent", normalizeImportedMoney(profile.vault_balance ?? "0"));
  setFormValue("coins", normalizeImportedCoins(profile.coins_skript ?? "0"));
  setFormValue("boost", normalizeImportedNumberString(profile.rjobs_boost_multiplier ?? "1"));
  setFormValue("arrival", formatDateTimeLocal(playerData.first_played_ms));
  setFormValue("moneyEarned", normalizeImportedMoney(economyData.vault_gained_total_plugin ?? "0"));
  setFormValue("moneySpent", normalizeImportedMoney(economyData.vault_spent_total_plugin ?? "0"));
  setFormValue("sellMoney", normalizeImportedMoney(economyData.skript_sell_total_cumulative ?? "0"));
  setFormValue("hopperMoney", normalizeImportedMoney(economyData.hopper_money_cumulative ?? "0"));
  setFormValue("sellStickMoney", normalizeImportedMoney(economyData.skript_sellstick_cumulative ?? "0"));
  setFormValue("averageSales", normalizeImportedMoney(economyData.average_24h_hourly ?? "0"));
  setFormValue("mainQuestsDone", normalizeImportedNumberString(questsData.main_unlock ?? "0"));
  setFormValue("secondaryQuestsDone", normalizeImportedNumberString(questsData.secondary_completed_count ?? "0"));
  setFormValue("dailyQuestsDone", normalizeImportedNumberString(questsData.daily_count ?? "0"));
  setFormValue("minerLevel", normalizeImportedNumberString(jobsLevelsData.Mineur ?? "0"));
  setFormValue("lumberjackLevel", normalizeImportedNumberString(jobsLevelsData.Bucheron ?? "0"));
  setFormValue("farmerLevel", normalizeImportedNumberString(jobsLevelsData.Fermier ?? "0"));
  setFormValue("hunterLevel", normalizeImportedNumberString(jobsLevelsData.Chasseur ?? "0"));

  const importedPlayDurationMs = playtimeData.play_seconds_vanilla_stat
    ? toFiniteNumber(playtimeData.play_seconds_vanilla_stat) * 1000
    : toFiniteNumber(playerData.last_played_ms);

  applyDurationToFields(importedPlayDurationMs, {
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds"
  });

  importDurationSecondsToFields(questsData.time_principal_seconds, {
    days: "mainQuestDays",
    hours: "mainQuestHours",
    minutes: "mainQuestMinutes",
    seconds: "mainQuestSeconds"
  });
  importDurationSecondsToFields(questsData.time_secondaire_seconds, {
    days: "secondaryQuestDays",
    hours: "secondaryQuestHours",
    minutes: "secondaryQuestMinutes",
    seconds: "secondaryQuestSeconds"
  });
  importDurationSecondsToFields(questsData.time_daily_seconds, {
    days: "dailyQuestDays",
    hours: "dailyQuestHours",
    minutes: "dailyQuestMinutes",
    seconds: "dailyQuestSeconds"
  });

  const minerResources = Array.isArray(jobResourcesData.MINEUR) ? jobResourcesData.MINEUR : [];
  let minerInfoAmountTotal = 0;
  let minerInfoTimeTotal = 0;
  minerResources.forEach((resource) => {
    const resourceKey = String(resource?.resource_key || "").trim();

    if (resourceKey === "grotte") {
      setFormValue("minerCaveOres", normalizeImportedNumberString(resource.amount ?? "0"));
      importDurationSecondsToFields(resource.time_seconds, {
        days: "minerCaveDays",
        hours: "minerCaveHours",
        minutes: "minerCaveMinutes",
        seconds: "minerCaveSeconds"
      });
      return;
    }

    minerInfoAmountTotal += toFiniteNumber(resource.amount);
    minerInfoTimeTotal += toFiniteNumber(resource.time_seconds);

    const mappedKey = minerResourceKeyMap[resourceKey];
    if (!mappedKey) return;

    setFormValue(`${mappedKey}MineralBlocksBroken`, normalizeImportedNumberString(resource.amount ?? "0"));
    setFormValue(`${mappedKey}MineralXp`, normalizeImportedInteger(resource.xp ?? "0"));
    setFormValue(`${mappedKey}MineralMoney`, normalizeImportedMoney(resource.money ?? "0"));
    setFormValue(`${mappedKey}MineralBlocksCrafted`, normalizeImportedNumberString(resource.crafted ?? "0"));
    importDurationSecondsToFields(resource.time_seconds, {
      days: `${mappedKey}MineralDays`,
      hours: `${mappedKey}MineralHours`,
      minutes: `${mappedKey}MineralMinutes`,
      seconds: `${mappedKey}MineralSeconds`
    });
  });

  setFormValue("minerInfoOres", normalizeImportedNumberString(minerInfoAmountTotal));
  importDurationSecondsToFields(minerInfoTimeTotal, {
    days: "minerInfoDays",
    hours: "minerInfoHours",
    minutes: "minerInfoMinutes",
    seconds: "minerInfoSeconds"
  });
  const minerInfoRatio = minerInfoTimeTotal > 0
    ? minerInfoAmountTotal / (minerInfoTimeTotal / 3600)
    : 0;
  setFormValue("minerInfoRatio", formatRate(minerInfoRatio));

  const woodResources = Array.isArray(jobResourcesData.BUCHERON) ? jobResourcesData.BUCHERON : [];
  woodResources.forEach((resource) => {
    const mappedKey = woodResourceKeyMap[String(resource?.resource_key || "").trim()];
    if (!mappedKey) return;

    setFormValue(`${mappedKey}WoodLogs`, normalizeImportedNumberString(resource.amount ?? "0"));
    setFormValue(`${mappedKey}WoodXp`, normalizeImportedInteger(resource.xp ?? "0"));
    setFormValue(`${mappedKey}WoodMoney`, normalizeImportedMoney(resource.money ?? "0"));
    importDurationSecondsToFields(resource.time_seconds, {
      days: `${mappedKey}WoodDays`,
      hours: `${mappedKey}WoodHours`,
      minutes: `${mappedKey}WoodMinutes`,
      seconds: `${mappedKey}WoodSeconds`
    });
  });

  const cropResources = Array.isArray(jobResourcesData.FERMIER) ? jobResourcesData.FERMIER : [];
  cropResources.forEach((resource) => {
    const mappedKey = cropResourceKeyMap[String(resource?.resource_key || "").trim()];
    if (!mappedKey) return;

    setFormValue(`${mappedKey}CropItems`, normalizeImportedNumberString(resource.amount ?? "0"));
    setFormValue(`${mappedKey}CropXp`, normalizeImportedInteger(resource.xp ?? "0"));
    setFormValue(`${mappedKey}CropMoney`, normalizeImportedMoney(resource.money ?? "0"));
    importDurationSecondsToFields(resource.time_seconds, {
      days: `${mappedKey}CropDays`,
      hours: `${mappedKey}CropHours`,
      minutes: `${mappedKey}CropMinutes`,
      seconds: `${mappedKey}CropSeconds`
    });
  });

  const mobResources = Array.isArray(jobResourcesData.CHASSEUR) ? jobResourcesData.CHASSEUR : [];
  mobResources.forEach((resource) => {
    const mappedKey = mobResourceKeyMap[String(resource?.resource_key || "").trim()];
    if (!mappedKey) return;

    setFormValue(`${mappedKey}MobKills`, normalizeImportedNumberString(resource.amount ?? "0"));
    setFormValue(`${mappedKey}MobXp`, normalizeImportedInteger(resource.xp ?? "0"));
    setFormValue(`${mappedKey}MobMoney`, normalizeImportedMoney(resource.money ?? "0"));
    importDurationSecondsToFields(resource.time_seconds, {
      days: `${mappedKey}MobDays`,
      hours: `${mappedKey}MobHours`,
      minutes: `${mappedKey}MobMinutes`,
      seconds: `${mappedKey}MobSeconds`
    });
  });

  updateQuestSummary();
  minerMinerals.forEach(updateMineralCard);
  updateMinerStats();
  lumberjackWoods.forEach(updateWoodCard);
  updateLumberjackStats();
  farmerCrops.forEach(updateCropCard);
  updateFarmerStats();
  hunterMobs.forEach(updateMobCard);
  updateHunterStats();
  fillImportedJobRatios(jobResourcesData);

  if (releveFeedback) {
    releveFeedback.textContent = "Import JSON termine. Infos du releve, economie, quetes, niveaux metiers et metiers ont ete remplis.";
  }
};

const formatQuestDuration = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${days}j ${hours}h ${minutes}m ${seconds}s`;
};

const formatRate = (value) => {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
};

const updateQuestSummary = () => {
  const totalSeconds = Array.from(questTimeInputs).reduce((total, input) => {
    if (String(input.name || "").startsWith("dailyQuest")) return total;
    const unit = input.dataset.questTime;
    const value = toFiniteNumber(input.value);
    if (unit === "days") return total + (value * 86400);
    if (unit === "hours") return total + (value * 3600);
    if (unit === "minutes") return total + (value * 60);
    return total + value;
  }, 0);

  const completedQuests = Array.from(questCompletedInputs).reduce((total, input) => total + toFiniteNumber(input.value), 0);
  const totalQuests = Array.from(questTotalInputs).reduce((total, input) => total + toFiniteNumber(input.value), 0);

  if (questTotalTimeOutput) {
    questTotalTimeOutput.value = formatQuestDuration(totalSeconds);
  }

  if (questCompletionOutput) {
    const completionRate = totalQuests > 0 ? Math.min(100, Math.max(0, (completedQuests / totalQuests) * 100)) : 0;
    questCompletionOutput.value = formatRate(completionRate);
  }
};

const renderMineralCards = () => {
  if (!mineralsGrid) return;

  mineralsGrid.innerHTML = minerMinerals.map(({ key, label }) => `
    <article class="mineral-card" data-mineral-card="${key}">
      <div class="mineral-card__top">
        <div>
          <h4>${label}</h4>
          <p>Statistiques detaillees du minerai</p>
        </div>
        <span class="mineral-card__pill">Mineur</span>
      </div>

      <div class="mineral-field-grid">
        <label class="field field-full">
          <span>XP gagnee</span>
          <input type="number" name="${key}MineralXp" min="0" value="0" data-mineral-input>
        </label>

        <fieldset class="releve-time-fieldset mineral-time-fieldset">
          <legend>Temps passe a farm</legend>
          <label>
            <span>Jours</span>
            <input type="number" name="${key}MineralDays" min="0" value="0" data-mineral-input>
          </label>
          <label>
            <span>Heures</span>
            <input type="number" name="${key}MineralHours" min="0" value="0" data-mineral-input>
          </label>
          <label>
            <span>Minutes</span>
            <input type="number" name="${key}MineralMinutes" min="0" max="59" value="0" data-mineral-input>
          </label>
          <label>
            <span>Secondes</span>
            <input type="number" name="${key}MineralSeconds" min="0" max="59" value="0" data-mineral-input>
          </label>
        </fieldset>

        <label class="field">
          <span>Nombre de blocs casses</span>
          <input type="number" name="${key}MineralBlocksBroken" min="0" value="0" data-mineral-input>
        </label>

        <label class="field">
          <span>Blocs craftes</span>
          <input type="number" name="${key}MineralBlocksCrafted" min="0" value="0" data-mineral-input>
        </label>

        <label class="field field-full">
          <span>Somme gagnee</span>
          <input type="number" name="${key}MineralMoney" min="0" value="0" data-mineral-input>
        </label>
      </div>

      <div class="mineral-metrics">
        <div class="mineral-metrics__head">
          <h5>Metriques</h5>
        </div>
        <div class="mineral-metric-grid">
          <div class="mineral-metric-card">
            <span>Ratio bloc / XP</span>
            <input type="text" name="${key}MineralBlockXpRatio" value="0" data-mineral-metric="${key}-blockXpRatio">
          </div>
          <div class="mineral-metric-card">
            <span>XP moyen par heure</span>
            <input type="text" name="${key}MineralXpPerHour" value="0" data-mineral-metric="${key}-xpPerHour">
          </div>
          <div class="mineral-metric-card">
            <span>Blocs moyens par heure</span>
            <input type="text" name="${key}MineralBlocksPerHour" value="0" data-mineral-metric="${key}-blocksPerHour">
          </div>
          <div class="mineral-metric-card">
            <span>Rendement moyen</span>
            <input type="text" name="${key}MineralYieldRate" value="0%" data-mineral-metric="${key}-yieldRate">
          </div>
          <div class="mineral-metric-card">
            <span>Argent moyen par heure</span>
            <input type="text" name="${key}MineralMoneyPerHour" value="0" data-mineral-metric="${key}-moneyPerHour">
          </div>
          <div class="mineral-metric-card">
            <span>Ratio somme / temps</span>
            <input type="text" name="${key}MineralMoneyTimeRatio" value="0" data-mineral-metric="${key}-moneyTimeRatio">
          </div>
        </div>
      </div>
    </article>
  `).join("");
};

const getFormNumber = (name) => {
  return toFiniteNumber(releveForm?.elements[name]?.value);
};

const getFarmSeconds = (days = 0, hours = 0, minutes = 0, seconds = 0) => {
  return (toFiniteNumber(days) * 86400)
    + (toFiniteNumber(hours) * 3600)
    + (toFiniteNumber(minutes) * 60)
    + toFiniteNumber(seconds);
};

const getReferenceYieldRate = (quantityPerHour, referenceValue) => {
  return referenceValue > 0 ? (quantityPerHour / referenceValue) * 100 : 0;
};

const setMineralMetric = (key, metric, value, suffix = "") => {
  const metricNode = document.querySelector(`[data-mineral-metric="${key}-${metric}"]`);
  if (metricNode) metricNode.value = `${formatRate(value)}${suffix}`;
};

const getMineralMetric = (key, metric) => {
  return document.querySelector(`[data-mineral-metric="${key}-${metric}"]`)?.value || "0";
};

const updateMinerCaveRatio = () => {
  if (!minerCaveRatioOutput) return;

  const caveSeconds = getFarmSeconds(
    getFormNumber("minerCaveDays"),
    getFormNumber("minerCaveHours"),
    getFormNumber("minerCaveMinutes"),
    getFormNumber("minerCaveSeconds")
  );
  const caveHours = caveSeconds / 3600;
  const ores = toFiniteNumber(minerCaveOresInput?.value);
  minerCaveRatioOutput.value = caveHours > 0 ? formatRate(ores / caveHours) : "0";
};

const updateMineralCard = ({ key }) => {
  const xp = getFormNumber(`${key}MineralXp`);
  const days = getFormNumber(`${key}MineralDays`);
  const hours = getFormNumber(`${key}MineralHours`);
  const minutes = getFormNumber(`${key}MineralMinutes`);
  const seconds = getFormNumber(`${key}MineralSeconds`);
  const blocksBroken = getFormNumber(`${key}MineralBlocksBroken`);
  const blocksCrafted = getFormNumber(`${key}MineralBlocksCrafted`);
  const money = getFormNumber(`${key}MineralMoney`);
  const farmSeconds = getFarmSeconds(days, hours, minutes, seconds);
  const farmHours = farmSeconds / 3600;
  const xpPerHour = farmHours > 0 ? xp / farmHours : 0;
  const blocksPerHour = farmHours > 0 ? blocksBroken / farmHours : 0;
  const moneyPerHour = farmHours > 0 ? money / farmHours : 0;

  setMineralMetric(key, "blockXpRatio", xp > 0 ? blocksBroken / xp : 0);
  setMineralMetric(key, "xpPerHour", xpPerHour);
  setMineralMetric(key, "blocksPerHour", blocksPerHour);
  setMineralMetric(key, "yieldRate", getReferenceYieldRate(blocksPerHour, mineralYieldReferences[key]), "%");
  setMineralMetric(key, "moneyPerHour", moneyPerHour);
  setMineralMetric(key, "moneyTimeRatio", farmSeconds > 0 ? money / farmSeconds : 0);
};

const updateMinerStats = () => {
  updateMinerCaveRatio();
};

renderMineralCards();

const renderWoodCards = () => {
  if (!woodGrid) return;

  woodGrid.innerHTML = lumberjackWoods.map(({ key, label }) => `
    <article class="wood-card" data-wood-card="${key}">
      <div class="wood-card__top">
        <div>
          <h4>${label}</h4>
          <p>Statistiques detaillees du bois</p>
        </div>
        <span class="wood-card__pill">Bucheron</span>
      </div>

      <div class="wood-field-grid">
        <label class="field field-full">
          <span>XP gagnee</span>
          <input type="number" name="${key}WoodXp" min="0" value="0" data-wood-input>
        </label>

        <fieldset class="releve-time-fieldset wood-time-fieldset">
          <legend>Temps passe a farm</legend>
          <label>
            <span>Jours</span>
            <input type="number" name="${key}WoodDays" min="0" value="0" data-wood-input>
          </label>
          <label>
            <span>Heures</span>
            <input type="number" name="${key}WoodHours" min="0" value="0" data-wood-input>
          </label>
          <label>
            <span>Minutes</span>
            <input type="number" name="${key}WoodMinutes" min="0" max="59" value="0" data-wood-input>
          </label>
          <label>
            <span>Secondes</span>
            <input type="number" name="${key}WoodSeconds" min="0" max="59" value="0" data-wood-input>
          </label>
        </fieldset>

        <label class="field field-full">
          <span>Nombre de buches recoltees</span>
          <input type="number" name="${key}WoodLogs" min="0" value="0" data-wood-input>
        </label>

        <label class="field field-full">
          <span>Somme gagnee</span>
          <input type="number" name="${key}WoodMoney" min="0" value="0" data-wood-input>
        </label>
      </div>

      <div class="wood-metrics">
        <div class="wood-metrics__head">
          <h5>Metriques</h5>
        </div>
        <div class="wood-metric-grid">
          <div class="wood-metric-card">
            <span>Ratio buche / XP</span>
            <input type="text" name="${key}WoodLogXpRatio" value="0" data-wood-metric="${key}-logXpRatio">
          </div>
          <div class="wood-metric-card">
            <span>XP moyen par heure</span>
            <input type="text" name="${key}WoodXpPerHour" value="0" data-wood-metric="${key}-xpPerHour">
          </div>
          <div class="wood-metric-card">
            <span>Buches / h moyen</span>
            <input type="text" name="${key}WoodLogsPerHour" value="0" data-wood-metric="${key}-logsPerHour">
          </div>
          <div class="wood-metric-card">
            <span>Rendement moyen</span>
            <input type="text" name="${key}WoodYieldRate" value="0%" data-wood-metric="${key}-yieldRate">
          </div>
          <div class="wood-metric-card">
            <span>Argent moyen par heure</span>
            <input type="text" name="${key}WoodMoneyPerHour" value="0" data-wood-metric="${key}-moneyPerHour">
          </div>
          <div class="wood-metric-card">
            <span>Ratio somme / temps</span>
            <input type="text" name="${key}WoodMoneyTimeRatio" value="0" data-wood-metric="${key}-moneyTimeRatio">
          </div>
        </div>
      </div>
    </article>
  `).join("");
};

const setWoodMetric = (key, metric, value, suffix = "") => {
  const metricNode = document.querySelector(`[data-wood-metric="${key}-${metric}"]`);
  if (metricNode) metricNode.value = `${formatRate(value)}${suffix}`;
};

const getWoodMetric = (key, metric) => {
  return document.querySelector(`[data-wood-metric="${key}-${metric}"]`)?.value || "0";
};

const updateWoodCard = ({ key }) => {
  const xp = getFormNumber(`${key}WoodXp`);
  const days = getFormNumber(`${key}WoodDays`);
  const hours = getFormNumber(`${key}WoodHours`);
  const minutes = getFormNumber(`${key}WoodMinutes`);
  const seconds = getFormNumber(`${key}WoodSeconds`);
  const logs = getFormNumber(`${key}WoodLogs`);
  const money = getFormNumber(`${key}WoodMoney`);
  const farmSeconds = getFarmSeconds(days, hours, minutes, seconds);
  const farmHours = farmSeconds / 3600;
  const xpPerHour = farmHours > 0 ? xp / farmHours : 0;
  const logsPerHour = farmHours > 0 ? logs / farmHours : 0;
  const moneyPerHour = farmHours > 0 ? money / farmHours : 0;

  setWoodMetric(key, "logXpRatio", xp > 0 ? logs / xp : 0);
  setWoodMetric(key, "xpPerHour", xpPerHour);
  setWoodMetric(key, "logsPerHour", logsPerHour);
  setWoodMetric(key, "yieldRate", getReferenceYieldRate(logsPerHour, woodYieldReferences[key]), "%");
  setWoodMetric(key, "moneyPerHour", moneyPerHour);
  setWoodMetric(key, "moneyTimeRatio", farmSeconds > 0 ? money / farmSeconds : 0);
};

const updateLumberjackStats = () => {
};

renderWoodCards();

const renderCropCards = () => {
  if (!cropGrid) return;

  cropGrid.innerHTML = farmerCrops.map(({ key, label }) => `
    <article class="crop-card" data-crop-card="${key}">
      <div class="crop-card__top">
        <div>
          <h4>${label}</h4>
          <p>Statistiques detaillees de la culture</p>
        </div>
        <span class="crop-card__pill">Fermier</span>
      </div>

      <div class="crop-field-grid">
        <label class="field field-full">
          <span>XP gagnee</span>
          <input type="number" name="${key}CropXp" min="0" value="0" data-crop-input>
        </label>

        <fieldset class="releve-time-fieldset crop-time-fieldset">
          <legend>Temps passe a farm</legend>
          <label>
            <span>Jours</span>
            <input type="number" name="${key}CropDays" min="0" value="0" data-crop-input>
          </label>
          <label>
            <span>Heures</span>
            <input type="number" name="${key}CropHours" min="0" value="0" data-crop-input>
          </label>
          <label>
            <span>Minutes</span>
            <input type="number" name="${key}CropMinutes" min="0" max="59" value="0" data-crop-input>
          </label>
          <label>
            <span>Secondes</span>
            <input type="number" name="${key}CropSeconds" min="0" max="59" value="0" data-crop-input>
          </label>
        </fieldset>

        <label class="field field-full">
          <span>Nombre d'items recoltes</span>
          <input type="number" name="${key}CropItems" min="0" value="0" data-crop-input>
        </label>

        <label class="field field-full">
          <span>Somme gagnee</span>
          <input type="number" name="${key}CropMoney" min="0" value="0" data-crop-input>
        </label>
      </div>

      <div class="crop-metrics">
        <div class="crop-metrics__head">
          <h5>Metriques</h5>
        </div>
        <div class="crop-metric-grid">
          <div class="crop-metric-card">
            <span>Ratio item / XP</span>
            <input type="text" name="${key}CropItemXpRatio" value="0" data-crop-metric="${key}-itemXpRatio">
          </div>
          <div class="crop-metric-card">
            <span>XP moyen par heure</span>
            <input type="text" name="${key}CropXpPerHour" value="0" data-crop-metric="${key}-xpPerHour">
          </div>
          <div class="crop-metric-card">
            <span>Items / h moyen</span>
            <input type="text" name="${key}CropItemsPerHour" value="0" data-crop-metric="${key}-itemsPerHour">
          </div>
          <div class="crop-metric-card">
            <span>Rendement moyen</span>
            <input type="text" name="${key}CropYieldRate" value="0%" data-crop-metric="${key}-yieldRate">
          </div>
          <div class="crop-metric-card">
            <span>Argent moyen par heure</span>
            <input type="text" name="${key}CropMoneyPerHour" value="0" data-crop-metric="${key}-moneyPerHour">
          </div>
          <div class="crop-metric-card">
            <span>Ratio somme / temps</span>
            <input type="text" name="${key}CropMoneyTimeRatio" value="0" data-crop-metric="${key}-moneyTimeRatio">
          </div>
        </div>
      </div>
    </article>
  `).join("");
};

const setCropMetric = (key, metric, value, suffix = "") => {
  const metricNode = document.querySelector(`[data-crop-metric="${key}-${metric}"]`);
  if (metricNode) metricNode.value = `${formatRate(value)}${suffix}`;
};

const getCropMetric = (key, metric) => {
  return document.querySelector(`[data-crop-metric="${key}-${metric}"]`)?.value || "0";
};

const updateCropCard = ({ key }) => {
  const xp = getFormNumber(`${key}CropXp`);
  const days = getFormNumber(`${key}CropDays`);
  const hours = getFormNumber(`${key}CropHours`);
  const minutes = getFormNumber(`${key}CropMinutes`);
  const seconds = getFormNumber(`${key}CropSeconds`);
  const items = getFormNumber(`${key}CropItems`);
  const money = getFormNumber(`${key}CropMoney`);
  const farmSeconds = getFarmSeconds(days, hours, minutes, seconds);
  const farmHours = farmSeconds / 3600;
  const xpPerHour = farmHours > 0 ? xp / farmHours : 0;
  const itemsPerHour = farmHours > 0 ? items / farmHours : 0;
  const moneyPerHour = farmHours > 0 ? money / farmHours : 0;

  setCropMetric(key, "itemXpRatio", xp > 0 ? items / xp : 0);
  setCropMetric(key, "xpPerHour", xpPerHour);
  setCropMetric(key, "itemsPerHour", itemsPerHour);
  setCropMetric(key, "yieldRate", getReferenceYieldRate(itemsPerHour, cropYieldReferences[key]), "%");
  setCropMetric(key, "moneyPerHour", moneyPerHour);
  setCropMetric(key, "moneyTimeRatio", farmSeconds > 0 ? money / farmSeconds : 0);
};

const updateFarmerStats = () => {
};

renderCropCards();

const renderMobCards = () => {
  if (!mobGrid) return;

  mobGrid.innerHTML = hunterMobs.map(({ key, label }) => `
    <article class="mob-card" data-mob-card="${key}">
      <div class="mob-card__top">
        <div>
          <h4>${label}</h4>
          <p>Statistiques detaillees du mob</p>
        </div>
        <span class="mob-card__pill">Chasseur</span>
      </div>

      <div class="mob-field-grid">
        <label class="field field-full">
          <span>XP gagnee</span>
          <input type="number" name="${key}MobXp" min="0" value="0" data-mob-input>
        </label>

        <fieldset class="releve-time-fieldset mob-time-fieldset">
          <legend>Temps passe a farm</legend>
          <label>
            <span>Jours</span>
            <input type="number" name="${key}MobDays" min="0" value="0" data-mob-input>
          </label>
          <label>
            <span>Heures</span>
            <input type="number" name="${key}MobHours" min="0" value="0" data-mob-input>
          </label>
          <label>
            <span>Minutes</span>
            <input type="number" name="${key}MobMinutes" min="0" max="59" value="0" data-mob-input>
          </label>
          <label>
            <span>Secondes</span>
            <input type="number" name="${key}MobSeconds" min="0" max="59" value="0" data-mob-input>
          </label>
        </fieldset>

        <label class="field field-full">
          <span>Nombre de mobs tues</span>
          <input type="number" name="${key}MobKills" min="0" value="0" data-mob-input>
        </label>

        <label class="field field-full">
          <span>Somme gagnee</span>
          <input type="number" name="${key}MobMoney" min="0" value="0" data-mob-input>
        </label>
      </div>

      <div class="mob-metrics">
        <div class="mob-metrics__head">
          <h5>Metriques</h5>
        </div>
        <div class="mob-metric-grid">
          <div class="mob-metric-card">
            <span>Ratio mobs / XP</span>
            <input type="text" name="${key}MobMobXpRatio" value="0" data-mob-metric="${key}-mobXpRatio">
          </div>
          <div class="mob-metric-card">
            <span>XP moyen par heure</span>
            <input type="text" name="${key}MobXpPerHour" value="0" data-mob-metric="${key}-xpPerHour">
          </div>
          <div class="mob-metric-card">
            <span>Mobs / h moyen</span>
            <input type="text" name="${key}MobMobsPerHour" value="0" data-mob-metric="${key}-mobsPerHour">
          </div>
          <div class="mob-metric-card">
            <span>Rendement moyen</span>
            <input type="text" name="${key}MobYieldRate" value="0%" data-mob-metric="${key}-yieldRate">
          </div>
          <div class="mob-metric-card">
            <span>Argent moyen par heure</span>
            <input type="text" name="${key}MobMoneyPerHour" value="0" data-mob-metric="${key}-moneyPerHour">
          </div>
          <div class="mob-metric-card">
            <span>Ratio somme / temps</span>
            <input type="text" name="${key}MobMoneyTimeRatio" value="0" data-mob-metric="${key}-moneyTimeRatio">
          </div>
        </div>
      </div>
    </article>
  `).join("");
};

const setMobMetric = (key, metric, value, suffix = "") => {
  const metricNode = document.querySelector(`[data-mob-metric="${key}-${metric}"]`);
  if (metricNode) metricNode.value = `${formatRate(value)}${suffix}`;
};

const getMobMetric = (key, metric) => {
  return document.querySelector(`[data-mob-metric="${key}-${metric}"]`)?.value || "0";
};

const updateMobCard = ({ key }) => {
  const xp = getFormNumber(`${key}MobXp`);
  const days = getFormNumber(`${key}MobDays`);
  const hours = getFormNumber(`${key}MobHours`);
  const minutes = getFormNumber(`${key}MobMinutes`);
  const seconds = getFormNumber(`${key}MobSeconds`);
  const kills = getFormNumber(`${key}MobKills`);
  const money = getFormNumber(`${key}MobMoney`);
  const farmSeconds = getFarmSeconds(days, hours, minutes, seconds);
  const farmHours = farmSeconds / 3600;
  const xpPerHour = farmHours > 0 ? xp / farmHours : 0;
  const mobsPerHour = farmHours > 0 ? kills / farmHours : 0;
  const moneyPerHour = farmHours > 0 ? money / farmHours : 0;

  setMobMetric(key, "mobXpRatio", xp > 0 ? kills / xp : 0);
  setMobMetric(key, "xpPerHour", xpPerHour);
  setMobMetric(key, "mobsPerHour", mobsPerHour);
  setMobMetric(key, "yieldRate", getReferenceYieldRate(mobsPerHour, mobYieldReferences[key]), "%");
  setMobMetric(key, "moneyPerHour", moneyPerHour);
  setMobMetric(key, "moneyTimeRatio", farmSeconds > 0 ? money / farmSeconds : 0);
};

const updateHunterStats = () => {
};

renderMobCards();

const getJobXpPerHourFromResources = (resources) => {
  const totals = resources.reduce((accumulator, resource) => {
    accumulator.xp += toFiniteNumber(resource?.xp);
    accumulator.seconds += toFiniteNumber(resource?.time_seconds);
    return accumulator;
  }, { xp: 0, seconds: 0 });

  if (totals.seconds <= 0) return 0;
  return totals.xp / (totals.seconds / 3600);
};

const fillImportedJobRatios = (jobResourcesData = {}) => {
  const minerXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.MINEUR) ? jobResourcesData.MINEUR : []);
  const lumberjackXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.BUCHERON) ? jobResourcesData.BUCHERON : []);
  const farmerXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.FERMIER) ? jobResourcesData.FERMIER : []);
  const hunterXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.CHASSEUR) ? jobResourcesData.CHASSEUR : []);

  const averageXpPerHour = getAverage([
    minerXpPerHour,
    lumberjackXpPerHour,
    farmerXpPerHour,
    hunterXpPerHour
  ]);

  const minerRatio = averageXpPerHour > 0 ? (minerXpPerHour / averageXpPerHour) * 100 : 0;
  const lumberjackRatio = averageXpPerHour > 0 ? (lumberjackXpPerHour / averageXpPerHour) * 100 : 0;
  const farmerRatio = averageXpPerHour > 0 ? (farmerXpPerHour / averageXpPerHour) * 100 : 0;
  const hunterRatio = averageXpPerHour > 0 ? (hunterXpPerHour / averageXpPerHour) * 100 : 0;
  const averageDifference = getAverage([
    Math.abs(minerRatio - 100),
    Math.abs(lumberjackRatio - 100),
    Math.abs(farmerRatio - 100),
    Math.abs(hunterRatio - 100)
  ]);

  setFormValue("minerRatio", formatRate(minerRatio));
  setFormValue("lumberjackRatio", formatRate(lumberjackRatio));
  setFormValue("farmerRatio", formatRate(farmerRatio));
  setFormValue("hunterRatio", formatRate(hunterRatio));
  setFormValue("averageDifference", formatRate(averageDifference));
};

const setFormValue = (name, value) => {
  const element = releveForm?.elements[name];
  if (!element) return;

  if (element.type === "checkbox") {
    element.checked = Boolean(value);
    return;
  }

  element.value = value ?? "";
};

const fillReleveForm = (releve) => {
  if (!releveForm || !releve) return;

  setFormValue("releveName", releve.name || "");
  setFormValue("betaReleve", Boolean(releve.betaReleve));

  Object.entries(releve).forEach(([key, value]) => {
    if (["id", "playerId", "createdAt", "updatedAt", "name", "betaReleve"].includes(key)) return;
    setFormValue(key, value);
  });

  applyFixedQuestTotals();
  updateBetaDayField();
  updateQuestSummary();
  updateMinerStats();
  updateLumberjackStats();
  updateFarmerStats();
  updateHunterStats();
};

const prefillFromLastReleve = (releve) => {
  if (!releveForm || !releve) return;

  fillReleveForm(releve);

  if (releveForm.elements.date) releveForm.elements.date.value = dateValue;
  if (releveForm.elements.time) releveForm.elements.time.value = timeValue;
};

if (releveForm) {
  if (releveForm.elements.date) releveForm.elements.date.value = dateValue;
  if (releveForm.elements.time) releveForm.elements.time.value = timeValue;
  if (releveForm.elements.arrival) releveForm.elements.arrival.value = dateTimeValue;
  applyFixedQuestTotals();
}

if (importJsonButton && importJsonInput) {
  importJsonButton.addEventListener("click", () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawPayload = await file.text();
      handleImportedJson(rawPayload);
    } catch {
      if (releveFeedback) releveFeedback.textContent = "Impossible de lire ce fichier JSON.";
    } finally {
      importJsonInput.value = "";
    }
  });
}

const initializeRelevePageState = () => {
  if (player) {
  releveTitle.textContent = editingReleve ? "Modifier un releve" : "Ajouter un releve";
  releveSubtitle.textContent = editingReleve
    ? `Modification du releve pour ${player.name}.`
    : `Formulaire de releve pour ${player.name}.`;
  relevePlayer.textContent = player.name;
  releveBack.href = `joueur-detail.html?id=${encodeURIComponent(player.id)}`;
  const canUseBeta = Boolean(player.betaParticipant);
  if (betaReleveCard) {
    if (!canUseBeta) betaReleveCard.hidden = true;
    betaReleveCard.classList.toggle("is-visible", canUseBeta);
  }
  if (betaCategoryLink) {
    betaCategoryLink.hidden = !canUseBeta;
  }
  const lastReleve = editingReleve ? null : getLastPlayerReleve();
  if (editingReleve) {
    fillReleveForm(editingReleve);
  } else if (lastReleve) {
    prefillFromLastReleve(lastReleve);
  }
  updateBetaDayField();
  showRelevePanel();
  document.title = `${editingReleve ? "Modifier" : "Ajouter"} un releve - ${player.name}`;
} else {
  releveTitle.textContent = "Joueur introuvable";
  releveSubtitle.textContent = "Impossible de retrouver ce joueur dans la sauvegarde locale.";
  relevePlayer.textContent = "Aucun joueur selectionne";
  releveBack.href = "joueur.html";
  releveBack.textContent = "Retour aux joueurs";
  if (betaReleveCard) {
    betaReleveCard.hidden = true;
    betaReleveCard.classList.remove("is-visible");
  }
  if (betaCategoryLink) {
    betaCategoryLink.hidden = true;
  }
  updateBetaDayField();
  showRelevePanel();
  document.title = "Joueur introuvable - StatGM Design";
  }
};

releveCategoryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showRelevePanel(link, true);
  });
});

if (panelPrevButton) {
  panelPrevButton.addEventListener("click", () => showAdjacentPanel(-1));
}

if (panelNextButton) {
  panelNextButton.addEventListener("click", () => showAdjacentPanel(1));
}

if (betaReleveCheckbox) {
  betaReleveCheckbox.addEventListener("change", updateBetaDayField);
}

questCalculatorInputs.forEach((input) => {
  input.addEventListener("input", updateQuestSummary);
});

if (mineralsGrid) {
  mineralsGrid.addEventListener("input", updateMinerStats);
}

if (woodGrid) {
  woodGrid.addEventListener("input", updateLumberjackStats);
}

if (cropGrid) {
  cropGrid.addEventListener("input", updateFarmerStats);
}

if (mobGrid) {
  mobGrid.addEventListener("input", updateHunterStats);
}

[...minerCaveTimeInputs, minerCaveOresInput].forEach((input) => {
  input?.addEventListener("input", updateMinerCaveRatio);
});

if (releveForm) {
  updateQuestSummary();
  updateMinerStats();
  updateLumberjackStats();
  updateFarmerStats();
  updateHunterStats();

  releveForm.addEventListener("reset", () => {
    setTimeout(() => {
      applyFixedQuestTotals();
      updateQuestSummary();
      updateMinerStats();
      updateLumberjackStats();
      updateFarmerStats();
      updateHunterStats();
    }, 0);
  });

  releveForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!player) {
      if (releveFeedback) releveFeedback.textContent = "Impossible d'enregistrer sans joueur selectionne.";
      return;
    }

    updateQuestSummary();
    updateMinerStats();
    updateLumberjackStats();
    updateFarmerStats();
    updateHunterStats();

    const data = new FormData(releveForm);
    const releve = {
      id: editingReleve?.id || createId(),
      playerId: player.id,
      createdAt: editingReleve?.createdAt || Date.now(),
      updatedAt: Date.now(),
      betaReleve: data.get("betaReleve") === "on",
      betaDay: String(data.get("betaDay") || ""),
      name: String(data.get("releveName") || "").trim(),
      phase: String(data.get("phase") || "").trim(),
      date: String(data.get("date") || ""),
      time: String(data.get("time") || ""),
      grade: String(data.get("grade") || "").trim(),
      boost: String(data.get("boost") || "1"),
      argent: String(data.get("argent") || "0"),
      coins: String(data.get("coins") || "0"),
      arrival: String(data.get("arrival") || ""),
      days: String(data.get("days") || "0"),
      hours: String(data.get("hours") || "0"),
      minutes: String(data.get("minutes") || "0"),
      seconds: String(data.get("seconds") || "0"),
      notes: String(data.get("notes") || "").trim(),
      moneyEarned: String(data.get("moneyEarned") || "0"),
      moneySpent: String(data.get("moneySpent") || "0"),
      sellMoney: String(data.get("sellMoney") || "0"),
      hopperMoney: String(data.get("hopperMoney") || "0"),
      sellStickMoney: String(data.get("sellStickMoney") || "0"),
      averageSales: String(data.get("averageSales") || "0"),
      mainQuestsDone: String(data.get("mainQuestsDone") || "0"),
      mainQuestsTotal: fixedQuestTotals.mainQuestsTotal,
      mainQuestDays: String(data.get("mainQuestDays") || "0"),
      mainQuestHours: String(data.get("mainQuestHours") || "0"),
      mainQuestMinutes: String(data.get("mainQuestMinutes") || "0"),
      mainQuestSeconds: String(data.get("mainQuestSeconds") || "0"),
      secondaryQuestsDone: String(data.get("secondaryQuestsDone") || "0"),
      secondaryQuestsTotal: fixedQuestTotals.secondaryQuestsTotal,
      secondaryQuestDays: String(data.get("secondaryQuestDays") || "0"),
      secondaryQuestHours: String(data.get("secondaryQuestHours") || "0"),
      secondaryQuestMinutes: String(data.get("secondaryQuestMinutes") || "0"),
      secondaryQuestSeconds: String(data.get("secondaryQuestSeconds") || "0"),
      dailyQuestsDone: String(data.get("dailyQuestsDone") || "0"),
      dailyQuestsTotal: fixedQuestTotals.dailyQuestsTotal,
      dailyQuestDays: String(data.get("dailyQuestDays") || "0"),
      dailyQuestHours: String(data.get("dailyQuestHours") || "0"),
      dailyQuestMinutes: String(data.get("dailyQuestMinutes") || "0"),
      dailyQuestSeconds: String(data.get("dailyQuestSeconds") || "0"),
      questTotalTime: String(data.get("questTotalTime") || "0j 0h 0m 0s"),
      questCompletionRate: String(data.get("questCompletionRate") || "0"),
      minerRatio: String(data.get("minerRatio") || "0"),
      hunterRatio: String(data.get("hunterRatio") || "0"),
      farmerRatio: String(data.get("farmerRatio") || "0"),
      lumberjackRatio: String(data.get("lumberjackRatio") || "0"),
      averageDifference: String(data.get("averageDifference") || "0"),
      minerLevel: String(data.get("minerLevel") || "0"),
      minerCaveDays: String(data.get("minerCaveDays") || "0"),
      minerCaveHours: String(data.get("minerCaveHours") || "0"),
      minerCaveMinutes: String(data.get("minerCaveMinutes") || "0"),
      minerCaveSeconds: String(data.get("minerCaveSeconds") || "0"),
      minerCaveOres: String(data.get("minerCaveOres") || "0"),
      minerCaveRatio: String(data.get("minerCaveRatio") || "0"),
      minerInfoDays: String(data.get("minerInfoDays") || "0"),
      minerInfoHours: String(data.get("minerInfoHours") || "0"),
      minerInfoMinutes: String(data.get("minerInfoMinutes") || "0"),
      minerInfoSeconds: String(data.get("minerInfoSeconds") || "0"),
      minerInfoOres: String(data.get("minerInfoOres") || "0"),
      minerInfoRatio: String(data.get("minerInfoRatio") || "0"),
      lumberjackLevel: String(data.get("lumberjackLevel") || "0"),
      farmerLevel: String(data.get("farmerLevel") || "0"),
      hunterLevel: String(data.get("hunterLevel") || "0")
    };

    minerMinerals.forEach(({ key }) => {
      const prefix = `${key}Mineral`;
      releve[`${prefix}Xp`] = String(data.get(`${prefix}Xp`) || "0");
      releve[`${prefix}Days`] = String(data.get(`${prefix}Days`) || "0");
      releve[`${prefix}Hours`] = String(data.get(`${prefix}Hours`) || "0");
      releve[`${prefix}Minutes`] = String(data.get(`${prefix}Minutes`) || "0");
      releve[`${prefix}Seconds`] = String(data.get(`${prefix}Seconds`) || "0");
      releve[`${prefix}BlocksBroken`] = String(data.get(`${prefix}BlocksBroken`) || "0");
      releve[`${prefix}BlocksCrafted`] = String(data.get(`${prefix}BlocksCrafted`) || "0");
      releve[`${prefix}Money`] = String(data.get(`${prefix}Money`) || "0");
      releve[`${prefix}BlockXpRatio`] = getMineralMetric(key, "blockXpRatio");
      releve[`${prefix}XpPerHour`] = getMineralMetric(key, "xpPerHour");
      releve[`${prefix}BlocksPerHour`] = getMineralMetric(key, "blocksPerHour");
      releve[`${prefix}YieldRate`] = getMineralMetric(key, "yieldRate");
      releve[`${prefix}MoneyPerHour`] = getMineralMetric(key, "moneyPerHour");
      releve[`${prefix}MoneyTimeRatio`] = getMineralMetric(key, "moneyTimeRatio");
    });

    lumberjackWoods.forEach(({ key }) => {
      const prefix = `${key}Wood`;
      releve[`${prefix}Xp`] = String(data.get(`${prefix}Xp`) || "0");
      releve[`${prefix}Days`] = String(data.get(`${prefix}Days`) || "0");
      releve[`${prefix}Hours`] = String(data.get(`${prefix}Hours`) || "0");
      releve[`${prefix}Minutes`] = String(data.get(`${prefix}Minutes`) || "0");
      releve[`${prefix}Seconds`] = String(data.get(`${prefix}Seconds`) || "0");
      releve[`${prefix}Logs`] = String(data.get(`${prefix}Logs`) || "0");
      releve[`${prefix}Money`] = String(data.get(`${prefix}Money`) || "0");
      releve[`${prefix}LogXpRatio`] = getWoodMetric(key, "logXpRatio");
      releve[`${prefix}XpPerHour`] = getWoodMetric(key, "xpPerHour");
      releve[`${prefix}LogsPerHour`] = getWoodMetric(key, "logsPerHour");
      releve[`${prefix}YieldRate`] = getWoodMetric(key, "yieldRate");
      releve[`${prefix}MoneyPerHour`] = getWoodMetric(key, "moneyPerHour");
      releve[`${prefix}MoneyTimeRatio`] = getWoodMetric(key, "moneyTimeRatio");
    });

    farmerCrops.forEach(({ key }) => {
      const prefix = `${key}Crop`;
      releve[`${prefix}Xp`] = String(data.get(`${prefix}Xp`) || "0");
      releve[`${prefix}Days`] = String(data.get(`${prefix}Days`) || "0");
      releve[`${prefix}Hours`] = String(data.get(`${prefix}Hours`) || "0");
      releve[`${prefix}Minutes`] = String(data.get(`${prefix}Minutes`) || "0");
      releve[`${prefix}Seconds`] = String(data.get(`${prefix}Seconds`) || "0");
      releve[`${prefix}Items`] = String(data.get(`${prefix}Items`) || "0");
      releve[`${prefix}Money`] = String(data.get(`${prefix}Money`) || "0");
      releve[`${prefix}ItemXpRatio`] = getCropMetric(key, "itemXpRatio");
      releve[`${prefix}XpPerHour`] = getCropMetric(key, "xpPerHour");
      releve[`${prefix}ItemsPerHour`] = getCropMetric(key, "itemsPerHour");
      releve[`${prefix}YieldRate`] = getCropMetric(key, "yieldRate");
      releve[`${prefix}MoneyPerHour`] = getCropMetric(key, "moneyPerHour");
      releve[`${prefix}MoneyTimeRatio`] = getCropMetric(key, "moneyTimeRatio");
    });

    hunterMobs.forEach(({ key }) => {
      const prefix = `${key}Mob`;
      releve[`${prefix}Xp`] = String(data.get(`${prefix}Xp`) || "0");
      releve[`${prefix}Days`] = String(data.get(`${prefix}Days`) || "0");
      releve[`${prefix}Hours`] = String(data.get(`${prefix}Hours`) || "0");
      releve[`${prefix}Minutes`] = String(data.get(`${prefix}Minutes`) || "0");
      releve[`${prefix}Seconds`] = String(data.get(`${prefix}Seconds`) || "0");
      releve[`${prefix}Kills`] = String(data.get(`${prefix}Kills`) || "0");
      releve[`${prefix}Money`] = String(data.get(`${prefix}Money`) || "0");
      releve[`${prefix}MobXpRatio`] = getMobMetric(key, "mobXpRatio");
      releve[`${prefix}XpPerHour`] = getMobMetric(key, "xpPerHour");
      releve[`${prefix}MobsPerHour`] = getMobMetric(key, "mobsPerHour");
      releve[`${prefix}YieldRate`] = getMobMetric(key, "yieldRate");
      releve[`${prefix}MoneyPerHour`] = getMobMetric(key, "moneyPerHour");
      releve[`${prefix}MoneyTimeRatio`] = getMobMetric(key, "moneyTimeRatio");
    });

    let releves = readReleves();
    if (editingReleve) {
      const editIndex = releves.findIndex((item) => String(item.id) === String(editingReleve.id));
      if (editIndex >= 0) {
        releves[editIndex] = releve;
      } else {
        releves.unshift(releve);
      }
    } else {
      releves.unshift(releve);
    }
    await writeReleves(releves);

    window.location.href = releveBack?.href || `joueur-detail.html?id=${encodeURIComponent(player.id)}`;
  });
}

const initializeRelevePage = async () => {
  await hydrateStorageCaches();
  player = readPlayers().find((item) => String(item.id) === String(playerId)) || null;
  editingReleve = readReleves().find((releve) => {
    return String(releve.id) === String(releveId) && String(releve.playerId) === String(playerId);
  }) || null;
  initializeRelevePageState();
};

initializeRelevePage();
