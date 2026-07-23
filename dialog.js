// --- 커스텀 다이얼로그 / 토스트 유틸리티 (prompt/confirm/alert 대체) ---

const dialogModal = document.getElementById('custom-dialog-modal');
const dialogMessage = document.getElementById('dialog-message');
const dialogInput = document.getElementById('dialog-input');
const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');
const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
const toastEl = document.getElementById('toast-notification');
let dialogResolve = null;

/**
 * 커스텀 입력 다이얼로그 (prompt 대체)
 * @param {string} message
 * @param {string} [placeholder]
 * @returns {Promise<string|null>} 입력값 또는 취소 시 null
 */
export function showInputDialog(message, placeholder = '') {
    return new Promise((resolve) => {
        dialogMessage.textContent = message;
        dialogInput.placeholder = placeholder;
        dialogInput.value = '';
        dialogInput.style.display = 'block';
        dialogConfirmBtn.textContent = '저장';
        dialogCancelBtn.textContent = '취소';
        dialogModal.classList.add('show');
        dialogInput.focus();
        dialogResolve = resolve;
    });
}

/**
 * 커스텀 확인 다이얼로그 (confirm 대체)
 * @param {string} message
 * @param {string} [confirmText]
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog(message, confirmText = '확인') {
    return new Promise((resolve) => {
        dialogMessage.textContent = message;
        dialogInput.style.display = 'none';
        dialogInput.value = '';
        dialogConfirmBtn.textContent = confirmText;
        dialogCancelBtn.textContent = '취소';
        dialogModal.classList.add('show');
        dialogResolve = resolve;
    });
}

function closeDialog(result) {
    dialogModal.classList.remove('show');
    if (dialogResolve) {
        dialogResolve(result);
        dialogResolve = null;
    }
}

dialogConfirmBtn.addEventListener('click', () => {
    const result = dialogInput.style.display !== 'none'
        ? (dialogInput.value.trim() || null)
        : true;
    closeDialog(result);
});

dialogCancelBtn.addEventListener('click', () => closeDialog(null));

dialogInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        closeDialog(dialogInput.value.trim() || null);
    }
    if (e.key === 'Escape') closeDialog(null);
});

window.addEventListener('click', (e) => {
    if (e.target === dialogModal) closeDialog(null);
});

/**
 * 토스트 알림 표시 (alert 대체)
 * @param {string} message
 */
export function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2500);
}
