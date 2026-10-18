/* Load verified 3D renders only for visible cards, with bounded API concurrency. */
(() => {
  const providers = [
    uuid => `https://crafatar-pub.neodium.fr/renders/head/${uuid}?scale=6&overlay`,
    uuid => `https://mc-heads.net/head/${uuid}/96`,
    uuid => `https://crafatar.com/renders/head/${uuid}?scale=6&overlay`
  ];
  const cache = new Map();
  const pending = new Map();
  const queue = [];
  const observed = new Set();
  const mounts = new WeakMap();
  let running = 0;

  function remember(uuid, entry) {
    cache.delete(uuid);
    cache.set(uuid, entry);
    while (cache.size > 256) {
      const oldest = cache.keys().next().value;
      const previous = cache.get(oldest);
      if (previous.url) URL.revokeObjectURL(previous.url);
      cache.delete(oldest);
    }
  }
  async function requestHead(uuid) {
    for (const provider of providers) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch(provider(uuid), {
          signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer"
        });
        // A PNG can still decode successfully when its HTTP status is 500.
        // Never accept that fallback image as the player's actual skin.
        const storage = response.headers.get("X-Storage-Type") || "";
        if (!response.ok || /(?:server|user) error/i.test(storage)) throw new Error("Service de skins indisponible.");
        if (!/^image\//i.test(response.headers.get("Content-Type") || "")) throw new Error("Réponse de skin invalide.");
        const blob = await response.blob();
        if (!blob.size || blob.size > 1024 * 1024) throw new Error("Image de skin invalide.");
        return URL.createObjectURL(blob);
      } catch {
        // Try the next service without interrupting the player directory.
      } finally { clearTimeout(timer); }
    }
    throw new Error("Skin indisponible pour cet UUID.");
  }
  function drain() {
    while (running < 4 && queue.length) {
      const job = queue.shift();
      running++;
      requestHead(job.uuid).then(url => {
        remember(job.uuid, { url });
        job.resolve(url);
      }, error => {
        remember(job.uuid, { retryAt: Date.now() + 30000 });
        job.reject(error);
      }).finally(() => {
        pending.delete(job.uuid);
        running--;
        drain();
      });
    }
  }
  function load(uuid) {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(uuid)) return Promise.reject(new Error("UUID invalide."));
    const cached = cache.get(uuid);
    if (cached?.url) { remember(uuid, cached); return Promise.resolve(cached.url); }
    if (cached?.retryAt > Date.now()) return Promise.reject(new Error("Skin temporairement indisponible."));
    if (pending.has(uuid)) return pending.get(uuid);
    const promise = new Promise((resolve, reject) => queue.push({ uuid, resolve, reject }));
    pending.set(uuid, promise);
    drain();
    return promise;
  }
  function showHead(image) {
    const { player, avatar, initial } = mounts.get(image);
    if (!image.isConnected) return;
    load(player.uuid).then(url => {
      if (image.isConnected) image.src = url;
    }).catch(() => {
      if (!image.isConnected) return;
      image.remove();
      avatar.classList.add("statgm-avatar--unavailable");
      avatar.title = "Skin indisponible pour ce joueur. Réessaie plus tard.";
      avatar.setAttribute("role", "img");
      avatar.setAttribute("aria-label", `Skin indisponible pour ${player.name}`);
      initial.hidden = false;
    });
  }
  const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      observed.delete(entry.target);
      showHead(entry.target);
    }
  }, { rootMargin: "160px" }) : null;

  function create(player) {
    const avatar = document.createElement("div");
    avatar.className = "statgm-avatar";
    avatar.title = `Tête 3D de ${player.name}`;
    const initial = document.createElement("span");
    initial.textContent = Array.from(player.name)[0]?.toUpperCase() || "?";
    initial.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.width = 80; image.height = 80;
    image.alt = `Tête Minecraft en 3D de ${player.name}`;
    image.decoding = "async";
    image.addEventListener("load", () => { initial.hidden = true; }, { once: true });
    image.addEventListener("error", () => {
      image.remove();
      avatar.title = "Impossible d’afficher la tête de ce joueur.";
      avatar.setAttribute("role", "img");
      avatar.setAttribute("aria-label", `Tête indisponible pour ${player.name}`);
    }, { once: true });
    avatar.append(initial, image);
    mounts.set(image, { player, avatar, initial });
    if (observer) { observed.add(image); observer.observe(image); }
    else setTimeout(() => showHead(image), 0);
    return avatar;
  }
  function resetObservations() {
    for (const image of observed) observer?.unobserve(image);
    observed.clear();
  }
  globalThis.StatGMHeads = { create, resetObservations, load };
})();
