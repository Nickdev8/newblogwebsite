<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import TripCommitTimeline from '$lib/TripCommitTimeline.svelte';
	import ImmichGallery from '$lib/ImmichGallery.svelte';
	import ContributionGrid from '$lib/ContributionGrid.svelte';
	import { wrapNoTranslateWords } from '$lib/noTranslate';
	import type { GithubCommit } from '$lib/server/github';
	import type { ContributionCalendar } from '$lib/server/githubContributions';

	export let data: {
		posts: {
			date: string;
			title: string;
			slug: string;
			blocks: (
				| { type: 'text'; html: string }
				| { type: 'media'; media: { src: string; alt: string; layout: string[] } }
			)[];
		}[];
		event: string;
		leftoverImages: { src: string; alt: string }[];
		banner?: {
			message: string;
			type?: 'info' | 'warning' | 'danger' | 'success';
			dismissible?: boolean;
		} | null;
		title: string;
		description: string;
		coverImage: string;
		content: string;
		images: string[];
		showCommitFeed?: boolean;
		showContributions?: boolean;
		tripDateRange?: { start?: string; end?: string };
		immichAlbum?: string;
		timezone?: string;
		timezoneLabel?: string;
	};

	const readableTitle = data.title || data.event;
	const heroDescription =
		data.description ||
		'A slow, long-form journal of what I was building, noticing, and collecting along the way.';

	const banner = data.banner;

	const dateFormatter = new Intl.DateTimeFormat('en', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});

	const formatDate = (value?: string) => (value ? dateFormatter.format(new Date(value)) : '—');

	const normalizeId = (value: string, fallback: string) =>
		(value && value.replace(/[^a-zA-Z0-9_-]/g, '-')) || fallback;

	const MS_PER_DAY = 24 * 60 * 60 * 1000;

	const toUTCDate = (value?: string) => {
		if (!value) return null;
		const parts = value.split('-').map(Number);
		if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
		const [year, month, day] = parts;
		return Date.UTC(year, (month || 1) - 1, day || 1);
	};

	const tripStart = toUTCDate(data.posts[0]?.date);

	const getDayNumber = (value?: string, fallback?: number) => {
		if (!tripStart) return fallback;
		const current = toUTCDate(value);
		if (current === null) return fallback;
		const diff = Math.round((current - tripStart) / MS_PER_DAY);
		return Math.max(1, diff + 1);
	};

	const journalEntries = data.posts.map((post, index) => {
		const dayNumber = getDayNumber(post.date, index + 1) ?? index + 1;
		return {
			...post,
			dayNumber,
			order: String(dayNumber).padStart(2, '0'),
			dateLabel: formatDate(post.date),
			id: normalizeId(post.slug, `entry-${index + 1}`)
		};
	});

	const totalEntriesLabel = data.posts.length === 1 ? 'entry' : 'entries';
	const firstEntryId = journalEntries[0]?.id;
	const showCommitFeed = data.showCommitFeed ?? false;
	const showContributions = data.showContributions ?? false;
	const tripDateRange = data.tripDateRange ?? {};
	const immichAlbum = data.immichAlbum;
	const shouldLoadTripTimeline = Boolean(showCommitFeed && tripDateRange.start && tripDateRange.end);
	const shouldLoadTripContributions = Boolean(showContributions && tripDateRange.start && tripDateRange.end);
	const timezone = data.timezone || '';
	const timezoneLabel = data.timezoneLabel || data.timezone || '';

	let tripTimelineSection: HTMLElement | null = null;
	let tripContributionsSection: HTMLElement | null = null;

	let tripCommits: GithubCommit[] = [];
	let tripCommitsLoading = false;
	let tripCommitsError: string | null = null;
	let tripContributions: ContributionCalendar | null = null;
	let tripContributionsLoading = false;
	let tripContributionsError: string | null = null;

	let bannerDismissed = false;

	let showBanner = Boolean(banner);

	const heroHighlights = [
		{ label: 'Entries logged', value: data.posts.length || '—' },
		{ label: 'First day', value: formatDate(data.posts[0]?.date) },
		{ label: 'Latest update', value: formatDate(data.posts[data.posts.length - 1]?.date) }
	];
	let heroHighlightsWithTime = heroHighlights;
	let localTime = timezone ? '--:--' : '';

	const timeFormatter: Intl.DateTimeFormat | null = timezone
		? new Intl.DateTimeFormat('en-US', {
				timeZone: timezone,
				hour: 'numeric',
				minute: '2-digit'
		  })
		: null;

	const refreshLocalTime = () => {
		if (!timeFormatter) return;
		localTime = timeFormatter.format(new Date());
	};

	const bannerTypeClasses: Record<string, string> = {
		warning: 'border-yellow-200/80 bg-yellow-50 text-yellow-900 dark:border-yellow-300/50 dark:bg-yellow-900/20 dark:text-yellow-100',
		danger: 'border-red-200/80 bg-red-50 text-red-900 dark:border-red-400/50 dark:bg-red-900/25 dark:text-red-100',
		info: 'border-blue-200/80 bg-blue-50 text-blue-900 dark:border-blue-300/60 dark:bg-blue-900/30 dark:text-blue-50',
		success: 'border-green-200/80 bg-green-50 text-green-900 dark:border-green-300/60 dark:bg-green-900/25 dark:text-green-50'
	};

