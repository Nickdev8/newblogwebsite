<script lang="ts">
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';

	export let data: {
		carouselImages: { src: string; isVideo: boolean }[];
		aboutMeImage: string;
	};

	function playMuted(node: HTMLVideoElement) {
		node.muted = true;
		node.play().catch(() => {
			// Autoplay was prevented by the browser.
		});
	}
</script>

<div class="m-8">
	<h1 class="mb-8 text-center text-4xl font-bold text-gray-900 dark:text-gray-100">About Me</h1>
	<div class="mb-16 overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-8 shadow-lg">
		<div class="flex flex-col items-center gap-8 md:flex-row md:items-center">
			<img
				src={data.aboutMeImage}
				alt="About Me"
				class="h-64 w-64 flex-shrink-0 rounded-full border-4 border-gray-500 dark:border-gray-300 object-cover"
			/>
			<div class="text-lg text-gray-800 dark:text-gray-200">
				<p class="mb-4">
					Hi, I'm Nick, a passionate developer and storyteller. I love building cool projects and
					sharing my experiences through this blog.
				</p>
				<p>
					When I'm not coding, you can find me exploring new places, meeting new people, and
					documenting my adventures. Thanks for stopping by!
				</p>
			</div>
		</div>
	</div>

	{#if data.carouselImages.length > 0}
		<div class="w-full">
			<h2 class="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">Gallery</h2>
			<Splide
				options={{
					type: 'loop',
					drag: 'free',
					snap: true,
					perPage: 4,
					perMove: 1,
					wheel: true,
					gap: '1rem',
					autoplay: true,
					interval: 3000
				}}
			>
				{#each data.carouselImages as media}
					<SplideSlide>
						{#if media.isVideo}
							<video
								src={media.src}
								class="h-64 w-full rounded-lg object-cover bg-gray-200 dark:bg-gray-700"
								loop
								playsinline
								use:playMuted
							>
								<track kind="captions" />
							</video>
						{:else}
							<img src={media.src} alt="Gallery" class="h-64 w-full rounded-lg object-cover bg-gray-200 dark:bg-gray-700" />
						{/if}
					</SplideSlide>
				{/each}
			</Splide>
		</div>
	{/if}
</div>