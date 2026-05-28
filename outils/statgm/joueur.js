const playerForm = document.querySelector("[data-player-form]");
const playerList = document.querySelector("[data-player-list]");
const playerEmpty = document.querySelector("[data-player-empty]");
const playerCount = document.querySelector("[data-player-count]");
const playerSearch = document.querySelector("[data-player-search]");
const betaFilter = document.querySelector("[data-beta-filter]");
const searchReset = document.querySelector("[data-search-reset]");
const pagination = document.querySelector("[data-pagination]");
const pageInfo = document.querySelector("[data-page-info]");
const pagePrev = document.querySelector("[data-page-prev]");
const pageNext = document.querySelector("[data-page-next]");
const folderImportButton = document.querySelector("[data-folder-import]");
const folderImportInput = document.querySelector("[data-folder-import-input]");
const folderImportFeedback = document.querySelector("[data-folder-import-feedback]");

const storageKey = "statgm-players";
const relevesStorageKey = "statgm-releves";
const store = window.StatGMStore;
const playersPerPage = 6;
const fixedQuestTotals = {
  mainQuestsTotal: "9",
  secondaryQuestsTotal: "4",
  dailyQuestsTotal: "-"
};

const referenceConfig = window.ReferenceConfig;
const referenceSettings = referenceConfig?.read?.() || referenceConfig?.defaultSettings || {};
const mineralYieldReferences = referenceSettings.minerals || {};
const woodYieldReferences = referenceSettings.woods || {};
const cropYieldReferences = referenceSettings.crops || {};
const mobYieldReferences = referenceSettings.mobs || {};

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

const minerKeys = ["stone", "coal", "copper", "lapis", "quartz", "redstone", "iron", "gold", "diamond", "emerald", "gem"];
const woodKeys = ["oak", "birch", "acacia", "darkOak", "spruce", "mahogany", "crimson", "warped"];
const cropKeys = ["wheat", "carrot", "potato", "pumpkin", "sugarCane", "beetroot", "netherWart", "cocoaBeans", "vine", "brownMushroom", "redMushroom"];
const mobKeys = ["zombie", "angel", "aspic", "asseche", "assoife", "dracorne", "aragnis", "mutant", "demon", "sylphe", "manticort"];

let currentPage = 1;
let playersCache = [];
let relevesCache = [];

const createId = () => globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const readPlayers = () => {
  return Array.isArray(playersCache) ? [...playersCache] : [];
};

const writePlayers = async (players) => {
  playersCache = Array.isArray(players) ? [...players] : [];
  if (store?.setList) {
    await store.setList(storageKey, playersCache);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(playersCache));
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
    playersCache = store.getList(storageKey);
    relevesCache = store.getList(relevesStorageKey);
    return;
  }

  try {
    playersCache = JSON.parse(localStorage.getItem(storageKey) || "[]");
    relevesCache = JSON.parse(localStorage.getItem(relevesStorageKey) || "[]");
  } catch {
    playersCache = [];
    relevesCache = [];
  }
};

const getInitial = (name) => {
  const trimmedName = String(name || "").trim();
  return (trimmedName.slice(0, 1) || "N").toUpperCase();
};

const getSearchQuery = () => String(playerSearch?.value || "").trim().toLowerCase();
const isBetaFilterActive = () => Boolean(betaFilter?.checked);

const getFilteredPlayers = () => {
  const query = getSearchQuery();
  const players = readPlayers().filter((player) => !isBetaFilterActive() || Boolean(player.betaParticipant));

  if (!query) return players;
  return players.filter((player) => String(player.name || "").toLowerCase().includes(query));
};

const getFormPlayer = () => {
  const data = new FormData(playerForm);
  return {
    id: createId(),
    name: String(data.get("name") || "").trim() || "Nouveau joueur",
    description: String(data.get("description") || "").trim(),
    betaParticipant: data.get("beta") === "on"
  };
};

