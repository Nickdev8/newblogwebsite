<script lang="ts">
	import { onMount } from 'svelte';
	import { Languages, ChevronDown } from 'lucide-svelte';
	import { trackReaderEvent } from '$lib/readerTracking';

	const COOKIE_KEY = 'googtrans';
	const LANG_KEY = 'lang_pref';

	let isDutch = false;
	let open = false;
	let root: HTMLDivElement | null = null;

	const getCookieValue = (key: string) => {
		if (typeof document === 'undefined') return '';
		const match = document.cookie
			.split(';')
			.map((entry) => entry.trim())
			.find((entry) => entry.startsWith(`${key}=`));
		return match ? decodeURIComponent(match.split('=')[1] || '') : '';
	};

	const getBaseDomain = (host: string) => {
		const parts = host.split('.');
		if (parts.length <= 2) return host;
		return parts.slice(-2).join('.');
	};

	const setCookie = (value: string, maxAgeSeconds: number) => {
		const encoded = encodeURIComponent(value);
		const host = window.location.hostname;
		const base = getBaseDomain(host);
		document.cookie = `${COOKIE_KEY}=${encoded}; path=/; max-age=${maxAgeSeconds}`;
		if (base !== host && host.includes('.')) {
			document.cookie = `${COOKIE_KEY}=${encoded}; path=/; max-age=${maxAgeSeconds}; domain=.${base}`;
		}
	};

	const clearCookie = () => {
		const host = window.location.hostname;
		const base = getBaseDomain(host);
		document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
		document.cookie = `${COOKIE_KEY}=; path=/; domain=${host}; max-age=0`;
		document.cookie = `${COOKIE_KEY}=; path=/; domain=.${host}; max-age=0`;
		if (base !== host && host.includes('.')) {
			document.cookie = `${COOKIE_KEY}=; path=/; domain=${base}; max-age=0`;
			document.cookie = `${COOKIE_KEY}=; path=/; domain=.${base}; max-age=0`;
		}
	};

	const applyLanguage = async (nextIsDutch: boolean) => {
		isDutch = nextIsDutch;
		localStorage.setItem(LANG_KEY, nextIsDutch ? 'nl' : 'en');
		if (nextIsDutch) {
			setCookie('/en/nl', 60 * 60 * 24 * 365);
		} else {
			setCookie('/en/en', 60 * 60 * 24 * 365);
		}
		await trackReaderEvent({ kind: 'language', language: nextIsDutch ? 'nl' : 'en' });
		open = false;
		window.location.reload();
	};

	onMount(() => {
		const stored = localStorage.getItem(LANG_KEY);
		const cookie = getCookieValue(COOKIE_KEY);
		if (stored === 'en') {
			setCookie('/en/en', 60 * 60 * 24 * 365);
			isDutch = false;
			return;
		}
		if (stored === 'nl' || cookie === '/en/nl') {
			isDutch = true;
			setCookie('/en/nl', 60 * 60 * 24 * 365);
			return;
		}
		isDutch = false;
	});

	const handleWindowClick = (event: MouseEvent) => {
		if (!open) return;
		if (!root) {
			open = false;
			return;
		}
		const target = event.target as Node | null;
		if (target && root.contains(target)) return;
		open = false;
	};
</script>

<svelte:window on:click={handleWindowClick} />

<div class="relative" bind:this={root}>
	<button
		type="button"
		translate="no"
		class={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
			isDutch
				? 'bg-amber-100 text-amber-900 shadow-sm dark:bg-amber-500/20 dark:text-amber-100'
				: 'text-gray-700 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white'
		}`}
		on:click={() => (open = !open)}
		aria-haspopup="true"
		aria-expanded={open}
		aria-label="Change language"
	>
		<Languages class="h-4 w-4" />
		<span class="hidden sm:inline">{isDutch ? 'Dutch' : 'Translate'}</span>
		<ChevronDown class={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
	</button>

	{#if open}
		<div class="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-black/10 bg-white p-2 text-sm text-gray-700 shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900 dark:text-gray-100">
			<button
				type="button"
				class={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
					!isDutch
						? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
						: 'hover:bg-slate-100/80 dark:hover:bg-white/10'
				}`}
				on:click={() => applyLanguage(false)}
			>
				<span>Original (English)</span>
			</button>
			<button
				type="button"
				class={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
					isDutch
						? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100'
						: 'hover:bg-slate-100/80 dark:hover:bg-white/10'
				}`}
				on:click={() => applyLanguage(true)}
			>
				<span>Dutch</span>
			</button>
		</div>
	{/if}
</div>
