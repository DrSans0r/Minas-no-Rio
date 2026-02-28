const menuData = [
  {
    category: "Pratos tradicionais",
    items: [
      {
        name: "Feijao tropeiro",
        description: "Feijao, farinha, ovos, couve e bacon artesanal.",
        price: 32.9,
        options: ["Individual", "Familia"]
      },
      {
        name: "Frango com quiabo",
        description: "Coxa e sobrecoxa ao molho caseiro com quiabo fresco.",
        price: 36.9,
        options: ["Individual", "Familia"]
      },
      {
        name: "Tutu a mineira",
        description: "Feijao batido, farinha tostada e linguica especial.",
        price: 29.9,
        options: ["Individual", "Familia"]
      }
    ]
  },
  {
    category: "Porcoes e acompanhamentos",
    items: [
      {
        name: "Torresmo crocante",
        description: "Porcao premium com limao e sal de ervas.",
        price: 27.9,
        options: ["250g", "500g"]
      },
      {
        name: "Pao de queijo artesanal",
        description: "Receita de queijo curado mineiro.",
        price: 24.9,
        options: ["12 unidades", "25 unidades"]
      },
      {
        name: "Couve refogada",
        description: "Cortada fina e puxada no alho dourado.",
        price: 16.9,
        options: ["Porcao"]
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
        name: "Suco natural da estacao",
        description: "Feito na hora com frutas selecionadas.",
        price: 9.9,
        options: ["300ml", "500ml"]
      },
      {
        name: "Cafe coado especial",
        description: "Cafe mineiro 100% arabica.",
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
const selectedItemsField = document.getElementById("selectedItems");
const totalValue = document.getElementById("totalValue");
const orderForm = document.getElementById("orderForm");
const orderMessage = document.getElementById("orderMessage");
const typeSelect = document.getElementById("typeSelect");
const addressField = document.getElementById("addressField");

const selectedItems = [];

const currency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function updateSelectedView() {
  if (!selectedItems.length) {
    selectedItemsField.value = "";
    totalValue.textContent = currency(0);
    return;
  }

  const lines = selectedItems.map((item, idx) =>
    `${idx + 1}. ${item.name} (${item.option}) - ${currency(item.price)}`
  );

  selectedItemsField.value = lines.join("\n");
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
  totalValue.textContent = currency(total);
}

function addItemToOrder(name, option, price) {
  selectedItems.push({ name, option, price });
  updateSelectedView();
}

function renderMenu() {
  const cards = menuData
    .map((category) => {
      const items = category.items
        .map((item) => {
          const optionButtons = item.options
            .map(
              (option) =>
                `<button type="button" class="option-btn" data-name="${item.name}" data-option="${option}" data-price="${item.price}">+ ${option}</button>`
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
      addItemToOrder(name, option, Number(price));
    });
  });
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
    orderMessage.textContent = "Selecione pelo menos um item do cardapio.";
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

    orderMessage.textContent = `Pedido enviado! Codigo: ${result.order.id}`;
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
