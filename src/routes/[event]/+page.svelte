<script lang="ts">
	export let data: {
		posts: { date: string; title: string; slug: string; content: string }[];
		event: string;
	};
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let expandedSlugs: string[] = [];
	let openedSlugs: Set<string> = new Set();
	const allPostSlugs = data.posts.map((p) => p.slug);

	onMount(() => {
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

		const scrollYKey = `scrollY_${data.event}`;
		const savedScrollY = localStorage.getItem(scrollYKey);
		if (savedScrollY) {
			window.scrollTo(0, parseInt(savedScrollY, 10));
		}

		let scrollTimeout: number;
		const handleScroll = () => {
			if (scrollTimeout) {
				window.cancelAnimationFrame(scrollTimeout);
			}
			scrollTimeout = window.requestAnimationFrame(() => {
				localStorage.setItem(scrollYKey, String(window.scrollY));
			});
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
</script>

<div class="m-16">
	<h1 class="mb-6 text-3xl font-bold capitalize">{data.event}</h1>
	<div class="mb-4 flex space-x-2">
		<button
			on:click={openAll}
			class="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
		>
			Open All
		</button>
		<button
			on:click={collapseAll}
			class="rounded bg-gray-500 px-4 py-2 text-white transition hover:bg-gray-600"
		>
			Collapse All
		</button>
	</div>
	<ul class="mb-8 space-y-4">
		{#each data.posts as post}
			<li class="rounded bg-white p-4 shadow transition hover:bg-gray-50">
				<button class="block w-full text-left" on:click={() => toggleExpand(post.slug)}>
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
						class="prose mt-4 max-w-none rounded border border-gray-200 bg-gray-50 p-6 shadow-inner"
						transition:slide={{ duration: 350, easing: (t) => t * t }}
					>
						{@html post.content}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
	{#if data.posts.length === 0}
		<p class="text-center text-gray-500">No posts found for this event.</p>
	{/if}
</div> 