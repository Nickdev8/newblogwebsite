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

	const ANON_KEY = 'anon_id';
	const LOCAL_KEY = (e: string, s: string) => `reactions:${e}:${s}`;

	function anonId() {
		if (!browser) return '';
		let id = localStorage.getItem(ANON_KEY);
		if (!id) { id = crypto.randomUUID(); localStorage.setItem(ANON_KEY, id); }
		return id;
	}

	async function fetchTypes() {
		const r = await fetch('/api/reactions/types');
		types = await r.json();
	}

	async function fetchCounts() {
		const r = await fetch(`/api/reactions/${event}/${slug}`);
		const d = await r.json();
		counts = d.counts ?? {};
		views  = d.views  ?? 0;
	}

	async function toggle(key: string) {
		const res = await fetch(`/api/reactions/${event}/${slug}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'toggle', type: key, anon_id: anonId() })
		});
		const d = await res.json();
		counts = d.counts;
		views  = d.views;

		const next = new Set(mine);
		next.has(key) ? next.delete(key) : next.add(key);
		mine = next;
		localStorage.setItem(LOCAL_KEY(event, slug), JSON.stringify([...mine]));
	}

	async function sendOpenView() {
		await fetch(`/api/reactions/${event}/${slug}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'open', anon_id: anonId() })
		}).then(r => r.json()).then(d => {
			counts = d.counts; views = d.views;
		});
	}

	onMount(async () => {
		await fetchTypes();
		await fetchCounts();
		try {
			const saved = browser && JSON.parse(localStorage.getItem(LOCAL_KEY(event, slug)) || '[]');
			mine = new Set(saved.filter((k: any)=> typeof k === 'string'));
		} catch {}
		mounted = true;
		if (expanded) sendOpenView();
	});

	$: if (mounted && expanded) sendOpenView();
</script>

<div class="flex flex-wrap items-center gap-2 text-base select-none" role="group" aria-label="Reactions">
	{#if views > 0}
	<div class="flex items-center gap-1.5 text-base opacity-80" title="Views">
		<span aria-hidden="true" class="text-sm">👁️</span>
		<span class="text-sm font-medium text-gray-600 dark:text-gray-300">{views}</span>
	</div>
	{/if}
</div>
