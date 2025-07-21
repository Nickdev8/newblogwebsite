import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { event } = params;
	const filePath = path.join('src/posts', `${event}.md`);

	if (!fs.existsSync(filePath)) {
		throw error(404, 'Not found');
	}

	const fileContent = fs.readFileSync(filePath, 'utf-8');
	const eventName = event;

	const sections = fileContent.split('---').filter((s) => s.trim());
	const posts = [];

	for (let i = 0; i < sections.length; i += 2) {
		const frontmatter = sections[i];
		const content = sections[i + 1] || '';
		const fullPostString = `---\n${frontmatter}\n---\n${content}`;
		const { data, content: parsedContent } = matter(fullPostString);

		const images: { src: string; alt: string }[] = [];
		const textContent = parsedContent.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
			images.push({ src, alt });
			return '';
		});

		if (data.date && data.title) {
			posts.push({
				title: data.title,
				date: data.date,
				slug: `${eventName}-${i / 2}`,
				content: marked(textContent.trim()),
				images,
				event: eventName
			});
		}
	}

	posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return { posts, event };
} 