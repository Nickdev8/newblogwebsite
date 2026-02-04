declare global {
	namespace App {
		interface Locals {
			isAdmin: boolean;
		}
	}
}

export {};

declare module '@splidejs/svelte-splide' {
	import { SvelteComponentTyped } from 'svelte';
	import Splide from '@splidejs/splide';

	export class Splide extends SvelteComponentTyped<{
		options?: any;
		hasTrack?: boolean;
		go?: Splide['go'];
		on?: Splide['on'];
		off?: Splide['off'];
		emit?: Splide['emit'];
		add?: Splide['add'];
		remove?: Splide['remove'];
		isIn?: Splide['isIn'];
		refresh?: Splide['refresh'];
		destroy?: Splide['destroy'];
		arrows?: boolean | [boolean, boolean];
		pagination?: boolean;
		progress?: boolean;
		autoplay?: boolean;
		drag?: boolean;
	}> {}

	export class SplideSlide extends SvelteComponentTyped {}
}
