<script lang="ts">
	// @ts-nocheck
	export let data: {
		posts: {
			date: string;
			title: string;
			slug: string;
			content: string;
			holeImages: { src: string; alt: string; layout: string[] }[];
		}[];
		event: string;
		leftoverImages: { src: string; alt: string }[];
		banner?: { message: string; type?: 'info' | 'warning' | 'danger' | 'success'; dismissible?: boolean } | null;
		title: string;
		description: string;
		coverImage: string;
		content: string;
		images: string[];
	};

	import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';

	let expandedSlugs: string[] = [];
	let openedSlugs: Set<string> = new Set();
	const allPostSlugs = data.posts.map((p) => p.slug);
	let initialLoad = true;
	let fullscreenMedia: { src: string; alt: string; isVideo: boolean } | null = null;

	// --- Banner (warning popup) state ---
	let bannerDismissed = false;
	let bannerKey = '';
	const bannerTypeClasses: Record<string, string> = {
		warning: 'bg-yellow-100 text-yellow-900 border-yellow-300',
		danger: 'bg-red-100 text-red-900 border-red-300',
		info: 'bg-blue-100 text-blue-900 border-blue-300',
		success: 'bg-green-100 text-green-900 border-green-300'
	};

	$: if (data.banner) {
		bannerKey = `bannerDismissed_${data.event}_${encodeURIComponent(data.banner.message)}`;
	}

	// Lock background scroll when fullscreen modal is open
	$: typeof document !== 'undefined' && (document.body.style.overflow = fullscreenMedia ? 'hidden' : '');

	onMount(async () => {
		// init banner dismissed state
		if (data.banner && typeof localStorage !== 'undefined') {
			bannerDismissed = localStorage.getItem(bannerKey) === 'true';
		}

		const visitedKey = `hasVisited_${data.event}`;
		const hasVisited = typeof localStorage !== 'undefined' && localStorage.getItem(visitedKey);

		const savedOpened = typeof localStorage !== 'undefined' && localStorage.getItem('openedSlugs');
		if (savedOpened) {
			openedSlugs = new Set(JSON.parse(savedOpened));
		}

		if (!hasVisited) {
			// First visit, open all posts
			expandedSlugs = [...allPostSlugs];
			openedSlugs = new Set([...openedSlugs, ...allPostSlugs]);
			localStorage.setItem(visitedKey, 'true');
		} else {
			// Subsequent visits, load saved state
			const savedExpanded = localStorage.getItem('expandedSlugs');
			if (savedExpanded) {
				expandedSlugs = JSON.parse(savedExpanded);
			}
		}

		localStorage.setItem('expandedSlugs', JSON.stringify(expandedSlugs));
		localStorage.setItem('openedSlugs', JSON.stringify(Array.from(openedSlugs)));

		await tick();
		initialLoad = false;

		const scrollKey = `currentPostSlug_${data.event}`;

		// Restore scroll position
		const savedSlug = localStorage.getItem(scrollKey);
		if (savedSlug) {
			setTimeout(() => {
				const element = document.getElementById(savedSlug);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 400); // Slightly longer than slide duration of 350ms
		}

		// Save scroll position efficiently
		let lastLoggedSlug = '';
		let rafId: number | null = null;
		const handleScroll = () => {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				let currentPostSlug = '';
				let closestTop = Infinity;

				const postElements = document.querySelectorAll('li[data-slug]');
				if (postElements.length === 0) return;

				postElements.forEach((el) => {
					const rect = el.getBoundingClientRect();
					const absTop = Math.abs(rect.top);
					if (absTop < closestTop) {
						closestTop = absTop;
						currentPostSlug = el.getAttribute('data-slug') || '';
					}
				});

				if (currentPostSlug && currentPostSlug !== lastLoggedSlug) {
					localStorage.setItem(scrollKey, currentPostSlug);
					lastLoggedSlug = currentPostSlug;
				}
			});
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (rafId) cancelAnimationFrame(rafId);
		};
	});

	function toggleExpand(slug: string) {
		if (expandedSlugs.includes(slug)) {
			expandedSlugs = expandedSlugs.filter((s) => s !== slug);
		} else {
			expandedSlugs = [...expandedSlugs, slug];
			openedSlugs = new Set([...openedSlugs, slug]); // trigger reactivity for color change
			localStorage.setItem('openedSlugs', JSON.stringify(Array.from(openedSlugs)));
		}
		localStorage.setItem('expandedSlugs', JSON.stringify(expandedSlugs));
	}

	function openAll() {
		expandedSlugs = [...allPostSlugs];
		openedSlugs = new Set([...openedSlugs, ...allPostSlugs]);
		localStorage.setItem('expandedSlugs', JSON.stringify(expandedSlugs));
		localStorage.setItem('openedSlugs', JSON.stringify(Array.from(openedSlugs)));
	}

	function collapseAll() {
		expandedSlugs = [];
		localStorage.setItem('expandedSlugs', JSON.stringify(expandedSlugs));
	}

	function dismissBanner() {
		bannerDismissed = true;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(bannerKey, 'true');
		}
	}

	function isVideo(src: string) {
		return src.endsWith('.mp4');
	}

	function hasLayout(image: { layout: string[] }, layout: string) {
		return image.layout.includes(layout);
	}

	function getLayoutClasses(image: { layout: string[] }) {
		const base = 'cursor-pointer my-2 sm:my-3 rounded-lg object-contain shadow-md';

		// Side positioning only on medium+ screens
		const side = hasLayout(image, 'right')
			? 'md:float-right md:ml-4 md:mb-2'
			: hasLayout(image, 'left')
			? 'md:float-left md:mr-4 md:mb-2'
			: 'mx-auto';

		// Width logic
		const width = hasLayout(image, 'hole')
			? 'w-full max-w-2xl mx-auto'
			: hasLayout(image, 'vertical')
			? 'w-full sm:w-1/2 md:w-1/5'
			: hasLayout(image, 'horizantal') || hasLayout(image, 'horizontal')
			? 'w-full sm:w-3/4 md:w-2/5'
			: hasLayout(image, 'left') || hasLayout(image, 'right')
			? 'w-full sm:w-2/3 md:w-1/4'
			: 'w-full max-w-sm mx-auto';

		return [base, side, width].join(' ');
	}

	function openFullscreen(src: string, alt: string) {
		fullscreenMedia = { src, alt, isVideo: isVideo(src) };
	}
