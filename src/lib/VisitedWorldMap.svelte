<script lang="ts">
	import { onMount, tick } from 'svelte';

	export let visited: string[] = [];

	let svgHtml = '';

	onMount(async () => {
		const res = await fetch('/maps/world.svg');
		svgHtml = await res.text();

		await tick();

		for (const iso of visited) {
			const el = document.getElementById(iso);
			if (el) {
				el.classList.add('visited-country');
				console.warn(`${iso}`);
			} else {
				console.warn(`Country ${iso} not found in SVG`);
			}
		}
	});
</script>

<div class="mx-auto max-w-5xl overflow-auto rounded-lg bg-white p-4 shadow-md dark:bg-gray-900">
	{#if svgHtml}
		<div class="mx-auto max-w-5xl overflow-auto rounded-lg bg-white p-4 shadow-md dark:bg-gray-900">
			{@html svgHtml}
		</div>
	{:else}
		<p class="text-center text-gray-500">Loading map...</p>
	{/if}
</div>

<style>
	.visited-country {
		fill: #3b82f6 !important;
		stroke: #1e3a8a !important;
	}
	svg {
		width: 100%;
		height: auto;
	}
</style>
