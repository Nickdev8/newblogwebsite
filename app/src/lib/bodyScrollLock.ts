import { browser } from '$app/environment';

let locks = 0;

export const lockBodyScroll = () => {
	if (!browser) return;
	locks += 1;
	if (locks === 1) {
		document.body.style.overflow = 'hidden';
	}
};

export const unlockBodyScroll = () => {
	if (!browser) return;
	locks = Math.max(0, locks - 1);
	if (locks === 0) {
		document.body.style.overflow = '';
	}
};
