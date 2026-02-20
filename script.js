const STORAGE_KEY = "nova-crate-state-v1";
const rarities = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
const rarityWeights = { Common: 56, Rare: 25, Epic: 12, Legendary: 5, Mythic: 2 };
const rarityXp = { Common: 14, Rare: 28, Epic: 48, Legendary: 85, Mythic: 150 };
const rarityColors = {
  Common: "#b5bfd6",
  Rare: "#35dfff",
  Epic: "#9e6bff",
  Legendary: "#ffb146",
  Mythic: "#ff4ce7"
};

const itemPool = {
  Common: ["Carbon Keycap", "Pulse Sticker", "Wireframe Badge"],
  Rare: ["Photon Blade", "Nebula Headset", "Aqua Drone"],
  Epic: ["Void Hoodie", "Aurora Keyboard", "Plasma Katana"],
  Legendary: ["Titan Exo Suit", "Solar Crown", "Orbit Bike"],
  Mythic: ["Eclipse Relic", "Singularity Core", "Celestial Aegis"]
};

const cases = [
  {
    id: "glimmer",
    name: "Glimmer Crate",
    description: "Balanced starter case for early progression.",
    theme: "common",
    cost: 120,
    unlockLevel: 1,
    rates: [
      { rarity: "Common", chance: 62 },
      { rarity: "Rare", chance: 23 },
      { rarity: "Epic", chance: 10 },
      { rarity: "Legendary", chance: 4 },
      { rarity: "Mythic", chance: 1 }
    ]
  },
  {
    id: "storm",
    name: "Storm Crate",
    description: "Leans into Rare and Epic rewards.",
    theme: "rare",
    cost: 260,
    unlockLevel: 2,
    rates: [
      { rarity: "Common", chance: 46 },
      { rarity: "Rare", chance: 30 },
      { rarity: "Epic", chance: 15 },
      { rarity: "Legendary", chance: 7 },
      { rarity: "Mythic", chance: 2 }
    ]
  },
  {
    id: "nova",
    name: "Nova Crate",
    description: "Premium split with enhanced Legendary drops.",
    theme: "legendary",
    cost: 480,
    unlockLevel: 4,
    rates: [
      { rarity: "Common", chance: 36 },
      { rarity: "Rare", chance: 30 },
      { rarity: "Epic", chance: 20 },
      { rarity: "Legendary", chance: 11 },
      { rarity: "Mythic", chance: 3 }
    ]
  },
  {
    id: "cosmic",
    name: "Cosmic Vault",
    description: "High risk case with top-end Mythic potential.",
    theme: "mythic",
    cost: 750,
    unlockLevel: 6,
    rates: [
      { rarity: "Common", chance: 26 },
      { rarity: "Rare", chance: 31 },
      { rarity: "Epic", chance: 23 },
      { rarity: "Legendary", chance: 14 },
      { rarity: "Mythic", chance: 6 }
    ]
  }
];

const defaultState = {
  coins: 700,
  xp: 0,
  inventory: [],
  streak: 0,
  lastDaily: 0,
  achievementClaimed: false,
  profile: { alias: "ArcRunner", accent: "#35f2ff" }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function pickByRates(rates) {
  const total = rates.reduce((sum, r) => sum + r.chance, 0);
  let roll = Math.random() * total;
  for (const rate of rates) {
    roll -= rate.chance;
    if (roll <= 0) return rate.rarity;
  }
  return rates[0].rarity;
}

function randomItem(rarity) {
  const pool = itemPool[rarity];
  const name = pool[Math.floor(Math.random() * pool.length)];
  const base = rarityWeights[rarity] * 12;
  return {
    name,
    rarity,
    value: base + Math.floor(Math.random() * 80)
  };
}

function calcLevel(xp) {
  return Math.floor(xp / 250) + 1;
}

function playTone(rarity) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = rarity === "Mythic" ? 840 : rarity === "Legendary" ? 640 : 420;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.6);
}

const { createApp, computed, ref, watch } = Vue;

