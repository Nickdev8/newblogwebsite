import { env } from '$env/dynamic/private';

export type GithubCommit = {
	sha: string;
	commitUrl: string;
	repoName: string;
	commit: {
		author: { name: string; date: string };
		message: string;
	};
};

const owner = env.GITHUB_OWNER || env.VITE_GITHUB_OWNER;
const token = env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN;
const apiBase = 'https://api.github.com';
const eventsEndpoint = owner ? `${apiBase}/users/${owner}/events/public` : '';
const feedRepos = (env.GITHUB_FEED_REPOS || env.VITE_GITHUB_FEED_REPOS || '')
	.split(',')
	.map((value) => value.trim())
	.filter(Boolean);
const ownerLower = owner?.toLowerCase() || '';

const buildHeaders = () => {
	const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
};

const ownerConfigured = () => Boolean(owner);

const apiCommitToHtml = (url: string) =>
	url?.replace('api.github.com/repos', 'github.com').replace('/commits/', '/commit/') || '#';

type PushEvent = {
	type: string;
	created_at: string;
	repo: { name: string };
	actor?: { login?: string };
	payload?: {
		commits?: { sha: string; message: string; url: string }[];
	};
};

const RECENT_CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
const recentCache: { timestamp: number; data: GithubCommit[] } = { timestamp: 0, data: [] };

const rangeCache = new Map<string, { timestamp: number; data: GithubCommit[] }>();
const RANGE_CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

async function gatherPushCommits(maxCommits: number, maxPages = 4): Promise<GithubCommit[]> {
	if (!ownerConfigured()) return [];
	const commits: GithubCommit[] = [];
	for (let page = 1; page <= maxPages && commits.length < maxCommits; page++) {
		const response = await fetch(`${eventsEndpoint}?per_page=100&page=${page}`, {
			headers: buildHeaders()
		});
		if (!response.ok) {
			console.error('Failed to fetch events', response.status, await response.text());
			break;
		}
		const events: PushEvent[] = await response.json();
		if (!events.length) break;
		for (const event of events) {
			if (event.type !== 'PushEvent') continue;
			const repoName = event.repo?.name || 'unknown-repo';
			const authorName = event.actor?.login || owner || 'unknown';
			const date = event.created_at;
			const payloadCommits = event.payload?.commits || [];
			for (const commit of payloadCommits) {
				commits.push({
					sha: commit.sha,
					repoName,
					commitUrl: apiCommitToHtml(commit.url),
					commit: {
						author: { name: authorName, date },
						message: commit.message || 'Commit'
					}
				});
				if (commits.length >= maxCommits) break;
			}
			if (commits.length >= maxCommits) break;
		}
	}
	return commits;
}

const repoCache = new Map<string, { timestamp: number; data: GithubCommit[] }>();
const trackedRepoCache: { timestamp: number; repos: string[] } = { timestamp: 0, repos: [] };
const TRACKED_REPO_CACHE_DURATION = 1000 * 60 * 10;

const fetchRepoCommits = async (repo: string, limit: number, since?: string, until?: string): Promise<GithubCommit[]> => {
	const cacheKey = `repo_${repo}_${since || 'all'}_${until || 'all'}_${limit}`;
	const cached = repoCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < RECENT_CACHE_DURATION) {
		return cached.data;
	}
	const url = new URL(`${apiBase}/repos/${repo}/commits`);
	const perPage = Math.min(Math.max(limit * 2, 20), 100);
	url.searchParams.set('per_page', String(perPage));
	if (since) url.searchParams.set('since', since);
	if (until) url.searchParams.set('until', until);
	const response = await fetch(url, { headers: buildHeaders() });
	if (!response.ok) {
		console.error('Failed to fetch repo commits', repo, response.status, await response.text());
		return [];
	}
	const json = await response.json();
	const commits: GithubCommit[] = [];
	for (const item of Array.isArray(json) ? json : []) {
		const commitData = item.commit || {};
		const authorName = commitData.author?.name || item.author?.login || owner || 'unknown';
		const date = commitData.author?.date || commitData.committer?.date || item.committer?.date || new Date().toISOString();
		const authorLogin = item.author?.login?.toLowerCase();
		if (ownerLower && authorLogin && authorLogin !== ownerLower) {
			continue;
		}
		commits.push({
			sha: item.sha,
			commitUrl: item.html_url,
			repoName: repo,
			commit: {
				author: { name: authorName, date },
				message: commitData.message || 'Commit'
			}
		});
		if (commits.length >= limit) break;
	}
	repoCache.set(cacheKey, { timestamp: Date.now(), data: commits });
	return commits;
};

