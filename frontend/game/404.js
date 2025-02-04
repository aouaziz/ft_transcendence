import { navigateTo } from './index.js';

export function loadTErrorPage() {
    const goHome = document.getElementById('goHome');
    goHome.addEventListener('click', (e) => {
        navigateTo('/Home');
    });
}
