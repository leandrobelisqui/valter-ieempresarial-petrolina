/* ================================================
   MODAL DE INSCRIÇÃO
   ================================================ */
function openModal() {
    const modal = document.getElementById('registration-modal');
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        const nameInput = modal.querySelector('#name');
        if (nameInput) nameInput.focus();
    }, 300);
}

function closeModal() {
    const modal = document.getElementById('registration-modal');
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    document.body.style.overflow = '';
}

// Fechar com tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
