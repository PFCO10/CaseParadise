let balance = Number(localStorage.getItem("balance")) || 1000;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

const items = [
  { name: "iPhone 15", rarity: "legendary", value: 5000, image: "images/iphone15.png", weight: 1 },
  { name: "PS5", rarity: "epic", value: 2500, image: "images/ps5.png", weight: 5 },
  { name: "AirPods", rarity: "rare", value: 1200, image: "images/airpods.png", weight: 10 },
  { name: "Libro", rarity: "common", value: 100, image: "images/book.png", weight: 40 }
];

const boxConfig = {
  basic: { cost: 100, multiplier: 1 },
  premium: { cost: 300, multiplier: 0.7 },
  legendary: { cost: 700, multiplier: 0.4 }
};

function updateUI() {
  document.getElementById("balance").textContent = balance;

  const inv = document.getElementById("inventory");
  inv.innerHTML = "";
  inventory.forEach(i => {
    inv.innerHTML += `
      <div class="item ${i.rarity}">
        <img src="${i.image}" width="60">
        <p>${i.name}</p>
        <small>${i.value} pts</small>
      </div>`;
  });

  const hist = document.getElementById("history");
  hist.innerHTML = "";
  history.slice(-10).reverse().forEach(h => {
    hist.innerHTML += `<li>${h}</li>`;
  });

  localStorage.setItem("balance", balance);
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("history", JSON.stringify(history));
}

function weightedRandom(multiplier) {
  let pool = [];
  items.forEach(item => {
    let weight = Math.floor(item.weight * multiplier);
    for (let i = 0; i < weight; i++) pool.push(item);
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

function openBox(type) {
  const box = boxConfig[type];
  if (balance < box.cost) {
    alert("No tienes monedas suficientes");
    return;
  }

  balance -= box.cost;

  document.getElementById("resultBox").textContent = "🎰 Abriendo caja...";
  
  setTimeout(() => {
    const reward = weightedRandom(box.multiplier);
    inventory.push(reward);
    history.push(`Obtuviste ${reward.name} (${reward.rarity})`);

    document.getElementById("resultBox").innerHTML = `
      <img src="${reward.image}" width="100"><br>
      <strong>${reward.name}</strong><br>
      Rareza: ${reward.rarity.toUpperCase()}
    `;
    updateUI();
  }, 1000);
}

updateUI();
