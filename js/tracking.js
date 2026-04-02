/* ================================================
   META CAPI — PageView Server-Side (50% scroll)
   ================================================ */
(function () {
    let pageViewFired = false;

    function getMetaCookies() {
        const cookies = document.cookie.split(';');
        const result = {};
        cookies.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name === '_fbc') result.fbc = value;
            if (name === '_fbp') result.fbp = value;
        });
        return result;
    }

    async function sendMetaCAPIEvent(eventName, eventData = {}) {
        try {
            const userData = getMetaCookies();
            const response = await fetch('/.netlify/functions/meta-capi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventName,
                    eventData: { url: window.location.href, ...eventData },
                    userData,
                }),
            });
            if (!response.ok) {
                console.error('Meta CAPI error:', await response.text());
            }
        } catch (error) {
            console.error('Failed to send Meta CAPI event:', error);
        }
    }

    window.addEventListener('scroll', () => {
        if (pageViewFired) return;
        const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (scrollPercent >= 0.5) {
            pageViewFired = true;
            sendMetaCAPIEvent('PageView', {
                customData: { scroll_percentage: 50, page_title: document.title },
            });
            if (typeof fbq === 'function') {
                fbq('track', 'PageView');
            }
        }
    }, { passive: true });
})();
