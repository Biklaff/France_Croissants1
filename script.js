const PRODUCTS = [

const TG_CONFIG = {
};

let cart = JSON.parse(localStorage.getItem('shop_cart')) || [];
let activeProd = null;
let activeImgIdx = 0;

window.onload = () => {
    renderProductGrid();
    updateCartCounter();
    if (localStorage.getItem('user_phone')) document.getElementById('customer-phone').value = localStorage.getItem('user_phone');
};

function renderProductGrid() {
    document.getElementById('product-grid').innerHTML = PRODUCTS.map((p, i) => `
        <div class="product-card" onclick="uiActionOpenProduct(${i})">
            <img src="${p.images[0]}" loading="lazy">
            <h3>${p.title}</h3>
            <p style="font-weight:bold; color:#d2691e">${p.price} грн</p>
        </div>
    `).join('');
}

function uiActionOpenProduct(idx) {
    activeProd = PRODUCTS[idx];
    activeImgIdx = 0;
    syncModal();
    document.getElementById('modal-product').style.display = 'flex';
    document.body.classList.add('no-scroll');
}

function syncModal() {
    document.getElementById('modal-image').src = activeProd.images[activeImgIdx];
    document.getElementById('modal-title').textContent = activeProd.title;
    document.getElementById('modal-description').textContent = activeProd.desc;
    document.getElementById('modal-price').textContent = `${activeProd.price} грн`;

    const dots = document.getElementById('slider-dots');
    dots.innerHTML = activeProd.images.length > 1 ?
        activeProd.images.map((_, i) => `<div class="dot ${i === activeImgIdx ? 'active' : ''}"></div>`).join('') : '';
}

function uiActionHandleSliderClick(e) {
    if (activeProd.images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    activeImgIdx = x < rect.width / 2 ? (activeImgIdx - 1 + activeProd.images.length) % activeProd.images.length : (activeImgIdx + 1) % activeProd.images.length;
    syncModal();
}

function cartLogicAdd() {
    cart.push({ ...activeProd, cartId: Date.now() });
    updateCartCounter();
    uiActionCloseModal({target: {id: 'modal-product'}});
    uiActionToggleCart();
}

function updateCartCounter() {
    document.getElementById('cart-counter').textContent = cart.length;
    localStorage.setItem('shop_cart', JSON.stringify(cart));
}

function uiActionToggleCart() {
    const el = document.getElementById('modal-cart');
    const isVisible = el.style.display === 'flex';
    el.style.display = isVisible ? 'none' : 'flex';
    document.body.classList.toggle('no-scroll', !isVisible);
    if (!isVisible) renderCartList();
}

function renderCartList() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = cart.length ? cart.map((item, i) => `
        <div class="cart-item-wrapper" id="item-${item.cartId}">
            <div class="btn-delete-swipe" onclick="cartLogicRemove(${i})">X</div>
            <div class="cart-item-row" ontouchstart="handleSwipeStart(event)" ontouchmove="handleSwipeMove(event)">
                <span>${item.title}</span>
                <strong>${item.price} грн</strong>
            </div>
        </div>
    `).join('') : '<p style="text-align:center; padding:30px; color:#999">Пусто</p>';
}

let startX = 0;
function handleSwipeMove(e) {
    const row = e.currentTarget;
    const diff = startX - e.touches[0].clientX;
    if (diff > 50) row.style.transform = "translateX(-80px)";
    if (diff < -50) row.style.transform = "translateX(0)";
}

function cartLogicRemove(idx) {
    cart.splice(idx, 1);
    updateCartCounter();
    renderCartList();
}

async function orderLogicSubmit() {
    const phone = document.getElementById('customer-phone').value;
    if (!cart.length || !phone) return alert("Введите данные");
    localStorage.setItem('user_phone', phone);

    const text = `📦 <b>Новый заказ!</b>\n📱 Тел: ${phone}\n💰 Итого: ${cart.reduce((s,i)=>s+i.price,0)} грн`;

    await fetch(`https://api.telegram.org/bot${TG_CONFIG.TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({chat_id: TG_CONFIG.CHAT_ID, text, parse_mode: 'HTML'})
    });

    alert("Заказ принят!");
}