</script>

{#if data.banner && !bannerDismissed}
	<!-- Top warning banner -->
	<div class={`w-full border-b px-3 py-2 sm:px-4 sm:py-2.5 text-sm flex items-start sm:items-center gap-2 ${bannerTypeClasses[data.banner.type || 'warning']}`}
		role="alert"
	>
		<span class="flex-1">{@html data.banner.message}</span>
		{#if data.banner.dismissible !== false}
			<div class="flex gap-2">
				<button
					class="shrink-0 rounded px-2 py-0.5 text-xs font-medium/none opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
					on:click={() => (bannerDismissed = true)}
					aria-label="Okay"
				>
					Okay
				</button>
				<button
					class="shrink-0 rounded px-2 py-0.5 text-xs font-medium/none opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
					on:click={dismissBanner}
					aria-label="Don't show again"
				>
					Don't show again
				</button>
			</div>
		{/if}
	</div>
{/if}

<div
	class="mx-auto max-w-none md:max-w-[1100px] lg:max-w-[1280px] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6"
	on:keydown={(e) => e.key === 'Escape' && (fullscreenMedia = null)}
	role="document"
>
	<div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
		<h1 class="text-2xl sm:text-3xl font-bold capitalize">{data.event}</h1>
		<div class="flex flex-wrap gap-2 sm:gap-3">
			<button
				on:click={openAll}
				class="text-[11px] sm:text-xs text-gray-500 transition hover:text-gray-700 hover:underline cursor-pointer"
			>
				Open All
			</button>
			<button
				on:click={collapseAll}
				class="text-[11px] sm:text-xs text-gray-500 transition hover:text-gray-700 hover:underline cursor-pointer"
			>
				Collapse All
			</button>
		</div>
	</div>

	<ul class="mb-6 space-y-2 sm:space-y-3">
		{#each data.posts as post}
			<li
				id={post.slug}
				data-slug={post.slug}
				class="rounded bg-white p-2.5 sm:p-3 shadow transition hover:bg-gray-50"
			>
				<button
					class="block w-full text-left cursor-pointer"
					on:click={() => toggleExpand(post.slug)}
					aria-expanded={expandedSlugs.includes(post.slug)}
					aria-controls={`content-${post.slug}`}
				>
					<div class="text-[11px] sm:text-xs text-gray-500">{post.date}</div>
					<div
						class="text-lg sm:text-xl font-semibold {openedSlugs.has(post.slug)
							? 'text-gray-700 underline hover:text-gray-900'
							: 'text-blue-600 underline hover:text-blue-800'}"
					>
						{post.title}
					</div>
				</button>

				{#if expandedSlugs.includes(post.slug)}
					<div
						id={`content-${post.slug}`}
						class="flow-root prose prose-sm sm:prose mt-3 max-w-none overflow-hidden rounded border border-gray-200 bg-gray-50 p-3 sm:p-4 shadow-inner"
						transition:slide={!initialLoad ? { duration: 350, easing: (t) => t * t } : undefined}
					>
						{#each post.holeImages as image}
							{#if isVideo(image.src)}
								<video
									src={image.src}
									class={` ${getLayoutClasses(image)}`}
									autoplay={!hasLayout(image, 'dontautostart')}
									loop={!hasLayout(image, 'dontautostart')}
									muted={!hasLayout(image, 'dontautostart')}
									playsinline={!hasLayout(image, 'dontautostart')}
									controls={hasLayout(image, 'dontautostart')}
									on:click={() => openFullscreen(image.src, image.alt)}
									on:keydown={(e) => e.key === 'Enter' && openFullscreen(image.src, image.alt)}
									role="button"
									tabindex="0"
									aria-label={image.alt || 'Open video fullscreen'}
								>
									<track kind="captions" />
								</video>
							{:else}
								<img
									src={image.src}
									alt={image.alt}
									class={` ${getLayoutClasses(image)}`}
									on:click={() => openFullscreen(image.src, image.alt)}
									on:keydown={(e) => e.key === 'Enter' && openFullscreen(image.src, image.alt)}
									role="button"
									tabindex="0"
								/>
							{/if}
						{/each}

						{@html post.content}
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	{#if data.posts.length === 0}
		<p class="text-center text-gray-500">No posts found for this event.</p>
	{/if}

	{#if data.leftoverImages.length > 0}
		<div class="mt-8">
			<h3 class="mb-4 text-xl font-semibold">Leftover Media</h3>
			<Splide
				options={{
					type: 'loop',
					drag: 'free',
					snap: true,
					perPage: 3,
					perMove: 1,
					wheel: true,
					gap: '1rem',
					autoplay: true,
					interval: 3000,
					breakpoints: {
						480: {
							perPage: 1,
							gap: '0.5rem'
						},
						768: {
							perPage: 2
						},
						1024: {
							perPage: 3
						}
					}
				}}
			>
				{#each data.leftoverImages as image}
					<SplideSlide>
						{#if isVideo(image.src)}
							<video
								src={image.src}
								class="mx-auto my-2 sm:my-3 h-48 sm:h-60 w-full cursor-pointer rounded-lg object-contain"
								controls
								on:click={() => openFullscreen(image.src, image.alt)}
								on:keydown={(e) => e.key === 'Enter' && openFullscreen(image.src, image.alt)}
								role="button"
								tabindex="0"
							>
								<track kind="captions" />
							</video>
						{:else}
							<img
								src={image.src}
								alt={image.alt}
								class="mx-auto my-2 sm:my-3 h-48 sm:h-60 w-full cursor-pointer rounded-lg object-contain"
								on:click={() => openFullscreen(image.src, image.alt)}
								on:keydown={(e) => e.key === 'Enter' && openFullscreen(image.src, image.alt)}
								role="button"
								tabindex="0"
							/>
						{/if}
					</SplideSlide>
				{/each}
			</Splide>
		</div>
	{/if}
</div>

{#if fullscreenMedia}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
		on:click={() => (fullscreenMedia = null)}
		role="dialog"
		aria-modal="true"
		aria-label="Fullscreen media viewer"
	>
		<div class="relative max-h-full max-w-full" on:click|stopPropagation>
			{#if fullscreenMedia.isVideo}
				<video
					src={fullscreenMedia.src}
					class="h-auto max-h-[85vh] w-auto max-w-[95vw]"
					controls
					autoplay
					playsinline
				/>
			{:else}
				<img
					src={fullscreenMedia.src}
					alt={fullscreenMedia.alt}
					class="h-auto max-h-[85vh] w-auto max-w-[95vw]"
				/>
			{/if}
			<button
				class="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white"
				on:click={() => (fullscreenMedia = null)}
				aria-label="Close fullscreen"
			>
				&times;
			</button>
		</div>
	</div>
{/if}

<style>
/* Compact the typography plugin spacing */
:global(.prose > :where(p, ul, ol, pre, table, img, video):not(:last-child)) {
	margin-bottom: 0.5rem;
}
:global(.prose h1){ margin-top:1.25rem; margin-bottom:0.5rem; }
:global(.prose h2){ margin-top:1rem;   margin-bottom:0.5rem; }
:global(.prose h3){ margin-top:0.75rem; margin-bottom:0.4rem; }
:global(.prose h4){ margin-top:0.5rem;  margin-bottom:0.3rem; }
:global(.prose li){ margin-top:0.15rem; margin-bottom:0.15rem; }
:global(.prose blockquote){ margin:0.75rem 0; padding-left:0.75rem; }
</style>
