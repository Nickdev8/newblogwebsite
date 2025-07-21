<script>
	export const prerender = true; 
	import Header from '$lib/Header.svelte';
	import '../app.css';
</script>

<Header />
<main>
	<slot />
</main>