const createPlayerCard = (player) => {
  const card = document.createElement("a");
  const avatar = document.createElement("div");
  const badge = document.createElement("span");
  const name = document.createElement("h3");

  card.className = "player-created-card";
  card.href = `joueur-detail.html?id=${encodeURIComponent(player.id)}`;
  card.setAttribute("aria-label", `Ouvrir la fiche de ${player.name}`);
  avatar.className = "avatar-orb";
  badge.className = "section-kicker";

  avatar.textContent = getInitial(player.name);
  badge.textContent = player.betaParticipant ? "Beta" : "Joueur";
  name.textContent = player.name;

  card.append(avatar, badge, name);
  return card;
};

const renderPlayers = () => {
  const allPlayers = readPlayers();
  const players = getFilteredPlayers();
  const totalPages = Math.max(1, Math.ceil(players.length / playersPerPage));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * playersPerPage;
  const visiblePlayers = players.slice(start, start + playersPerPage);

  playerCount.textContent = players.length;
  playerList.replaceChildren(...visiblePlayers.map(createPlayerCard));
  playerEmpty.hidden = players.length > 0;
  playerEmpty.textContent = allPlayers.length ? "Aucun joueur ne correspond à ta recherche." : "Aucun joueur créé pour le moment.";

  pagination.hidden = players.length <= playersPerPage;
  pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
  pagePrev.disabled = currentPage === 1;
  pageNext.disabled = currentPage === totalPages;
};

const toFiniteNumber = (value) => {
  const normalizedValue = String(value ?? "").replace(",", ".");
  const numberValue = Number(normalizedValue);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getAverage = (values) => {
  const safeValues = values.map(toFiniteNumber).filter((value) => Number.isFinite(value));
  if (!safeValues.length) return 0;
  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
};

const formatRate = (value) => {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
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

const secondsToFields = (secondsValue) => {
  const totalSeconds = Math.max(0, Math.floor(toFiniteNumber(secondsValue)));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const formatDateTimeLocal = (timestampMs) => {
  const safeMs = toFiniteNumber(timestampMs);
  if (!safeMs) return "";
  const date = new Date(safeMs);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitDateTimeParts = (isoValue) => {
  const parsedDate = new Date(isoValue || Date.now());
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const pad = (value) => String(value).padStart(2, "0");
  return {
    createdAt: safeDate.getTime(),
    date: `${safeDate.getFullYear()}-${pad(safeDate.getMonth() + 1)}-${pad(safeDate.getDate())}`,
    time: `${pad(safeDate.getHours())}:${pad(safeDate.getMinutes())}`
  };
};

const formatMoneyStorage = (value) => String(toFiniteNumber(value).toFixed(2));
const formatCoinsStorage = (value) => String((toFiniteNumber(value) / 1000).toFixed(3));
const formatIntegerStorage = (value) => String(Math.round(toFiniteNumber(value)));
const formatPlainStorage = (value) => String(toFiniteNumber(value));

const buildQuestSummary = (questValues) => {
  const totalSeconds = toFiniteNumber(questValues.mainSeconds) + toFiniteNumber(questValues.secondarySeconds);
  const duration = secondsToFields(totalSeconds);
  const totalQuests = toFiniteNumber(fixedQuestTotals.mainQuestsTotal) + toFiniteNumber(fixedQuestTotals.secondaryQuestsTotal) + toFiniteNumber(fixedQuestTotals.dailyQuestsTotal);
  const completedQuests = toFiniteNumber(questValues.mainDone) + toFiniteNumber(questValues.secondaryDone) + toFiniteNumber(questValues.dailyDone);
  const completionRate = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  return {
    questTotalTime: `${duration.days}j ${duration.hours}h ${duration.minutes}m ${duration.seconds}s`,
    questCompletionRate: formatRate(completionRate)
  };
};

const buildResourceMetrics = ({ xp, quantity, money, seconds, referenceValue }) => {
  const farmHours = seconds > 0 ? seconds / 3600 : 0;
  const xpPerHour = farmHours > 0 ? xp / farmHours : 0;
  const quantityPerHour = farmHours > 0 ? quantity / farmHours : 0;
  const moneyPerHour = farmHours > 0 ? money / farmHours : 0;

  return {
    ratio: xp > 0 ? quantity / xp : 0,
    xpPerHour,
    quantityPerHour,
    yieldRate: getReferenceYieldRate(quantityPerHour, referenceValue),
    moneyPerHour,
    moneyTimeRatio: seconds > 0 ? money / seconds : 0
  };
};

const getJobXpPerHourFromResources = (resources) => {
  const totals = resources.reduce((accumulator, resource) => {
    accumulator.xp += toFiniteNumber(resource?.xp);
    accumulator.seconds += toFiniteNumber(resource?.time_seconds);
    return accumulator;
  }, { xp: 0, seconds: 0 });

  if (totals.seconds <= 0) return 0;
  return totals.xp / (totals.seconds / 3600);
};

const buildJobRatios = (jobResourcesData = {}) => {
  const minerXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.MINEUR) ? jobResourcesData.MINEUR : []);
  const lumberjackXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.BUCHERON) ? jobResourcesData.BUCHERON : []);
  const farmerXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.FERMIER) ? jobResourcesData.FERMIER : []);
  const hunterXpPerHour = getJobXpPerHourFromResources(Array.isArray(jobResourcesData.CHASSEUR) ? jobResourcesData.CHASSEUR : []);
  const averageXpPerHour = getAverage([minerXpPerHour, lumberjackXpPerHour, farmerXpPerHour, hunterXpPerHour]);

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

  return {
    minerRatio: formatRate(minerRatio),
    lumberjackRatio: formatRate(lumberjackRatio),
    farmerRatio: formatRate(farmerRatio),
    hunterRatio: formatRate(hunterRatio),
    averageDifference: formatRate(averageDifference)
  };
};

