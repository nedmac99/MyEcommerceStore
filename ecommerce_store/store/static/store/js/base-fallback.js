(function(){
    if (window._GLOBAL_JS_LOADED) return;

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

    function showToast(message, timeout=3000){
        const container = document.getElementById('toast-container');
        if (!container) { alert(message); return; }
        const el = document.createElement('div');
        el.className = 'toast'; el.textContent = message;
        el.style.background = '#333'; el.style.color = '#fff'; el.style.padding = '8px 12px'; el.style.borderRadius = '4px'; el.style.marginBottom = '8px';
        container.appendChild(el);
        setTimeout(()=> el.remove(), timeout);
    }

    document.addEventListener('DOMContentLoaded', function(){
        const csrftoken = getCookie('csrftoken');
        document.querySelectorAll('.add-to-cart-form').forEach(function(form){
            form.addEventListener('submit', function(e){
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                if (btn) { btn.disabled = true; }
                fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': csrftoken,
                        'Accept': 'application/json'
                    },
                    body: new FormData(form)
                }).then(function(r){
                    if (!r.ok) throw new Error('Network response was not ok');
                    return r.json();
                }).then(function(data){
                    if (data && data.product_name) showToast(data.product_name + ' added to cart');
                    else showToast('Added to cart');
                    if (data && data.cart_item_count !== undefined) document.querySelectorAll('.cart-badge').forEach(function(el){ el.textContent = data.cart_item_count; });
                }).catch(function(){
                    form.submit();
                }).finally(function(){ if (btn) btn.disabled = false; });
            });
        });
    });
})();
