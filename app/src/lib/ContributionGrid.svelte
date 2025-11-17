<script lang="ts">
	import { afterUpdate } from 'svelte';
	import type { ContributionCalendar } from '$lib/server/githubContributions';

	export let calendar: ContributionCalendar | null = null;
	export let title = 'Contribution graph';
	export let description = '';

	const weeks = calendar?.weeks ?? [];
	const total = calendar?.totalContributions ?? 0;

	let scroller: HTMLDivElement | null = null;

	const scrollToEnd = () => {
		if (scroller) {
			scroller.scrollLeft = scroller.scrollWidth;
		}
	};

	afterUpdate(scrollToEnd);
</script>

{#if calendar && weeks.length > 0}
	<section class="contrib-panel rounded-3xl border border-black/10 bg-white/90 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
		<header class="mb-4 flex flex-wrap items-center justify-between gap-3 text-gray-900 dark:text-white">
			<div>
				<p class="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">{title}</p>
				{#if description}
					<p class="text-sm text-gray-600 dark:text-gray-300">{description}</p>
				{/if}
			</div>
			<span class="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-200">
				{total} contributions
			</span>
		</header>
		<div class="flex gap-1 overflow-x-auto contrib-scroll" bind:this={scroller}>
			{#each weeks as week}
				<div class="grid grid-rows-7 gap-1">
					{#each week.contributionDays as day}
						<span
							title={`${day.date} · ${day.count} contributions`}
							class="day-square"
							style={`background:${day.color}`}
						></span>
					{/each}
				</div>
			{/each}
		</div>
 	</section>
{/if}

<style>
	.day-square {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		background: #e5e7eb;
	}
	.contrib-scroll {
		scrollbar-width: thin;
		scrollbar-color: rgba(15, 23, 42, 0.35) rgba(15, 23, 42, 0.08);
		padding-bottom: 0.5rem;
		margin-bottom: -0.5rem;
	}

	.contrib-scroll::-webkit-scrollbar {
		height: 8px;
	}

	.contrib-scroll::-webkit-scrollbar-track {
		background: rgba(15, 23, 42, 0.08);
		border-radius: 999px;
	}

	.contrib-scroll::-webkit-scrollbar-thumb {
		background: linear-gradient(90deg, #2563eb, #14b8a6);
		border-radius: 999px;
	}
</style>