type FullscreenMedia = { src: string; alt: string; isVideo: boolean } | null;

let fullscreenMedia: FullscreenMedia = null;

	const hasLayout = (layout: string[], value: string) => layout.includes(value);
	const isVideo = (src: string) => !!src && src.endsWith('.mp4');

	function getLayoutClasses(layout: string[]) {
		const base = 'media-block block cursor-pointer rounded-2xl overflow-hidden shadow-md transition';
		const alignClass = hasLayout(layout, 'right')
			? 'md:ml-auto'
			: hasLayout(layout, 'left')
				? 'md:mr-auto'
				: 'mx-auto';

		const widthClass = hasLayout(layout, 'hole')
			? 'w-full max-w-4xl'
			: hasLayout(layout, 'vertical')
				? 'w-full sm:w-2/3 md:w-1/3'
				: hasLayout(layout, 'horizantal') || hasLayout(layout, 'horizontal')
					? 'w-full sm:w-3/4 md:w-2/3'
					: 'w-full max-w-2xl';

		const orientationClass = hasLayout(layout, 'vertical') ? 'max-h-[520px]' : '';

		return [base, alignClass, widthClass, orientationClass, 'my-4 sm:my-5'].join(' ');
	}

	function openFullscreen(src: string, alt: string) {
		fullscreenMedia = { src, alt, isVideo: isVideo(src) };
	}

	function closeFullscreen() {
		fullscreenMedia = null;
	}

	function jumpToEntry(id: string) {
		if (!browser) return;
		const element = document.getElementById(id);
		if (!element) return;
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		const highlight = ['ring-2', 'ring-emerald-400', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-slate-900', 'shadow-xl'];
		element.classList.add(...highlight);
		window.setTimeout(() => element.classList.remove(...highlight), 1400);
	}

	$: showBanner = Boolean(banner && !bannerDismissed);
	$: heroHighlightsWithTime = timezoneLabel
		? [...heroHighlights, { label: `${timezoneLabel} time`, value: localTime || '—' }]
		: heroHighlights;

	$: if (browser && typeof document !== 'undefined') {
		document.body.style.overflow = fullscreenMedia ? 'hidden' : '';
	}

	const loadTripCommits = async () => {
		if (!shouldLoadTripTimeline) return;
		tripCommitsLoading = true;
		tripCommitsError = null;
		try {
			const params = new URLSearchParams({
				from: tripDateRange.start || '',
				to: tripDateRange.end || '',
				limit: '15'
			});
			const res = await fetch(`/api/github/trip-commits?${params.toString()}`);
			if (!res.ok) {
				throw new Error('Failed to fetch trip commits');
			}
			const json = await res.json();
			tripCommits = json?.commits ?? [];
		} catch (error) {
			console.error('Error fetching trip commits', error);
			tripCommitsError = 'Unable to load trip commits right now.';
			tripCommits = [];
		} finally {
			tripCommitsLoading = false;
		}
	};

	const loadTripContributions = async () => {
		if (!shouldLoadTripContributions) return;
		tripContributionsLoading = true;
		tripContributionsError = null;
		const from = tripDateRange.start ? new Date(tripDateRange.start) : null;
		const to = tripDateRange.end ? new Date(tripDateRange.end) : null;
		if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
			tripContributionsLoading = false;
			return;
		}
		try {
			const params = new URLSearchParams({
				from: from.toISOString(),
				to: to.toISOString()
			});
			const res = await fetch(`/api/github/contributions?${params.toString()}`);
			if (!res.ok) {
				throw new Error('Failed to fetch trip contributions');
			}
			const json = await res.json();
			tripContributions = json?.contributions ?? null;
		} catch (error) {
			console.error('Error fetching trip contributions', error);
			tripContributionsError = 'Unable to load contributions right now.';
			tripContributions = null;
		} finally {
			tripContributionsLoading = false;
		}
	};

	const setupLazyTrigger = (getNode: () => HTMLElement | null, trigger: () => void) => {
		if (typeof window === 'undefined') {
			return () => {};
		}
		if (!('IntersectionObserver' in window)) {
			trigger();
			return () => {};
		}
		const observer = new IntersectionObserver(
			(entries, obs) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					obs.disconnect();
					trigger();
				}
			},
			{ rootMargin: '200px' }
		);
		const watchForNode = () => {
			const node = getNode();
			if (node) {
				observer.observe(node);
			} else {
				requestAnimationFrame(watchForNode);
			}
		};
		watchForNode();
		return () => observer.disconnect();
	};

	const triggerTripCommitsLoad = (force = false) => {
		if (!shouldLoadTripTimeline) return;
		if (tripCommitsLoading) return;
		if (!force && tripCommits.length > 0) return;
		loadTripCommits();
	};

	const triggerTripContributionsLoad = (force = false) => {
		if (!shouldLoadTripContributions) return;
		if (tripContributionsLoading) return;
		if (!force && tripContributions) return;
		loadTripContributions();
	};

	onMount(() => {
		const cleanups: (() => void)[] = [];
		if (timeFormatter) {
			refreshLocalTime();
			const id = window.setInterval(refreshLocalTime, 60_000);
			cleanups.push(() => clearInterval(id));
		}
		if (shouldLoadTripTimeline) {
			cleanups.push(setupLazyTrigger(() => tripTimelineSection, () => triggerTripCommitsLoad()));
		}
		if (shouldLoadTripContributions) {
			cleanups.push(setupLazyTrigger(() => tripContributionsSection, () => triggerTripContributionsLoad()));
		}
		return () => cleanups.forEach((cleanup) => cleanup());
	});
