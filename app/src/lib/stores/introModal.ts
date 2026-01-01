import { writable } from 'svelte/store';

export const introModalOpen = writable(false);

export const requestIntroModal = () => {
	introModalOpen.set(true);
};
