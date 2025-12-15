// ========================
// DATOS DE ITEMS (muchos)
// ========================
const rewards = [
  { name: "iPhone 15", rarity: "Legendario", image: "images/iphone15.png", weight: 1 },
  { name: "Drone DJI", rarity: "Legendario", image: "images/drone.png", weight: 1 },
  { name: "MacBook Pro", rarity: "Legendario", image: "images/macbook.png", weight: 2 },
  { name: "PS5", rarity: "Épico", image: "images/ps5.png", weight: 5 },
  { name: "AirPods Pro", rarity: "Épico", image: "images/airpods.png", weight: 6 },
  { name: "Nintendo Switch", rarity: "Épico", image: "images/switch.png", weight: 4 },
  { name: "Zapatillas Nike", rarity: "Raro", image: "images/nike.png", weight: 10 },
  { name: "Tablet iPad", rarity: "Raro", image: "images/ipad.png", weight: 8 },
  { name: "Libro HP", rarity: "Común", image: "images/harrypotter.png", weight: 50 },
  { name: "Mochila Jansport", rarity: "Común", image: "images/mochila.png", weight: 40 },
  { name: "Auriculares JBL", rarity: "Común", image: "images/jbl.png", weight: 35 },
  { name: "Cámara GoPro", rarity: "Épico", image: "images/gopro.png", weight: 6 },
  { name: "Reloj Rolex", rarity: "Legendario", image: "images/rolex.png", weight: 1 },
  { name: "Gafas Ray-Ban", rarity: "Épico", image: "images/rayban.png", weight: 5 },
  { name: "Hoverboard", rarity: "Épico", image: "images/hoverboard.png", weight: 4 },
  { name: "Bicicleta BMX", rarity: "Raro", image: "images/bmx.png", weight: 8 },
  { name: "Auriculares Sony", rarity: "Raro", image: "images/sony.png", weight: 10 },
  { name: "Tablet Samsung", rarity: "Raro", image: "images/samsung.png", weight: 7 },
  { name: "Cámara Canon EOS", rarity: "Épico", image: "images/canon.png", weight: 5 },
  { name: "Figura Funko Pop", rarity: "Común", image: "images/funko.png", weight: 45 },
  { name: "Polaroid", rarity: "Común", image: "images/polaroid.png", weight: 35 },
  { name: "Mochila Herschel", rarity: "Común", image: "images/herschel.png", weight: 35 }
];

// ========================
// VARIABLES DEL USUARIO
// ========================
let userBalance = 1000; // Moneda virtual inicial
let inventory = []; // Items obtenidos

// ========================
// ELEMENTOS DEL DOM
// ========================
const balanceEl = document.getElementById("user-balance");
const dropResultEl = document.getElementById("drop-result");
const inventoryEl = document.getElementById("inventory");
const openBoxBtn = document.getElementById("open-box-btn");

// ========================
// FUNCIONES
// ========================

// Función para obtener un item aleatorio según peso
function getRandomReward() {
  const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let r of rewards) {
    if (rand < r.weight) return r;
    rand -= r.weight;
  }
}

// Función para abrir caja
function openBox() {
  const boxCost = 100;

  if (userBalance < boxCost) {
    dropResultEl.textContent = "¡No tienes suficiente moneda!";
    return;
  }

  userBalance -= boxCost;
  balanceEl.textContent = userBalance;

  const reward = getRandomReward();
  inventory.push(reward);

  // Mostrar resultado en drop result
  dropResultEl.innerHTML = `
    🎉 Obtuviste: <strong>${reward.name}</strong> 
    <span class="rarity-${reward.rarity}">[${reward.rarity}]</span>
    <br>
    <img src="${reward.image}" alt="${reward.name}" width="80">
  `;

  updateInventory();
}

// Función para actualizar inventario en pantalla
function updateInventory() {
  inventoryEl.innerHTML = "";
  inventory.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("item-card", `rarity-${item.rarity}`);
    itemDiv.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <p>${item.name}</p>
      <small>${item.rarity}</small>
    `;
    inventoryEl.appendChild(itemDiv);
  });
}

// ========================
// EVENTOS
// ========================
openBoxBtn.addEventListener("click", openBox);

// ========================
// INICIALIZACIÓN
// ========================
balanceEl.textContent = userBalance;
