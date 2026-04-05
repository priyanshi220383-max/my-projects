/* ============================================================
   URVORA — Accessories.js
   Handles: Cart, Wishlist, Search, Scroll-Spy, Toast Alerts
   ============================================================ */


/* ============================================================
   SECTION 1 — DATA STORE
   We keep cart and wishlist as arrays in memory.
   Each item is an object like: { id, name, price, qty, img }
   ============================================================ */

// These two arrays hold the items the user has added.
// They start empty every time the page loads.
let cart     = [];   // Cart items
let wishlist = [];   // Wishlist items


/* ============================================================
   SECTION 2 — HELPER: Read product data from a card element
   Every .items-card in your HTML already has:
       data-id="TITAN-01"
       data-price="20295"
       data-name="Titan Edge Slim"
   We grab those values here so we don't hard-code anything.
   ============================================================ */

/**
 * getProductFromCard(cardEl)
 * Receives an .items-card element and returns a plain object
 * with id, name, price (number), and img (src string).
 */
function getProductFromCard(cardEl) {
    return {
        id   : cardEl.dataset.id,                   // dataset.id reads data-id="..."
        name : cardEl.dataset.name,
        price: parseInt(cardEl.dataset.price, 10),  // parseInt converts "20295" → 20295
        img  : cardEl.querySelector('img').src       // first <img> inside the card
    };
}


/* ============================================================
   SECTION 3 — CART LOGIC
   ============================================================ */

/**
 * addToCart(product)
 * Adds a product object to the cart array.
 * If the same product (by id) is already in cart, just increase qty by 1.
 */
function addToCart(product) {
    // .find() loops through the array and returns the first match, or undefined
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.qty += 1;          // Already in cart → just increase quantity
    } else {
        cart.push({ ...product, qty: 1 });  // { ...product } copies all properties; we add qty:1
    }

    updateCartBadge();   // Refresh the number shown on the Cart link
    showToast(`"${product.name}" added to cart 🛒`);
}

/**
 * removeFromCart(id)
 * Removes a product from the cart by its id.
 * .filter() returns a new array keeping only items that do NOT match the id.
 */
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartBadge();
    renderCartModal();   // Re-draw the cart panel after removal
}

/**
 * changeQty(id, delta)
 * delta = +1 to increase, -1 to decrease quantity.
 * If qty drops to 0, remove the item entirely.
 */
function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.qty += delta;

    if (item.qty <= 0) {
        removeFromCart(id);   // Auto-remove if qty hits 0
    } else {
        updateCartBadge();
        renderCartModal();
    }
}

/**
 * updateCartBadge()
 * Counts total items in cart (sum of all qty values) and
 * updates the little number bubble next to "Cart" in the navbar.
 */
function updateCartBadge() {
    // .reduce() accumulates a running total. acc = accumulator (starts at 0)
    const total = cart.reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cart-count').textContent = total;
}

/**
 * getTotalPrice()
 * Returns the grand total (price × qty) for all cart items.
 * toLocaleString('en-IN') formats numbers Indian-style: 1,00,000
 */
function getTotalPrice() {
    const sum = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    return sum.toLocaleString('en-IN');
}


/* ============================================================
   SECTION 4 — WISHLIST LOGIC
   ============================================================ */

/**
 * toggleWishlist(product)
 * If the item is already in wishlist → remove it.
 * If not → add it.
 * Returns true if it was added, false if it was removed.
 */
function toggleWishlist(product) {
    const idx = wishlist.findIndex(item => item.id === product.id); // findIndex returns position (-1 if not found)

    if (idx !== -1) {
        wishlist.splice(idx, 1);   // splice(start, deleteCount) removes 1 item at position idx
        showToast(`"${product.name}" removed from wishlist`);
        return false;
    } else {
        wishlist.push(product);
        showToast(`"${product.name}" added to wishlist ❤️`);
        return true;
    }
}

/**
 * updateWishlistButtons()
 * After any wishlist change, loop all .items-card elements
 * and highlight the wishlist button if that product is in the wishlist.
 */
function updateWishlistButtons() {
    document.querySelectorAll('.items-card').forEach(card => {
        const id  = card.dataset.id;
        const btn = card.querySelector('.wishlist-btn');  // We'll add this button below
        if (!btn) return;

        // Check if this card's id is currently in the wishlist array
        const inWishlist = wishlist.some(item => item.id === id); // .some() returns true/false

        // Toggle a CSS class to visually indicate it's wishlisted
        btn.classList.toggle('wishlisted', inWishlist);
        btn.textContent = inWishlist ? '❤️' : '🤍';
    });
}


