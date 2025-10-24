document.addEventListener('DOMContentLoaded', function(){
    const csrftoken = (typeof getCookie === 'function') ? getCookie('csrftoken') : null;

    function handleForm(form, isRemoveAll){
        form.addEventListener('submit', async function(e){
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (btn && btn.disabled) return;
            if (!confirm(isRemoveAll ? 'Are you sure you want to remove ALL units of this item from your cart?' : 'Are you sure you want to remove one unit of this item from your cart?')) return;
            if (btn) { btn.disabled = true; btn.dataset.origText = btn.textContent; btn.textContent = 'Working...'; }
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
                    document.querySelectorAll('.cart-badge').forEach(function(el){ el.textContent = data.cart_item_count; });
                    const totalEl = document.getElementById('order-total');
                    if (totalEl && data.order_total !== undefined) totalEl.textContent = data.order_total;
                    const itemRow = document.getElementById('cart-item-' + data.product_id);
                    if (itemRow) {
                        if (data.item_quantity > 0) {
                            const qty = itemRow.querySelector('.item-qty'); if (qty) qty.textContent = data.item_quantity;
                        } else {
                            itemRow.remove();
                        }
                    }
                    if (typeof showToast === 'function') showToast(isRemoveAll ? 'Item removed' : 'Cart updated');
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === 'function') showToast('Could not update cart');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origText || 'Remove'; delete btn.dataset.origText; }
            }
        });
    }

    document.querySelectorAll('.remove-form').forEach(function(f){ handleForm(f, false); });
    document.querySelectorAll('.remove-all-form').forEach(function(f){ handleForm(f, true); });
});
