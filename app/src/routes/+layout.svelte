<script>
	import Header from '$lib/Header.svelte';
	import LiveStatsCard from '$lib/LiveStatsCard.svelte';
	import '../app.css';

	export let data;
</script>

<div class="page-shell min-h-screen">
	<Header />
	<main class="px-0 pb-16 pt-8 sm:px-8 lg:px-10">
		<div class="w-full max-w-none space-y-0 sm:space-y-16 sm:mx-auto sm:max-w-7xl">
			<slot />
		</div>
	</main>
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
</div>
