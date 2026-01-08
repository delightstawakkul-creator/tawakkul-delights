// State Management
const cart = []
let currentCategory = "all"
let selectedProduct = null
let products = {}

// DOM Elements
const productGrid = document.getElementById("productGrid")
const cartBtn = document.getElementById("cartBtn")
const cartCount = document.getElementById("cartCount")
const cartSidebar = document.getElementById("cartSidebar")
const cartOverlay = document.getElementById("cartOverlay")
const closeCartBtn = document.getElementById("closeCart")
const cartItems = document.getElementById("cartItems")
const checkoutBtn = document.getElementById("checkoutBtn")
const categoryTitle = document.getElementById("categoryTitle")
const navButtons = document.querySelectorAll(".nav-btn")
const productModal = document.getElementById("productModal")
const modalClose = document.querySelector(".modal-close")
const addToCartBtn = document.getElementById("addToCartBtn")
const modalQuantity = document.getElementById("modalQuantity")
const increaseQtyBtn = document.getElementById("increaseQty")
const decreaseQtyBtn = document.getElementById("decreaseQty")

// Convert Google Drive view link to direct image link
function convertDriveLink(url) {
  if (!url || !url.includes("drive.google.com")) {
    return url
  }
  // Extract file ID from Google Drive view link
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`
  }
  return url
}

// Load products from JSON file
async function loadProductsData() {
  try {
    const response = await fetch("./products.json")
    if (!response.ok) {
      throw new Error("Failed to load products")
    }
    products = await response.json()
    
    // Convert all Google Drive links to direct image links
    Object.values(products).forEach((category) => {
      category.forEach((product) => {
        if (product.image) {
          product.image = convertDriveLink(product.image)
        }
      })
    })
    
    loadProducts("all")
  } catch (error) {
    console.error("Error loading products:", error)
    productGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">Error loading products. Please refresh the page.</p>'
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadProductsData()
  setupEventListeners()
  
  // Hero button click handler
  const heroBtn = document.getElementById("heroExploreBtn")
  if (heroBtn) {
    heroBtn.addEventListener("click", () => {
      const allBtn = document.querySelector('[data-category="all"]')
      if (allBtn) {
        allBtn.click()
        window.scrollTo({ top: document.querySelector(".main").offsetTop - 80, behavior: "smooth" })
      }
    })
  }
})

// Event Listeners
function setupEventListeners() {
  cartBtn.addEventListener("click", openCart)
  closeCartBtn.addEventListener("click", closeCart)
  cartOverlay.addEventListener("click", closeCart)
  checkoutBtn.addEventListener("click", checkout)
  modalClose.addEventListener("click", closeModal)
  addToCartBtn.addEventListener("click", addToCart)
  increaseQtyBtn.addEventListener("click", () => {
    const qty = Number.parseInt(modalQuantity.value)
    modalQuantity.value = qty + 1
  })
  decreaseQtyBtn.addEventListener("click", () => {
    const qty = Number.parseInt(modalQuantity.value)
    if (qty > 1) modalQuantity.value = qty - 1
  })

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle")
  const mainNav = document.getElementById("mainNav")
  
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      mainNav.classList.toggle("nav-open")
      mobileMenuToggle.classList.toggle("active")
    })
    
    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        if (mainNav && mobileMenuToggle && 
            !mainNav.contains(e.target) && 
            !mobileMenuToggle.contains(e.target) &&
            mainNav.classList.contains("nav-open")) {
          mainNav.classList.remove("nav-open")
          mobileMenuToggle.classList.remove("active")
        }
      }
    })
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      navButtons.forEach((b) => b.classList.remove("active"))
      e.target.classList.add("active")
      const category = e.target.dataset.category
      currentCategory = category
      loadProducts(category)
      
      // Close mobile menu after selection
      if (window.innerWidth <= 768 && mainNav && mobileMenuToggle) {
        mainNav.classList.remove("nav-open")
        mobileMenuToggle.classList.remove("active")
      }
    })
  })
}

// Load Products
function loadProducts(category, skipCartUpdate = false) {
  productGrid.innerHTML = ""

  // Wait for products to be loaded
  if (!products || Object.keys(products).length === 0) {
    return
  }

  const categoryName = category === "all" ? "All Products" : category.charAt(0).toUpperCase() + category.slice(1)
  categoryTitle.textContent = categoryName

  let productsToShow = []
  if (category === "all") {
    Object.values(products).forEach((cat) => productsToShow.push(...cat))
  } else {
    productsToShow = products[category] || []
  }

  // Filter out unavailable products
  productsToShow = productsToShow.filter((product) => product.available !== false)

  if (productsToShow.length === 0) {
    productGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">No products available in this category.</p>'
    return
  }

  productsToShow.forEach((product) => {
    const productCard = createProductCard(product)
    productGrid.appendChild(productCard)
  })
}

// Create Product Card
function createProductCard(product) {
  const card = document.createElement("div")
  card.className = "product-card"
  card.setAttribute("data-product-id", product.id)
  
  const cartItem = cart.find((item) => item.id === product.id)
  const isInCart = cartItem !== undefined
  const quantity = isInCart ? cartItem.quantity : 0
  
  let buttonsHTML = ""
  let footerHTML = ""
  if (isInCart) {
    buttonsHTML = `
      <div class="product-buttons">
        <button class="product-btn product-btn-view">View</button>
        <div class="product-qty-controls">
          <button class="qty-btn-card" data-action="decrease" data-product-id="${product.id}">−</button>
          <span class="qty-display">${quantity}</span>
          <button class="qty-btn-card" data-action="increase" data-product-id="${product.id}">+</button>
        </div>
      </div>
    `
    footerHTML = `
      <div class="product-footer">
        <p class="product-price-footer">₹${product.price}</p>
        <div class="product-qty-controls">
          <button class="qty-btn-card" data-action="decrease" data-product-id="${product.id}">−</button>
          <span class="qty-display">${quantity}</span>
          <button class="qty-btn-card" data-action="increase" data-product-id="${product.id}">+</button>
        </div>
      </div>
    `
  } else {
    buttonsHTML = `
      <div class="product-buttons">
        <button class="product-btn product-btn-view">View</button>
        <button class="product-btn product-btn-add" data-product-id="${product.id}">Add to Cart</button>
      </div>
    `
    footerHTML = `
      <div class="product-footer">
        <p class="product-price-footer">₹${product.price}</p>
        <button class="product-btn product-btn-add-footer" data-product-id="${product.id}">Add to Cart</button>
      </div>
    `
  }
  
  card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-header">
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-unit">${product.unit}</p>
                </div>
                <p class="product-price">₹${product.price}</p>
            </div>
            ${buttonsHTML}
            ${footerHTML}
        </div>
    `
  
  // Make card clickable for view on mobile
  card.addEventListener("click", (e) => {
    // Don't trigger if clicking on buttons, quantity controls, or any element in footer
    const clickedButton = e.target.closest("button")
    const clickedFooter = e.target.closest(".product-footer")
    
    if (!clickedButton && !clickedFooter && window.innerWidth <= 768) {
      openModal(product)
      e.stopPropagation()
    }
  })
  
  // View button (desktop)
  const viewBtn = card.querySelector(".product-btn-view")
  if (viewBtn) {
    viewBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      openModal(product)
    })
  }
  
  // Add to cart button (desktop)
  const addBtn = card.querySelector(".product-btn-add")
  if (addBtn) {
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      addToCartDirect(product)
    })
  }
  
  // Add to cart button (mobile footer)
  const addBtnFooter = card.querySelector(".product-btn-add-footer")
  if (addBtnFooter) {
    addBtnFooter.addEventListener("click", (e) => {
      e.stopPropagation()
      addToCartDirect(product)
    })
  }
  
  // Quantity control buttons (desktop and mobile)
  const decreaseBtn = card.querySelectorAll('[data-action="decrease"]')
  const increaseBtn = card.querySelectorAll('[data-action="increase"]')
  
  decreaseBtn.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      adjustCartQuantity(product.id, -1)
    })
  })
  
  increaseBtn.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      adjustCartQuantity(product.id, 1)
    })
  })
  
  return card
}

