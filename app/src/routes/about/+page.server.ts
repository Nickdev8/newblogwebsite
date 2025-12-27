import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fetchContributionCalendar } from '$lib/server/githubContributions';

const CDN_BASE = 'https://cdn.nickesselman.nl';
const toCdnPath = (src: string) => {
	if (!src) return src;
	if (/^https?:\/\//i.test(src)) return src;
	if (src.startsWith('/blogimages/')) return `${CDN_BASE}${src}`;
	return src;
};

const POSTS_DIR = path.join(process.cwd(), 'src', 'posts');
const mediaRegex = /!\[[^\]]*?\]\(([^)]+)\)/g;

const collectPostMedia = () => {
	if (!fs.existsSync(POSTS_DIR)) return [];
	const media: string[] = [];
	const files = fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith('.md'));

	for (const file of files) {
		const filePath = path.join(POSTS_DIR, file);
		const content = fs.readFileSync(filePath, 'utf-8');
		const sections = content.split('---').filter((s) => s.trim());
		const mainFMRaw = sections[0] || '';
		const mainData = matter(`---\n${mainFMRaw}\n---`).data || {};
		if (mainData.coverImage) {
			media.push(String(mainData.coverImage));
		}
		let match: RegExpExecArray | null;
		while ((match = mediaRegex.exec(content))) {
			const src = match[1]?.trim();
			if (src) media.push(src);
		}
	}

	const unique = Array.from(new Set(media));
	return unique.map((src) => ({
		src: toCdnPath(src),
		isVideo: src.toLowerCase().endsWith('.mp4')
	}));
};

const shuffle = <T>(input: T[]): T[] => {
	const arr = [...input];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

export async function load() {
	const allMedia = collectPostMedia();
	const fallbackMedia = [
		'/blogimages/neighborhood/planeride.webp',
		'/blogimages/neighborhood/linkedin.webp',
		'/blogimages/neighborhood/elliottDancing.mp4',
		'/blogimages/neighborhood/uno.webp',
		'/blogimages/neighborhood/morningwalkv2.webp',
		'/blogimages/neighborhood/githubhqpanorrama1.webp',
		'/blogimages/undercity/githubroof.webp',
		'/blogimages/undercity/group.webp',
		'/blogimages/neighborhood/paolobeingsmart.mp4',
		'/blogimages/neighborhood/populated.webp'
	].map((src) => ({ src: toCdnPath(src), isVideo: src.endsWith('.mp4') }));

	const mediaPool = allMedia.length > 0 ? allMedia : fallbackMedia;
	const carouselImages = shuffle(mediaPool).slice(0, 24);

	const aboutMeImages = ['/mainme.webp', '/aboutme-writing.webp', '/aboutme3.webp'];
	const aboutMeImage = aboutMeImages[Math.floor(Math.random() * aboutMeImages.length)];

	const now = new Date();
	const from = new Date(now);
	from.setFullYear(from.getFullYear() - 2);
	const contributions = await fetchContributionCalendar({ from: from.toISOString(), to: now.toISOString() });

	return { carouselImages, aboutMeImage, contributions };
}
