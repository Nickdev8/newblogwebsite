<script lang="ts">
	export let data: {
		events: {
			slug: string;
			title: string;
			description: string;
			coverImage: string;
			lat: number;
			lng: number;
			live: boolean;
		}[];
	} = { events: [] };
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	import MapView from '$lib/MapView.svelte';
	import { Calendar, Inbox, ArrowRightCircle } from 'lucide-svelte';

	const locations = [
		...data.events.map((e) => ({ lat: e.lat, lng: e.lng, title: e.title })),
		{
			lat: 37.770466,
			lng: -122.430382,
			title: 'HackClub Event, Hackers House with 12 programmer'
		},
		{
			lat: 42.315348,
			lng: -71.009515,
			title: 'HackClub Event, First Hackathon on a private island'
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
	<h1 class="mb-8 flex items-center justify-center space-x-2 text-center text-4xl font-bold">
		<span>My Adventures</span>
	</h1>
	<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
		{#each data.events as event, i}
			<div
				in:fly={{ y: 50, duration: 500, delay: i * 150 }}
				class="overflow-hidden rounded-lg bg-white shadow-lg transition-transform duration-300 hover:scale-105 dark:bg-gray-800 {event.live
					? 'ring-2 ring-red-500'
					: ''}"
			>
				<a href="/{event.slug}" class="block h-full flex flex-col">
					<div class="relative">
						{#if event.coverImage.endsWith('.mp4')}
							<video
								src={event.coverImage}
								class="h-48 w-full object-cover flex"
								autoplay
								loop
								muted
								playsinline>Your browser does not support the video tag.</video
							>
						{:else}
							<img
								src={event.coverImage}
								alt="Cover image for {event.title}"
								class="h-48 w-full object-cover flex"
							/>
						{/if}
						{#if event.live}
							<div
								class="absolute top-2 right-2 flex items-center space-x-2 rounded-full bg-red-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-red-500/50"
							>
								<span class="relative flex h-3 w-3">
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
									></span>
									<span class="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
								</span>
								<span>LIVE</span>
							</div>
						{/if}
					</div>
					<div class="content-between p-6 flex-1 flex flex-col">
						<div class="flex flex-col">
							<div class="flex items-center space-x-2">
								<Calendar class="h-5 w-5 text-gray-500 dark:text-gray-400" />
								<h2 translate="no" class="text-2xl font-bold">{event.title}</h2>
							</div>
							<p class="mt-2 text-gray-600 dark:text-gray-300">{event.description}</p>
						</div>

						<div class="mt-auto flex-1 justify-items-end justify-self-end content-end">
							<ArrowRightCircle class="h-6 w-6 text-blue-500" />
						</div>
					</div>
				</a>
			</div>
		{/each}
	</div>
	{#if data.events.length === 0}
		<p class="mt-8 flex items-center justify-center space-x-2 text-center text-gray-500">
			<Inbox class="h-6 w-6" />
			<span>No events found.</span>
		</p>
	{/if}
</div>

<section class="mb-8 mt-16 px-4">
	<h2 class="mb-6 flex items-center justify-center space-x-2 text-center text-3xl font-bold">
		<span>Places I’ve Been</span>
	</h2>

	<div
		class="mx-auto w-full max-w-screen-2xl overflow-hidden rounded-xl border border-gray-200 shadow-md dark:border-gray-700"
	>
		<MapView {locations} />
	</div>
</section>
