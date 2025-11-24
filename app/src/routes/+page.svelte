<script lang="ts">
	import { onMount } from 'svelte';
	import GitCommitPanel from '$lib/GitCommitPanel.svelte';
	import ContributionGrid from '$lib/ContributionGrid.svelte';
	import type { GithubCommit } from '$lib/server/github';
	import type { ContributionCalendar } from '$lib/server/githubContributions';

	export let data: {
		events: {
			slug: string;
			title: string;
			description: string;
			coverImage: string;
			live: boolean;
		}[];
	} = { events: [] };

	const posts = data.events ?? [];
	const heroYear = new Date().getFullYear();
	const showCommitPanel = false;
	let commits: GithubCommit[] = [];
	let contributions: ContributionCalendar | null = null;
	let commitsLoading = true;
	let contributionsLoading = false;
	let commitsError: string | null = null;
	let contributionsError: string | null = null;
	const livePost = posts.find((post) => post.live);

	const loadCommits = async () => {
		commitsLoading = true;
		commitsError = null;
		try {
			const res = await fetch('/api/github/commits?limit=5');
			if (!res.ok) {
				throw new Error('Failed to fetch commits');
			}
			const json = await res.json();
			commits = json?.commits ?? [];
		} catch (error) {
			console.error('Error fetching commits', error);
			commitsError = 'Unable to load recent commits right now.';
			commits = [];
		} finally {
			commitsLoading = false;
		}
	};

	const loadContributions = async () => {
		if (contributionsLoading) return;
		contributionsLoading = true;
		contributionsError = null;
		try {
			const res = await fetch('/api/github/contributions');
			if (!res.ok) {
				throw new Error('Failed to fetch contributions');
			}
			const json = await res.json();
			contributions = json?.contributions ?? null;
		} catch (error) {
			console.error('Error fetching contributions', error);
			contributionsError = 'Unable to load contributions right now.';
			contributions = null;
		} finally {
			contributionsLoading = false;
		}
	};

	const triggerContributionsLoad = () => {
		if (contributionsLoading || contributions) {
			return;
		}
		loadContributions();
	};

	onMount(() => {
		let prefetchHandle: number | null = null;
		if (showCommitPanel) {
			loadCommits();
		} else {
			commitsLoading = false;
		}
		if (typeof window !== 'undefined') {
			prefetchHandle = window.setTimeout(() => {
				triggerContributionsLoad();
			}, 2500);
		}
		return () => {
			if (prefetchHandle !== null && typeof window !== 'undefined') {
				window.clearTimeout(prefetchHandle);
			}
		};
	});
</script>