const createEmptyReleve = ({ playerId, createdAt, name, date, time, importSourceKey }) => ({
  id: createId(),
  playerId,
  createdAt,
  updatedAt: Date.now(),
  importSourceKey,
  betaReleve: false,
  betaDay: "",
  name,
  phase: "",
  date,
  time,
  grade: "",
  boost: "1",
  argent: "0",
  coins: "0",
  arrival: "",
  days: "0",
  hours: "0",
  minutes: "0",
  seconds: "0",
  notes: "Import dossier JSON",
  moneyEarned: "0",
  moneySpent: "0",
  sellMoney: "0",
  hopperMoney: "0",
  sellStickMoney: "0",
  averageSales: "0",
  mainQuestsDone: "0",
  mainQuestsTotal: fixedQuestTotals.mainQuestsTotal,
  mainQuestDays: "0",
  mainQuestHours: "0",
  mainQuestMinutes: "0",
  mainQuestSeconds: "0",
  secondaryQuestsDone: "0",
  secondaryQuestsTotal: fixedQuestTotals.secondaryQuestsTotal,
  secondaryQuestDays: "0",
  secondaryQuestHours: "0",
  secondaryQuestMinutes: "0",
  secondaryQuestSeconds: "0",
  dailyQuestsDone: "0",
  dailyQuestsTotal: fixedQuestTotals.dailyQuestsTotal,
  dailyQuestDays: "0",
  dailyQuestHours: "0",
  dailyQuestMinutes: "0",
  dailyQuestSeconds: "0",
  questTotalTime: "0j 0h 0m 0s",
  questCompletionRate: "0",
  minerRatio: "0",
  hunterRatio: "0",
  farmerRatio: "0",
  lumberjackRatio: "0",
  averageDifference: "0",
  minerLevel: "0",
  minerCaveDays: "0",
  minerCaveHours: "0",
  minerCaveMinutes: "0",
  minerCaveSeconds: "0",
  minerCaveOres: "0",
  minerCaveRatio: "0",
  minerInfoDays: "0",
  minerInfoHours: "0",
  minerInfoMinutes: "0",
  minerInfoSeconds: "0",
  minerInfoOres: "0",
  minerInfoRatio: "0",
  lumberjackLevel: "0",
  farmerLevel: "0",
  hunterLevel: "0"
});

