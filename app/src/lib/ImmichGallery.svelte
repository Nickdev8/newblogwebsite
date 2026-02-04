<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';

	export let shareUrl: string = '';
	// Legacy props kept for older embeds.
	export let title: string | undefined = undefined;
	export let description: string | undefined = undefined;
	$: if (title || description) {
	}

	type GalleryAsset = {
		id: string;
		previewUrl: string;
		originalUrl: string;
		alt: string;
		isVideo: boolean;
	};

	let valid = false;
	$: valid = Boolean(shareUrl && shareUrl.startsWith('http'));

	let assets: GalleryAsset[] = [];
	let loading = false;
	let errorMessage = '';
	let abortController: AbortController | null = null;
	let fullscreenAsset: GalleryAsset | null = null;

	const parseError = async (response: Response) => {
		try {
			const data = await response.json();
			return data?.error || data?.message || `Immich responded with ${response.status}`;
		} catch {
			return `Immich responded with ${response.status}`;
		}
	};

	const fetchGallery = async (url: string) => {
		if (!browser || !url) {
			return;
		}

		abortController?.abort();
		const controller = new AbortController();
		abortController = controller;

		loading = true;
		errorMessage = '';
		assets = [];

		try {
			const response = await fetch(`/api/immich?shareUrl=${encodeURIComponent(url)}`, {
				signal: controller.signal
			});

			if (!response.ok) {
				throw new Error(await parseError(response));
			}

			const payload = (await response.json()) as { assets?: GalleryAsset[] };
			if (controller.signal.aborted) {
				return;
			}

			assets = Array.isArray(payload.assets) ? payload.assets : [];
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				return;
			}

			errorMessage = (error as Error).message || 'Unable to load shared gallery.';
		} finally {
			if (!controller.signal.aborted) {
				loading = false;
			}
		}
	};

	$: if (browser) {
		if (!valid) {
			assets = [];
			errorMessage = '';
			loading = false;
		} else {
			void fetchGallery(shareUrl);
		}
	}

	onDestroy(() => {
		abortController?.abort();
	});

	const openFullscreen = (asset: GalleryAsset) => {
		fullscreenAsset = asset;
	};

	const closeFullscreen = () => {
		fullscreenAsset = null;
	};
</script>

{#if valid}
	<section class="mt-12 rounded-[32px] border border-black/5 bg-white/95 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
		<p class="mb-4 text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
			Images from my Immich album
		</p>
		{#if loading}
			<p class="text-sm text-gray-600 dark:text-gray-300">Loading shared photos…</p>
		{:else if errorMessage}
			<p class="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
		{:else if assets.length === 0}
			<p class="text-sm text-gray-600 dark:text-gray-400">No shared media is available yet.</p>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each assets as asset (asset.id)}
					<button
						type="button"
						class="group relative overflow-hidden rounded-3xl border border-black/5 bg-white/80 shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-black/40 dark:border-white/10 dark:bg-white/10"
						on:click={() => openFullscreen(asset)}
						aria-label={`Open ${asset.alt || 'media'} fullscreen`}
					>
						{#if asset.isVideo}
							<video
								src={asset.previewUrl}
								poster={asset.previewUrl}
								muted
								autoplay
								loop
								playsinline
								class="pointer-events-none block h-full w-full object-cover"
							>
								<track kind="captions" />
							</video>
						{:else}
							<img
								src={asset.previewUrl}
								alt={asset.alt}
								loading="lazy"
								class="block h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
							/>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</section>

	{#if fullscreenAsset}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="immich-fullscreen-title"
		>
			<div class="relative max-h-full max-w-full">
				<h2 id="immich-fullscreen-title" class="sr-only">{fullscreenAsset.alt}</h2>
				{#if fullscreenAsset.isVideo}
					<video
						src={fullscreenAsset.originalUrl || fullscreenAsset.previewUrl}
						controls
						playsinline
						autoplay
						class="h-auto max-h-[85vh] w-auto max-w-[95vw] rounded-3xl"
					>
						<track kind="captions" />
					</video>
				{:else}
					<img
						src={fullscreenAsset.originalUrl || fullscreenAsset.previewUrl}
						alt={fullscreenAsset.alt}
						class="h-auto max-h-[85vh] w-auto max-w-[95vw] rounded-3xl"
						loading="eager"
					/>
				{/if}
				<button
					class="absolute right-2 top-2 size-10 rounded-full bg-black/60 text-2xl text-white shadow-lg transition hover:bg-black"
					on:click={closeFullscreen}
					aria-label="Close fullscreen media"
				>
					×
				</button>
			</div>
		</div>
	{/if}
{/if}
