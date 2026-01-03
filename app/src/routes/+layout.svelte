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
	import '../app.css';

	export let data;

	const INTRO_KEY = 'intro_seen';
	let showIntro = false;
	let introLocked = false;
	let introName = '';
	let introSubmitting = false;
	let isAdminRoute = false;

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

	onMount(() => {
		getOrCreateReaderId();
		const seen = localStorage.getItem(INTRO_KEY);
		if (!seen) {
			openIntro();
		}

		trackVisit(window.location.pathname, document.referrer);

		const unsubscribe = introModalOpen.subscribe((value) => {
			if (!value) return;
			openIntro(true);
			introModalOpen.set(false);
		});

		const stopNavigate = afterNavigate(({ from, to }) => {
			if (!from || !to) return;
			trackVisit(to.url.pathname, from.url.pathname);
		});

		return () => {
			unsubscribe();
			stopNavigate();
			if (introLocked) {
				unlockBodyScroll();
			}
		};
	});
</script>

<svelte:head>
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
			steps={data?.steps ?? null}
			lastUpdated={data?.lastUpdated ?? null}
			nextRefresh={data?.nextRefresh ?? null}
			distanceKm={data?.distanceKm ?? null}
			activeMinutes={data?.activeMinutes ?? null}
			caloriesOut={data?.caloriesOut ?? null}
			restingHeartRate={data?.restingHeartRate ?? null}
			sleepDurationMinutes={data?.sleepDurationMinutes ?? null}
			sleepScore={data?.sleepScore ?? null}
			heartRateBpm={data?.heartRateBpm ?? null}
			stepsWeek={data?.stepsWeek ?? null}
			floors={data?.floors ?? null}
			errorMessage={data?.errorMessage ?? null}
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
