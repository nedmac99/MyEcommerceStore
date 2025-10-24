document.addEventListener('DOMContentLoaded', function(){
    const csrftoken = (typeof getCookie === 'function') ? getCookie('csrftoken') : null;
    document.querySelectorAll('.add-to-cart-form').forEach(function(form){
        form.addEventListener('submit', async function(e){
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (btn && btn.disabled) return; // already in-flight
            if (btn) { btn.disabled = true; btn.dataset.origText = btn.textContent; btn.textContent = 'Adding...'; }
            try {
                const resp = await fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': csrftoken,
                        'Accept': 'application/json'
                    },
                    body: new FormData(form)
                });
                if (!resp.ok) throw new Error('Network response was not ok');
                const data = await resp.json();
                if (data.error) {
                    if (typeof showToast === 'function') showToast('Error: ' + data.error);
                } else {
                    if (typeof showToast === 'function') showToast((data.product_name || 'Item') + ' added to cart');
                    document.querySelectorAll('.cart-badge').forEach(function(el){ el.textContent = data.cart_item_count; });
                    const totalEl = document.getElementById('order-total');
                    if (totalEl && data.order_total !== undefined) totalEl.textContent = data.order_total;
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === 'function') showToast('Network error — could not add to cart');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origText || 'Add to Cart'; delete btn.dataset.origText; }
            }
        });
    });
});
