<script>
	import Header from '$lib/Header.svelte';
	import '../app.css';
</script>

<div class="page-shell min-h-screen">
	<Header />
	<main class="px-4 pb-16 pt-8 sm:px-8 lg:px-10">
		<div class="mx-auto w-full max-w-7xl space-y-16">
			<slot />
		</div>
	</main>
</div>
