import { fetchContributionCalendar } from '$lib/server/githubContributions';

export async function load() {
	const curatedSources = [
		'/blogimages/neighborhood/planeride.webp',
		'/blogimages/neighborhood/linkedin.webp',
		'/blogimages/neighborhood/elliottDancing.mp4',
		'/blogimages/neighborhood/uno.webp',
		'/blogimages/neighborhood/morningwalkv2.webp',
		'/blogimages/neighborhood/githubhqpanorrama1.webp',
		'/blogimages/undercity/githubroof.webp',
		'/blogimages/undercity/group.webp',
		'/blogimages/neighborhood/paolobeingsmart.mp4',
		'/blogimages/neighborhood/populated.mp4'
	];

	const carouselImages = curatedSources.map((src) => ({
		src,
		isVideo: src.endsWith('.mp4')
	}));

	const aboutMeImages = ['/mainme.webp', '/aboutme-writing.webp', '/aboutme3.webp'];
	const aboutMeImage = aboutMeImages[Math.floor(Math.random() * aboutMeImages.length)];

	const now = new Date();
	const from = new Date(now);
	from.setFullYear(from.getFullYear() - 2);
	const contributions = await fetchContributionCalendar({ from: from.toISOString(), to: now.toISOString() });

	return { carouselImages, aboutMeImage, contributions };
}

