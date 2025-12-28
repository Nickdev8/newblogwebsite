import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PageServerLoad } from './$types';

const CDN_BASE = 'https://cdn.nickesselman.nl';
const toCdnPath = (src?: string) => {
	if (!src) return src;
	if (/^https?:\/\//i.test(src)) return src;
	if (src.startsWith('/blogimages/')) return `${CDN_BASE}${src}`;
	return src;
};

export const load: PageServerLoad = async ({ fetch }) => {
	const postsDir = 'src/posts';
	const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

	let steps = null;
	let lastUpdated = null;
	let nextRefresh = null;
	let distanceKm = null;
	let activeMinutes = null;
	let caloriesOut = null;
	let restingHeartRate = null;
	let sleepDurationMinutes = null;
	let sleepScore = null;
	let heartRateBpm = null;
	let stepsWeek = null;
	let floors = null;
	let errorMessage: string | null = null;

	try {
		const response = await fetch('/api/steps');
		if (response.ok) {
			const payload = (await response.json()) as {
				steps?: number | null;
				lastUpdated?: number | null;
				nextRefresh?: number | null;
				distanceKm?: number | null;
				activeMinutes?: number | null;
				caloriesOut?: number | null;
				restingHeartRate?: number | null;
				sleepDurationMinutes?: number | null;
				sleepScore?: number | null;
				heartRateBpm?: number | null;
				stepsWeek?: number | null;
				floors?: number | null;
				errorMessage?: string | null;
			};
			steps = typeof payload.steps === 'number' ? payload.steps : null;
			lastUpdated = typeof payload.lastUpdated === 'number' ? payload.lastUpdated : null;
			nextRefresh = typeof payload.nextRefresh === 'number' ? payload.nextRefresh : null;
			distanceKm = typeof payload.distanceKm === 'number' ? payload.distanceKm : null;
			activeMinutes = typeof payload.activeMinutes === 'number' ? payload.activeMinutes : null;
			caloriesOut = typeof payload.caloriesOut === 'number' ? payload.caloriesOut : null;
			restingHeartRate =
				typeof payload.restingHeartRate === 'number' ? payload.restingHeartRate : null;
			sleepDurationMinutes =
				typeof payload.sleepDurationMinutes === 'number' ? payload.sleepDurationMinutes : null;
			sleepScore = typeof payload.sleepScore === 'number' ? payload.sleepScore : null;
			heartRateBpm = typeof payload.heartRateBpm === 'number' ? payload.heartRateBpm : null;
			stepsWeek = typeof payload.stepsWeek === 'number' ? payload.stepsWeek : null;
			floors = typeof payload.floors === 'number' ? payload.floors : null;
			errorMessage =
				typeof payload.errorMessage === 'string' && payload.errorMessage
					? payload.errorMessage
					: null;
		}
	} catch (error) {
		console.error('Failed to fetch steps in page load', error);
	}

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

	return {
		events,
		steps,
		lastUpdated,
		nextRefresh,
		distanceKm,
		activeMinutes,
		caloriesOut,
		restingHeartRate,
		sleepDurationMinutes,
		sleepScore,
		heartRateBpm,
		stepsWeek,
		floors,
		errorMessage
	};
};
