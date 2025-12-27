import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CDN_BASE = 'https://cdn.nickesselman.nl';
const toCdnPath = (src?: string) => {
	if (!src) return src;
	if (/^https?:\/\//i.test(src)) return src;
	if (src.startsWith('/blogimages/')) return `${CDN_BASE}${src}`;
	return src;
};

export async function load() {
	const postsDir = 'src/posts';
	const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

	const events = files.map((filename) => {
		const filePath = path.join(postsDir, filename);
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const { data } = matter(fileContent);

		const sections = fileContent.split('---').filter((s) => s.trim());
		const dateStamps: number[] = [];
		for (let i = 1; i < sections.length; i += 2) {
			const fm = sections[i];
			const fmData = matter(`---\n${fm}\n---`).data || {};
			const time = fmData.date ? new Date(fmData.date).getTime() : NaN;
			if (!Number.isNaN(time)) {
				dateStamps.push(time);
			}
		}
		const latestDate = dateStamps.length ? Math.max(...dateStamps) : 0;

		const slug = filename.replace(/\.md$/, '');

		return {
			slug,
			title: data.title || slug,
			description: data.description || 'No description available.',
			coverImage: toCdnPath(data.coverImage) || '/placeholder.png',
			live: data.live || false,
			latestDate
		};
	});

	// Newest entries first on the home page
	events.sort((a, b) => (b.latestDate || 0) - (a.latestDate || 0));

	return { events };
}
