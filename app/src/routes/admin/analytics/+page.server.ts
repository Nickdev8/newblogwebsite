import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PageServerLoad } from './$types';
import { readReaderDB } from '$lib/server/readerStore';

type PostSummary = {
	slug: string;
	title: string;
};

const POSTS_DIR = path.join(process.cwd(), 'src', 'posts');

const readPosts = (): PostSummary[] => {
	if (!fs.existsSync(POSTS_DIR)) return [];
	return fs
		.readdirSync(POSTS_DIR)
		.filter((file) => file.endsWith('.md'))
		.map((filename) => {
			const filePath = path.join(POSTS_DIR, filename);
			const fileContent = fs.readFileSync(filePath, 'utf-8');
			const { data } = matter(fileContent);
			return {
				slug: filename.replace(/\.md$/, ''),
				title: data.title || filename
			};
		});
};

const bucketReferrer = (referrer: string) => {
	const value = referrer.toLowerCase();
	if (!value || value === 'direct') return 'direct';
	if (value.startsWith('/')) return 'internal';
	if (
		value.includes('google.') ||
		value.includes('bing.') ||
		value.includes('duckduckgo.') ||
		value.includes('yahoo.')
	) {
		return 'search';
	}
	if (
		value.includes('twitter.') ||
		value.includes('t.co') ||
		value.includes('facebook.') ||
		value.includes('instagram.') ||
		value.includes('linkedin.') ||
		value.includes('reddit.')
	) {
		return 'social';
	}
	return 'external';
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.isAdmin) {
		return {
			loggedIn: false,
			totals: null,
		perPost: [],
		deviceCounts: [],
		referrerCounts: [],
		languageCounts: [],
		names: [],
		readerBreakdown: []
	};
	}

	const posts = readPosts();
	const titleMap = new Map(posts.map((post) => [post.slug, post.title]));

	const db = await readReaderDB();
	const rows = db.rows ?? [];

	const visitRows = rows.filter((row) => row.kind === 'visit');
	const postRows = rows.filter((row) => row.kind === 'post_view');
	const nameRows = rows.filter((row) => row.kind === 'name');
	const languageRows = rows.filter((row) => row.kind === 'language');

	const uniqueReaders = new Set(visitRows.map((row) => row.anon_id));
	const totalVisits = visitRows.length;
	const totalPostViews = postRows.length;

	const deviceMap = new Map<string, number>();
	for (const row of visitRows) {
		deviceMap.set(row.device, (deviceMap.get(row.device) || 0) + 1);
	}

	const referrerMap = new Map<string, number>();
	for (const row of visitRows) {
		const bucket = bucketReferrer(row.referrer);
		referrerMap.set(bucket, (referrerMap.get(bucket) || 0) + 1);
	}

	const languageLatest = new Map<string, { language: 'en' | 'nl'; created_at: number }>();
	for (const row of languageRows) {
		const current = languageLatest.get(row.anon_id);
		if (!current || row.created_at > current.created_at) {
			languageLatest.set(row.anon_id, { language: row.language, created_at: row.created_at });
		}
	}
	const languageCounts = Array.from(languageLatest.values()).reduce<Record<string, number>>(
		(acc, row) => {
			acc[row.language] = (acc[row.language] || 0) + 1;
			return acc;
		},
		{}
	);

	const nameLatest = new Map<string, { name: string; created_at: number }>();
	for (const row of nameRows) {
		const current = nameLatest.get(row.anon_id);
		if (!current || row.created_at > current.created_at) {
			nameLatest.set(row.anon_id, { name: row.name, created_at: row.created_at });
		}
	}

	const names = Array.from(nameLatest.values()).sort((a, b) => b.created_at - a.created_at);

	const perPostMap = new Map<
		string,
		{
			slug: string;
			title: string;
			totalViews: number;
			uniqueReaders: Set<string>;
		}
	>();
	for (const row of postRows) {
		const entry = perPostMap.get(row.event) ?? {
			slug: row.event,
			title: titleMap.get(row.event) || row.event,
			totalViews: 0,
			uniqueReaders: new Set<string>()
		};
		entry.totalViews += 1;
		entry.uniqueReaders.add(row.anon_id);
		perPostMap.set(row.event, entry);
	}

	const readerBreakdownMap = new Map<
		string,
		{ name: string; posts: Map<string, { event: string; title: string }> }
	>();

	for (const row of postRows) {
		const nameEntry = nameLatest.get(row.anon_id);
		if (!nameEntry) continue;
		const existing =
			readerBreakdownMap.get(row.anon_id) ?? { name: nameEntry.name, posts: new Map() };
		if (!existing.posts.has(row.event)) {
			existing.posts.set(row.event, {
				event: row.event,
				title: titleMap.get(row.event) || row.event
			});
		}
		readerBreakdownMap.set(row.anon_id, existing);
	}

	const perPost = Array.from(perPostMap.values())
		.map((entry) => ({
			slug: entry.slug,
			title: entry.title,
			totalViews: entry.totalViews,
			uniqueReaders: entry.uniqueReaders.size
		}))
		.sort((a, b) => b.totalViews - a.totalViews);

	return {
		loggedIn: true,
		totals: {
			totalVisits,
			totalPostViews,
			uniqueReaders: uniqueReaders.size,
			uniqueNamedReaders: nameLatest.size
		},
		perPost,
		deviceCounts: Array.from(deviceMap.entries()).sort((a, b) => b[1] - a[1]),
		referrerCounts: Array.from(referrerMap.entries()).sort((a, b) => b[1] - a[1]),
		languageCounts: Object.entries(languageCounts).sort((a, b) => b[1] - a[1]),
		names,
		readerBreakdown: Array.from(readerBreakdownMap.values())
			.map((reader) => ({
				name: reader.name,
				posts: Array.from(reader.posts.values()).sort((a, b) => b.percent - a.percent)
			}))
			.sort((a, b) => a.name.localeCompare(b.name))
	};
};
