<script lang="ts">
	export let data: {
		events: {
			slug: string;
			title: string;
			description: string;
			coverImage: string;
		}[];
	} = { events: [] };
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	import VisitedWorldMap from '$lib/VisitedWorldMap.svelte';

	const visited = ['US', 'FR', 'JP', 'BR'];

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

<div class="m-8">
	<h1 class="mb-8 text-center text-4xl font-bold">My Adventures</h1>
	<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
		{#each data.events as event, i}
			<div
				in:fly={{ y: 50, duration: 500, delay: i * 150 }}
				class="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 hover:scale-105"
			>
				<a href="/{event.slug}" class="block">
					{#if event.coverImage.endsWith('.mp4')}
						<video
							src={event.coverImage}
							class="h-48 w-full object-cover"
							autoplay
							loop
							muted
							playsinline
						>Your browser does not support the video tag.</video>
					{:else}
						<img
							src={event.coverImage}
							alt="Cover image for {event.title}"
							class="h-48 w-full object-cover"
						/>
					{/if}
					<div class="p-6">
						<h2 translate="no" class="text-2xl font-bold capitalize text-gray-800 dark:text-gray-100">{event.title}</h2>
						<p class="mt-2 text-gray-600 dark:text-gray-300">{event.description}</p>
					</div>
				</a>
			</div>
		{/each}
	</div>
	{#if data.events.length === 0}
		<p class="mt-8 text-center text-gray-500">No events found.</p>
	{/if}
</div>

<section class="mt-16 px-4">
	<h2 class="mb-6 text-center text-3xl font-bold text-gray-800 dark:text-gray-100">Places I've Been</h2>
	<div class="mx-auto max-w-5xl">
		<VisitedWorldMap {visited} />

		<p class="mt-4 text-center text-gray-600 dark:text-gray-400 text-sm">
			Countries I've visited are shown in <span class="text-blue-600 dark:text-blue-400 font-semibold">blue</span>.
		</p>
	</div>
</section>
