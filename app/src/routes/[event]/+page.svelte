<script lang="ts">
	// @ts-nocheck
	import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { browser } from '$app/environment';
	import ReactionBar from '$lib/ReactionBar.svelte';
	import { ChevronDown, Minimize, MessageCircleWarning } from 'lucide-svelte';

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
	};

	/* ------------------------------------------------------------------ */
	/*  PERSISTENCE LAYER (single key, debounced save)                     */
	/* ------------------------------------------------------------------ */

	const STORAGE_KEY = `eventState:${data.event}`;
	const hasLocalStorage = browser && typeof localStorage !== 'undefined';
	type Persisted = {
		read: string[];
		expanded: string[];
		opened: string[];
		struck: string[];
		bannerDismissed: boolean;
	};

	const fallbackState = (): Persisted => ({
		read: [],
		expanded: [],
		opened: [],
		struck: [],
		bannerDismissed: false
	});

	function loadState(): Persisted {
		if (!hasLocalStorage) return fallbackState();
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return fallbackState();
			const parsed = JSON.parse(raw);
			return { ...fallbackState(), ...parsed };
		} catch {
			return fallbackState();
		}
	}

	let state: Persisted = hasLocalStorage ? loadState() : fallbackState();

	// Derived runtime structures (what the UI actually uses)
	let readSlugs = new Set<string>(state.read);
	let expandedSlugs: string[] = state.expanded;
	let openedSlugs = new Set<string>(state.opened);
	let struckSlugs = new Set<string>(state.struck);
	let bannerDismissed = state.bannerDismissed;

	// Cheap debounce with rAF
	let saveRaf: number | null = null;
	function queueSave() {
		if (!hasLocalStorage) return;
		if (saveRaf) cancelAnimationFrame(saveRaf);
		saveRaf = requestAnimationFrame(() => {
			state = {
				read: Array.from(readSlugs),
				expanded: expandedSlugs,
				opened: Array.from(openedSlugs),
				struck: Array.from(struckSlugs),
				bannerDismissed
			};
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			} catch {}
			saveRaf = null;
		});
	}

	// Save before leaving the page as a last resort
	if (browser) {
		window.addEventListener('beforeunload', queueSave);
	}

	/* ------------------------------------------------------------------ */
	/*  UI STATE                                                          */
	/* ------------------------------------------------------------------ */

	const allPostSlugs = data.posts.map((p) => p.slug);
	let initialLoad = true;
	let fullscreenMedia: { src: string; alt: string; isVideo: boolean } | null = null;
	let fullscreenPanel: HTMLDivElement | null = null;

	let hoveredSlug: string | null = null;
	let strikeTimeout: ReturnType<typeof setTimeout> | null = null;

	const readableTitle = data.title || data.event;
	const heroDescription =
		data.description ||
		'A slow, long-form journal of what I was building, noticing, and collecting along the way.';
	const firstEntry = data.posts[0];
	const lastEntry = data.posts[data.posts.length - 1];
	const dateFormatter = new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
	const formatDate = (value?: string) => (value ? dateFormatter.format(new Date(value)) : '—');
	const heroHighlights = [
		{ label: 'Entries logged', value: data.posts.length || '—' },
		{ label: 'First note', value: formatDate(firstEntry?.date) },
		{ label: 'Latest update', value: formatDate(lastEntry?.date) }
	];
	const entryBadge = (index: number) => `Entry ${String(index + 1).padStart(2, '0')}`;

	const bannerTypeClasses: Record<string, string> = {
		warning: 'bg-yellow-100 text-yellow-900 border-yellow-300',
		danger: 'bg-red-100 text-red-900 border-red-300',
		info: 'bg-blue-100 text-blue-900 border-blue-300',
		success: 'bg-green-100 text-green-900 border-green-300'
	};

	let bannerKey = '';
	$: if (data.banner) {
		bannerKey = `bannerDismissed_${data.event}_${encodeURIComponent(data.banner.message)}`;
	}

	// Lock background scroll when fullscreen modal is open
	$: if (browser && typeof document !== 'undefined') {
		document.body.style.overflow = fullscreenMedia ? 'hidden' : '';
	}

	function handleWindowClick(event: MouseEvent) {
		if (!fullscreenMedia) return;
		const target = event.target as Node | null;
		if (target && fullscreenPanel?.contains(target)) return;
		fullscreenMedia = null;
	}

	/* ------------------------------------------------------------------ */
	/*  REACTIONS                                                          */
	/* ------------------------------------------------------------------ */

	const ANON_KEY = 'anon_id_v1';
	function getAnonId() {
		if (!hasLocalStorage) return 'no-localstorage';
		let id = localStorage.getItem(ANON_KEY);
		if (!id) {
			id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
			localStorage.setItem(ANON_KEY, id);
		}
		return id;
	}
	const anon_id = hasLocalStorage ? getAnonId() : 'server-render';

	const REACT_KEY = (slug: string) => `reacted:${data.event}:${slug}`;

	type ReactionState = {
		counts: Record<string, number>;
		views: number;
		mine: boolean;
		loading: boolean;
	};

	let reactions: Record<string, ReactionState> = {};

	async function loadReaction(slug: string) {
		try {
			const res = await fetch(`/api/reactions/${data.event}/${slug}`);
			if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
			const { counts, views } = await res.json();
			reactions = {
				...reactions,
				[slug]: {
					counts,
					views,
					mine: hasLocalStorage && localStorage.getItem(REACT_KEY(slug)) === '1',
					loading: false
				}
			};
		} catch (error) {
			console.error(`Failed to load reactions for ${slug}:`, error);
			reactions = {
				...reactions,
				[slug]: { counts: {}, views: 0, mine: false, loading: false } // Fallback to default state
			};
		}
	}

	async function toggleReaction(slug: string, type: string) {
		const current = reactions[slug] || { counts: {}, views: 0, mine: false, loading: false };
		const add = !current.mine;

		reactions = { ...reactions, [slug]: { ...current, loading: true } };

		const res = await fetch(`/api/reactions/${data.event}/${slug}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'toggle', type, anon_id })
		});

		const { counts, views, error } = await res.json();
		if (error) {
			console.error(error);
			reactions = { ...reactions, [slug]: { ...current, loading: false } };
			return;
		}

		if (hasLocalStorage) {
			if (add) localStorage.setItem(REACT_KEY(slug), '1');
			else localStorage.removeItem(REACT_KEY(slug));
		}

		reactions = {
			...reactions,
			[slug]: { counts, views, mine: add, loading: false }
		};
	}

	/* ------------------------------------------------------------------ */
	/*  MISC HELPERS                                                       */
	/* ------------------------------------------------------------------ */
	function wrapNoTranslateWords(content: string): string {
		let words = ['Neighborhood', 'Undercity', 'Hack Club'];
		words = [...new Set(words)].sort((a, b) => b.length - a.length);

		const wrappedWords: string[] = [];

		for (const word of words) {
			if (!word) continue;
			const escaped = word.replace(/[-/\\^$*+?.()|[\\\]{}]/g, '\\$&');
			const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');

			if (regex.test(content)) {
				wrappedWords.push(word);
				content = content.replace(regex, '<span translate="no"> $1 </span>');
			}
		}

		if (wrappedWords.length > 0) {
			console.log('[wrapNoTranslateWords:title]', wrappedWords, 'in:', content);
		}

		return content;
	}

	function markAsRead(slug: string) {
		if (readSlugs.has(slug)) return;
		const next = new Set(readSlugs);
		next.add(slug);
		readSlugs = next;
		queueSave();
	}

	function toggleExpand(slug: string) {
		if (expandedSlugs.includes(slug)) {
			expandedSlugs = expandedSlugs.filter((s) => s !== slug);
		} else {
			expandedSlugs = [...expandedSlugs, slug];
			openedSlugs.add(slug);
			markAsRead(slug);
		}

		queueSave();
	}

	function openAll() {
		expandedSlugs = [...allPostSlugs];
		allPostSlugs.forEach((s) => {
			openedSlugs.add(s);
			readSlugs.add(s);
		});
		queueSave();
	}

	function collapseAll() {
		expandedSlugs = [];
		queueSave();
	}

	function dismissBanner() {
		bannerDismissed = true;
		if (hasLocalStorage) {
			localStorage.setItem(bannerKey, 'true');
		}
		queueSave();
	}

	function isVideo(src: string) {
		return src && src.endsWith('.mp4');
	}

	function hasLayout(image: { layout: string[] }, layout: string) {
		return image.layout.includes(layout);
	}

	function getLayoutClasses(image: { layout: string[] }) {
		const base = 'cursor-pointer my-2 sm:my-3 rounded-lg object-contain shadow-md';

		const side = hasLayout(image, 'right')
			? 'md:float-right md:ml-4 md:mb-2'
			: hasLayout(image, 'left')
				? 'md:float-left md:mr-4 md:mb-2'
				: 'mx-auto';

		const width = hasLayout(image, 'hole')
			? 'w-full max-w-2xl mx-auto'
			: hasLayout(image, 'vertical')
				? 'w-full sm:w-1/2 md:w-1/5'
				: hasLayout(image, 'horizantal') || hasLayout(image, 'horizontal')
					? 'w-full sm:w-3/4 md:w-2/5'
					: hasLayout(image, 'left') || hasLayout(image, 'right')
						? 'w-full sm:w-2/3 md:w-1/4'
						: 'w-full max-w-sm mx-auto';

		return [base, side, width].join(' ');
	}

	function openFullscreen(src: string, alt: string) {
		fullscreenMedia = { src, alt, isVideo: isVideo(src) };
	}

	function tryStartStrikeTimer(slug: string) {
		if (expandedSlugs.includes(slug) && hoveredSlug === slug && !struckSlugs.has(slug)) {
			if (strikeTimeout) clearTimeout(strikeTimeout);
			strikeTimeout = setTimeout(() => {
				struckSlugs.add(slug);
				queueSave();
			}, 1000);
		}
	}

	function clearStrikeTimer() {
		if (strikeTimeout) clearTimeout(strikeTimeout);
		strikeTimeout = null;
	}

	function unmarkRead(slug: string) {
		if (!readSlugs.has(slug)) return;
		const next = new Set(readSlugs);
		next.delete(slug);
		readSlugs = next;
		queueSave();
	}
	function markAllUnread() {
		readSlugs = new Set();
		queueSave();
	}

	const VIEW_THRESHOLD = 0.35; // ~35% visible
	const VIEW_MS = 2500; // 2.5 seconds

	function readOnView(node: HTMLElement, slug: string) {
		if (typeof IntersectionObserver === 'undefined') {
			markAsRead(slug);
			return { destroy() {} };
		}
		let timer: number | null = null;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && entry.intersectionRatio >= VIEW_THRESHOLD) {
					if (timer) clearTimeout(timer);
					timer = window.setTimeout(() => {
						markAsRead(slug);
						observer.disconnect();
					}, VIEW_MS);
				} else if (timer) {
					clearTimeout(timer);
					timer = null;
				}
			},
			{ threshold: [0, VIEW_THRESHOLD, 1] }
		);
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
				if (timer) clearTimeout(timer);
			}
		};
	}

	/* ------------------------------------------------------------------ */
	/*  MOUNT                                                              */
	/* ------------------------------------------------------------------ */

	onMount(async () => {
		// Ensure bannerDismissed mirrors previous local key if you still want that older behavior
		if (data.banner && hasLocalStorage) {
			const stored = localStorage.getItem(bannerKey);
			if (stored === 'true') {
				bannerDismissed = true;
			}
		}

		// Always start collapsed, but we keep the saved line-through/read state
		expandedSlugs = [];
		queueSave();

		await tick();
		initialLoad = false;
		await Promise.all(data.posts.map((p) => loadReaction(p.slug)));

		if (!browser) return;
		const seedKey = `seeded:${data.event}`;
		if (sessionStorage.getItem(seedKey)) return;
		sessionStorage.setItem(seedKey, '1');

		const id = anon_id;
		for (const slug of allPostSlugs) {
			try {
				await fetch(`/api/reactions/${data.event}/${slug}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ mode: 'seed', anon_id: id })
				});
			} catch (error) {
				console.error(`Failed to seed view for ${slug}:`, error);
			}
		}
	});
