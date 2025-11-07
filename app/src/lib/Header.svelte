<script>
	import { onMount } from 'svelte';
	import { isDark } from '$lib/stores/theme';
	let dark = false;
	let isMobileMenuOpen = false;

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

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
			<!-- Left: Logo / site title -->
			<div class="text-2xl font-bold text-gray-800 dark:text-gray-100">
				<a href="/">Nick's Blog</a>
			</div>

			<!-- Center: main page | friend book | experiences -->
			<div class="hidden md:flex justify-center space-x-2 text-gray-600 dark:text-gray-300">
				<a href="/" class="hover:text-blue-600 dark:hover:text-blue-400">Main Page</a>
				<span class="select-none">|</span>
				<a href="/experiences" class="hover:text-blue-600 dark:hover:text-blue-400">Experiences</a>
				<span class="select-none">|</span>
				<a href="/about" class="hover:text-blue-600 dark:hover:text-blue-400">About Me</a>
				<span class="select-none">|</span>
				<a href="/contact" class="hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
			</div>

			<!-- Right side: hamburger and theme toggle -->
			<div class="flex items-center">
				<!-- Dark mode toggle (for desktop) -->
				<div class="hidden md:block">
					<label
						class="relative inline-block h-8 w-14 select-none align-middle cursor-pointers"
						aria-label="Toggle dark mode"
					>
						<input
							type="checkbox"
							class="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
							bind:checked={dark}
							on:change={updateTheme}
						/>
						<span
							class="absolute inset-0 rounded-full bg-indigo-200 transition-colors duration-500
							peer-checked:bg-indigo-600 dark:bg-indigo-800 dark:peer-checked:bg-yellow-400"
						></span>
						<span
							class="absolute bottom-[15%] left-[10%] flex h-[1.4em] w-[1.4em] items-center justify-center
							rounded-full bg-white shadow transition-all duration-500
							peer-checked:translate-x-[1.5em] dark:bg-gray-900"
						>
							{#if dark}
								<!-- Moon icon -->
								<svg
									class="h-4 w-4 text-yellow-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-width="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
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

				<!-- Hamburger menu button (visible on mobile) -->
				<div class="md:hidden">
					<button on:click={toggleMobileMenu} class="text-gray-800 dark:text-gray-100 focus:outline-none">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if isMobileMenuOpen}
		<div class="mt-4 flex flex-col space-y-2 md:hidden">
			<a href="/" class="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Main Page</a>
			<a href="/experiences" class="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Experiences</a>
			<a href="/about" class="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">About Me</a>
			<a href="/contact" class="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Contact</a>
			
			<!-- Dark mode toggle for mobile -->
			<div class="pt-4">
				<label
					class="relative inline-block h-8 w-14 select-none align-middle cursor-pointers"
					aria-label="Toggle dark mode"
				>
					<input
						type="checkbox"
						class="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
						bind:checked={dark}
						on:change={updateTheme}
					/>
					<span
						class="absolute inset-0 rounded-full bg-indigo-200 transition-colors duration-500
						peer-checked:bg-indigo-600 dark:bg-indigo-800 dark:peer-checked:bg-yellow-400"
					></span>
					<span
						class="absolute bottom-[15%] left-[10%] flex h-[1.4em] w-[1.4em] items-center justify-center
						rounded-full bg-white shadow transition-all duration-500
						peer-checked:translate-x-[1.5em] dark:bg-gray-900"
					>
						{#if dark}
							<!-- Moon icon -->
							<svg
								class="h-4 w-4 text-yellow-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path stroke-width="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
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
		{/if}
	</nav>
</header>
