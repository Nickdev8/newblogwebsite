<script>
	import Header from '$lib/Header.svelte';
	import '../app.css';
</script>

<Header />
<main class="page-shell px-4 pb-16 pt-10 sm:px-8 lg:px-10">
	<div class="mx-auto w-full max-w-7xl space-y-16">
		<slot />
	</div>
</main>
