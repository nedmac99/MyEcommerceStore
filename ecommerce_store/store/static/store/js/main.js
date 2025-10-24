// Signal that main.js has loaded
window._MAIN_JS_LOADED = true;

// CSRF helper
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showToast(message, timeout=3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    el.style.background = '#333';
    el.style.color = '#fff';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '4px';
    el.style.marginBottom = '8px';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    el.style.transition = 'opacity .2s, transform .2s';
    container.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
        el.style.opacity = '0'; el.style.transform = 'translateY(-6px)';
        setTimeout(() => el.remove(), 250);
    }, timeout);
}

document.addEventListener('DOMContentLoaded', function(){
    const csrftoken = getCookie('csrftoken');
    document.querySelectorAll('.remove-form, .remove-all-form').forEach(function(form){
        form.addEventListener('submit', function(e){
            e.preventDefault();
            const isRemoveAll = form.classList.contains('remove-all-form');
            const confirmMsg = isRemoveAll ? 'Are you sure you want to remove ALL units of this item from your cart?' : 'Are you sure you want to remove one unit of this item from your cart?';
            if (!confirm(confirmMsg)) return;
            const action = form.getAttribute('action');
            fetch(action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrftoken,
                    'Accept': 'application/json'
                },
                body: new FormData(form)
            }).then(function(response){
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            }).then(function(data){
                if (data.error) { showToast('Error: '+data.error); return; }
                // Update cart badge(s)
                document.querySelectorAll('.cart-badge').forEach(function(el){ el.textContent = data.cart_item_count; });
                // Update order total
                const totalEl = document.getElementById('order-total');
                if (totalEl && data.order_total !== undefined) totalEl.textContent = data.order_total;
                // Update item quantity or remove row
                const itemRow = document.getElementById('cart-item-' + data.product_id);
                if (itemRow) {
                    if (data.item_quantity > 0) {
                        const qty = itemRow.querySelector('.item-qty'); if (qty) qty.textContent = data.item_quantity;
                    } else {
                        itemRow.remove();
                    }
                }
                showToast(isRemoveAll ? 'Item removed' : 'Cart updated');
            }).catch(function(err){
                console.error(err);
                showToast('Could not update cart');
            });
        });
    });
    // Handle add-to-cart forms via AJAX to avoid redirecting the page
    document.querySelectorAll('.add-to-cart-form').forEach(function(form){
        form.addEventListener('submit', function(e){
            e.preventDefault();
            const action = form.getAttribute('action');
            fetch(action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrftoken,
                    'Accept': 'application/json'
                },
                body: new FormData(form)
            }).then(function(response){
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            }).then(function(data){
                if (data.error) { showToast('Error: '+data.error); return; }
                // Update cart badge(s)
                document.querySelectorAll('.cart-badge').forEach(function(el){ el.textContent = data.cart_item_count; });
                // Optionally update order total if present on page
                const totalEl = document.getElementById('order-total');
                if (totalEl && data.order_total !== undefined) totalEl.textContent = data.order_total;
                // Show confirmation toast with product name
                if (data.product_name) showToast(data.product_name + ' added to cart');
                else showToast('Added to cart');
            }).catch(function(err){
                console.error(err);
                showToast('Could not add to cart');
            });
        });
    });
    // Mobile nav toggle (hamburger)
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function(){
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', String(!expanded));
            mainNav.classList.toggle('nav-open');
        });
    }
});
