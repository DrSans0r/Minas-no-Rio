const menuData = [
  {
    category: "Pratos tradicionais",
    items: [
      {
        name: "Feijão tropeiro",
        description: "Feijão, farinha, ovos, couve e bacon artesanal.",
        price: 32.9,
        options: ["Individual", "Família"]
      },
      {
        name: "Frango com quiabo",
        description: "Coxa e sobrecoxa ao molho caseiro com quiabo fresco.",
        price: 36.9,
        options: ["Individual", "Família"]
      },
      {
        name: "Tutu à mineira",
        description: "Feijão batido, farinha tostada e linguiça especial.",
        price: 29.9,
        options: ["Individual", "Família"]
      }
    ]
  },
  {
    category: "Porções e acompanhamentos",
    items: [
      {
        name: "Torresmo crocante",
        description: "Porção premium com limão e sal de ervas.",
        price: 27.9,
        options: ["250g", "500g"]
      },
      {
        name: "Pão de queijo artesanal",
        description: "Receita de queijo curado mineiro.",
        price: 24.9,
        options: ["12 unidades", "25 unidades"]
      },
      {
        name: "Couve refogada",
        description: "Cortada fina e puxada no alho dourado.",
        price: 16.9,
        options: ["Porção"]
      }
    ]
  },
  {
    category: "Sobremesas",
    items: [
      {
        name: "Doce de leite cremoso",
        description: "Cozimento lento, sabor intenso e textura aveludada.",
        price: 18.9,
        options: ["Pote 250g", "Pote 500g"]
      },
      {
        name: "Romeu e Julieta no copo",
        description: "Creme de queijo com goiabada artesanal.",
        price: 16.9,
        options: ["Unidade"]
      },
      {
        name: "Canjica gourmet",
        description: "Canjica cremosa com coco e canela.",
        price: 14.9,
        options: ["Unidade", "Combo 4"]
      }
    ]
  },
  {
    category: "Bebidas",
    items: [
      {
        name: "Suco natural da estação",
        description: "Feito na hora com frutas selecionadas.",
        price: 9.9,
        options: ["300ml", "500ml"]
      },
      {
        name: "Café coado especial",
        description: "Café mineiro 100% arábica.",
        price: 7.9,
        options: ["Copo"]
      },
      {
        name: "Refresco de goiaba",
        description: "Leve, refrescante e sem conservantes.",
        price: 8.9,
        options: ["300ml", "1L"]
      }
    ]
  }
];

const menuGrid = document.getElementById("menuGrid");
const selectedItemsList = document.getElementById("selectedItemsList");
const selectionFeedback = document.getElementById("selectionFeedback");
const totalValue = document.getElementById("totalValue");
const orderForm = document.getElementById("orderForm");
const orderMessage = document.getElementById("orderMessage");
const typeSelect = document.getElementById("typeSelect");
const addressField = document.getElementById("addressField");

const selectedItems = [];
let feedbackTimeoutId;

const currency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function updateSelectedView() {
  if (!selectedItems.length) {
    selectedItemsList.innerHTML = "<p class=\"selected-items-empty\">Nenhum item selecionado.</p>";
    totalValue.textContent = currency(0);
    updateMenuOptionCounts();
    return;
  }
  const listHtml = selectedItems
    .map(
      (item, idx) => `
      <div class="selected-item-row">
        <span>${idx + 1}. ${item.name} (${item.option}) - ${currency(item.price)}</span>
        <div class="selected-item-actions">
          <button type="button" class="remove-item-btn" data-index="${idx}" aria-label="Remover ${item.name}">
            <i class="ph ph-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `
    )
    .join("");
  selectedItemsList.innerHTML = listHtml;

  selectedItemsList.querySelectorAll(".remove-item-btn").forEach((button) => {
    button.addEventListener("click", () => {
      removeItemFromOrder(Number(button.dataset.index));
    });
  });

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
  totalValue.textContent = currency(total);
  updateMenuOptionCounts();
}

function showSelectionFeedback(message) {
  clearTimeout(feedbackTimeoutId);
  selectionFeedback.textContent = message;
  selectionFeedback.classList.add("visible");

  feedbackTimeoutId = setTimeout(() => {
    selectionFeedback.textContent = "";
    selectionFeedback.classList.remove("visible");
  }, 1400);
}

function addItemToOrder(name, option, price, sourceButton) {
  selectedItems.push({ name, option, price });
  updateSelectedView();
  showSelectionFeedback(`${name} (${option}) adicionado.`);

  if (sourceButton) {
    sourceButton.classList.remove("added");
    void sourceButton.offsetWidth;
    sourceButton.classList.add("added");
  }
}

function removeItemFromOrder(index) {
  if (index < 0 || index >= selectedItems.length) {
    return;
  }

  selectedItems.splice(index, 1);
  updateSelectedView();
}

function getSelectedCount(name, option) {
  return selectedItems.filter((item) => item.name === name && item.option === option).length;
}

function updateMenuOptionCounts() {
  menuGrid.querySelectorAll(".option-count").forEach((badge) => {
    const { name, option } = badge.dataset;
    const count = getSelectedCount(name, option);
    badge.textContent = String(count);
    badge.classList.toggle("visible", count > 0);
  });
}

function renderMenu() {
  const cards = menuData
    .map((category) => {
      const items = category.items
        .map((item) => {
          const optionButtons = item.options
            .map(
              (option) =>
                `<div class="option-choice">
                  <button type="button" class="option-btn" data-name="${item.name}" data-option="${option}" data-price="${item.price}">+ ${option}</button>
                  <span class="option-count" data-name="${item.name}" data-option="${option}" aria-label="Quantidade selecionada">0</span>
                </div>`
            )
            .join("");

          return `
            <article class="menu-item">
              <div class="menu-item-title">
                <span>${item.name}</span>
                <span>${currency(item.price)}</span>
              </div>
              <small>${item.description}</small>
              <div class="item-options">${optionButtons}</div>
            </article>
          `;
        })
        .join("");

      return `
        <article class="menu-card">
          <h3>${category.category}</h3>
          ${items}
        </article>
      `;
    })
    .join("");

  menuGrid.innerHTML = cards;

  menuGrid.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const { name, option, price } = button.dataset;
      addItemToOrder(name, option, Number(price), button);
    });
  });

  updateMenuOptionCounts();
}

function toggleAddressField() {
  const isDelivery = typeSelect.value === "entrega";
  addressField.style.display = isDelivery ? "grid" : "none";
  const addressInput = addressField.querySelector("input");
  addressInput.required = isDelivery;
}

typeSelect.addEventListener("change", toggleAddressField);

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedItems.length) {
    orderMessage.textContent = "Selecione pelo menos um item do cardápio.";
    orderMessage.className = "order-message error";
    return;
  }

  const formData = new FormData(orderForm);
  const payload = {
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    type: formData.get("type"),
    address: formData.get("address"),
    payment: formData.get("payment"),
    notes: formData.get("notes"),
    items: selectedItems,
    total: selectedItems.reduce((sum, item) => sum + item.price, 0)
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Falha ao enviar o pedido.");
    }

    orderMessage.textContent = `Pedido enviado! Código: ${result.order.id}`;
    orderMessage.className = "order-message success";

    orderForm.reset();
    selectedItems.splice(0, selectedItems.length);
    updateSelectedView();
    toggleAddressField();
  } catch (error) {
    orderMessage.textContent = error.message;
    orderMessage.className = "order-message error";
  }
});

renderMenu();
toggleAddressField();