const initializeResourceFields = (releve) => {
  minerKeys.forEach((key) => {
    const prefix = `${key}Mineral`;
    releve[`${prefix}Xp`] = "0";
    releve[`${prefix}Days`] = "0";
    releve[`${prefix}Hours`] = "0";
    releve[`${prefix}Minutes`] = "0";
    releve[`${prefix}Seconds`] = "0";
    releve[`${prefix}BlocksBroken`] = "0";
    releve[`${prefix}BlocksCrafted`] = "0";
    releve[`${prefix}Money`] = "0";
    releve[`${prefix}BlockXpRatio`] = "0";
    releve[`${prefix}XpPerHour`] = "0";
    releve[`${prefix}BlocksPerHour`] = "0";
    releve[`${prefix}YieldRate`] = "0%";
    releve[`${prefix}MoneyPerHour`] = "0";
    releve[`${prefix}MoneyTimeRatio`] = "0";
  });

  woodKeys.forEach((key) => {
    const prefix = `${key}Wood`;
    releve[`${prefix}Xp`] = "0";
    releve[`${prefix}Days`] = "0";
    releve[`${prefix}Hours`] = "0";
    releve[`${prefix}Minutes`] = "0";
    releve[`${prefix}Seconds`] = "0";
    releve[`${prefix}Logs`] = "0";
    releve[`${prefix}Money`] = "0";
    releve[`${prefix}LogXpRatio`] = "0";
    releve[`${prefix}XpPerHour`] = "0";
    releve[`${prefix}LogsPerHour`] = "0";
    releve[`${prefix}YieldRate`] = "0%";
    releve[`${prefix}MoneyPerHour`] = "0";
    releve[`${prefix}MoneyTimeRatio`] = "0";
  });

  cropKeys.forEach((key) => {
    const prefix = `${key}Crop`;
    releve[`${prefix}Xp`] = "0";
    releve[`${prefix}Days`] = "0";
    releve[`${prefix}Hours`] = "0";
    releve[`${prefix}Minutes`] = "0";
    releve[`${prefix}Seconds`] = "0";
    releve[`${prefix}Items`] = "0";
    releve[`${prefix}Money`] = "0";
    releve[`${prefix}ItemXpRatio`] = "0";
    releve[`${prefix}XpPerHour`] = "0";
    releve[`${prefix}ItemsPerHour`] = "0";
    releve[`${prefix}YieldRate`] = "0%";
    releve[`${prefix}MoneyPerHour`] = "0";
    releve[`${prefix}MoneyTimeRatio`] = "0";
  });

  mobKeys.forEach((key) => {
    const prefix = `${key}Mob`;
    releve[`${prefix}Xp`] = "0";
    releve[`${prefix}Days`] = "0";
    releve[`${prefix}Hours`] = "0";
    releve[`${prefix}Minutes`] = "0";
    releve[`${prefix}Seconds`] = "0";
    releve[`${prefix}Kills`] = "0";
    releve[`${prefix}Money`] = "0";
    releve[`${prefix}MobXpRatio`] = "0";
    releve[`${prefix}XpPerHour`] = "0";
    releve[`${prefix}MobsPerHour`] = "0";
    releve[`${prefix}YieldRate`] = "0%";
    releve[`${prefix}MoneyPerHour`] = "0";
    releve[`${prefix}MoneyTimeRatio`] = "0";
  });
};

