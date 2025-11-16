<script lang="ts">
	import type { GithubCommit } from '$lib/server/github';

	export let commits: GithubCommit[] = [];
	export let title = 'Build log';
	export let description = 'Latest from the repo.';

	const fallbackIdeas = [
		{
			label: 'Roll one silly fix',
			detail: 'Pick any repo, rename a helper to something whimsical, and push it with a poetic commit message.'
		},
		{
			label: 'Ship from a new spot',
			detail: 'Grab a coffee somewhere different, run `git push`, and tag the commit with the café Wi-Fi name.'
		},
		{
			label: 'Open-source a moment',
			detail: 'Drop a tiny script or snippet you found handy into a public gist so future you can find it.'
		}
	];

	const formatDate = (value: string) => {
		const timestamp = new Date(value);
		if (Number.isNaN(timestamp.getTime())) return value;
		return timestamp.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const commitLabel = (message: string) => message.split('\n')[0] || 'Untitled commit';
</script>

{#if commits.length > 0}
	<section class="build-log rounded-3xl border border-transparent bg-[#0f172a] p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.45)] dark:bg-black/80">
		<header class="mb-4 flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="text-xs uppercase tracking-[0.35em] text-slate-400">{title}</p>
				<p class="text-sm text-slate-300">{description}</p>
			</div>
			<span class="rounded-full border border-white/30 px-4 py-1 text-xs font-semibold tracking-[0.3em] text-white/90">
				{commits.length} logs
			</span>
		</header>
		<ul class="space-y-2 font-mono text-sm">
			{#each commits as commit}
				<li class="rounded-2xl bg-white/5 px-4 py-3 shadow-inner transition hover:bg-white/10">
					<a
						href={commit.commitUrl}
						target="_blank"
						rel="noopener"
						class="flex flex-col gap-1 text-white"
					>
						<span class="truncate">{commitLabel(commit.commit.message)}</span>
						<span class="text-xs text-slate-300">
							{formatDate(commit.commit.author.date)} · {commit.repoName}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<section class="rounded-3xl border border-black/5 bg-white/95 p-6 text-gray-900 shadow-[0_20px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 dark:text-white">
		<header class="mb-4 space-y-2">
			<p class="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Build log</p>
			<h3 class="text-2xl font-semibold">No commits yet—pick a quest ✦</h3>
			<p class="text-sm text-gray-600 dark:text-gray-300">
				The feed is quiet, so here are a few fun shippable dares while you brew the next push.
			</p>
		</header>
		<ul class="space-y-3">
			{#each fallbackIdeas as idea}
				<li class="rounded-2xl border border-black/5 bg-white/80 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/10">
					<p class="font-semibold text-gray-900 dark:text-white">{idea.label}</p>
					<p class="text-gray-600 dark:text-gray-300">{idea.detail}</p>
				</li>
			{/each}
		</ul>
	</section>
{/if}
