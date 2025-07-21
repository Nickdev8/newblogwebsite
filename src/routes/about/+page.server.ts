import fs from 'fs';
import path from 'path';

export async function load() {
	const postsDir = 'src/posts';
	const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

	const allMedia: { src: string; isVideo: boolean }[] = [];
	const imageRegex = /!\[[^\]]*\]\(([^)]*)\)/g;

	for (const filename of files) {
		const filePath = path.join(postsDir, filename);
		const content = fs.readFileSync(filePath, 'utf-8');
		let match;
		while ((match = imageRegex.exec(content)) !== null) {
			const src = match[1];
			allMedia.push({
				src,
				isVideo: src.endsWith('.mp4')
			});
		}
	}

	// Shuffle and select a subset of images for the carousel
	const shuffledImages = allMedia.sort(() => 0.5 - Math.random());
	const carouselImages = shuffledImages.slice(0, 15); // Take up to 15 images

	return { carouselImages };
} 