</script>

<svelte:window
	on:keydown={(event) => {
		if (event.key === 'Escape' && fullscreenMedia) {
			closeFullscreen();
		}
	}}
/>

{#if showBanner && banner}
	<div class="mx-auto w-full max-w-[1600px] px-3 sm:px-6 lg:px-10">
		<div
			class={`flex w-full flex-col items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 ${bannerTypeClasses[banner.type || 'warning']}`}
			role="alert"
		>
			<span class="flex-1">{@html banner.message}</span>
			{#if banner.dismissible !== false}
				<button
					type="button"
					class="rounded-full border border-current px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] transition hover:-translate-y-0.5 hover:bg-white/40 hover:text-current dark:hover:bg-white/10"
					on:click={() => (bannerDismissed = true)}
				>
					Close
				</button>
			{/if}
		</div>
	</div>
{/if}

<article class="journal-shell mx-auto w-full max-w-[1600px] px-3 pt-0 pb-6 sm:mt-0 sm:px-6 lg:px-10">
	<section class="mt-2 grid items-center gap-6 rounded-[28px] border border-black/10 bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 p-6 shadow-[0_22px_40px_rgba(15,23,42,0.12)] dark:border-white/15 dark:from-slate-900/75 dark:via-slate-800/80 dark:to-slate-900/75 dark:shadow-[0_22px_40px_rgba(0,0,0,0.3)] lg:grid-cols-[1.1fr_0.9fr] lg:p-7">
		<div class="space-y-3">
			<p class="text-xs uppercase tracking-[0.28em] text-slate-600 dark:text-slate-200">Field report · {data.event}</p>
			<h1 translate="no" class="text-[clamp(2rem,2.6vw,2.75rem)] font-bold leading-tight tracking-[-0.01em]">{readableTitle}</h1>
			<p class="max-w-3xl text-sm leading-relaxed text-slate-700 dark:text-slate-200 sm:text-base">{heroDescription}</p>

			<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
				<span class="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] dark:border-white/15">{data.posts.length} {totalEntriesLabel}</span>
				<span>Updated {formatDate(data.posts[data.posts.length - 1]?.date)}</span>
			</div>

			{#if timezoneLabel}
				<div class="mt-3">
					<div class="inline-flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-100/80 to-white/95 px-4 py-3 text-slate-800 shadow-[0_14px_28px_rgba(15,23,42,0.1)] dark:border-white/15 dark:from-slate-800/80 dark:to-slate-900/90 dark:text-slate-100 dark:shadow-[0_14px_28px_rgba(0,0,0,0.4)]">
						<div class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Local time · {timezoneLabel}</div>
						<div class="text-2xl font-semibold tracking-[-0.01em]">{localTime || '—'}</div>
					</div>
				</div>
			{/if}

			{#if firstEntryId}
				<button
					type="button"
					class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/25 dark:bg-white/10 dark:text-white"
					on:click={() => jumpToEntry(firstEntryId)}
				>
					Jump to entries
				</button>
			{/if}
		</div>

		{#if data.coverImage}
			<div class="relative ml-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
				{#if isVideo(data.coverImage)}
					<video src={data.coverImage} muted playsinline loop class="block h-full w-full object-cover" />
				{:else}
					<img src={data.coverImage} alt={readableTitle} class="block h-full w-full object-cover" loading="lazy" />
				{/if}
			</div>
		{/if}
	</section>

	<section class="mt-6 rounded-3xl border border-black/10 bg-white/90 px-4 py-5 dark:border-white/10 dark:bg-slate-900/60 sm:px-5 lg:px-6">
		<div class="flex flex-col gap-1">
			<p class="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">Mission dossier</p>
			<h2 class="text-xl font-semibold text-slate-900 dark:text-white">At a glance</h2>
		</div>
		<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
			{#each heroHighlightsWithTime as highlight}
				<div class="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
					<p class="text-[0.72rem] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{highlight.label}</p>
					<p class="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{highlight.value}</p>
				</div>
			{/each}
		</div>
	</section>

	{#if showCommitFeed && tripDateRange.start && tripDateRange.end}
		<div class="mt-10" bind:this={tripTimelineSection}>
			{#if tripCommitsLoading}
				<section class="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm animate-pulse dark:border-white/10 dark:bg-white/5">
					<div class="h-5 w-48 rounded bg-gray-200 dark:bg-white/10"></div>
					<div class="space-y-3">
						{#each Array(4) as _}
							<div class="rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
								<div class="h-3 w-32 rounded bg-gray-200 dark:bg-white/10"></div>
								<div class="mt-2 h-3 w-56 rounded bg-gray-200 dark:bg-white/10"></div>
								<div class="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-white/10"></div>
							</div>
						{/each}
					</div>
				</section>
			{:else if tripCommits.length > 0}
				<TripCommitTimeline commits={tripCommits} eventName={readableTitle} dateRange={tripDateRange} />
			{:else if tripCommitsError}
				<section class="rounded-3xl border border-dashed border-red-200 bg-red-50/60 p-6 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>{tripCommitsError}</span>
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-600 hover:text-white dark:border-red-400/60 dark:text-red-200 dark:hover:bg-red-400/30"
							on:click={() => triggerTripCommitsLoad(true)}
						>
							Retry
						</button>
					</div>
				</section>
			{:else}
				<section class="rounded-3xl border border-dashed border-black/5 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
					<div class="flex flex-col items-center gap-3">
						<p>Load the trip's commit log when you're ready.</p>
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-900 hover:text-white dark:border-white/40 dark:text-white dark:hover:bg-white/10"
							on:click={() => triggerTripCommitsLoad(true)}
						>
							Show trip commits
						</button>
					</div>
				</section>
			{/if}
		</div>
	{/if}

	{#if showContributions && tripDateRange.start && tripDateRange.end}
		<div class="mt-8" bind:this={tripContributionsSection}>
			{#if tripContributionsLoading}
				<section class="rounded-3xl border border-black/5 bg-white p-6 shadow-sm animate-pulse dark:border-white/10 dark:bg-white/5">
					<div class="h-4 w-48 rounded bg-gray-200 dark:bg-white/10"></div>
					<div class="mt-2 h-3 w-72 rounded bg-gray-200 dark:bg-white/10"></div>
					<div class="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
						{#each Array(8) as _}
							<div class="h-20 rounded-2xl bg-gray-100 dark:bg-white/10" aria-hidden="true"></div>
						{/each}
					</div>
				</section>
			{:else if tripContributions}
				<ContributionGrid calendar={tripContributions} title="Commit heatmap" description="GitHub pushes logged during this trip" />
			{:else if tripContributionsError}
				<section class="rounded-3xl border border-dashed border-red-200 bg-red-50/60 p-6 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>{tripContributionsError}</span>
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-600 hover:text-white dark:border-red-400/60 dark:text-red-200 dark:hover:bg-red-400/30"
							on:click={() => triggerTripContributionsLoad(true)}
						>
							Retry
						</button>
					</div>
				</section>
			{:else}
				<section class="rounded-3xl border border-dashed border-black/5 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
					<div class="flex flex-col items-center gap-3">
						<p>Load the GitHub heatmap for this trip.</p>
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-900 hover:text-white dark:border-white/40 dark:text-white dark:hover:bg-white/10"
							on:click={() => triggerTripContributionsLoad(true)}
						>
							Show contributions
						</button>
					</div>
				</section>
			{/if}
		</div>
	{/if}

	<section class="mt-10 space-y-5 lg:space-y-0 lg:grid lg:gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
		<nav class="jump-panel sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto self-start rounded-[28px] border border-black/5 bg-white/90 p-5 shadow-[0_18px_38px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5 lg:block">
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-[0.6rem] uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Navigator</p>
					<p class="text-base font-semibold text-gray-900 dark:text-white">{journalEntries.length} day recap</p>
				</div>
				<span class="text-xs text-gray-500 dark:text-gray-400">Tap to jump</span>
			</div>
			{#if journalEntries.length === 0}
				<p class="mt-6 text-sm text-gray-600 dark:text-gray-300">
					Entries will appear here once the trip is written up.
				</p>
			{:else}
				<div class="jump-timeline mt-5 space-y-3">
					{#each journalEntries as entry}
						<button
							type="button"
							class="jump-card group w-full rounded-2xl border border-black/5 px-3 py-3 text-left text-sm transition hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/10"
							on:click={() => jumpToEntry(entry.id)}
						>
							<div class="flex items-center justify-between gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
								<span>Day {entry.order}</span>
								<span>{entry.dateLabel}</span>
							</div>
							<p class="mt-1 text-base font-semibold text-gray-900 group-hover:text-gray-700 dark:text-white dark:group-hover:text-gray-200">
								{entry.title}
							</p>
						</button>
					{/each}
				</div>
			{/if}
		</nav>

		<div class="journal-feed space-y-8 lg:col-start-2">
			{#if journalEntries.length === 0}
				<div class="rounded-[32px] border border-dashed border-black/10 bg-white/80 p-10 text-center text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
					<p class="text-xl font-semibold">No entries just yet.</p>
					<p class="mt-2 text-sm">Check back soon for the full travel journal.</p>
				</div>
			{:else}
				{#each journalEntries as entry}
					<article id={entry.id} class="journal-entry scroll-mt-20 rounded-[32px] border border-black/5 bg-white/95 p-5 shadow-[0_28px_55px_rgba(15,23,42,0.12)] transition dark:border-white/10 dark:bg-white/5 sm:p-8">
						<header class="flex flex-col gap-4 border-b border-black/5 pb-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p class="text-[0.65rem] uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">Day {entry.order}</p>
								<h2 class="text-3xl font-semibold text-gray-900 dark:text-white">{entry.title}</h2>
							</div>
							<div class="text-sm text-gray-600 dark:text-gray-300">
								<span>{entry.dateLabel}</span>
							</div>
						</header>

						<div class="journal-body prose prose-base mt-6 max-w-none space-y-5 text-gray-800 dark:prose-invert dark:text-gray-100">
							{#each entry.blocks as block}
								{#if block.type === 'text'}
									<div class="prose prose-base max-w-none text-gray-800 dark:prose-invert dark:text-gray-100">
										{@html wrapNoTranslateWords(block.html)}
									</div>
								{:else}
									{#if block.media && block.media.src}
										<button
											type="button"
											class={getLayoutClasses(block.media.layout)}
											on:click={() => openFullscreen(block.media.src, block.media.alt)}
											aria-label={block.media.alt || 'Open media fullscreen'}
											style="padding:0;border:none;background:none;"
										>
											{#if isVideo(block.media.src)}
												<video
													src={block.media.src}
													autoplay={!hasLayout(block.media.layout, 'dontautostart')}
													loop={!hasLayout(block.media.layout, 'dontautostart')}
													muted={!hasLayout(block.media.layout, 'dontautostart')}
													playsinline={!hasLayout(block.media.layout, 'dontautostart')}
													controls={hasLayout(block.media.layout, 'dontautostart')}
													tabindex="-1"
													class="w-full rounded-xl"
												>
													<track kind="captions" />
												</video>
											{:else}
												<img src={block.media.src} alt={block.media.alt} tabindex="-1" class="block w-full rounded-xl object-cover" />
											{/if}
										</button>
									{/if}
								{/if}
							{/each}
						</div>
					</article>
				{/each}
			{/if}
		</div>
	</section>

	{#if data.leftoverImages.length > 0}
		<section class="mt-12 rounded-[32px] border border-black/5 bg-white/90 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p class="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Loose frames</p>
					<h3 class="text-2xl font-semibold text-gray-900 dark:text-white">Extra captures from the trip</h3>
					<p class="text-sm text-gray-600 dark:text-gray-300">Tap any tile to open it fullscreen.</p>
				</div>
				<span class="text-sm font-semibold text-gray-500 dark:text-gray-400">{data.leftoverImages.length} media</span>
			</div>
			<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.leftoverImages as image}
					<button
						type="button"
						class="group relative w-full overflow-hidden rounded-3xl border border-black/5 bg-white/80 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:border-white/10 dark:bg-white/5"
						on:click={() => openFullscreen(image.src, image.alt)}
						aria-label={image.alt || 'Open media fullscreen'}
						style="padding:0;border:none;background:none;"
					>
						{#if isVideo(image.src)}
							<video
								src={image.src}
								autoplay
								muted
								loop
								playsinline
								controls={false}
								controlsList="nodownload noplaybackrate noremoteplayback"
								disablePictureInPicture
								tabindex="-1"
								class="pointer-events-none block h-full w-full object-cover"
							>
								<track kind="captions" />
							</video>
						{:else}
							<img
								src={image.src}
								alt={image.alt}
								loading="lazy"
								class="block h-full w-full object-cover"
								tabindex="-1"
							/>
						{/if}
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<ImmichGallery shareUrl={immichAlbum} title={`Story reel from ${readableTitle}`} description="Live Immich album embed" />
</article>

{#if fullscreenMedia}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="fullscreen-media-title"
		tabindex="-1"
	>
		<div class="relative max-h-full max-w-full" role="document">
			<h2 id="fullscreen-media-title" class="sr-only">{fullscreenMedia.alt}</h2>
			{#if fullscreenMedia.isVideo}
				<video
					src={fullscreenMedia.src}
					controls
					autoplay
					playsinline
					class="h-auto max-h-[85vh] w-auto max-w-[95vw]"
				>
					<track kind="captions" />
				</video>
			{:else}
				<img
					src={fullscreenMedia.src}
					alt={fullscreenMedia.alt}
					class="h-auto max-h-[85vh] w-auto max-w-[95vw]"
				/>
			{/if}

			<button
				class="absolute right-2 top-2 size-10 rounded-full bg-black/50 p-2 text-white"
				on:click={closeFullscreen}
				aria-label="Close fullscreen"
			>
				×
			</button>
		</div>
	</div>
{/if}
