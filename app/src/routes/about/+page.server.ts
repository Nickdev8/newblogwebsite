import fs from 'fs';
import path from 'path';

export async function load() {
	const postsDir = 'src/posts';
	const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

	const allMedia: { src: string; isVideo: boolean }[] = [];
	const uniqueSources = new Set<string>();
	const imageRegex = /!\[[^\]]*\]\(([^)]*)\)/g;
	const frontmatterRegex = /---\s*[\s\S]*?coverImage:\s*([^\s]+)[\s\S]*?---/;

	const addMedia = (src: string) => {
		if (src && !uniqueSources.has(src)) {
			uniqueSources.add(src);
			allMedia.push({
				src,
				isVideo: src.endsWith('.mp4')
			});
		}
	};

	for (const filename of files) {
		const filePath = path.join(postsDir, filename);
		const content = fs.readFileSync(filePath, 'utf-8');

		let match;
		while ((match = imageRegex.exec(content)) !== null) {
			addMedia(match[1]);
		}

		const frontmatterMatch = content.match(frontmatterRegex);
		if (frontmatterMatch && frontmatterMatch[1]) {
			addMedia(frontmatterMatch[1]);
		}
	}

	const shuffledImages = allMedia.sort(() => 0.5 - Math.random());
	const carouselImages = shuffledImages.slice(0, 10);

	const aboutMeImages = ['/aboutme2.webp', '/aboutme3.webp', '/aboutme4.webp', '/aboutme5.webp'];
	const aboutMeImage = aboutMeImages[Math.floor(Math.random() * aboutMeImages.length)];

	return { carouselImages, aboutMeImage };
} 



