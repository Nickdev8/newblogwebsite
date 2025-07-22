<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let event: string;
	export let slug: string;
	export let expanded: boolean;

	type ReactionType = { key: string; emoji: string; label?: string };

	let types: ReactionType[] = [];
	let counts: Record<string, number> = {};
	let views = 0;

	let mine = new Set<string>();
	let mounted = false;
	let viewSent = false;

	const ANON_KEY = 'anon_id';
	const LOCAL_KEY = (e: string, s: string) => `reactions:${e}:${s}`;

	function anonId() {
		if (!browser) return '';
		let id = localStorage.getItem(ANON_KEY);
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem(ANON_KEY, id);
		}
		return id;
	}

	async function fetchTypes() {
		const r = await fetch('/api/reactions/types');
		types = await r.json();
	}

	async function fetchCounts() {
		const r = await fetch(`/api/reactions/${event}/${slug}`);
		const d = await r.json();
		counts = d.counts;
		views = d.views;
	}

	async function toggle(key: string) {
		const res = await fetch(`/api/reactions/${event}/${slug}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'toggle', type: key, anon_id: anonId() })
		});
		const d = await res.json();
		counts = d.counts;
		views = d.views;

		const next = new Set(mine);
		next.has(key) ? next.delete(key) : next.add(key);
		mine = next;

		localStorage.setItem(LOCAL_KEY(event, slug), JSON.stringify([...mine]));
	}

	async function sendOpenView() {
		if (viewSent) return;
		viewSent = true;
		const res = await fetch(`/api/reactions/${event}/${slug}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'open', anon_id: anonId() })
		});
		const d = await res.json();
		counts = d.counts;
		views = d.views;
	}

	onMount(async () => {
		await fetchTypes();
		await fetchCounts();

		try {
			const saved = browser && JSON.parse(localStorage.getItem(LOCAL_KEY(event, slug)) || '[]');
			mine = new Set(saved.filter((k: any) => typeof k === 'string'));
		} catch {}

		mounted = true;
		if (expanded) sendOpenView();
	});

	$: if (mounted && expanded && !viewSent) sendOpenView();
</script>

<div
	class="shrink-0 flex flex-wrap items-center gap-1 text-lg sm:text-xl select-none"
	role="group"
	aria-label="Reactions"
>
	{#each types as r}
		<button
			type="button"
			class="flex items-center gap-0.5 sm:gap-1 transition-opacity hover:opacity-80 focus:outline-none"
			aria-pressed={mine.has(r.key)}
			on:click|stopPropagation={() => toggle(r.key)}
			title={mine.has(r.key) ? 'Remove reaction' : (r.label || 'React')}
		>
			<span class={mine.has(r.key) ? 'opacity-100' : 'opacity-50 filter grayscale'}>
				{r.emoji}
			</span>
			<span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300">
				{counts[r.key] ?? 0}
			</span>
		</button>
	{/each}

	<div class="flex items-center gap-1 text-base opacity-70" title="Views">
		<span aria-hidden="true">👁</span>
		<span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300">{views}</span>
	</div>
</div>
