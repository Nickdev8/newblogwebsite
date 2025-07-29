<script>
	import { onMount } from 'svelte';
	import { isDark } from '$lib/stores/theme';
	let dark = false;

	onMount(() => {
		dark =
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

		isDark.set(dark);
		updateTheme();
	});

	function updateTheme() {
		document.documentElement.classList.toggle('dark', dark);
		isDark.set(dark);
		localStorage.theme = dark ? 'dark' : 'light';
	}
</script>

<header class="bg-white shadow-md transition-colors dark:bg-gray-900">
	<nav class="container mx-auto px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="text-2xl font-bold text-gray-800 dark:text-gray-100">
				<a href="/">Nick's Blog</a>
			</div>
			<div class="flex items-center space-x-4">
				<a
					href="/"
					class="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
					>Home</a
				>
				<a
					href="/about"
					class="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
					>About Me</a
				>
				<a
					href="/contact"
					class="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
					>Contact</a
				>
				<!-- Custom switch toggle -->
				<label
					class="relative ml-4 inline-block h-8 w-14 select-none align-middle"
					aria-label="Toggle dark mode"
				>
					<!-- <input
						type="checkbox"
						bind:checked={dark}
						on:change={() => {
							localStorage.theme = dark ? 'dark' : 'light';
							updateTheme();
						}}
						aria-checked={dark}
						tabindex="0"
					/> -->
					<input
						type="checkbox"
						class="peer absolute left-0 top-0 z-10 h-full w-full cursor-pointer opacity-0"
						bind:checked={dark}
						on:change={() => {
							updateTheme();
						}}
					/>

					<!-- Slider background -->
					<span
						class="absolute bottom-0 left-0 right-0 top-0 rounded-full bg-indigo-200 transition-colors
                            duration-500 peer-checked:bg-indigo-600
                            dark:bg-indigo-800 dark:peer-checked:bg-yellow-400"
					></span>
					<!-- Thumb -->
					<span
						class="absolute bottom-[15%] left-[10%] flex h-[1.4em] w-[1.4em] items-center justify-center
                            rounded-full bg-white shadow
                            transition-all duration-500 peer-checked:translate-x-[1.5em]
                            dark:bg-gray-900"
					>
						{#if dark}
							<!-- Moon icon -->
							<svg
								class="h-4 w-4 text-yellow-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke="currentColor"
									stroke-width="2"
									d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
								/>
							</svg>
						{:else}
							<!-- Sun icon -->
							<svg class="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="5" />
								<path
									stroke="currentColor"
									stroke-width="2"
									d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m12.02 0l-1.41 1.41M6.46 17.54l-1.41 1.41"
								/>
							</svg>
						{/if}
					</span>
				</label>
			</div>
		</div>
	</nav>
</header>