createApp({
  setup() {
    const state = ref(loadState());
    const selectedCase = ref(cases[0]);
    const rolling = ref(false);
    const filterRarity = ref("All");
    const reelItems = ref([]);
    const reelOffset = ref(0);
    const lastDrop = ref(null);
    const previews = ref(Object.fromEntries(cases.map((c) => [c.id, "--"])));

    const level = computed(() => calcLevel(state.value.xp));
    const xpForNextLevel = computed(() => level.value * 250);
    const xpPercent = computed(() => ((state.value.xp % 250) / 250) * 100);
    const achievementClaimed = computed(() => state.value.achievementClaimed);
    const dailyAvailable = computed(() => Date.now() - state.value.lastDaily > 1000 * 60 * 60 * 20);
    const filteredInventory = computed(() =>
      state.value.inventory.filter((item) => filterRarity.value === "All" || item.rarity === filterRarity.value)
    );
    const totalValue = computed(() => state.value.inventory.reduce((sum, i) => sum + i.value, 0));

    const leaderboard = computed(() => {
      const seeded = [
        { name: "PulseNova", value: 7420 },
        { name: "AstraHex", value: 6890 },
        { name: "LumaRift", value: 6360 }
      ];
      return [...seeded, { name: state.value.profile.alias || "You", value: totalValue.value }]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    });

    const reelTrackStyle = computed(() => ({ transform: `translateX(-${reelOffset.value}px)` }));
    const reelGlowStyle = computed(() => {
      const rarity = lastDrop.value?.rarity;
      const color = rarity ? rarityColors[rarity] : "#35f2ff";
      return { boxShadow: `0 0 28px ${color}66` };
    });

    function persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
      document.documentElement.style.setProperty("--accent", state.value.profile.accent);
    }

    function setPreview(caseData) {
      selectedCase.value = caseData;
      const rarity = pickByRates(caseData.rates);
      previews.value[caseData.id] = `${randomItem(rarity).name} (${rarity})`;
    }

    function grantEmergencyBonus() {
      const cheapest = Math.min(...cases.filter((c) => level.value >= c.unlockLevel).map((c) => c.cost));
      if (state.value.coins < cheapest) {
        const gift = Math.ceil(cheapest * 0.35);
        state.value.coins += gift;
        lastDrop.value = { name: `Emergency Coin Grant +${gift}`, rarity: "Common" };
      }
    }

    function claimDaily() {
      if (!dailyAvailable.value) return;
      const now = Date.now();
      const day = 1000 * 60 * 60 * 24;
      state.value.streak = now - state.value.lastDaily < day * 2 ? state.value.streak + 1 : 1;
      const reward = 140 + state.value.streak * 15;
      state.value.coins += reward;
      state.value.xp += 40;
      state.value.lastDaily = now;
      persist();
    }

    function completeChallenge() {
      state.value.coins += 120;
      state.value.xp += 30;
      persist();
    }

    function claimAchievement() {
      if (state.value.achievementClaimed || state.value.inventory.length < 5) return;
      state.value.achievementClaimed = true;
      state.value.coins += 300;
      state.value.xp += 120;
      persist();
    }

    function makeReel(finalItem) {
      const ribbon = [];
      for (let i = 0; i < 28; i += 1) {
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        ribbon.push(randomItem(rarity));
      }
      ribbon[22] = finalItem;
      reelItems.value = ribbon;
      reelOffset.value = 0;
      requestAnimationFrame(() => {
        reelOffset.value = 22 * 170 - 350;
      });
    }

    function confettiBurst() {
      const burst = document.createElement("div");
      burst.style.position = "fixed";
      burst.style.inset = "0";
      burst.style.pointerEvents = "none";
      burst.innerHTML = Array.from({ length: 50 })
        .map(
          (_, i) =>
            `<span style="position:absolute;left:${Math.random() * 100}%;top:-10px;width:7px;height:13px;background:${i % 2 ? '#ff4de7' : '#35f2ff'};transform:rotate(${Math.random() * 360}deg);animation:fall ${2 + Math.random()}s linear forwards"></span>`
        )
        .join("");
      const style = document.createElement("style");
      style.textContent = "@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:.2}}";
      burst.append(style);
      document.body.append(burst);
      setTimeout(() => burst.remove(), 3200);
    }

    function openCase(caseData) {
      if (rolling.value || level.value < caseData.unlockLevel) return;
      grantEmergencyBonus();
      if (state.value.coins < caseData.cost) return;
      rolling.value = true;
      selectedCase.value = caseData;
      state.value.coins -= caseData.cost;
      const rarity = pickByRates(caseData.rates);
      const prize = randomItem(rarity);
      makeReel(prize);
      setTimeout(() => {
        state.value.inventory.unshift(prize);
        state.value.xp += rarityXp[rarity];
        lastDrop.value = prize;
        playTone(rarity);
        if (rarity === "Legendary" || rarity === "Mythic") confettiBurst();
        rolling.value = false;
        grantEmergencyBonus();
        persist();
      }, 4200);
    }

    watch(
      () => [state.value.profile.alias, state.value.profile.accent, state.value.inventory.length],
      () => {
        if (!state.value.achievementClaimed && state.value.inventory.length >= 5) {
          // achievement can now be claimed
        }
        persist();
      },
      { deep: true }
    );

    document.documentElement.style.setProperty("--accent", state.value.profile.accent);

    setInterval(() => {
      cases.forEach((c) => {
        const rarity = pickByRates(c.rates);
        previews.value[c.id] = `${randomItem(rarity).name} (${rarity})`;
      });
    }, 2600);

    return {
      state,
      cases,
      rarities,
      level,
      xpForNextLevel,
      xpPercent,
      filterRarity,
      filteredInventory,
      totalValue,
      leaderboard,
      selectedCase,
      previews,
      openCase,
      setPreview,
      reelItems,
      reelTrackStyle,
      reelGlowStyle,
      lastDrop,
      rolling,
      claimDaily,
      completeChallenge,
      claimAchievement,
      dailyAvailable,
      achievementClaimed
    };
  }
}).mount("#app");

(function particleField() {
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = Array.from({ length: Math.min(90, Math.floor(window.innerWidth / 18)) }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      v: Math.random() * 0.4 + 0.1
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y -= p.v;
      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.fillStyle = "rgba(120,180,255,0.35)";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();