/* ============================================================
   SECTION 5 — MODAL BUILDER
   We create a single <div> overlay that acts as both
   the Cart panel and the Wishlist panel. We show/hide it
   by calling openModal() with different HTML content.
   ============================================================ */

// The modal overlay element — created once, reused for everything
let modalOverlay = null;

/**
 * createModalOverlay()
 * Builds the overlay <div> and appends it to <body>.
 * Called only once when the page loads.
 */
function createModalOverlay() {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'modal-overlay';

    // Inline styles so we don't need to touch your CSS file
    Object.assign(modalOverlay.style, {
        display        : 'none',           // Hidden by default
        position       : 'fixed',          // Stays in place even when scrolling
        top            : '0',
        left           : '0',
        width          : '100%',
        height         : '100%',
        background     : 'rgba(61,31,8,0.55)',  // Semi-transparent dark brown backdrop
        zIndex         : '2000',           // Must be above the sticky navbars (z-index 999/1000)
        justifyContent : 'flex-end',       // Panel slides in from the RIGHT side
        alignItems     : 'stretch'
    });

    // The white/cream panel inside the overlay
    const panel = document.createElement('div');
    panel.id = 'modal-panel';
    Object.assign(panel.style, {
        background   : '#f5ede0',       // --cream colour from your CSS variables
        width        : '420px',
        maxWidth     : '100%',
        height       : '100%',
        overflowY    : 'auto',          // Scroll inside panel if content is long
        padding      : '32px 28px',
        boxShadow    : '-8px 0 32px rgba(61,31,8,0.2)',
        fontFamily   : "'Montserrat', sans-serif",
        color        : '#4a2e0a'
    });

    panel.innerHTML = '<div id="modal-content"></div>';  // Content injected dynamically
    modalOverlay.appendChild(panel);
    document.body.appendChild(modalOverlay);

    // Clicking the dark backdrop (outside the panel) closes the modal
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();   // Only close if clicked outside the panel
    });
}

/** openModal() — Makes the overlay visible using flexbox */
function openModal() {
    modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';   // Prevents background from scrolling behind modal
}

/** closeModal() — Hides the overlay */
function closeModal() {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = '';         // Restore background scrolling
}

/**
 * renderCartModal()
 * Builds the HTML string for the cart panel and injects it
 * into #modal-content, then opens the modal.
 */
