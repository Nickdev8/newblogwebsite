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

	onMount(async () => {
		const visitedKey = `hasVisited_${data.event}`;
		const hasVisited = localStorage.getItem(visitedKey);

		const savedOpened = localStorage.getItem('openedSlugs');
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
			// Use a timeout to allow for content to render, especially expanded items and their animations
			setTimeout(() => {
				const element = document.getElementById(savedSlug);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 400); // Slightly longer than slide duration of 350ms
		}

		// Save scroll position
		let scrollTimeout: number;
		let lastLoggedSlug = '';
		const handleScroll = () => {
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
			scrollTimeout = setTimeout(() => {
				let currentPostSlug = '';
				let closestTop = Infinity;

				const postElements = document.querySelectorAll('li[data-slug]');
				if (postElements.length === 0) return;

				postElements.forEach((el) => {
					const rect = el.getBoundingClientRect();
					const absTop = Math.abs(rect.top);

					if (absTop < closestTop) {
						closestTop = absTop;
						currentPostSlug = el.getAttribute('data-slug');
					}
				});

				if (currentPostSlug && currentPostSlug !== lastLoggedSlug) {
					localStorage.setItem(scrollKey, currentPostSlug);
					lastLoggedSlug = currentPostSlug;
				}
			}, 100);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function toggleExpand(slug: string) {
		if (expandedSlugs.includes(slug)) {
			expandedSlugs = expandedSlugs.filter((s) => s !== slug);
		} else {
			expandedSlugs = [...expandedSlugs, slug];
			// Re-assign to trigger reactivity for the color change
			openedSlugs = new Set([...openedSlugs, slug]);
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

	function isVideo(src: string) {
		return src.endsWith('.mp4');
	}

	function hasLayout(image: { layout: string[] }, layout: string) {
		return image.layout.includes(layout);
	}

	function getLayoutClasses(image: { layout: string[] }) {
		const classes: string[] = ['cursor-pointer'];
		if (hasLayout(image, 'right')) {
			classes.push('float-right', 'ml-4', 'mb-2');
		} else if (hasLayout(image, 'left')) {
			classes.push('float-left', 'mr-4', 'mb-2');
		}

		if (hasLayout(image, 'hole')) {
			classes.push('w-full', 'max-w-2xl', 'mx-auto');
		} else if (hasLayout(image, 'left') || hasLayout(image, 'right')) {
			if (hasLayout(image, 'vertical')) {
				classes.push('w-1/5');
			} else if (hasLayout(image, 'horizantal')) {
				classes.push('w-2/5');
			} else {
				classes.push('w-1/4');
			}
		} else {
			classes.push('w-full', 'max-w-sm', 'mx-auto');
		}
		return classes.join(' ');
	}

	function openFullscreen(src: string, alt: string) {
		fullscreenMedia = { src, alt, isVideo: isVideo(src) };
	}
</script>

{#if fullscreenMedia}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
		on:click={() => (fullscreenMedia = null)}
	>
		<div class="relative max-h-full max-w-full" on:click|stopPropagation>
			{#if fullscreenMedia.isVideo}
				<video src={fullscreenMedia.src} class="h-auto max-h-[90vh] w-auto" controls autoplay />
			{:else}
				<img
					src={fullscreenMedia.src}
					alt={fullscreenMedia.alt}
					class="h-auto max-h-[90vh] w-auto"
				/>
			{/if}
			<button
				class="absolute right-2 top-2 rounded-full bg-black bg-opacity-50 p-2 text-white"
				on:click={() => (fullscreenMedia = null)}
			>
				&times;
			</button>
		</div>
	</div>
{/if}

<div class="m-16">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold capitalize">{data.event}</h1>
		<div class="flex space-x-4">
			<button
				on:click={openAll}
				class="text-sm text-gray-500 transition hover:text-gray-700 hover:underline cursor-pointer"
			>
				Open All
			</button>
			<button
				on:click={collapseAll}
				class="text-sm text-gray-500 transition hover:text-gray-700 hover:underline cursor-pointer"
			>
				Collapse All
			</button>
		</div>
	</div>
	<ul class="mb-8 space-y-4">
		{#each data.posts as post}
			<li
				id={post.slug}
				data-slug={post.slug}
				class="rounded bg-white p-4 shadow transition hover:bg-gray-50"
			>
				<button class="block w-full text-left cursor-pointer" on:click={() => toggleExpand(post.slug)}>
					<div class="text-sm text-gray-500">{post.date}</div>
					<div
						class="text-xl font-semibold {openedSlugs.has(post.slug)
							? 'text-gray-700 underline hover:text-gray-900'
							: 'text-blue-600 underline hover:text-blue-800'}"
					>
						{post.title}
					</div>
				</button>
				{#if expandedSlugs.includes(post.slug)}
					<div
						class="prose mt-4 max-w-none overflow-hidden rounded border border-gray-200 bg-gray-50 p-6 shadow-inner"
						transition:slide={!initialLoad ? { duration: 350, easing: (t) => t * t } : undefined}
					>
						{#each post.holeImages as image}
							{#if isVideo(image.src)}
								<video
									src={image.src}
									class="my-4 rounded-lg object-contain shadow-md {getLayoutClasses(image)}"
									autoplay={!hasLayout(image, 'dontautostart')}
									loop={!hasLayout(image, 'dontautostart')}
									muted={!hasLayout(image, 'dontautostart')}
									playsinline={!hasLayout(image, 'dontautostart')}
									controls={hasLayout(image, 'dontautostart')}
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
									class="my-4 rounded-lg object-contain shadow-md {getLayoutClasses(image)}"
									on:click={() => openFullscreen(image.src, image.alt)}
									on:keydown={(e) => e.key === 'Enter' && openFullscreen(image.src, image.alt)}
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
					rewind: true,
					gap: '1rem',
					autoplay: true,
					interval: 5000,
					perPage: 3,
					breakpoints: {
						640: {
							perPage: 1
						},
						1024: {
							perPage: 2
						}
					}
				}}
			>
				{#each data.leftoverImages as image}
					<SplideSlide>
						{#if isVideo(image.src)}
							<video
								src={image.src}
								class="mx-auto my-4 h-64 w-full cursor-pointer rounded-lg object-contain"
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
								class="mx-auto my-4 h-64 w-full cursor-pointer rounded-lg object-contain"
								on:click={() => openFullscreen(image.src, image.alt)}
								on:keydown={(e) => e.key === 'Enter' && openFullscreen(image.src, image.alt)}
								tabindex="0"
							/>
						{/if}
					</SplideSlide>
				{/each}
			</Splide>
		</div>
	{/if}
</div> 