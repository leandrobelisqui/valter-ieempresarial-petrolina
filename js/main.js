/* ================================================
   MODAL FUNCTIONS
   ================================================ */
function openModal() {
    const modal = document.getElementById('modal-inscricao');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('modal-inscricao');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {

    // Modal close button
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    /* ================================================
       1. FAQ ACCORDION
       ================================================ */
    const faqButtons = document.querySelectorAll('.faq-item button');

    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.nextElementSibling;
            const icon = button.querySelector('.material-icons');
            const isOpen = answer.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-answer').forEach(item => {
                item.classList.remove('open');
                item.style.maxHeight = null;
                const btn = item.previousElementSibling;
                btn.querySelector('.material-icons').style.transform = 'rotate(0deg)';
                btn.setAttribute('aria-expanded', 'false');
            });

            // Toggle current
            if (!isOpen) {
                answer.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                icon.style.transform = 'rotate(180deg)';
                button.setAttribute('aria-expanded', 'true');
            }
        });
    });

    /* ================================================
       2. WHATSAPP PHONE MASK — (XX) XXXXX-XXXX
       ================================================ */
    const phoneInput = document.getElementById('whatsapp');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            const m = v.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !m[2] ? m[1] : '(' + m[1] + ') ' + m[2] + (m[3] ? '-' + m[3] : '');
        });
    }

    /* ================================================
       3. FORM SUBMISSION - KIWIFY CHECKOUT
       ================================================ */
    const form = document.getElementById('registration-form');
    const submitBtn = document.getElementById('submit-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const whatsapp = document.getElementById('whatsapp').value.trim();

            // Validate
            if (!name || !email || !whatsapp) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            // Loading state
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons animate-spin text-lg">refresh</span> Processando...';
            submitBtn.style.opacity = '0.7';

            // Get all current URL parameters
            const currentParams = new URLSearchParams(window.location.search);
            
            // Build checkout params starting with all current params
            const checkoutParams = new URLSearchParams();
            
            // Add all existing params from current URL (UTMs, src, sck, etc.)
            for (const [key, value] of currentParams) {
                checkoutParams.append(key, value);
            }
            
            // Add user data for pre-population
            checkoutParams.set('name', name);
            checkoutParams.set('email', email);
            checkoutParams.set('phone', whatsapp.replace(/\D/g, ''));
            checkoutParams.set('region', 'br');

            // Payload for webhook
            const payload = {
                name,
                email,
                whatsapp: whatsapp.replace(/\D/g, ''),
                timestamp: new Date().toISOString(),
                // All URL parameters
                ...Object.fromEntries(currentParams)
            };

            // --- WEBHOOK (N8N / Automação) ---
            const WEBHOOK_URL = 'https://SEU_WEBHOOK_N8N.com/webhook/ie-empresarial';

            try {
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).catch(() => { });
            } catch (err) {
                // silencia
            }

            // --- META PIXEL: InitiateCheckout ---
            if (typeof fbq === 'function') {
                fbq('track', 'InitiateCheckout', {
                    value: 47.00,
                    currency: 'BRL',
                    content_name: 'IE Empresarial Petrolina - Individual',
                });
            }

            // --- KIWIFY REDIRECT ---
            const KIWIFY_URL = 'https://pay.kiwify.com.br/RjYXcAz';
            const finalUrl = `${KIWIFY_URL}?${checkoutParams.toString()}`;

            // Pequeno delay para dar tempo do webhook e pixel dispararem
            await new Promise(resolve => setTimeout(resolve, 800));

            // Redirecionar
            window.location.href = finalUrl;
        });
    }

    /* ================================================
       4. MODAL DE INSCRIÇÃO
       ================================================ */
    const modal = document.getElementById('inscricao-modal');
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('close-modal-btn');
    const openModalBtns = document.querySelectorAll('a[href="#inscricao"]');

    function openModal(e) {
        if (e) e.preventDefault();
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = ''; // Restore background scrolling
        }
    }

    // Open modal on CTA click
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    // Close modal on close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close modal on overlay click
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    // Close modal on Esc key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    /* ================================================
       5. SMOOTH SCROLL FOR ANCHOR LINKS
       ================================================ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            if (targetId === 'inscricao') {
                e.preventDefault();
                openModal();
                return;
            }
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ================================================
       6. INTERSECTION OBSERVER — REVEAL ANIMATIONS
       ================================================ */
    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach(el => observer.observe(el));
    } else {
        // Fallback: show all
        revealElements.forEach(el => el.classList.add('visible'));
    }

});
