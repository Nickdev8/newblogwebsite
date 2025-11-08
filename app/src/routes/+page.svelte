<script lang="ts">
	import { ArrowUpRight, Calendar } from 'lucide-svelte';

	export let data: {
		events: {
			slug: string;
			title: string;
			description: string;
			coverImage: string;
			live: boolean;
			lat?: number;
			lng?: number;
		}[];
	} = { events: [] };

	const posts = data.events ?? [];
	const featuredPost = posts[0];

	const heroTags = ['analog kid', 'slow web', 'studio log', 'field recordings'];
	const heroStats = [
		{ label: 'Entries logged', value: posts.length || '—' },
		{ label: 'Signals live', value: posts.filter((post) => post.live).length },
		{ label: 'Year in motion', value: new Date().getFullYear() }
	];
	const primaryActions = [
		{ label: 'Open studio', href: 'https://nickesselman.nl', external: true },
		{ label: 'Send a note', href: '/contact', external: false }
	];
</script>

<section class="hero-panel grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
	<div class="space-y-8">
		<div class="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
			<span>Personal log</span>
			<span class="h-1 w-1 rounded-full bg-emerald-400"></span>
			<span>Edition {new Date().getFullYear()}</span>
		</div>
		<div class="space-y-4">
			<h1 class="text-4xl font-semibold text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">Hi, I’m Nick. I keep a running archive of experiments, builds, and things I’m trying to pay attention to.</h1>
			<p class="text-lg text-gray-600 dark:text-gray-300">
				No algorithmic swirl, just a living log of prototypes, projects with friends, and the moments worth bottling. Expect thoughtful pacing, bold energy, and the occasional field note stitched in from the road.
			</p>
		</div>
		<div class="flex flex-wrap gap-3">
			{#each primaryActions as action}
				<a
					href={action.href}
					target={action.external ? '_blank' : undefined}
					rel={action.external ? 'noopener' : undefined}
					class="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/10 transition hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
				>
					{action.label}
					<ArrowUpRight class="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
				</a>
			{/each}
		</div>
		<div class="grid gap-4 sm:grid-cols-3">
			{#each heroStats as stat}
				<div class="rounded-2xl border border-black/5 bg-white/80 p-4 text-gray-900 shadow-[0_15px_35px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 dark:text-white">
					<p class="text-3xl font-semibold">{stat.value}</p>
					<p class="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">{stat.label}</p>
				</div>
			{/each}
		</div>
		<div class="flex flex-wrap gap-2 text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
			{#each heroTags as tag}
				<span class="rounded-full border border-black/10 px-3 py-1 dark:border-white/10">{tag}</span>
			{/each}
		</div>
	</div>
	<div class="relative overflow-hidden rounded-[32px] border border-black/5 bg-gradient-to-br from-amber-200/80 via-white to-sky-200/80 p-[1px] shadow-[0_40px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-900/30">
		<div class="h-full rounded-[30px] bg-white/80 p-8 backdrop-blur dark:bg-white/5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Signal boost</p>
					<h3 class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
						{#if featuredPost}
							{featuredPost.title}
						{:else}
							Fresh drops coming soon
						{/if}
					</h3>
					<p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
						{#if featuredPost}
							{featuredPost.description}
						{:else}
							Submissions take shape offline first. Once they’re ready, they land here with the full story.
						{/if}
					</p>
				</div>
				{#if featuredPost}
					<a href="/{featuredPost.slug}" class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white transition hover:-translate-y-1 dark:bg-white dark:text-gray-900" aria-label="Open featured post">
						<ArrowUpRight class="h-5 w-5" />
					</a>
				{/if}
			</div>
			<div class="mt-8 space-y-4">
				{#if featuredPost && featuredPost.coverImage}
					<div class="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
						{#if featuredPost.coverImage.endsWith('.mp4')}
							<video src={featuredPost.coverImage} class="h-52 w-full object-cover" muted playsinline loop></video>
						{:else}
							<img src={featuredPost.coverImage} alt={featuredPost.title} class="h-52 w-full object-cover" loading="lazy" />
						{/if}
					</div>
				{/if}
				<div class="rounded-2xl border border-black/5 bg-white/80 p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-gray-900 dark:text-white">Studio feed</span>
						<span class="text-xs uppercase tracking-[0.3em] text-emerald-500">Live</span>
					</div>
					<p class="mt-2">
						What’s cooking: a rotating stack of ambient sensors, a slow photo scanner, and a handful of stubborn side quests.
					</p>
				</div>
			</div>
		</div>
		<div class="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl dark:bg-cyan-500/20"></div>
	</div>
</section>

<section class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-2">
			<p class="eyebrow">Latest dispatches</p>
			<h2 class="text-3xl font-semibold text-gray-900 dark:text-white">Things worth remembering</h2>
			<p class="text-sm text-gray-600 dark:text-gray-300">A rotating shelf of essays, build logs, and travel notes—captured while they’re still vivid.</p>
		</div>
		<p class="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
			{posts.length} entr{posts.length === 1 ? 'y' : 'ies'}
		</p>
	</div>

	{#if posts.length > 0}
		<div class="grid gap-5 md:grid-cols-2">
			{#each posts as post, index}
				<a
					href="/{post.slug}"
					class="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-black/5 bg-white/75 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition hover:-translate-y-1 hover:border-black/20 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/30"
				>
					<div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
							<span>{post.live ? 'Live log' : 'Entry'}</span>
						</div>
						<span>#{index + 1}</span>
					</div>
					{#if post.coverImage}
						<div class="mt-4 overflow-hidden rounded-2xl border border-black/5 transition duration-500 group-hover:scale-[1.02] dark:border-white/10">
							{#if post.coverImage.endsWith('.mp4')}
								<video src={post.coverImage} class="h-44 w-full rounded-2xl object-cover" muted playsinline loop></video>
							{:else}
								<img src={post.coverImage} alt={post.title} class="h-44 w-full rounded-2xl object-cover" loading="lazy" />
							{/if}
						</div>
					{/if}
					<h3 class="mt-5 text-2xl font-semibold text-gray-900 dark:text-white">{post.title}</h3>
					<p class="mt-3 flex-1 text-sm text-gray-600 line-clamp-3 dark:text-gray-300">{post.description}</p>
					<span class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline-offset-4 transition group-hover:gap-3 dark:text-white">
						Dive in
						<ArrowUpRight class="h-4 w-4" />
					</span>
				</a>
			{/each}
		</div>
	{:else}
		<div class="rounded-[30px] border border-dashed border-gray-300 bg-white/70 p-16 text-center text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
			<p class="text-xl font-semibold">No entries yet.</p>
			<p class="mt-2 text-sm">Once the next experiment lands, this grid will light up with the story.</p>
		</div>
	{/if}
</section>

<section class="relative overflow-hidden rounded-[36px] border border-black/5 bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 p-10 text-white shadow-[0_35px_65px_rgba(15,23,42,0.4)] dark:border-white/10 dark:from-white dark:via-gray-200 dark:to-white dark:text-gray-900">
	<div class="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl dark:bg-indigo-500/20"></div>
	<div class="relative space-y-4">
		<p class="text-sm uppercase tracking-[0.4em] text-white/70 dark:text-gray-600">Elsewhere</p>
		<h2 class="text-3xl font-semibold leading-tight">More frequent signals live on nickesselman.nl—drop by for prototypes, residency notes, and ways to collaborate.</h2>
		<p class="text-sm text-white/80 dark:text-gray-600">
			This space stays intentionally slow. For in-progress builds, playlists from the road, or to drop a line, hop over to the studio home base.
		</p>
	</div>
	<div class="mt-8 flex flex-wrap gap-4">
		<a
			href="https://nickesselman.nl"
			target="_blank"
			rel="noopener"
			class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:-translate-y-1 dark:bg-gray-900 dark:text-white"
		>
			Visit nickesselman.nl
			<ArrowUpRight class="h-4 w-4" />
		</a>
		<a href="/contact" class="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-1 dark:border-gray-800 dark:text-gray-900">
			Send a note
			<ArrowUpRight class="h-4 w-4" />
		</a>
	</div>
</section>
