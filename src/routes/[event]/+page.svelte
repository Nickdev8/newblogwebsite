<script lang="ts">
	// @ts-nocheck
	import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { browser } from '$app/environment';
	import ReactionBar from '$lib/ReactionBar.svelte';

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
	type Persisted = {
		read: string[];
		expanded: string[];
		opened: string[];
		struck: string[];
		bannerDismissed: boolean;
	};

	function loadState(): Persisted {
		if (typeof localStorage === 'undefined') return fallback();
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return fallback();
			const parsed = JSON.parse(raw);
			return { ...fallback(), ...parsed };
		} catch {
			return fallback();
		}
		function fallback(): Persisted {
			return { read: [], expanded: [], opened: [], struck: [], bannerDismissed: false };
		}
	}

	let state: Persisted = loadState();

	// Derived runtime structures (what the UI actually uses)
	let readSlugs = new Set<string>(state.read);
	let expandedSlugs: string[] = state.expanded;
	let openedSlugs = new Set<string>(state.opened);
	let struckSlugs = new Set<string>(state.struck);
	let bannerDismissed = state.bannerDismissed;

	// Cheap debounce with rAF
	let saveRaf: number | null = null;
	function queueSave() {
		if (typeof localStorage === 'undefined') return;
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
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', queueSave);
	}

	/* ------------------------------------------------------------------ */
	/*  UI STATE                                                          */
	/* ------------------------------------------------------------------ */

	const allPostSlugs = data.posts.map((p) => p.slug);
	let initialLoad = true;
	let fullscreenMedia: { src: string; alt: string; isVideo: boolean } | null = null;

	let hoveredSlug: string | null = null;
	let strikeTimeout: ReturnType<typeof setTimeout> | null = null;

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
	$: typeof document !== 'undefined' &&
		(document.body.style.overflow = fullscreenMedia ? 'hidden' : '');

	/* ------------------------------------------------------------------ */
	/*  REACTIONS                                                          */
	/* ------------------------------------------------------------------ */

	const ANON_KEY = 'anon_id_v1';
	function getAnonId() {
		if (typeof localStorage === 'undefined') return 'no-localstorage';
		let id = localStorage.getItem(ANON_KEY);
		if (!id) {
			id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
			localStorage.setItem(ANON_KEY, id);
		}
		return id;
	}
	const anon_id = getAnonId();

	const REACT_KEY = (slug: string) => `reacted:${data.event}:${slug}`;

	type ReactionState = {
		counts: Record<string, number>;
		views: number;
		mine: boolean;
		loading: boolean;
	};

	let reactions: Record<string, ReactionState> = {};

	async function loadReaction(slug: string) {
		const res = await fetch(`/api/reactions/${data.event}/${slug}`);
		const { counts, views } = await res.json();
		reactions = {
			...reactions,
			[slug]: {
				counts,
				views,
				mine: typeof localStorage !== 'undefined' && localStorage.getItem(REACT_KEY(slug)) === '1',
				loading: false
			}
		};
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

		if (typeof localStorage !== 'undefined') {
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
			const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
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
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(bannerKey, 'true');
		}
		queueSave();
	}

	function isVideo(src: string) {
		return src.endsWith('.mp4');
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
		if (data.banner && typeof localStorage !== 'undefined') {
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
			fetch(`/api/reactions/${data.event}/${slug}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mode: 'seed', anon_id: id })
			});
		}
	});
</script>

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

<div
	class="mx-auto max-w-none px-3 py-4 sm:px-4 sm:py-6 md:max-w-[1100px] md:px-6 lg:max-w-[1280px] lg:px-8"
	on:keydown={(e) => e.key === 'Escape' && (fullscreenMedia = null)}
	role="document"
>
	<div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
		<h1 class="text-2xl font-bold capitalize sm:text-3xl" translate="no">{data.event}</h1>
		<div class="flex flex-wrap gap-2 sm:gap-3">
			<button
				on:click={openAll}
				class="cursor-pointer text-[11px] text-gray-500 transition hover:text-gray-700 hover:underline dark:text-gray-200 sm:text-xs"
			>
				Open All
			</button>
			<button
				on:click={collapseAll}
				class="cursor-pointer text-[11px] text-gray-500 transition hover:text-gray-700 hover:underline dark:text-gray-200 sm:text-xs"
			>
				Collapse All
			</button>
			<button
				on:click={markAllUnread}
				class="cursor-pointer text-[11px] text-gray-500 transition hover:text-gray-700 hover:underline dark:text-gray-200 sm:text-xs"
			>
				Mark All as Unread
			</button>
		</div>
	</div>

	<ul class="mb-6 space-y-2 sm:space-y-3">
		{#each data.posts as post}
			<li
				id={post.slug}
				data-slug={post.slug}
				class="relative rounded bg-white p-2.5 shadow transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 sm:p-3"
				on:mouseenter={() => {
					hoveredSlug = post.slug;
					tryStartStrikeTimer(post.slug);
				}}
				on:mouseleave={() => {
					if (hoveredSlug === post.slug) hoveredSlug = null;
					clearStrikeTimer();
				}}
			>
				<!-- {#if readSlugs.has(post.slug)}
					<button
						on:click|stopPropagation={() => unmarkRead(post.slug)}
						title="Mark as unread"
						aria-label="Mark as unread"
						class="absolute right-2 top-2 text-[10px] text-gray-400 hover:text-gray-700 sm:text-xs"
					>
						✕
					</button>
				{/if} -->

				<!-- HEADER ROW -->
				<div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
					<button
						class="flex-1 cursor-pointer text-left"
						on:click={() => {
							const willOpen = !expandedSlugs.includes(post.slug);
							toggleExpand(post.slug);
							if (willOpen) markAsRead(post.slug);
						}}
						aria-expanded={expandedSlugs.includes(post.slug)}
						aria-controls={`content-${post.slug}`}
					>
						<div class="text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">{post.date}</div>
						<div class="font-semibold sm:text-xl">
							<span
								class={readSlugs.has(post.slug)
									? 'text-blue-800 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200'
									: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'}
							>
								<span>{@html wrapNoTranslateWords(`<span>${post.title}</span>`)}</span>
							</span>
						</div>
					</button>

					<div class="mt-1 sm:ml-3 sm:mt-0">
						<!-- RIGHT SIDE REACTIONS -->
						<ReactionBar
							event={data.event}
							slug={post.slug}
							expanded={expandedSlugs.includes(post.slug)}
							on:toggle={(e) => toggleReaction(post.slug, e.detail.type)}
							on:loaded={() => loadReaction(post.slug)}
						/>
					</div>
				</div>

				{#if expandedSlugs.includes(post.slug)}
					<div
						id={`content-${post.slug}`}
						use:readOnView={post.slug}
						class="prose prose-sm sm:prose mt-3 flow-root max-w-none overflow-hidden rounded border border-gray-200 bg-gray-50 p-3 shadow-inner dark:border-gray-700 dark:bg-gray-900 sm:p-4"
						transition:slide={!initialLoad ? { duration: 350, easing: (t) => t * t } : undefined}
					>
						{#each post.holeImages as image}
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
						{/each}

						{@html wrapNoTranslateWords(post.content)}
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	{#if data.posts.length === 0}
		<p class="text-center text-gray-500">No posts found for this event.</p>
	{/if}

	{#if data.leftoverImages.length > 0}
		<div class="mt-8">
			<h3 class="mb-4 text-xl font-semibold">Bonus Pictures</h3>
			<div class="columns-1 gap-4 [column-fill:balance] sm:columns-2 lg:columns-4">
				{#each data.leftoverImages as image}
					<button
						type="button"
						class="mb-4 w-full cursor-pointer break-inside-avoid overflow-hidden rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
								class="pointer-events-none block h-auto w-full"
							>
								<track kind="captions" />
							</video>
						{:else}
							<img
								src={image.src}
								alt={image.alt}
								loading="lazy"
								class="block h-auto w-full"
								tabindex="-1"
							/>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#if fullscreenMedia}
	<section
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
		tabindex="0"
		role="dialog"
		aria-modal="true"
		aria-label="Fullscreen media viewer"
		on:click={() => (fullscreenMedia = null)}
		on:keydown={(e) => e.key === 'Escape' && (fullscreenMedia = null)}
	>
		<div class="relative max-h-full max-w-full" on:click|stopPropagation>
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
				class="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white"
				on:click={() => (fullscreenMedia = null)}
				aria-label="Close fullscreen"
			>
				&times;
			</button>
		</div>
	</section>
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
