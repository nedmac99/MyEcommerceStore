// Small helper to read CSRF token from cookie
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

document.addEventListener('DOMContentLoaded', function () {
    const payBtn = document.getElementById('payBtn');
    if (!payBtn) return;

    const createUrl = payBtn.dataset.createUrl;
    if (!createUrl) return;

    payBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        if (payBtn.disabled) return;
        payBtn.disabled = true;
        const origText = payBtn.textContent;
        payBtn.textContent = 'Starting checkout...';

        try {
            const csrftoken = getCookie('csrftoken');
            const res = await fetch(createUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!res.ok) {
                const err = await res.json().catch(()=>({error:'unknown'}));
                console.error('create checkout failed', err);
                alert('Could not start checkout: ' + (err.error || res.statusText));
                payBtn.disabled = false;
                payBtn.textContent = origText;
                return;
            }

            const data = await res.json();
            if (data.url) {
                // Hosted Checkout URL returned by Stripe
                window.location.href = data.url;
                return;
            }

            if (data.id) {
                // As fallback, redirect to a path using the session id if server provides url elsewhere
                // Try redirecting to Stripe hosted checkout with session id via /checkout/session/:id (not used here)
                console.warn('Session id returned but no url to redirect to:', data.id);
                alert('Checkout started. Redirecting...');
            }

            payBtn.disabled = false;
            payBtn.textContent = origText;
        } catch (err) {
            console.error(err);
            alert('Unexpected error starting checkout. See console for details.');
            payBtn.disabled = false;
            payBtn.textContent = origText;
        }
    });
});
