import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fetchRecentCommits } from '$lib/server/github';
import { fetchContributionCalendar } from '$lib/server/githubContributions';

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

	const recentCommits = await fetchRecentCommits(5);

	const now = new Date();
	const from = new Date(now);
	from.setFullYear(from.getFullYear() - 2);
	const contributions = await fetchContributionCalendar({ from: from.toISOString(), to: now.toISOString() });

	return { events, recentCommits, contributions };
}