const applyResourceImport = ({ releve, resources, map, suffix, quantityField, craftField, references }) => {
  resources.forEach((resource) => {
    const mappedKey = map[String(resource?.resource_key || "").trim()];
    if (!mappedKey) return;

    const quantity = toFiniteNumber(resource.amount);
    const xp = toFiniteNumber(resource.xp);
    const money = toFiniteNumber(resource.money);
    const seconds = toFiniteNumber(resource.time_seconds);
    const durations = secondsToFields(seconds);
    const metrics = buildResourceMetrics({
      xp,
      quantity,
      money,
      seconds,
      referenceValue: toFiniteNumber(references[mappedKey])
    });
    const prefix = `${mappedKey}${suffix}`;

    releve[`${prefix}Xp`] = formatIntegerStorage(xp);
    releve[`${prefix}Days`] = String(durations.days);
    releve[`${prefix}Hours`] = String(durations.hours);
    releve[`${prefix}Minutes`] = String(durations.minutes);
    releve[`${prefix}Seconds`] = String(durations.seconds);
    releve[`${prefix}${quantityField}`] = formatPlainStorage(quantity);
    releve[`${prefix}Money`] = formatMoneyStorage(money);
    releve[`${prefix}XpPerHour`] = formatRate(metrics.xpPerHour);
    releve[`${prefix}YieldRate`] = `${formatRate(metrics.yieldRate)}%`;
    releve[`${prefix}MoneyPerHour`] = formatRate(metrics.moneyPerHour);
    releve[`${prefix}MoneyTimeRatio`] = formatRate(metrics.moneyTimeRatio);

    if (suffix === "Mineral") {
      releve[`${prefix}BlocksPerHour`] = formatRate(metrics.quantityPerHour);
      releve[`${prefix}BlockXpRatio`] = formatRate(metrics.ratio);
      releve[`${prefix}BlocksCrafted`] = formatPlainStorage(resource.crafted ?? 0);
    }

    if (suffix === "Wood") {
      releve[`${prefix}LogsPerHour`] = formatRate(metrics.quantityPerHour);
      releve[`${prefix}LogXpRatio`] = formatRate(metrics.ratio);
    }

    if (suffix === "Crop") {
      releve[`${prefix}ItemsPerHour`] = formatRate(metrics.quantityPerHour);
      releve[`${prefix}ItemXpRatio`] = formatRate(metrics.ratio);
    }

    if (suffix === "Mob") {
      releve[`${prefix}MobsPerHour`] = formatRate(metrics.quantityPerHour);
      releve[`${prefix}MobXpRatio`] = formatRate(metrics.ratio);
    }
  });
};