// Modal Functions
function openModal(product) {
  selectedProduct = product
  modalQuantity.value = 1
  document.getElementById("modalImage").src = product.image
  document.getElementById("modalName").textContent = product.name
  document.getElementById("modalDescription").textContent = product.description
  document.getElementById("modalUnit").textContent = product.unit
  document.getElementById("modalPrice").textContent = product.price
  productModal.style.display = "block"
}

function closeModal() {
  productModal.style.display = "none"
  selectedProduct = null
}

// Add to Cart from Modal
function addToCart() {
  if (!selectedProduct) return

  const quantity = Number.parseInt(modalQuantity.value)
  const existingItem = cart.find((item) => item.id === selectedProduct.id)

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({
      ...selectedProduct,
      quantity: quantity,
    })
  }

  updateCart()
  closeModal()
  showNotification("Added to cart!")
}

// Add to Cart Directly from Product Card
function addToCartDirect(product) {
  const existingItem = cart.find((item) => item.id === product.id)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({
      ...product,
      quantity: 1,
    })
  }

  updateCart()
  showNotification("Added to cart!")
}

// Adjust Cart Quantity from Product Card
function adjustCartQuantity(productId, change) {
  const cartItem = cart.find((item) => item.id === productId)
  
  if (!cartItem) return

  cartItem.quantity += change

  if (cartItem.quantity <= 0) {
    const index = cart.findIndex((item) => item.id === productId)
    cart.splice(index, 1)
  }

  updateCart()
}

