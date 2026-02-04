import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],
	kit: {
		adapter: adapter({ out: 'build' }),
		prerender: {
			handleHttpError: ({ path, status }) => {
				if (status === 404) {
					console.warn(`Skipping missing asset during prerender: ${path}`);
					return;
				}

				throw new Error(`Error ${status} while prerendering ${path}`);
			}
		}
	}
};

export default config;