const buildImportedReleve = ({ parsed, playerId, fileName }) => {
  const profile = parsed?.profile || {};
  const playerData = parsed?.player || {};
  const playtimeData = parsed?.playtime || {};
  const economyData = parsed?.economy || {};
  const questsData = parsed?.quests || {};
  const jobsLevelsData = parsed?.jobs_levels || {};
  const jobResourcesData = parsed?.job_resources || {};
  const exportedInfo = splitDateTimeParts(parsed?.exported_at_iso);
  const playerName = String(playerData.name || fileName.replace(/^gdstats_/i, "").replace(/\.json$/i, "")).trim() || "Joueur";
  const importSourceKey = `${fileName}|${parsed?.exported_at_iso || ""}`;
  const releve = createEmptyReleve({
    playerId,
    createdAt: exportedInfo.createdAt,
    name: `Import ${playerName} ${exportedInfo.date} ${exportedInfo.time}`,
    date: exportedInfo.date,
    time: exportedInfo.time,
    importSourceKey
  });

  initializeResourceFields(releve);

  releve.grade = String(profile.luckperms_primary_group || "").trim();
  releve.argent = formatMoneyStorage(profile.vault_balance ?? 0);
  releve.coins = formatCoinsStorage(profile.coins_skript ?? 0);
  releve.boost = String(toFiniteNumber(profile.rjobs_boost_multiplier ?? 1));
  releve.arrival = formatDateTimeLocal(playerData.first_played_ms);
  releve.moneyEarned = formatMoneyStorage(economyData.vault_gained_total_plugin ?? 0);
  releve.moneySpent = formatMoneyStorage(economyData.vault_spent_total_plugin ?? 0);
  releve.sellMoney = formatMoneyStorage(economyData.skript_sell_total_cumulative ?? 0);
  releve.hopperMoney = formatMoneyStorage(economyData.hopper_money_cumulative ?? 0);
  releve.sellStickMoney = formatMoneyStorage(economyData.skript_sellstick_cumulative ?? 0);
  releve.averageSales = formatMoneyStorage(economyData.average_24h_hourly ?? 0);

  const playDurationSeconds = playtimeData.play_seconds_vanilla_stat
    ? toFiniteNumber(playtimeData.play_seconds_vanilla_stat)
    : Math.floor(toFiniteNumber(playerData.last_played_ms) / 1000);
  const playDuration = secondsToFields(playDurationSeconds);
  releve.days = String(playDuration.days);
  releve.hours = String(playDuration.hours);
  releve.minutes = String(playDuration.minutes);
  releve.seconds = String(playDuration.seconds);

  releve.mainQuestsDone = formatPlainStorage(questsData.main_unlock ?? 0);
  releve.secondaryQuestsDone = formatPlainStorage(questsData.secondary_completed_count ?? 0);
  releve.dailyQuestsDone = formatPlainStorage(questsData.daily_count ?? 0);
  const mainQuestFields = secondsToFields(questsData.time_principal_seconds ?? 0);
  releve.mainQuestDays = String(mainQuestFields.days);
  releve.mainQuestHours = String(mainQuestFields.hours);
  releve.mainQuestMinutes = String(mainQuestFields.minutes);
  releve.mainQuestSeconds = String(mainQuestFields.seconds);
  const secondaryQuestFields = secondsToFields(questsData.time_secondaire_seconds ?? 0);
  releve.secondaryQuestDays = String(secondaryQuestFields.days);
  releve.secondaryQuestHours = String(secondaryQuestFields.hours);
  releve.secondaryQuestMinutes = String(secondaryQuestFields.minutes);
  releve.secondaryQuestSeconds = String(secondaryQuestFields.seconds);
  const dailyQuestFields = secondsToFields(questsData.time_daily_seconds ?? 0);
  releve.dailyQuestDays = String(dailyQuestFields.days);
  releve.dailyQuestHours = String(dailyQuestFields.hours);
  releve.dailyQuestMinutes = String(dailyQuestFields.minutes);
  releve.dailyQuestSeconds = String(dailyQuestFields.seconds);

  const questSummary = buildQuestSummary({
    mainSeconds: questsData.time_principal_seconds ?? 0,
    secondarySeconds: questsData.time_secondaire_seconds ?? 0,
    mainDone: questsData.main_unlock ?? 0,
    secondaryDone: questsData.secondary_completed_count ?? 0,
    dailyDone: questsData.daily_count ?? 0
  });
  releve.questTotalTime = questSummary.questTotalTime;
  releve.questCompletionRate = questSummary.questCompletionRate;

  releve.minerLevel = formatPlainStorage(jobsLevelsData.Mineur ?? 0);
  releve.lumberjackLevel = formatPlainStorage(jobsLevelsData.Bucheron ?? 0);
  releve.farmerLevel = formatPlainStorage(jobsLevelsData.Fermier ?? 0);
  releve.hunterLevel = formatPlainStorage(jobsLevelsData.Chasseur ?? 0);

  const minerResources = Array.isArray(jobResourcesData.MINEUR) ? jobResourcesData.MINEUR : [];
  let minerInfoAmountTotal = 0;
  let minerInfoTimeTotal = 0;
  minerResources.forEach((resource) => {
    const resourceKey = String(resource?.resource_key || "").trim();
    if (resourceKey === "grotte") {
      const grottoDuration = secondsToFields(resource.time_seconds ?? 0);
      releve.minerCaveOres = formatPlainStorage(resource.amount ?? 0);
      releve.minerCaveDays = String(grottoDuration.days);
      releve.minerCaveHours = String(grottoDuration.hours);
      releve.minerCaveMinutes = String(grottoDuration.minutes);
      releve.minerCaveSeconds = String(grottoDuration.seconds);
      const grottoHours = toFiniteNumber(resource.time_seconds) / 3600;
      releve.minerCaveRatio = formatRate(grottoHours > 0 ? toFiniteNumber(resource.amount) / grottoHours : 0);
      return;
    }

    minerInfoAmountTotal += toFiniteNumber(resource.amount);
    minerInfoTimeTotal += toFiniteNumber(resource.time_seconds);
  });
  applyResourceImport({
    releve,
    resources: minerResources,
    map: minerResourceKeyMap,
    suffix: "Mineral",
    quantityField: "BlocksBroken",
    references: mineralYieldReferences
  });

  const minerInfoFields = secondsToFields(minerInfoTimeTotal);
  releve.minerInfoOres = formatPlainStorage(minerInfoAmountTotal);
  releve.minerInfoDays = String(minerInfoFields.days);
  releve.minerInfoHours = String(minerInfoFields.hours);
  releve.minerInfoMinutes = String(minerInfoFields.minutes);
  releve.minerInfoSeconds = String(minerInfoFields.seconds);
  releve.minerInfoRatio = formatRate(minerInfoTimeTotal > 0 ? minerInfoAmountTotal / (minerInfoTimeTotal / 3600) : 0);

  applyResourceImport({
    releve,
    resources: Array.isArray(jobResourcesData.BUCHERON) ? jobResourcesData.BUCHERON : [],
    map: woodResourceKeyMap,
    suffix: "Wood",
    quantityField: "Logs",
    references: woodYieldReferences
  });

  applyResourceImport({
    releve,
    resources: Array.isArray(jobResourcesData.FERMIER) ? jobResourcesData.FERMIER : [],
    map: cropResourceKeyMap,
    suffix: "Crop",
    quantityField: "Items",
    references: cropYieldReferences
  });

  applyResourceImport({
    releve,
    resources: Array.isArray(jobResourcesData.CHASSEUR) ? jobResourcesData.CHASSEUR : [],
    map: mobResourceKeyMap,
    suffix: "Mob",
    quantityField: "Kills",
    references: mobYieldReferences
  });

  const ratios = buildJobRatios(jobResourcesData);
  releve.minerRatio = ratios.minerRatio;
  releve.lumberjackRatio = ratios.lumberjackRatio;
  releve.farmerRatio = ratios.farmerRatio;
  releve.hunterRatio = ratios.hunterRatio;
  releve.averageDifference = ratios.averageDifference;

  return { playerName, importSourceKey, releve };
};