</script>

<svelte:window
	on:keydown={(event) => {
		if (event.key === 'Escape' && fullscreenMedia) {
			fullscreenMedia = null;
		}
	}}
	on:click={handleWindowClick}
/>

{#if data.banner && !bannerDismissed}
	<!-- Top warning banner -->
	<div
		class={`flex w-full items-start gap-2 border-b px-3 py-2 text-sm sm:items-center sm:px-4 sm:py-2.5 ${bannerTypeClasses[data.banner.type || 'warning']}`}
		role="alert"
	>
		<span class="flex-1">{@html data.banner.message}</span>
		{#if data.banner.dismissible !== false}
			<div class="flex gap-2">
				<button
					class="font-medium/none shrink-0 rounded px-2 py-0.5 text-xs opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
					on:click={() => (bannerDismissed = true)}
					aria-label="Okay"
				>
					Okay
				</button>
				<button
					class="font-medium/none shrink-0 rounded px-2 py-0.5 text-xs opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
					on:click={dismissBanner}
					aria-label="Don't show again"
				>
					Don't show again
				</button>
			</div>
		{/if}
	</div>
{/if}

<article class="reading-shell mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-10">
	<section class="hero-grid grid gap-8 rounded-[36px] border border-black/5 bg-white/95 p-6 shadow-[0_45px_95px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-10">
		<div class="space-y-5">
			<p class="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">Field report</p>
			<h1 class="text-4xl font-semibold text-gray-900 sm:text-5xl dark:text-white" translate="no">{readableTitle}</h1>
			<p class="text-base text-gray-600 dark:text-gray-300">{heroDescription}</p>
			<div class="flex flex-wrap gap-3">
				<span class="rounded-full border border-black/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 dark:border-white/10 dark:text-gray-200">
					{data.event}
				</span>
				<span class="rounded-full border border-black/10 px-4 py-1 text-xs font-semibold text-gray-700 dark:border-white/10 dark:text-gray-200">
					{data.posts.length} entr{data.posts.length === 1 ? 'y' : 'ies'}
				</span>
			</div>
			<div class="grid gap-4 sm:grid-cols-3">
				{#each heroHighlights as highlight}
					<div class="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-white/5">
						<p class="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">{highlight.label}</p>
						<p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{highlight.value}</p>
					</div>
				{/each}
			</div>
		</div>
		<div class="relative overflow-hidden rounded-[28px] border border-black/5 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-[0_35px_75px_rgba(15,23,42,0.2)] dark:border-white/10">
			{#if data.coverImage}
				<img src={data.coverImage} alt={readableTitle} class="h-full w-full object-cover" loading="lazy" />
			{:else}
				<div class="h-full min-h-[280px] w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent),linear-gradient(135deg,_#0f172a,_#1e1b4b)]"></div>
			{/if}
			<div class="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/60 to-transparent px-5 py-4 text-sm text-white">
				<div>
					<p class="text-[0.65rem] uppercase tracking-[0.4em] text-white/70">Now reading</p>
					<p class="text-lg font-semibold">{readableTitle}</p>
				</div>
				<span class="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]">Slow web</span>
			</div>
		</div>
	</section>

	<section class="mt-8 rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Reading controls</p>
				<p class="text-sm text-gray-600 dark:text-gray-300">
					Open everything at once or move entry by entry—your place is saved quietly in the background.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<button
					on:click={openAll}
					class="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-gray-900"
				>
					Open all
				</button>
				<button
					on:click={collapseAll}
					class="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 dark:border-white/20 dark:text-white"
				>
					Collapse all
				</button>
				<a
					href="/contact"
					class="inline-flex items-center gap-2 rounded-full border border-dashed border-black/20 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:-translate-y-0.5 dark:border-white/20 dark:text-gray-300"
				>
					Say hi
				</a>
			</div>
		</div>
	</section>

	<section class="mt-12">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Field log</p>
				<h2 class="text-3xl font-semibold text-gray-900 dark:text-white">Entries in this arc</h2>
				<p class="text-sm text-gray-600 dark:text-gray-300">
					Tap into each dispatch for the full write-up, supporting media, and live reaction counts.
				</p>
			</div>
			<p class="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
				{data.posts.length} entr{data.posts.length === 1 ? 'y' : 'ies'}
			</p>
		</div>

		{#if data.posts.length === 0}
			<p class="mt-6 rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-center text-gray-500 dark:border-white/15 dark:bg-white/5 dark:text-gray-300">
				No posts found for this event.
			</p>
		{:else}
			<ol class="mt-6 space-y-6">
				{#each data.posts as post, index}
					<li
						id={post.slug}
						data-slug={post.slug}
						class="relative rounded-[32px] border border-black/5 bg-white/90 p-5 shadow-[0_25px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-black/20 dark:border-white/10 dark:bg-white/5"
						on:mouseenter={() => {
							hoveredSlug = post.slug;
							tryStartStrikeTimer(post.slug);
						}}
						on:mouseleave={() => {
							if (hoveredSlug === post.slug) hoveredSlug = null;
							clearStrikeTimer();
						}}
					>
						<article class="space-y-5">
							<header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div class="space-y-2">
									<div class="flex flex-wrap items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
										<span>{entryBadge(index)}</span>
										<span class="h-1 w-1 rounded-full bg-gray-300 dark:bg-white/30"></span>
										<span>{formatDate(post.date)}</span>
										{#if readSlugs.has(post.slug)}
											<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
												Read
											</span>
										{:else}
											<span class="rounded-full bg-sky-100 px-2 py-0.5 text-[0.6rem] font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-100">
												New
											</span>
										{/if}
									</div>
									<h3 class="text-2xl font-semibold text-gray-900 dark:text-white">
										<span>{@html wrapNoTranslateWords(`<span>${post.title}</span>`)}</span>
									</h3>
								</div>
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
									<button
										type="button"
										class="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 dark:border-white/20 dark:text-white"
										on:click={() => {
											const willOpen = !expandedSlugs.includes(post.slug);
											toggleExpand(post.slug);
											if (willOpen) markAsRead(post.slug);
										}}
										aria-expanded={expandedSlugs.includes(post.slug)}
										aria-controls={`content-${post.slug}`}
									>
										{expandedSlugs.includes(post.slug) ? 'Hide entry' : 'Read entry'}
										<ChevronDown class={`h-4 w-4 transition-transform ${expandedSlugs.includes(post.slug) ? 'rotate-180' : ''}`} />
									</button>
									<ReactionBar
										event={data.event}
										slug={post.slug}
										expanded={expandedSlugs.includes(post.slug)}
										on:toggle={(e) => toggleReaction(post.slug, e.detail.type)}
										on:loaded={() => loadReaction(post.slug)}
									/>
								</div>
							</header>

							{#if expandedSlugs.includes(post.slug)}
								<div
									id={`content-${post.slug}`}
									use:readOnView={post.slug}
									class="prose prose-base mt-2 max-w-none flow-root rounded-[28px] border border-dashed border-black/10 bg-white/80 p-5 shadow-inner dark:border-white/15 dark:bg-white/5"
									transition:slide={!initialLoad ? { duration: 350, easing: (t) => t * t } : undefined}
								>
									{#each post.holeImages as image}
										{#if image && image.src}
											{#if isVideo(image.src)}
												<button
													type="button"
													class={getLayoutClasses(image)}
													on:click={() => openFullscreen(image.src, image.alt)}
													aria-label={image.alt || 'Open video fullscreen'}
													style="padding:0;border:none;background:none;"
												>
													<video
														src={image.src}
														autoplay={!hasLayout(image, 'dontautostart')}
														loop={!hasLayout(image, 'dontautostart')}
														muted={!hasLayout(image, 'dontautostart')}
														playsinline={!hasLayout(image, 'dontautostart')}
														controls={hasLayout(image, 'dontautostart')}
														tabindex="-1"
													>
														<track kind="captions" />
													</video>
												</button>
											{:else}
												<button
													type="button"
													class={getLayoutClasses(image)}
													on:click={() => openFullscreen(image.src, image.alt)}
													aria-label={image.alt || 'Open image fullscreen'}
													style="padding:0;border:none;background:none;"
												>
													<img src={image.src} alt={image.alt} tabindex="-1" />
												</button>
											{/if}
										{/if}
									{/each}

									{@html wrapNoTranslateWords(post.content)}
								</div>
							{/if}
						</article>
					</li>
				{/each}
			</ol>
		{/if}
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
</article>

{#if fullscreenMedia}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="fullscreen-media-title"
		tabindex="-1"
	>
		<div class="relative max-h-full max-w-full" role="document" bind:this={fullscreenPanel}>
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
				on:click={() => (fullscreenMedia = null)}
				aria-label="Close fullscreen"
			>
				<Minimize />
			</button>

			<a
				href={`/contact?image=${encodeURIComponent(fullscreenMedia.src)}`}
				aria-label="Report this image"
				class="absolute bottom-2 left-2 size-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/60"
			>
				<MessageCircleWarning />
			</a>
		</div>
	</div>
{/if}

<style>
	/* Compact the typography plugin spacing */
	:global(.prose > :where(p, ul, ol, pre, table, img, video):not(:last-child)) {
		margin-bottom: 0.5rem;
	}
	:global(.prose h1) {
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
	}
	:global(.prose h2) {
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	:global(.prose h3) {
		margin-top: 0.75rem;
		margin-bottom: 0.4rem;
	}
	:global(.prose h4) {
		margin-top: 0.5rem;
		margin-bottom: 0.3rem;
	}
	:global(.prose li) {
		margin-top: 0.15rem;
		margin-bottom: 0.15rem;
	}
	:global(.prose blockquote) {
		margin: 0.75rem 0;
		padding-left: 0.75rem;
	}
	:global(video:focus),
	:global(button:focus) {
		outline: none !important;
		box-shadow: none !important;
	}
</style>
