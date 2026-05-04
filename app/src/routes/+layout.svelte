<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Header from '$lib/Header.svelte';
	import Footer from '$lib/Footer.svelte';
	import LiveStatsCard from '$lib/LiveStatsCard.svelte';
	import { introModalOpen } from '$lib/stores/introModal';
	import { lockBodyScroll, unlockBodyScroll } from '$lib/bodyScrollLock';
	import { getOrCreateReaderId, trackReaderEvent } from '$lib/readerTracking';
	import { EMPTY_LIVE_STATS, type LiveStatsPayload } from '$lib/liveStats';
	import { SITE_AUTHOR, SITE_NAME, buildSeo, defaultSeo, serializeJsonLd, type SeoData } from '$lib/seo';
	import '../app.css';

	export let data;

	const INTRO_KEY = 'intro_seen';
	let showIntro = false;
	let introLocked = false;
	let introName = '';
	let introSubmitting = false;
	let isAdminRoute = false;
	let seo: SeoData = defaultSeo;
	let liveStats: LiveStatsPayload = { ...EMPTY_LIVE_STATS };

	const hasLiveStatsData = (stats: LiveStatsPayload) =>
		[
			stats.steps,
			stats.distanceKm,
			stats.activeMinutes,
			stats.caloriesOut,
			stats.restingHeartRate,
			stats.sleepDurationMinutes,
			stats.sleepScore,
			stats.heartRateBpm,
			stats.stepsWeek,
			stats.floors,
			stats.lastUpdated,
			stats.nextRefresh
		].some((value) => value !== null && value !== undefined);

	const syncLiveStatsFromData = (source: Partial<LiveStatsPayload> | null | undefined) => {
		liveStats = {
			...EMPTY_LIVE_STATS,
			...source
		};
	};

	const refreshLiveStats = async () => {
		try {
			const response = await fetch('/api/live-stats', {
				headers: {
					accept: 'application/json'
				}
			});

			if (!response.ok) {
				return;
			}

			const nextStats = (await response.json()) as LiveStatsPayload;
			if (hasLiveStatsData(nextStats) || nextStats.errorMessage) {
				liveStats = {
					...EMPTY_LIVE_STATS,
					...nextStats
				};
			}
		} catch {
			// Keep the server-rendered fallback if the client refresh fails.
		}
	};

	const getErrorSeo = (status: number, pathname: string) =>
		buildSeo({
			title: status === 404 ? 'Page Not Found' : 'Page Unavailable',
			description:
				status === 404
					? 'The page you were looking for could not be found.'
					: 'Something went wrong while loading this page.',
			pathname,
			robots: 'noindex,nofollow'
		});

	const openIntro = (force = false) => {
		showIntro = true;
		if (browser && force) {
			localStorage.removeItem(INTRO_KEY);
		}
	};

	const closeIntro = () => {
		showIntro = false;
		introName = '';
		if (browser) {
			localStorage.setItem(INTRO_KEY, '1');
		}
	};

	const submitName = async () => {
		const trimmed = introName.trim();
		if (!trimmed) return;
		introSubmitting = true;
		await trackReaderEvent({ kind: 'name', name: trimmed });
		introSubmitting = false;
		closeIntro();
	};

	const getDeviceClass = () => (window.innerWidth < 768 ? 'mobile' : 'desktop');

	const trackVisit = (path: string, referrer: string) => {
		trackReaderEvent({
			kind: 'visit',
			path,
			referrer: referrer || 'direct',
			device: getDeviceClass()
		});
	};

	$: if (showIntro && !introLocked) {
		lockBodyScroll();
		introLocked = true;
	} else if (!showIntro && introLocked) {
		unlockBodyScroll();
		introLocked = false;
	}

	$: isAdminRoute = $page.url.pathname.startsWith('/admin');
	$: seo =
		$page.status >= 400
			? getErrorSeo($page.status, $page.url.pathname)
			: (($page.data as { seo?: SeoData })?.seo ?? defaultSeo);
	$: syncLiveStatsFromData(data);

	onMount(() => {
		getOrCreateReaderId();
		const seen = localStorage.getItem(INTRO_KEY);
		if (!seen) {
			openIntro();
		}

		trackVisit(window.location.pathname, document.referrer);
		void refreshLiveStats();

		const unsubscribe = introModalOpen.subscribe((value) => {
			if (!value) return;
			openIntro(true);
			introModalOpen.set(false);
		});

		afterNavigate(({ from, to }) => {
			if (!from || !to) return;
			trackVisit(to.url.pathname, from.url.pathname);
		});

		return () => {
			unsubscribe();
			if (introLocked) {
				unlockBodyScroll();
			}
		};
	});
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta name="author" content={SITE_AUTHOR} />
	<meta name="robots" content={seo.robots} />
	<link rel="canonical" href={seo.canonical} />
	<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />

	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:type" content={seo.ogType} />
	<meta property="og:url" content={seo.canonical} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:image" content={seo.image} />
	<meta property="og:image:alt" content={seo.imageAlt} />
	<meta property="og:locale" content="en_US" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={seo.image} />

	{#if seo.publishedTime}
		<meta property="article:published_time" content={seo.publishedTime} />
	{/if}
	{#if seo.modifiedTime}
		<meta property="article:modified_time" content={seo.modifiedTime} />
	{/if}
	{#each seo.structuredData as item}
		<script type="application/ld+json">
			{@html serializeJsonLd(item)}
		</script>
	{/each}

	{#if !isAdminRoute}
		<script>
			function googleTranslateElementInit() {
				if (!window.google || !window.google.translate) return;
				new window.google.translate.TranslateElement(
					{ pageLanguage: 'en', includedLanguages: 'nl', autoDisplay: false },
					'google_translate_element'
				);
			}
		</script>
		<script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
	{:else}
		<meta name="google" content="notranslate" />
	{/if}
</svelte:head>

{#if !isAdminRoute}
	<div id="google_translate_element" class="sr-only" aria-hidden="true"></div>
{/if}

<div class="page-shell min-h-screen">
	{#if !isAdminRoute}
		<Header />
	{/if}
	<main class={isAdminRoute ? '' : 'px-0 pb-16 pt-8 sm:px-8 lg:px-10'}>
		<div class={isAdminRoute ? '' : 'w-full max-w-none space-y-0 sm:space-y-16 sm:mx-auto sm:max-w-7xl'}>
			<slot />
		</div>
	</main>
	{#if !isAdminRoute}
		<Footer />
	{/if}
	{#if !isAdminRoute}
		<LiveStatsCard
			steps={liveStats.steps}
			lastUpdated={liveStats.lastUpdated}
			nextRefresh={liveStats.nextRefresh}
			distanceKm={liveStats.distanceKm}
			activeMinutes={liveStats.activeMinutes}
			caloriesOut={liveStats.caloriesOut}
			restingHeartRate={liveStats.restingHeartRate}
			sleepDurationMinutes={liveStats.sleepDurationMinutes}
			sleepScore={liveStats.sleepScore}
			heartRateBpm={liveStats.heartRateBpm}
			stepsWeek={liveStats.stepsWeek}
			floors={liveStats.floors}
			errorMessage={liveStats.errorMessage}
		/>
	{/if}
</div>

{#if showIntro}
	<div
		class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="intro-title"
	>
		<div class="w-full max-w-2xl rounded-[30px] border border-white/10 bg-slate-900/95 p-6 text-slate-100 shadow-[0_28px_70px_rgba(0,0,0,0.55)] sm:p-8">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Quick hello</p>
			<h2 id="intro-title" class="mt-2 text-3xl font-semibold text-white">Before you read</h2>
			<p class="mt-3 text-sm text-slate-200">
				Optional: share a first name if you want it to show up in my private reader analytics.
				Skipping won’t change your experience.
			</p>

			<div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
				<input
					type="text"
					placeholder="Your name"
					maxlength="80"
					class="w-full flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-white/30 focus:outline-none"
					bind:value={introName}
					on:keydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							submitName();
						}
					}}
				/>
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						class="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
						on:click={submitName}
						disabled={!introName.trim() || introSubmitting}
					>
						Send
					</button>
					<button
						type="button"
						class="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
						on:click={closeIntro}
					>
						Skip
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