const getPlayerNameFromFile = (fileName, parsed) => {
  const rawName = String(parsed?.player?.name || fileName.replace(/^gdstats_/i, "").replace(/\.json$/i, "")).trim();
  return rawName || "Joueur";
};

const findPlayerByName = (players, name) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  return players.find((player) => String(player.name || "").trim().toLowerCase() === normalizedName);
};

const readFileText = (file) => file.text();

const handleFolderImport = async (files) => {
  if (!files.length) {
    if (folderImportFeedback) folderImportFeedback.textContent = "Aucun fichier JSON detecte dans le dossier selectionne.";
    return;
  }

  const supportedFiles = files.filter((file) => /^gdstats_.+\.json$/i.test(file.name));
  if (!supportedFiles.length) {
    if (folderImportFeedback) folderImportFeedback.textContent = "Aucun fichier au format gdstats_{nomdujoueur}.json n'a ete trouve.";
    return;
  }

  const players = readPlayers();
  const releves = readReleves();
  let createdPlayers = 0;
  let createdReleves = 0;
  let updatedReleves = 0;
  let ignoredFiles = 0;

  for (const [index, file] of supportedFiles.entries()) {
    try {
      const rawPayload = await readFileText(file);
      const parsed = JSON.parse(rawPayload);
      const playerName = getPlayerNameFromFile(file.name, parsed);
      let player = findPlayerByName(players, playerName);

      if (!player) {
        player = {
          id: createId(),
          name: playerName,
          description: "",
          betaParticipant: false
        };
        players.unshift(player);
        createdPlayers += 1;
      }

      const imported = buildImportedReleve({
        parsed,
        playerId: player.id,
        fileName: file.name
      });

      const existingIndex = releves.findIndex((releve) =>
        String(releve.playerId) === String(player.id)
        && String(releve.importSourceKey || "") === String(imported.importSourceKey)
      );

      if (existingIndex >= 0) {
        releves[existingIndex] = {
          ...releves[existingIndex],
          ...imported.releve,
          id: releves[existingIndex].id,
          createdAt: releves[existingIndex].createdAt || imported.releve.createdAt,
          updatedAt: Date.now()
        };
        updatedReleves += 1;
      } else {
        releves.unshift(imported.releve);
        createdReleves += 1;
      }
    } catch {
      ignoredFiles += 1;
    }

    if (folderImportFeedback && ((index + 1) % 25 === 0 || index === supportedFiles.length - 1)) {
      folderImportFeedback.textContent = `Import en cours... ${index + 1}/${supportedFiles.length} fichier(s) analyses.`;
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  await Promise.all([
    writePlayers(players),
    writeReleves(releves)
  ]);
  currentPage = 1;
  renderPlayers();

  if (folderImportFeedback) {
    folderImportFeedback.textContent = `${supportedFiles.length - ignoredFiles} fichier(s) traite(s) : ${createdPlayers} joueur(s) cree(s), ${createdReleves} releve(s) ajoute(s), ${updatedReleves} releve(s) mis a jour${ignoredFiles ? `, ${ignoredFiles} fichier(s) ignore(s)` : ""}.`;
  }
};

if (playerForm) {
  playerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const players = readPlayers();
    players.unshift(getFormPlayer());
    await writePlayers(players);
    currentPage = 1;
    if (playerSearch) playerSearch.value = "";
    if (betaFilter) betaFilter.checked = false;
    playerForm.reset();
    renderPlayers();
  });
}

