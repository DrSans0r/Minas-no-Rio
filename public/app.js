const menuData = [
  {
    category: "Itens salgados",
    items: [
      {
        name: "Torresmo",
        description: "Pele suina pururucada, crocante por fora e macia por dentro.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Queijo",
        description: "Queijo minas artesanal, sabor suave e textura firme.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Linguiça",
        description: "Linguiça caseira temperada com alho e ervas.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Farofa",
        description: "Farofa crocante feita com farinha de mandioca e temperos da casa.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Mandioquinha",
        description: "Mandioquinha cozida e temperada, textura macia e sabor adocicado.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Conserva",
        description: "Legumes em conserva com tempero especial e acidez equilibrada.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Biscoito",
        description: "Biscoito salgado artesanal, leve e crocante.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Pimenta",
        description: "Molho de pimenta artesanal, aroma marcante e picancia ajustada.",
        price: 0,
        options: ["Unidade"]
      }
    ]
  },
  {
    category: "Itens doces",
    items: [
      {
        name: "Mel",
        description: "Mel puro de abelhas, sabor floral e cor dourada.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Doce de leite",
        description: "Doce de leite cremoso, cozido lentamente em receita mineira.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Cocada cremosa",
        description: "Cocada de colher com coco fresco e textura aveludada.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Geleia de mocoto",
        description: "Geleia tradicional de mocoto, doce firme e sabor caracteristico.",
        price: 0,
        options: ["Unidade"]
      },
      {
        name: "Goiabada cascao",
        description: "Goiabada cascao artesanal, feita com pedacos de goiaba.",
        price: 0,
        options: ["Unidade"]
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
    updateMenuControls();
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
  updateMenuControls();
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

function removeSingleItem(name, option) {
  const index = selectedItems.findIndex((item) => item.name === name && item.option === option);
  if (index === -1) {
    return;
  }

  selectedItems.splice(index, 1);
  updateSelectedView();
}

function getSelectedCount(name, option) {
  return selectedItems.filter((item) => item.name === name && item.option === option).length;
}

function updateMenuControls() {
  menuGrid.querySelectorAll(".item-action").forEach((action) => {
    const { name, option } = action.dataset;
    const count = getSelectedCount(name, option);
    const value = action.querySelector(".stepper-value");
    value.textContent = String(count);
    action.classList.toggle("is-stepper", count > 0);
  });
}

function renderMenu() {
  const cards = menuData
    .map((category) => {
      const items = category.items
        .map((item) => {
          const option = item.options[0] || "Unidade";

          return `
            <article class="menu-item">
              <div class="menu-item-title">
                <span>${item.name}</span>
                <span>${currency(item.price)}</span>
              </div>
              <small>${item.description}</small>
              <div class="item-options">
                <div class="item-action" data-name="${item.name}" data-option="${option}" data-price="${item.price}">
                  <button type="button" class="buy-btn">Comprar</button>
                  <div class="qty-stepper" aria-label="Controle de quantidade para ${item.name}">
                    <button type="button" class="stepper-btn stepper-minus" aria-label="Remover uma unidade de ${item.name}">-</button>
                    <span class="stepper-value" aria-live="polite">0</span>
                    <button type="button" class="stepper-btn stepper-plus" aria-label="Adicionar uma unidade de ${item.name}">+</button>
                  </div>
                </div>
              </div>
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

  menuGrid.querySelectorAll(".buy-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.closest(".item-action");
      const { name, option, price } = action.dataset;
      addItemToOrder(name, option, Number(price), button);
    });
  });

  menuGrid.querySelectorAll(".stepper-plus").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.closest(".item-action");
      const { name, option, price } = action.dataset;
      addItemToOrder(name, option, Number(price), action.querySelector(".buy-btn"));
    });
  });

  menuGrid.querySelectorAll(".stepper-minus").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.closest(".item-action");
      const { name, option } = action.dataset;
      removeSingleItem(name, option);
    });
  });

  updateMenuControls();
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

