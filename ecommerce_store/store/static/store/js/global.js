// Signal that global.js has loaded
window._GLOBAL_JS_LOADED = true;

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

// Simple toast using the toast container in base.html
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

// Keep the page content below the fixed nav by exposing a helper that sets
// a CSS variable `--nav-height` to the measured nav height. This is called
// on load, after toggles, and on resize so the H1/content won't be covered.
function updateNavHeight(){
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    // measure the nav (including any expanded menu) and set a CSS variable
    // so CSS can apply the same spacing to the page content.
    const natural = nav.scrollHeight || nav.offsetHeight || 64;
    // clamp to a reasonable max (80vh) so nav doesn't push content excessively
    const max = Math.floor(window.innerHeight * 0.8);
    const final = Math.max(48, Math.min(natural, max));
    document.documentElement.style.setProperty('--nav-height', final + 'px');
}

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function(){
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function(){
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', String(!expanded));
            mainNav.classList.toggle('nav-open');
            // show/hide the nav-left with a sliding animation when collapsible
            const navLeft = document.querySelector('.nav-left');
            if (!navLeft) return;
            if (mainNav.classList.contains('nav-open')) {
                navLeft.style.display = 'block';
                // trigger reflow then set maxHeight for transition
                navLeft.classList.add('collapsible');
                const height = navLeft.scrollHeight;
                navLeft.style.maxHeight = height + 'px';
                navLeft.style.opacity = '1';
            } else {
                // collapse
                navLeft.style.maxHeight = '0';
                navLeft.style.opacity = '0';
                // after transition ends hide it
                setTimeout(() => {
                    if (!mainNav.classList.contains('nav-open')) navLeft.style.display = 'none';
                }, 300);
            }
            // update nav height immediately and after the toggle animation so
            // the page padding follows the nav size and prevents overlap.
            try { updateNavHeight(); } catch(e){}
            setTimeout(function(){ try { updateNavHeight(); } catch(e){} }, 360);
        });
    }
    // click-outside to close when nav is open
    document.addEventListener('click', function(e){
        const nav = document.querySelector('.main-nav');
        const navToggle = document.querySelector('.nav-toggle');
        const navLeft = document.querySelector('.nav-left');
        if (!nav || !navToggle || !navLeft) return;
        if (!nav.classList.contains('nav-open')) return;
        // if click is inside nav or on toggle, ignore
        if (nav.contains(e.target) || navToggle.contains(e.target)) return;
        // otherwise collapse
        nav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        // collapse animation
        navLeft.style.maxHeight = '0';
        navLeft.style.opacity = '0';
        setTimeout(() => { if (!nav.classList.contains('nav-open')) navLeft.style.display = 'none'; }, 300);
    });

    // Dropdown click behavior for small screens: allow tapping 'Clubs' to open the submenu
    const dropdownToggles = document.querySelectorAll('.nav-item.has-dropdown > .nav-link');
    if (dropdownToggles && dropdownToggles.length) {
        dropdownToggles.forEach(function(toggle){
            toggle.addEventListener('click', function(e){
                // On desktop we rely on hover; on small screens intercept the click to toggle
                if (window.innerWidth <= 600) {
                    e.preventDefault();
                    const parent = this.parentElement;
                    const isOpen = parent.classList.contains('open');
                    // close any other open dropdowns
                    document.querySelectorAll('.nav-item.has-dropdown.open').forEach(function(el){
                        if (el !== parent) el.classList.remove('open');
                    });
                    parent.classList.toggle('open', !isOpen);
                    // update aria-hidden on the dropdown
                    const dropdown = parent.querySelector('.dropdown');
                    if (dropdown) dropdown.setAttribute('aria-hidden', String(isOpen));
                    // update nav height after toggling
                    try { updateNavHeight(); } catch(e){}
                }
            });
        });
    }
});

