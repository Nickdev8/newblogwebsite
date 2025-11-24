<script>
	import { onMount } from 'svelte';
	import { isDark } from '$lib/stores/theme';
	import { Menu, Moon, Sun, X } from 'lucide-svelte';

	let dark = false;
	let isMobileMenuOpen = false;

	const navLinks = [
		{ href: '/', label: 'Posts' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function toggleTheme() {
		dark = !dark;
		updateTheme();
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

<header class="px-0 sm:px-8 lg:px-10">
	<nav class="glass-panel flex flex-col gap-4 px-4 py-5 sm:px-6 sm:py-4">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<a href="/" class="group grid gap-0.5 text-left md:max-w-md md:flex-1">
				<span class="text-base font-semibold uppercase tracking-[0.25em] text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-white">
					Field Notes
				</span>
				<span class="text-2xl font-semibold text-gray-900 transition-colors group-hover:tracking-wide dark:text-white">
					Nick Esselman
				</span>
				<span class="text-xs text-gray-500 dark:text-gray-400">Stories of building & wandering</span>
			</a>

			<div class="flex flex-1 flex-wrap items-center justify-between gap-3 md:justify-end md:gap-5">
				<div class="hidden flex-wrap items-center gap-5 text-sm font-semibold text-gray-600 dark:text-gray-200 md:flex">
					{#each navLinks as link}
						<a
							href={link.href}
							class="transition hover:text-gray-900 dark:hover:text-white"
						>
							{link.label}
						</a>
					{/each}
				</div>

				<div class="flex items-center gap-3">
					<button
						type="button"
						on:click={toggleTheme}
						aria-pressed={dark}
						aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
						class="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:border-black/40 dark:border-white/10 dark:text-gray-100"
					>
						{#if dark}
							<Moon class="h-4 w-4" />
							<span class="hidden sm:inline">Night</span>
						{:else}
							<Sun class="h-4 w-4" />
							<span class="hidden sm:inline">Day</span>
						{/if}
					</button>

					<button
						type="button"
						on:click={toggleMobileMenu}
						class="rounded-full border border-black/10 p-2 text-gray-700 transition hover:-translate-y-0.5 hover:border-black/40 dark:border-white/10 dark:text-gray-100 md:hidden"
						aria-expanded={isMobileMenuOpen}
					>
						{#if isMobileMenuOpen}
							<X class="h-5 w-5" />
						{:else}
							<Menu class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>
		</div>
	</nav>

	{#if isMobileMenuOpen}
		<div class="glass-panel mt-3 flex flex-col gap-3 px-5 py-4 text-sm font-semibold text-gray-600 dark:text-gray-200 md:hidden">
			{#each navLinks as link}
				<a href={link.href} class="rounded-2xl border border-black/5 px-4 py-3 transition hover:border-black/20 dark:border-white/5 dark:hover:border-white/40">
					{link.label}
				</a>
			{/each}
		</div>
	{/if}
</header>