<main class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:max-w-7xl">
	<section class="space-y-2 text-gray-900 dark:text-white">
		<p class="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">
			Trip journals · {heroYear}
		</p>
		<h1 class="text-4xl font-semibold leading-tight">Stories from the road</h1>
		<p class="max-w-2xl text-sm text-gray-600 dark:text-gray-300">
			Everything I'm doing lands here—quick scraps, day-by-day play-by-plays, and the longer stories from what I'm building and wandering through.
		</p>
		{#if livePost}
			<a
				href={`/${livePost.slug}`}
				class="mt-4 inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-green-500/20 dark:border-green-400/40 dark:text-green-200"
			>
				<span class="inline-flex size-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(74,222,128,0.8)]"></span>
				Live now: {livePost.title}
			</a>
		{/if}
	</section>


	{#if posts.length === 0}
		<section class="rounded-3xl border border-dashed border-black/10 bg-white/70 p-10 text-center text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
			<p class="text-lg font-semibold">No trips are public yet.</p>
			<p class="mt-2 text-sm">New entries will show up here as soon as I publish them.</p>
		</section>
	{:else}
		<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each posts as post}
				<li class="group overflow-hidden rounded-3xl border border-black/5 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5">
					<a href={`/${post.slug}`} class="flex h-full flex-col">
						{#if post.coverImage}
							<div class="relative h-48 overflow-hidden border-b border-black/5 bg-black/5 dark:border-white/10 dark:bg-white/10">
								{#if post.coverImage.endsWith('.mp4')}
									<video src={post.coverImage} muted playsinline loop class="h-full w-full object-cover"></video>
								{:else}
									<img src={post.coverImage} alt={post.title} class="h-full w-full object-cover" loading="lazy" />
								{/if}
					<span
						class={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] ${post.live ? 'bg-green-500/90 text-white shadow-[0_8px_20px_rgba(34,197,94,0.45)]' : 'bg-black/70 text-white'}`}
					>
						{post.live ? '● Live' : 'Archived'}
					</span>
							</div>
						{/if}
						<div class="flex flex-1 flex-col gap-3 px-5 py-6 text-gray-900 dark:text-white">
							<div>
								<p class="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">{post.slug}</p>
								<h2 class="mt-2 text-2xl font-semibold">{post.title}</h2>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-300">{post.description}</p>
							<span class="mt-auto inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 transition group-hover:gap-3 dark:text-blue-200">
								Continue reading ➜
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
	
	<div class="mt-8">
		{#if contributionsLoading}
			<section class="rounded-3xl border border-black/5 bg-white p-6 shadow-sm animate-pulse dark:border-white/10 dark:bg-white/5">
				<div class="h-4 w-40 rounded bg-gray-200 dark:bg-white/10"></div>
				<div class="mt-2 h-3 w-72 rounded bg-gray-200 dark:bg-white/10"></div>
				<div class="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					{#each Array(8) as _}
						<div class="h-24 rounded-2xl bg-gray-100 dark:bg-white/10" aria-hidden="true"></div>
					{/each}
				</div>
			</section>
		{:else if contributions}
			<ContributionGrid calendar={contributions} title="Recent commits" description="Past two years of activity" />
		{:else if contributionsError}
			<section class="rounded-3xl border border-dashed border-red-200 bg-red-50/60 p-6 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<span>{contributionsError}</span>
					<button
						type="button"
						class="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-600 hover:text-white dark:border-red-400/60 dark:text-red-200 dark:hover:bg-red-400/30"
						on:click={triggerContributionsLoad}
					>
						Retry
					</button>
				</div>
			</section>
		{:else}
			<section class="rounded-3xl border border-dashed border-black/5 bg-white/70 p-6 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
				<div class="flex flex-col items-center gap-3">
					<p>Load GitHub activity to see the latest heatmap.</p>
					<button
						type="button"
						class="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-900 hover:text-white dark:border-white/40 dark:text-white dark:hover:bg-white/10"
						on:click={triggerContributionsLoad}
					>
						Show contributions
					</button>
				</div>
			</section>
		{/if}
	</div>

	{#if showCommitPanel}
		{#if commitsLoading}
			<section class="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm animate-pulse dark:border-white/10 dark:bg-white/5">
				<div class="h-5 w-48 rounded bg-gray-200 dark:bg-white/10"></div>
				<div class="space-y-3">
					{#each Array(3) as _}
						<div class="rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
							<div class="h-3 w-32 rounded bg-gray-200 dark:bg-white/10"></div>
							<div class="mt-2 h-3 w-56 rounded bg-gray-200 dark:bg-white/10"></div>
							<div class="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-white/10"></div>
						</div>
					{/each}
				</div>
			</section>
		{:else if commits.length > 0}
			<GitCommitPanel {commits} title="Build log" description="Latest pushes across my repos" />
		{:else if commitsError}
			<section class="rounded-3xl border border-dashed border-red-200 bg-red-50/60 p-6 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
				{commitsError}
			</section>
		{/if}
	{/if}
</main>

<style>
	:global(body) {
		background: #f7f5f2;
	}

	:global(.dark body) {
		background: #05060a;
	}
</style>