// Cart Functions
function openCart() {
  cartSidebar.classList.add("open")
  cartOverlay.classList.add("open")
}

function closeCart() {
  cartSidebar.classList.remove("open")
  cartOverlay.classList.remove("open")
}

function updateCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  cartCount.textContent = totalItems
  renderCartItems()
  updateCartTotal()
  // Refresh product cards to show updated cart status
  loadProducts(currentCategory, true)
}

function renderCartItems() {
  cartItems.innerHTML = ""

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>'
    return
  }

  cart.forEach((item, index) => {
    const cartItem = document.createElement("div")
    cartItem.className = "cart-item"
    cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-unit">${item.unit}</p>
                <p class="cart-item-price">₹${item.price} × ${item.quantity}</p>
            </div>
            <div class="cart-item-controls">
                <button class="qty-change" data-index="${index}" data-action="decrease">−</button>
                <span>${item.quantity}</span>
                <button class="qty-change" data-index="${index}" data-action="increase">+</button>
                <button class="remove-btn" data-index="${index}">🗑</button>
            </div>
        `
    cartItems.appendChild(cartItem)
  })

  // Event listeners for cart controls
  document.querySelectorAll(".qty-change").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = Number.parseInt(e.target.dataset.index)
      const action = e.target.dataset.action

      if (action === "increase") {
        cart[index].quantity++
      } else if (action === "decrease" && cart[index].quantity > 1) {
        cart[index].quantity--
      }
      updateCart()
    })
  })

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = Number.parseInt(e.target.dataset.index)
      cart.splice(index, 1)
      updateCart()
    })
  })
}

function updateCartTotal() {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  document.getElementById("totalPrice").textContent = total
}

// Checkout
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!")
    return
  }

  let message = "Hi! I want to place an order:\n\n"
  cart.forEach((item) => {
    message += `${item.name} (${item.unit}) - ₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}\n`
  })

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  message += `\nTotal: ₹${total}`

  const whatsappNumber = "917671942511"
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

  window.open(whatsappUrl, "_blank")
}

// Notification
function showNotification(text) {
  const notification = document.createElement("div")
  notification.className = "notification"
  notification.textContent = text
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.classList.add("show")
  }, 10)

  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => notification.remove(), 300)
  }, 2000)
}

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === productModal) {
    closeModal()
  }
})
