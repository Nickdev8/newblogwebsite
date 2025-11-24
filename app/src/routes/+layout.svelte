<script>
	import Header from '$lib/Header.svelte';
	import '../app.css';
</script>

<div class="page-shell min-h-screen">
	<Header />
	<main class="px-0 pb-16 pt-8 sm:px-8 lg:px-10">
		<div class="w-full max-w-none space-y-0 sm:space-y-16 sm:mx-auto sm:max-w-7xl">
			<slot />
		</div>
	</main>
</div>
