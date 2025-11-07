import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; // <- for Svelte 4
import { mdsvex } from 'mdsvex';

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],
	kit: {
		adapter: adapter({ out: 'build' })
		// no prerender.default in v2
	}
};

export default config;
