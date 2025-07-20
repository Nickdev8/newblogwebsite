<script lang="ts">
	export let data: { posts: { date: string; title: string; slug: string; content: string }[] } = { posts: [] };
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let expandedSlugs: string[] = [];
	let openedSlugs: Set<string> = new Set();

	onMount(() => {
		const savedExpanded = localStorage.getItem('expandedSlugs');
		if (savedExpanded) {
			expandedSlugs = JSON.parse(savedExpanded);
		}
		const savedOpened = localStorage.getItem('openedSlugs');
		if (savedOpened) {
			openedSlugs = new Set(JSON.parse(savedOpened));
		}
	});

	function toggleExpand(slug: string) {
		if (expandedSlugs.includes(slug)) {
			expandedSlugs = expandedSlugs.filter(s => s !== slug);
		} else {
			expandedSlugs = [...expandedSlugs, slug];
			openedSlugs.add(slug);
			localStorage.setItem('openedSlugs', JSON.stringify(Array.from(openedSlugs)));
		}
		localStorage.setItem('expandedSlugs', JSON.stringify(expandedSlugs));
	}
</script>

<div class="m-16">
	<h1 class="mb-6 text-3xl font-bold">Journal</h1>
	<ul class="space-y-4">
		{#each data.posts as post}
			<li class="rounded bg-white p-4 shadow transition hover:bg-gray-50">
				<button
					class="block w-full text-left"
					on:click={() => toggleExpand(post.slug)}
				>
					<div class="text-sm text-gray-500">{post.date}</div>
					<div class="text-xl font-semibold {openedSlugs.has(post.slug) ? 'text-purple-600 underline hover:text-purple-800' : 'text-blue-600 underline hover:text-blue-800'}">{post.title}</div>
				</button>
				{#if expandedSlugs.includes(post.slug)}
					<div
						class="mt-4 prose max-w-none bg-gray-50 rounded p-6 border border-gray-200 shadow-inner"
						transition:slide={{ duration: 350, easing: t => t*t }}
					>
						{@html post.content}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</div>
