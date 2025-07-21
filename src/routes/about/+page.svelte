<script lang="ts">
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';

	export let data: { carouselImages: { src: string; isVideo: boolean }[] } = {
		carouselImages: []
	};

	const images = ['/aboutme2.png', '/aboutme3.png', '/aboutme4.png', '/aboutme5.png'];
	const image = images[Math.floor(Math.random() * images.length)];
</script>

<div class="m-8">
	<h1 class="mb-8 text-4xl font-bold">About Me</h1>
	<div class="mb-16 flex flex-col gap-8 md:flex-row">
		<img
			src={image}
			alt="About Me"
			class="h-64 w-64 rounded-full border-4 border-gray-500 object-cover shadow-lg"
		/>
		<div class="max-w-lg text-lg">
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

	{#if data.carouselImages.length > 0}
		<div class="w-full max-w-6xl">
			<h2 class="mb-4 text-2xl font-bold">Gallery</h2>
			<Splide
				options={{
					type: 'loop',
					drag: 'free',
					snap: true,
					perPage: 3,
					perMove: 1,
					wheel: true,
					gap: '1rem',
					autoplay: false,
					interval: 3000
				}}
			>
				{#each data.carouselImages as media}
					<SplideSlide>
						{#if media.isVideo}
							<video
								src={media.src}
								class="h-64 w-full rounded-lg object-cover"
								controls
								muted
								playsinline
							/>
						{:else}
							<img src={media.src} alt="Gallery image" class="h-64 w-full rounded-lg object-cover" />
						{/if}
					</SplideSlide>
				{/each}
			</Splide>
		</div>
	{/if}
</div> 