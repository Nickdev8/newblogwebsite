<script lang="ts">
	export let data: {
		events: {
			slug: string;
			title: string;
			description: string;
			coverImage: string;
			lat: number;
			lng: number;
		}[];
	} = { events: [] };
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	import MapView from '$lib/MapView.svelte';

	const locations = [
		...data.events.map((e) => ({ lat: e.lat, lng: e.lng, title: e.title })),
		{
			lat: 37.770466,
			lng: -122.430382,
			title: 'HackClub Event, Hackers House with 12 programmer'
		},
		{
			lat: 31.230391,
			lng: 121.473701,
			title: 'HackClub Event, Hosted a Game Cafe'
		},
		{
			lat: 52.391151,
			lng: 4.85615,
			title: 'School 2025-2028'
		},
		{
			lat: 60.475522,
			lng: 5.331638,
			title: 'Vacation'
		},
		{
			lat: 61.242143,
			lng: 8.922087,
			title: 'Vacation'
		},
		{
			lat: 57.278657,
			lng: 9.661341,
			title: 'Vacation'
		},
		{
			lat: 47.517117,
			lng: 3.478922,
			title: 'Vacation'
		},
		{
			lat: 44.162275,
			lng: 4.935713,
			title: 'Vacation'
		},
		{
			lat: 48.857948,
			lng: 2.29539,
			title: 'Vacation'
		},
		{
			lat: 59.540752,
			lng: 18.389933,
			title: 'Vacation'
		},
		{
			lat: 39.5728562,
			lng: 3.204822,
			title: 'Vacation'
		},
		{
			lat: 59.913868,
			lng: 10.752245,
			title: 'Vacation'
		},
		{
			lat: 58.687242,
			lng: 7.803918,
			title: 'Vacation'
		}
	];

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
				class="overflow-hidden rounded-lg bg-white shadow-lg transition-transform duration-300 hover:scale-105 dark:bg-gray-800"
			>
				<a href="/{event.slug}" class="block">
					{#if event.coverImage.endsWith('.mp4')}
						<video
							src={event.coverImage}
							class="h-48 w-full object-cover"
							autoplay
							loop
							muted
							playsinline>Your browser does not support the video tag.</video
						>
					{:else}
						<img
							src={event.coverImage}
							alt="Cover image for {event.title}"
							class="h-48 w-full object-cover"
						/>
					{/if}
					<div class="p-6">
						<h2
							translate="no"
							class="text-2xl font-bold capitalize text-gray-800 dark:text-gray-100"
						>
							{event.title}
						</h2>
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

<section class="mb-8 mt-16 px-4">
	<h2 class="mb-6 text-center text-3xl font-bold">Places I've Been</h2>
	<div
		class="mx-auto w-full max-w-screen-2xl overflow-hidden rounded-xl border border-gray-200 shadow-md dark:border-gray-700"
	>
		<MapView {locations} />
	</div>
</section>