function renderCartModal() {
    const content = document.getElementById('modal-content');

    if (cart.length === 0) {
        // Empty cart state
        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                <h2 style="font-family:'Cormorant Garamond',serif;font-size:26px;letter-spacing:2px;">Your Cart</h2>
                <button onclick="closeModal()" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
            </div>
            <p style="color:#b8892a;text-align:center;margin-top:60px;">Your cart is empty.</p>
        `;
        openModal();
        return;
    }

    // Build one row of HTML for each cart item
    // .map() transforms each item into an HTML string; .join('') combines them all
    const rows = cart.map(item => `
        <div style="display:flex;gap:14px;align-items:center;border-bottom:1px solid #e8d5b7;padding:14px 0;">
            <img src="${item.img}" alt="${item.name}"
                 style="width:70px;height:70px;object-fit:cover;border-radius:4px;flex-shrink:0;">
            <div style="flex:1;min-width:0;">
                <p style="font-weight:600;font-size:13px;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
                <p style="color:#b8892a;font-size:13px;margin:0;">₹${item.price.toLocaleString('en-IN')}</p>
                <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                    <!-- onclick calls changeQty with this item's id and -1 or +1 -->
                    <button onclick="changeQty('${item.id}',-1)" style="width:26px;height:26px;border:1px solid #d4a84b;background:#fff;border-radius:4px;cursor:pointer;font-size:16px;line-height:1;">−</button>
                    <span style="font-size:14px;font-weight:600;">${item.qty}</span>
                    <button onclick="changeQty('${item.id}',+1)" style="width:26px;height:26px;border:1px solid #d4a84b;background:#fff;border-radius:4px;cursor:pointer;font-size:16px;line-height:1;">+</button>
                </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
                <p style="font-size:13px;font-weight:600;margin:0 0 8px;">₹${(item.price * item.qty).toLocaleString('en-IN')}</p>
                <!-- onclick calls removeFromCart with this item's id -->
                <button onclick="removeFromCart('${item.id}')" style="background:none;border:none;color:#8a621a;cursor:pointer;font-size:18px;" title="Remove">🗑</button>
            </div>
        </div>
    `).join('');

    content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <h2 style="font-family:'Cormorant Garamond',serif;font-size:26px;letter-spacing:2px;">Your Cart</h2>
            <button onclick="closeModal()" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
        </div>
        ${rows}
        <div style="margin-top:24px;border-top:2px solid #d4a84b;padding-top:20px;">
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:600;">
                <span>Total</span>
                <span>₹${getTotalPrice()}</span>
            </div>
            <button onclick="proceedToCheckout()"
                style="width:100%;margin-top:18px;padding:14px;background:#3d1f08;color:#fefefe;
                       border:none;border-radius:4px;font-size:14px;letter-spacing:1px;cursor:pointer;
                       font-family:'Montserrat',sans-serif;transition:background 0.3s;">
                PROCEED TO CHECKOUT
            </button>
        </div>
    `;

    openModal();
}

/**
 * renderWishlistModal()
 * Same idea as renderCartModal but for the wishlist.
 */
function renderWishlistModal() {
    const content = document.getElementById('modal-content');

    if (wishlist.length === 0) {
        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                <h2 style="font-family:'Cormorant Garamond',serif;font-size:26px;letter-spacing:2px;">Wishlist</h2>
                <button onclick="closeModal()" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
            </div>
            <p style="color:#b8892a;text-align:center;margin-top:60px;">Your wishlist is empty.</p>
        `;
        openModal();
        return;
    }

    const rows = wishlist.map(item => `
        <div style="display:flex;gap:14px;align-items:center;border-bottom:1px solid #e8d5b7;padding:14px 0;">
            <img src="${item.img}" alt="${item.name}"
                 style="width:70px;height:70px;object-fit:cover;border-radius:4px;flex-shrink:0;">
            <div style="flex:1;min-width:0;">
                <p style="font-weight:600;font-size:13px;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
                <p style="color:#b8892a;font-size:13px;margin:0;">₹${item.price.toLocaleString('en-IN')}</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                <!-- Move to cart from wishlist -->
                <button onclick="moveToCart('${item.id}')"
                    style="padding:6px 10px;background:#3d1f08;color:#fefefe;border:none;border-radius:4px;
                           font-size:11px;cursor:pointer;font-family:'Montserrat',sans-serif;letter-spacing:0.5px;">
                    Add to Cart
                </button>
                <!-- Remove from wishlist -->
                <button onclick="removeFromWishlist('${item.id}')"
                    style="background:none;border:none;color:#8a621a;cursor:pointer;font-size:18px;text-align:center;">
                    🗑
                </button>
            </div>
        </div>
    `).join('');

    content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <h2 style="font-family:'Cormorant Garamond',serif;font-size:26px;letter-spacing:2px;">Wishlist ❤️</h2>
            <button onclick="closeModal()" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
        </div>
        ${rows}
    `;

    openModal();
}

/**
 * removeFromWishlist(id)
 * Removes item from wishlist and re-draws the modal.
 */
function removeFromWishlist(id) {
    wishlist = wishlist.filter(item => item.id !== id);
    updateWishlistButtons();
    renderWishlistModal();
}

/**
 * moveToCart(id)
 * Takes a wishlist item and adds it to the cart, then removes it from wishlist.
 */
function moveToCart(id) {
    const item = wishlist.find(i => i.id === id);
    if (!item) return;
    addToCart(item);
    removeFromWishlist(id);
    renderCartModal();   // Switch the panel view to the cart
}

/**
 * proceedToCheckout()
 * Placeholder checkout function. Replace with real payment logic later.
 */
function proceedToCheckout() {
    closeModal();
    showToast('Checkout coming soon! Thank you for shopping at URVORA 🙏');
}


/* ============================================================
   SECTION 6 — SEARCH OVERLAY
   A full-width search bar that appears when "Search" is clicked.
   It filters the visible .items-card elements in real time.
   ============================================================ */

let searchOverlay = null;

/**
 * createSearchOverlay()
 * Builds a sticky search bar that appears just below the navbars.
 */
function createSearchOverlay() {
    searchOverlay = document.createElement('div');
    searchOverlay.id = 'search-overlay';

    Object.assign(searchOverlay.style, {
        display    : 'none',
        position   : 'fixed',
        top        : '124px',    // Below both sticky navbars (62px main + 62px secondary ≈ 124px)
        left       : '0',
        width      : '100%',
        background : '#3d1f08',
        padding    : '16px 8%',
        zIndex     : '1500',
        boxShadow  : '0 6px 20px rgba(61,31,8,0.3)',
        display    : 'none'
    });

    searchOverlay.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center;max-width:700px;margin:auto;">
            <input id="search-input" type="text" placeholder="Search watches, jewellery…"
                style="flex:1;padding:12px 16px;border:1px solid #d4a84b;border-radius:4px;
                       background:#f5ede0;color:#3d1f08;font-family:'Montserrat',sans-serif;
                       font-size:14px;outline:none;">
            <button id="search-close" title="Close search"
                style="background:none;border:none;color:#e8d5b7;font-size:22px;cursor:pointer;">✕</button>
        </div>
        <p id="search-status" style="color:#d4a84b;font-size:12px;letter-spacing:1px;text-align:center;margin-top:8px;"></p>
    `;

    document.body.appendChild(searchOverlay);

    // Live search: fires every time the user types a character (the 'input' event)
    document.getElementById('search-input').addEventListener('input', function() {
        filterProducts(this.value.trim());
    });

    // Close button resets everything
    document.getElementById('search-close').addEventListener('click', closeSearch);
}

/** openSearch() — Shows the search bar and focuses the input field */
function openSearch() {
    searchOverlay.style.display = 'block';
    document.getElementById('search-input').value = '';   // Clear previous text
    document.getElementById('search-status').textContent = '';
    filterProducts('');   // Reset all cards to visible
    setTimeout(() => document.getElementById('search-input').focus(), 50); // Small delay so focus works
}

/** closeSearch() — Hides the search bar and shows all products again */
function closeSearch() {
    searchOverlay.style.display = 'none';
    filterProducts('');   // Un-hide all cards
}

/**
 * filterProducts(query)
 * Shows only .items-card elements whose name or id contains the query text.
 * Case-insensitive. Hides non-matching cards.
 */
function filterProducts(query) {
    const q     = query.toLowerCase();   // Convert to lowercase for case-insensitive match
    const cards = document.querySelectorAll('.items-card');
    let   shown = 0;

    cards.forEach(card => {
        const name = (card.dataset.name || '').toLowerCase();
        const id   = (card.dataset.id   || '').toLowerCase();

        // Check if the query appears in the product name or id
        const matches = q === '' || name.includes(q) || id.includes(q);

        // Show or hide the card based on whether it matches
        card.style.display = matches ? '' : 'none';
        if (matches) shown++;
    });

    // Update the status message below the search bar
    const status = document.getElementById('search-status');
    if (q !== '') {
        status.textContent = shown > 0 ? `${shown} result(s) found` : 'No products found';
    } else {
        status.textContent = '';
    }
}


/* ============================================================
   SECTION 7 — TOAST NOTIFICATION
   A small pop-up message at the bottom of the screen
   that automatically disappears after 2.5 seconds.
   ============================================================ */

let toastTimer = null;   // We store the timer so we can cancel it if another toast arrives quickly

/**
 * showToast(message)
 * Creates (or reuses) a toast <div> and shows the message.
 */
function showToast(message) {
    // Find existing toast or create a new one
    let toast = document.getElementById('urvora-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'urvora-toast';
        Object.assign(toast.style, {
            position      : 'fixed',
            bottom        : '28px',
            left          : '50%',
            transform     : 'translateX(-50%)',   // Centers it horizontally
            background    : '#3d1f08',
            color         : '#67502c',
            padding       : '12px 26px',
            borderRadius  : '4px',
            fontSize      : '13px',
            letterSpacing : '0.5px',
            fontFamily    : "'Montserrat', sans-serif",
            zIndex        : '3000',
            opacity       : '0',
            transition    : 'opacity 0.3s ease',   // Fade in/out
            pointerEvents : 'none',                 // Can't click on it — it's decorative
            whiteSpace    : 'nowrap'
        });
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';   // Fade in

    // Cancel the previous auto-hide timer so rapid toasts don't flicker
    if (toastTimer) clearTimeout(toastTimer);

    // Auto-hide after 2.5 seconds
    toastTimer = setTimeout(() => {
        toast.style.opacity = '0';   // Fade out
    }, 2500);
}


/* ============================================================
   SECTION 8 — SCROLL-SPY
   Highlights the correct link in the secondary navbar
   as the user scrolls past each section.
   ============================================================ */

/**
 * initScrollSpy()
 * Uses IntersectionObserver — a browser feature that tells us
 * when an element enters or leaves the screen.
 * This is more efficient than listening to the scroll event every pixel.
 */
function initScrollSpy() {
    // Collect all sections that have an id matching a nav link
    const sections  = document.querySelectorAll('section[id], footer[id]');
    const navLinks  = document.querySelectorAll('#nav-links a');

    // IntersectionObserver fires a callback whenever a section
    // becomes more than 30% visible on screen
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove .active from all nav links first
                navLinks.forEach(link => link.classList.remove('active'));

                // Find the nav link whose href matches this section's id
                const matchingLink = document.querySelector(`#nav-links a[href="#${entry.target.id}"]`);
                if (matchingLink) matchingLink.classList.add('active');
            }
        });
    }, { threshold: 0.3 });   // 0.3 = fire when 30% of the section is visible

    sections.forEach(section => observer.observe(section));
}


