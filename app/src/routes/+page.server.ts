import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fetchRecentCommits } from '$lib/server/github';
import type { GithubCommit } from '$lib/server/github';
import { fetchContributionCalendar } from '$lib/server/githubContributions';
import type { ContributionCalendar } from '$lib/server/githubContributions';

export async function load() {
	const postsDir = 'src/posts';
	const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

	const events = files.map((filename) => {
		const filePath = path.join(postsDir, filename);
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const { data } = matter(fileContent);

		const slug = filename.replace(/\.md$/, '');

		return {
			slug,
			title: data.title || slug,
			description: data.description || 'No description available.',
			coverImage: data.coverImage || '/placeholder.png',
			live: data.live || false
		};
	});

	// Sort events to show live events first
	events.sort((a, b) => (b.live ? 1 : -1));

	let recentCommits: GithubCommit[] = [];
	try {
		recentCommits = await fetchRecentCommits(5);
	} catch (error) {
		console.error('Failed to fetch recent commits:', error);
	}

	const now = new Date();
	const from = new Date(now);
	from.setFullYear(from.getFullYear() - 2);
	let contributions: ContributionCalendar | null = null;
	try {
		contributions = await fetchContributionCalendar({ from: from.toISOString(), to: now.toISOString() });
	} catch (error) {
		console.error('Failed to fetch contribution calendar:', error);
	}

	return { events, recentCommits, contributions };
}