const getTrackedRepos = async (max = 10): Promise<string[]> => {
	if (feedRepos.length > 0) {
		return feedRepos.slice(0, max);
	}

	if (!token) {
		return [];
	}

	const now = Date.now();
	if (trackedRepoCache.repos.length && now - trackedRepoCache.timestamp < TRACKED_REPO_CACHE_DURATION) {
		return trackedRepoCache.repos.slice(0, max);
	}

	const repos: string[] = [];
	const perPage = 100;
	let page = 1;

	while (repos.length < max) {
		const query = new URLSearchParams({
			per_page: String(perPage),
			page: String(page),
			sort: 'pushed',
			direction: 'desc',
			visibility: 'all',
			affiliation: 'owner,collaborator,organization_member'
		});

		const response = await fetch(`${apiBase}/user/repos?${query.toString()}`, {
			headers: buildHeaders()
		});

		if (!response.ok) {
			console.error('Failed to fetch repo list', response.status, await response.text());
			break;
		}

		const json = await response.json();
		if (!Array.isArray(json) || json.length === 0) {
			break;
		}

		for (const repo of json) {
			if (repo?.full_name) {
				repos.push(repo.full_name);
			}
			if (repos.length >= max) {
				break;
			}
		}

		if (json.length < perPage) {
			break;
		}

		page += 1;
	}

	trackedRepoCache.timestamp = now;
	trackedRepoCache.repos = repos;

	return repos.slice(0, max);
};

const gatherRepoCommits = async (limit: number, since?: string, until?: string): Promise<GithubCommit[]> => {
	const repos = await getTrackedRepos(limit * 3);
	const perRepoLimit = Math.max(3, Math.ceil(limit / 2));
	const collected: GithubCommit[] = [];

	for (const repo of repos) {
		const repoData = await fetchRepoCommits(repo, perRepoLimit, since, until);
		collected.push(...repoData);
	}

	return collected
		.sort((a, b) => {
			const aDate = new Date(a.commit.author.date).getTime();
			const bDate = new Date(b.commit.author.date).getTime();
			return bDate - aDate;
		})
		.slice(0, limit);
};

const useRepoFeed = () => feedRepos.length > 0 || Boolean(token);

export async function fetchRecentCommits(limit = 5): Promise<GithubCommit[]> {
	const now = Date.now();
	if (now - recentCache.timestamp < RECENT_CACHE_DURATION && recentCache.data.length) {
		return recentCache.data.slice(0, limit);
	}
	let pool = useRepoFeed() ? await gatherRepoCommits(limit * 2) : [];
	if (!pool.length) {
		pool = await gatherPushCommits(limit * 2);
	}
	recentCache.timestamp = now;
	recentCache.data = pool;
	return pool.slice(0, limit);
}

export async function fetchCommitsBetween(since?: string, until?: string, limit = 10): Promise<GithubCommit[]> {
	if (!since || !until) return [];
	const sinceDate = new Date(since);
	const untilDate = new Date(until);
	if (Number.isNaN(sinceDate.getTime()) || Number.isNaN(untilDate.getTime())) return [];

	const key = `${since}_${until}_${limit}_${useRepoFeed() ? 'repo' : 'events'}`;
	const now = Date.now();
	const cached = rangeCache.get(key);
	if (cached && now - cached.timestamp < RANGE_CACHE_DURATION) {
		return cached.data;
	}

	let pool = useRepoFeed()
		? await gatherRepoCommits(limit * 2, sinceDate.toISOString(), untilDate.toISOString())
		: [];
	if (!pool.length) {
		pool = await gatherPushCommits(limit * 6);
	}
	const filtered = useRepoFeed()
		? pool
		: pool.filter((commit) => {
				const commitDate = new Date(commit.commit.author.date);
			if (Number.isNaN(commitDate.getTime())) return false;
			return commitDate >= sinceDate && commitDate <= untilDate;
		});
	const sliced = filtered.slice(0, limit);
	rangeCache.set(key, { timestamp: now, data: sliced });
	return sliced;
}
