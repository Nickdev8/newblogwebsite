<script lang="ts">
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';

	export let data: {
		carouselImages: { src: string; isVideo: boolean }[];
		aboutMeImage: string;
	};

	const badges = ['Builder', 'Film nerd', 'Hack Clubber'];
	const nowItems = [
		{ label: 'Right now', value: 'Cutting the Neighborhood film diary' },
		{ label: 'Next trip', value: 'Wherever the Hack Club bus parks' }
	];

	const simpleNotes = [
		'Code meets cameras is my favorite combo.',
		'I learn fastest by hosting nights where everyone ships.',
		'Offline first, internet second.'
	];

	function playMuted(node: HTMLVideoElement) {
		node.muted = true;
		node.play().catch(() => {
			// autoplay might get blocked
		});
	}
</script>

<div class="space-y-10 px-4 pb-16 pt-6 sm:px-8 lg:px-10">
	<section class="glass-panel overflow-hidden">
		<div class="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
			<div class="space-y-4">
				<p class="eyebrow">About Nick</p>
				<h1 class="text-4xl font-semibold text-gray-900 dark:text-white">Making, filming, wandering.</h1>
				<p class="text-base leading-relaxed text-gray-600 dark:text-gray-300">
					I’m Nick—teenage builder, currently splitting time between code, film, and Hack Club events.
					This page is the quick version of who’s writing all those posts.
				</p>
				<div class="flex flex-wrap gap-2">
					{#each badges as badge}
						<span class="badge-soft">{badge}</span>
					{/each}
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each nowItems as item}
						<div class="rounded-2xl border border-black/5 p-4 dark:border-white/10">
							<p class="text-[0.6rem] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
								{item.label}
							</p>
							<p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
						</div>
					{/each}
				</div>
			</div>
			<div class="relative">
				<div class="absolute -inset-3 rounded-3xl bg-gradient-to-br from-blue-100 via-pink-100 to-yellow-100 blur-2xl opacity-60 dark:from-blue-900/40 dark:via-purple-900/30 dark:to-yellow-900/20"></div>
				<img
					src={data.aboutMeImage}
					alt="Nick"
					class="relative z-10 h-full w-full rounded-3xl object-cover shadow-2xl"
				/>
			</div>
		</div>
	</section>

	<section class="glass-panel space-y-4">
		<p class="eyebrow">One-minute snapshot</p>
		<h2 class="text-2xl font-semibold text-gray-900 dark:text-white">A few truths that keep me moving.</h2>
		<ul class="space-y-3 text-sm text-gray-700 dark:text-gray-200">
			{#each simpleNotes as note}
				<li class="rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">{note}</li>
			{/each}
		</ul>
	</section>

	{#if data.carouselImages.length > 0}
		<section class="space-y-4">
			<div class="glass-panel space-y-3 text-center sm:text-left">
				<p class="eyebrow">Film strip</p>
				<h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Scenes from the projects + trips</h2>
				<p class="text-sm text-gray-600 dark:text-gray-300">
					A rotating grab bag of stills and clips pulled straight from recent posts.
				</p>
			</div>
			<Splide
				options={{
					type: 'loop',
					gap: '1.25rem',
					perPage: 3,
					breakpoints: {
						1024: { perPage: 2 },
						640: { perPage: 1 }
					},
					autoplay: true,
					interval: 3200,
					pagination: false
				}}
				class="rounded-3xl"
			>
				{#each data.carouselImages as media}
					<SplideSlide>
						<div class="overflow-hidden rounded-3xl border border-black/5 bg-gray-200 dark:border-white/10 dark:bg-white/5">
							{#if media.isVideo}
								<video
									src={media.src}
									class="h-64 w-full object-cover"
									loop
									playsinline
									use:playMuted
								>
									<track kind="captions" />
								</video>
							{:else}
								<img src={media.src} alt="Gallery" class="h-64 w-full object-cover" loading="lazy" />
							{/if}
						</div>
					</SplideSlide>
				{/each}
			</Splide>
		</section>
	{/if}

	<section class="glass-panel space-y-4 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Elsewhere</p>
		<h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Want more frequent updates?</h2>
		<p class="text-sm text-gray-600 dark:text-gray-300">
			Most projects ship on nickesselman.nl, plus there’s a contact form if you want to collaborate or share an idea.
		</p>
		<a
			href="https://nickesselman.nl"
			target="_blank"
			rel="noopener"
			class="inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-gray-900"
		>
			Visit nickesselman.nl
		</a>
	</section>
</div>
