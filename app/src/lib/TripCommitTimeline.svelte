<script lang="ts">
	import type { GithubCommit } from '$lib/server/github';

	export let commits: GithubCommit[] = [];
	export let eventName = '';
	export let dateRange: { start?: string; end?: string } = {};

	const dayLabel = (value: string) => {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	};

	const commitLabel = (message: string) => message.split('\n')[0] || 'Untitled commit';
</script>

{#if commits.length > 0}
	<section class="rounded-[32px] border border-black/5 bg-white/95 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
		<header class="mb-4 flex flex-col gap-1 text-gray-900 dark:text-white">
			<p class="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">What I shipped</p>
			<h3 class="text-2xl font-semibold">Git commits logged during {eventName}</h3>
			<p class="text-sm text-gray-600 dark:text-gray-300">
				Between {dateRange.start ? dayLabel(dateRange.start) : '?'} and {dateRange.end ? dayLabel(dateRange.end) : '?'}
			</p>
		</header>
		<ol class="space-y-4">
			{#each commits as commit}
				<li class="rounded-2xl border border-black/5 bg-white/80 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<a href={commit.commitUrl} class="font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-white" target="_blank" rel="noopener">
							{commitLabel(commit.commit.message)}
						</a>
						<span class="text-xs uppercase tracking-[0.3em] text-gray-400">{dayLabel(commit.commit.author.date)}</span>
					</div>
			<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{commit.commit.author.name} · {commit.repoName}</p>
				</li>
			{/each}
		</ol>
	</section>
{/if}