/* ============================================================
   SECTION 9 — ADD WISHLIST BUTTONS TO EVERY PRODUCT CARD
   Your existing HTML only has a 🛒 cart button.
   We inject a 🤍 wishlist button dynamically into every .items-card.
   ============================================================ */

function addWishlistButtons() {
    document.querySelectorAll('.items-card').forEach(card => {
        const actions = card.querySelector('.card-actions');
        if (!actions) return;

        // Create the wishlist button element
        const wBtn = document.createElement('button');
        wBtn.className    = 'cart-btn wishlist-btn';    // Reuse your .cart-btn style
        wBtn.textContent  = '🤍';
        wBtn.title        = 'Add to Wishlist';
        wBtn.setAttribute('aria-label', 'Add to wishlist');

        // Insert it right after the existing 🛒 button
        // insertAdjacentElement('afterend', el) places el right after the target
        const cartBtn = actions.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.insertAdjacentElement('afterend', wBtn);
        } else {
            actions.appendChild(wBtn);
        }

        // Click handler for the wishlist button
        wBtn.addEventListener('click', function() {
            const product = getProductFromCard(card);
            const added   = toggleWishlist(product);
            updateWishlistButtons();
        });
    });
}


/* ============================================================
   SECTION 10 — WIRE UP ALL BUTTONS (event listeners)
   Run once the page is fully loaded (DOMContentLoaded).
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

    /* --- One-time setup --- */
    createModalOverlay();    // Build the slide-in panel
    createSearchOverlay();   // Build the search bar
    addWishlistButtons();    // Inject 🤍 buttons into every product card
    initScrollSpy();         // Start watching sections for scroll-spy

    /* ----------------------------------------------------------
       CART BUTTONS (🛒 on every product card)
       We use "event delegation" here:
       Instead of attaching a listener to each button individually,
       we attach ONE listener to the whole <body>.
       When any button is clicked, the event "bubbles up" to body.
       We check if the clicked element is a .cart-btn with a data-id.
    ---------------------------------------------------------- */
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.cart-btn[data-id]');  // .closest() finds the nearest ancestor matching the selector
        if (!btn) return;   // Not a cart button — ignore

        // Walk up the DOM from the button to find the parent .items-card
        const card = btn.closest('.items-card');
        if (!card) return;

        const product = getProductFromCard(card);
        addToCart(product);
    });

    /* ----------------------------------------------------------
       NAVBAR — "Cart" link opens the cart modal
    ---------------------------------------------------------- */
    document.getElementById('nav-cart').addEventListener('click', function(e) {
        e.preventDefault();       // Prevent the default href="#" from jumping to top
        renderCartModal();
    });

    /* ----------------------------------------------------------
       NAVBAR — "Wishlist" link opens the wishlist modal
    ---------------------------------------------------------- */
    document.getElementById('nav-wishlist').addEventListener('click', function(e) {
        e.preventDefault();
        renderWishlistModal();
    });

    /* ----------------------------------------------------------
       NAVBAR — "Search" link opens the search bar
    ---------------------------------------------------------- */
    document.getElementById('nav-search').addEventListener('click', function(e) {
        e.preventDefault();
        openSearch();
    });

    /* ----------------------------------------------------------
       CLOSE MODAL with Escape key — quality-of-life feature
    ---------------------------------------------------------- */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeSearch();
        }
    });

    /* ----------------------------------------------------------
       titan-1.html — Cart button on the product detail page
       The titan-1.html file has its own "Add to Cart" button
       with data-id="TITAN-01". We handle it the same way as above.
       Since that page uses your same JS file, it will just work.
       (The cart state resets when the user navigates back —
       to persist it across pages you would need localStorage,
       which is a more advanced topic for later.)
    ---------------------------------------------------------- */

});
/* ============================================================
   END OF Accessories.js
   ============================================================ */