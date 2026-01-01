<script>
	import { requestIntroModal } from '$lib/stores/introModal';

	const links = [
		{ href: '/', label: 'Posts' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];
</script>

<footer class="px-3 pb-10 pt-6 sm:px-6 lg:px-10">
	<div class="glass-panel mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-5 py-5 text-sm text-gray-600 dark:text-gray-200 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex flex-wrap items-center gap-4">
			{#each links as link}
				<a href={link.href} class="font-semibold transition hover:text-gray-900 dark:hover:text-white">
					{link.label}
				</a>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<a
				href="mailto:info@nickesselman.nl"
				class="text-sm font-semibold text-gray-600 transition hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
			>
				info@nickesselman.nl
			</a>
			<button
				type="button"
				class="rounded-full border border-black/10 px-3 py-1.5 font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:border-black/30 dark:border-white/10 dark:text-gray-100"
				on:click={requestIntroModal}
			>
				Show intro again
			</button>
		</div>
	</div>
</footer>
