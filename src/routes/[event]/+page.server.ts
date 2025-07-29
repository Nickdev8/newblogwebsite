import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, EntryGenerator } from './$types';

export const entries: EntryGenerator = () => {
	const postsDir = 'src/posts';
	const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

	return files.map((file) => ({
		event: file.replace(/\.md$/, '')
	}));
};

function getLayoutClasses(image: { layout: string[] }) {
	const classes: string[] = [];
	if (image.layout.includes('right')) {
		classes.push('float-right', 'ml-4', 'mb-2');
	} else if (image.layout.includes('left')) {
		classes.push('float-left', 'mr-4', 'mb-2');
	}

	if (image.layout.includes('hole')) {
		classes.push('w-full', 'max-w-3xl', 'mr-auto');
	} else if (image.layout.includes('left') || image.layout.includes('right')) {
		if (image.layout.includes('vertical')) {
			classes.push('w-1/4');
		} else if (image.layout.includes('horizantal')) {
			classes.push('w-1/2');
		} else {
			classes.push('w-1/3');
			
		}
	} else {
		// Default case for images without float or hole hints
		classes.push('w-full', 'max-w-md', 'mx-auto');
	}
	return classes.join(' ');
}

export const load: PageServerLoad = async ({ params }) => {
	const { event } = params;
	const filePath = path.join('src/posts', `${event}.md`);

	if (!fs.existsSync(filePath)) {
		throw error(404, 'Not found');
	}

	const fileContent = fs.readFileSync(filePath, 'utf-8');
	const eventName = event;
	const sections = fileContent.split('---').filter((s) => s.trim());

	// Parse the MAIN frontmatter (first block)
	const mainFMRaw = sections[0] || '';
	const mainData = matter(`---\n${mainFMRaw}\n---`).data || {};
	const banner = mainData.warning
		? {
				message: mainData.warning,
				type: mainData.warning_type || 'warning',
				dismissible: mainData.warning_dismissible !== false
		  }
		: null;

	const posts = [];

	// Start from the second frontmatter section, skipping the main one
	for (let i = 1; i < sections.length; i += 2) {
		const frontmatter = sections[i];
		const content = sections[i + 1] || '';
		const fullPostString = `---\n${frontmatter}\n---\n${content}`;
		const { data, content: parsedContent } = matter(fullPostString);

		const holeImages: { src: string; alt: string; layout: string[] }[] = [];
		let textContent = parsedContent.replace(
			/!\[([^\]]*)\]\(([^)]*)\)(?:\{([^}]*)\})?/g,
			(match, alt, src, layout) => {
				const layoutArr = layout ? layout.trim().split(/\s+/) : [];
				holeImages.push({ src, alt, layout: layoutArr });
				return '';
			}
		);

		if (data.date && data.title) {
			posts.push({
				title: data.title,
				date: data.date,
				slug: `${eventName}-${i / 2}`,
				content: marked(textContent.trim()),
				holeImages,
				event: eventName
			});
		}
	}

	if (event === 'undercity') {
		posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	} else {
		posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}

	const extraImagesDir = path.join('static', 'blogimages', eventName, 'extra');
	const leftoverImages = fs.existsSync(extraImagesDir)
		? fs.readdirSync(extraImagesDir).map((file) => ({
				src: `/blogimages/${eventName}/extra/${file}`,
				alt: 'Extra image'
		  }))
		: [];

	return {
		posts,
		event,
		leftoverImages,
		banner,
		title: mainData.title || '',
		description: mainData.description || '',
		coverImage: mainData.coverImage || '',
		content: '', // or mainData.content if you want
		images: []   // or mainData.images || []
	};
};