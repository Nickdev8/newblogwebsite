<script lang="ts">
	export let data: { events: string[] } = { events: [] };
	import { onMount } from 'svelte';

	onMount(() => {
		const savedScrollY = localStorage.getItem('scrollY_main');
		if (savedScrollY) {
			window.scrollTo({
				top: parseInt(savedScrollY, 10),
				behavior: 'smooth'
			});
		}

		let scrollTimeout: number;
		const handleScroll = () => {
			if (scrollTimeout) {
				window.cancelAnimationFrame(scrollTimeout);
			}
			scrollTimeout = window.requestAnimationFrame(() => {
				localStorage.setItem('scrollY_main', String(window.scrollY));
			});
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<div class="m-16">
	<h1 class="mb-6 text-3xl font-bold">Journal</h1>
	<ul class="space-y-4">
		{#each data.events as event}
			<li class="rounded bg-white p-4 shadow transition hover:bg-gray-50">
				<a href="/{event}" class="block w-full text-left">
					<div class="text-xl font-semibold capitalize text-blue-600 underline hover:text-blue-800">
						{event}
					</div>
				</a>
			</li>
		{/each}
	</ul>
	{#if data.events.length === 0}
		<p class="text-center text-gray-500">No events found.</p>
	{/if}
</div>
