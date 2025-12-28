<script lang="ts">
	import {
		Activity,
		Bed,
		ChevronDown,
		ChevronUp,
		Flame,
		Footprints,
		HeartPulse,
		Sparkles,
		Timer
	} from 'lucide-svelte';

	export let steps: number | null | undefined;
	export let lastUpdated: number | null | undefined;
	export let nextRefresh: number | null | undefined;
	export let distanceKm: number | null | undefined;
	export let activeMinutes: number | null | undefined;
	export let caloriesOut: number | null | undefined;
	export let restingHeartRate: number | null | undefined;
	export let sleepDurationMinutes: number | null | undefined;
	export let sleepScore: number | null | undefined;
	export let heartRateBpm: number | null | undefined;
	export let stepsWeek: number | null | undefined;
	export let floors: number | null | undefined;
	let expanded = false;

	const numberFormatter = new Intl.NumberFormat('en-US');

	const nowSeconds = () => Math.floor(Date.now() / 1000);
	const pluralize = (value: number, unit: string) => `${value} ${unit}${value === 1 ? '' : 's'}`;

	const formatAgo = (timestamp: number | null | undefined) => {
		if (timestamp === null || timestamp === undefined) return '--';
		const diffMinutes = Math.max(0, Math.round((nowSeconds() - timestamp) / 60));
		return pluralize(diffMinutes, 'minute') + ' ago';
	};

	const formatUntil = (timestamp: number | null | undefined) => {
		if (timestamp === null || timestamp === undefined) return '--';
		const diffMinutes = Math.round((timestamp - nowSeconds()) / 60);
		if (diffMinutes <= 0) return 'any moment';
		return 'in ' + pluralize(diffMinutes, 'minute');
	};

	const formatDuration = (minutes: number | null | undefined) => {
		if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "Didn't wear watch";
		const hrs = Math.floor(minutes / 60);
		const mins = Math.round(minutes % 60);
		if (hrs <= 0) return `${mins}m`;
		return `${hrs}h ${String(mins).padStart(2, '0')}m`;
	};

	const formatNumber = (value: number | null | undefined, digits = 0) => {
		if (value === null || value === undefined || !Number.isFinite(value)) return '--';
		return value.toFixed(digits);
	};

	const formatDailyNumber = (value: number | null | undefined, suffix = '') => {
		if (value === null || value === undefined || !Number.isFinite(value)) return 'No data today';
		return `${numberFormatter.format(value)}${suffix}`;
	};

	$: stepsTodayLabel = formatDailyNumber(steps);
	$: updatedLabel = formatAgo(lastUpdated);
	$: nextUpdateLabel = formatUntil(nextRefresh);
	$: distanceLabel = distanceKm ? `${formatNumber(distanceKm, 1)} km` : 'No data today';
	$: activeMinutesLabel =
		activeMinutes === null || activeMinutes === undefined || !Number.isFinite(activeMinutes)
			? 'Just sat today'
			: `${numberFormatter.format(activeMinutes)} min`;
	$: caloriesLabel = formatDailyNumber(caloriesOut, ' kcal');
	$: restingHeartLabel =
		restingHeartRate === null || restingHeartRate === undefined
			? 'No data today'
			: `${numberFormatter.format(restingHeartRate)} bpm`;
	$: heartRateLabel =
		heartRateBpm === null || heartRateBpm === undefined
			? '--'
			: `${numberFormatter.format(heartRateBpm)} bpm`;
	$: sleepLabel = formatDuration(sleepDurationMinutes);
	$: sleepHelper =
		sleepScore === null || sleepScore === undefined
			? 'Sleep score'
			: `Sleep score ${numberFormatter.format(sleepScore)}`;
	$: stepsWeekLabel =
		stepsWeek === null || stepsWeek === undefined
			? 'No data this week'
			: `${numberFormatter.format(stepsWeek)} this week`;
	$: floorsLabel =
		floors === null || floors === undefined
			? 'No data today'
			: `${numberFormatter.format(floors)} floors`;
	$: stepsValueLabel = distanceKm ? `${stepsTodayLabel} · ${distanceLabel}` : stepsTodayLabel;
	let stats = [];
	$: stats = [
		{
			label: 'Steps today',
			value: stepsValueLabel,
			helper: `Week: ${stepsWeekLabel}`,
			icon: Footprints
		},
		{
			label: 'Sleep (last night)',
			value: sleepLabel,
			helper: sleepHelper,
			icon: Bed
		},
		{
			label: 'Active minutes',
			value: activeMinutesLabel,
			helper: 'Cardio + peak',
			icon: Timer
		},
		{
			label: 'Heart rate',
			value: heartRateLabel,
			helper: 'Live bpm',
			icon: HeartPulse
		},
		{
			label: 'Calories burned',
			value: caloriesLabel,
			helper: 'Today so far',
			icon: Flame
		},
		{
			label: 'Floors climbed',
			value: floorsLabel,
			helper: 'Today',
			icon: Activity
		}
	];
	$: collapsedLabel =
		steps === null || steps === undefined ? 'No data today' : `${numberFormatter.format(steps)} steps`;