if (pagePrev) {
  pagePrev.addEventListener("click", () => {
    currentPage = Math.max(1, currentPage - 1);
    renderPlayers();
  });
}

if (pageNext) {
  pageNext.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredPlayers().length / playersPerPage));
    currentPage = Math.min(totalPages, currentPage + 1);
    renderPlayers();
  });
}

if (playerSearch) {
  playerSearch.addEventListener("input", () => {
    currentPage = 1;
    renderPlayers();
  });
}

if (betaFilter) {
  betaFilter.addEventListener("change", () => {
    currentPage = 1;
    renderPlayers();
  });
}

if (searchReset) {
  searchReset.addEventListener("click", () => {
    if (!playerSearch) return;
    playerSearch.value = "";
    if (betaFilter) betaFilter.checked = false;
    currentPage = 1;
    renderPlayers();
    playerSearch.focus();
  });
}

if (folderImportButton && folderImportInput) {
  folderImportButton.addEventListener("click", () => {
    folderImportInput.click();
  });

  folderImportInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    if (folderImportFeedback) folderImportFeedback.textContent = "Import du dossier en cours...";
    await handleFolderImport(files);
    folderImportInput.value = "";
  });
}

const initializePlayerPage = async () => {
  if (folderImportButton) folderImportButton.disabled = true;
  if (folderImportFeedback) folderImportFeedback.textContent = "Chargement de la sauvegarde...";

  await hydrateStorageCaches();

  if (folderImportButton) folderImportButton.disabled = false;
  if (folderImportFeedback) folderImportFeedback.textContent = "";
  renderPlayers();
};

initializePlayerPage();