// Dynamic hamburger: show toggle when nav-left would overlap the cart on larger screens
function adjustNavToggle() {
    const nav = document.querySelector('.main-nav');
    const navLeft = document.querySelector('.nav-left');
    const navRight = document.querySelector('.nav-right');
    const navToggle = document.querySelector('.nav-toggle');
    if (!nav || !navLeft || !navRight || !navToggle) return;

    const winWidth = window.innerWidth;
    // On mobile let CSS handle it
    if (winWidth <= 600) {
        navToggle.style.display = '';
        // keep CSS-driven behavior; ensure any inline collapse styles are cleared
        navLeft.style.display = '';
        navLeft.style.maxHeight = '';
        navLeft.style.opacity = '';
        navLeft.classList.remove('collapsible');
        return;
    }

    // Measure available space for nav-left safely even if it's hidden
    const navRect = nav.getBoundingClientRect();
    const rightRect = navRight.getBoundingClientRect();
    const available = rightRect.left - navRect.left - 16; // 16px padding buffer

    // If navLeft is display:none we need to temporarily show it off-screen to measure
    const computed = window.getComputedStyle(navLeft);
    let didTemporarilyShow = false;
    const prev = { display: navLeft.style.display, position: navLeft.style.position, left: navLeft.style.left, visibility: navLeft.style.visibility };
    if (computed.display === 'none') {
        didTemporarilyShow = true;
        navLeft.style.position = 'absolute';
        navLeft.style.left = '-9999px';
        navLeft.style.display = 'flex';
        navLeft.style.visibility = 'hidden';
    }
    const needed = navLeft.scrollWidth;
    if (didTemporarilyShow) {
        // restore
        navLeft.style.display = prev.display || 'none';
        navLeft.style.position = prev.position || '';
        navLeft.style.left = prev.left || '';
        navLeft.style.visibility = prev.visibility || '';
    }

    if (needed > available) {
        // show hamburger toggle and hide nav-left until toggled
        navToggle.style.display = 'inline-flex';
        // make nav-left collapsible so we can animate it when opened
        navLeft.classList.add('collapsible');
        // hide links unless already opened
        if (!nav.classList.contains('nav-open')) {
            navLeft.style.maxHeight = '0';
            navLeft.style.opacity = '0';
            navLeft.style.display = 'none';
            navToggle.setAttribute('aria-expanded', 'false');
        }
    } else {
        // enough space — ensure links are visible and hide toggle
        navToggle.style.display = 'none';
        navLeft.style.display = '';
        navLeft.style.maxHeight = '';
        navLeft.style.opacity = '';
        nav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navLeft.classList.remove('collapsible');
    }
}

// Wire adjustment on load and resize with debounce
let _navResizeTimer = null;
window.addEventListener('resize', function(){
    if (_navResizeTimer) clearTimeout(_navResizeTimer);
    _navResizeTimer = setTimeout(function(){
        try { adjustNavToggle(); } catch(e){}
        try { updateNavHeight(); } catch(e){}
    }, 120);
});
document.addEventListener('DOMContentLoaded', function(){
    // run after a small timeout to allow fonts/layout
    setTimeout(function(){ try { adjustNavToggle(); } catch(e){}; try { updateNavHeight(); } catch(e){} }, 50);
});

// Also run on full load to ensure images/fonts that affect layout are accounted for
window.addEventListener('load', function(){
    try { adjustNavToggle(); } catch(e){}
    try { updateNavHeight(); } catch(e){}
});

// AJAX logout to prevent white flash / full reload
document.addEventListener('DOMContentLoaded', function(){
    const logoutForm = document.getElementById('logout-form');
    if (!logoutForm) return;
    logoutForm.addEventListener('submit', function(e){
        e.preventDefault();
        const btn = logoutForm.querySelector('.nav-logout');
        if (btn) btn.classList.add('is-logging-out');
        const csrf = logoutForm.querySelector('input[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');
        const loginUrl = logoutForm.getAttribute('data-login-url');
        const registerUrl = logoutForm.getAttribute('data-register-url');
        fetch(logoutForm.action, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrf },
            credentials: 'same-origin'
        }).then(resp => {
            // regardless of redirect success, treat as logged out
            const navRight = document.querySelector('.nav-right');
            if (!navRight) { window.location.href = loginUrl || '/login/'; return; }
            // remove greeting + form
            navRight.querySelectorAll('.nav-user, #logout-form').forEach(el => el.remove());
            // add login/register links
            const loginA = document.createElement('a');
            loginA.href = loginUrl || '/login/';
            loginA.textContent = 'Login';
            const registerA = document.createElement('a');
            registerA.href = registerUrl || '/register/';
            registerA.textContent = 'Register';
            navRight.appendChild(loginA);
            navRight.appendChild(registerA);
            showToast('Logged out');
            try { adjustNavToggle(); } catch(e){}
        }).catch(() => {
            // fallback: full redirect
            window.location.href = loginUrl || '/login/';
        });
    });
});