</script>

<div class="fixed bottom-2 left-2 right-auto z-40 w-auto max-w-[12.5rem] text-[11px] sm:bottom-3 sm:left-4 sm:max-w-[15rem] md:bottom-4 md:left-5">
	<div
		class="rounded-xl border border-black/5 bg-white/90 p-2 shadow-[0_10px_26px_rgba(15,23,42,0.08)] backdrop-blur-md ring-1 ring-black/5 transition dark:border-white/10 dark:bg-white/5 dark:ring-white/5"
	>
		{#if expanded}
			<div class="flex items-center justify-between gap-2 pb-2">
				<div class="flex items-center gap-2">
					<div>
						<p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-300">
							Live stats (24h)
						</p>
					</div>
				</div>
				<button
					type="button"
					on:click={() => (expanded = !expanded)}
					aria-expanded={expanded}
					aria-label="Collapse live stats"
					class="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left font-semibold text-gray-800 transition hover:bg-black/5 dark:text-gray-100 dark:hover:bg-white/5 sm:w-auto"
				>
					<span class="ml-auto text-[10px] font-semibold text-amber-700 dark:text-amber-200">Close</span>
					<ChevronUp class="h-[16px] w-[16px]" />
				</button>
			</div>

			<div class="mt-2 grid grid-cols-1 gap-1">
				{#each stats as stat}
					<div class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition hover:bg-black/5 dark:hover:bg-white/5">
						<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 text-amber-600 dark:from-amber-500/15 dark:to-orange-400/15 dark:text-amber-200">
							<svelte:component this={stat.icon} class="h-[18px] w-[18px]" />
						</div>
						<div class="flex-1">
							<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
								{stat.label}
							</p>
							<p class="text-base font-semibold text-gray-900 dark:text-white">{stat.value}</p>
							<p class="text-[11px] text-gray-500 dark:text-gray-400">{stat.helper}</p>
						</div>
					</div>
				{/each}
			</div>
			<p class="mt-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
				Updated {updatedLabel} <br> Next {nextUpdateLabel}
			</p>
		{:else}
				<button
					type="button"
					on:click={() => (expanded = true)}
					aria-expanded={expanded}
					aria-label="Expand live stats"
					class="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left font-semibold text-gray-800 transition hover:bg-black/5 dark:text-gray-100 dark:hover:bg-white/5"
				>
					<span class="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
						<Footprints class="h-[15px] w-[15px]" />
					</span>
					<span class="truncate">{collapsedLabel}</span>
					<span class="ml-auto text-[10px] font-semibold text-amber-700 dark:text-amber-200">Open</span>
					<ChevronDown class="h-[16px] w-[16px]" />
				</button>
			{/if}
		</div>
</div>
