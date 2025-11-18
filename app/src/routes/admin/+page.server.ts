import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { COOKIE_NAME, computeSignature } from '$lib/server/session';

const POSTS_DIR = path.join(process.cwd(), 'src', 'posts');
const SLUG_REGEX = /^[a-zA-Z0-9-_]+$/;

const resolveSlug = (slug: string) => {
	if (!SLUG_REGEX.test(slug)) {
		throw error(400, 'Invalid slug');
	}

	return path.join(POSTS_DIR, `${slug}.md`);
};

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.isAdmin) {
		return {
			loggedIn: false,
			posts: [],
			selectedSlug: null,
			content: '',
			saved: false
		};
	}

	if (!fs.existsSync(POSTS_DIR)) {
		throw error(500, 'Posts directory not found');
	}

	const files = fs
		.readdirSync(POSTS_DIR)
		.filter((file) => file.endsWith('.md'))
		.sort((a, b) => a.localeCompare(b));

	const posts = files.map((filename) => {
		const filePath = path.join(POSTS_DIR, filename);
		const { data } = matter.read(filePath);
		return {
			slug: filename.replace(/\.md$/, ''),
			title: data.title || filename
		};
	});

	const requestedSlug = url.searchParams.get('post');
	const selectedSlug = requestedSlug && posts.some((post) => post.slug === requestedSlug)
		? requestedSlug
		: posts[0]?.slug;

	const content =
		selectedSlug && fs.existsSync(resolveSlug(selectedSlug))
			? fs.readFileSync(resolveSlug(selectedSlug), 'utf-8')
			: '';

	return {
		loggedIn: true,
		posts,
		selectedSlug: selectedSlug ?? null,
		content,
		saved: url.searchParams.get('saved') === '1'
	};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password');
		const adminPassword = env.ADMIN_PASSWORD;

		if (!adminPassword) {
			return fail(500, { loginError: 'ADMIN_PASSWORD is not configured on the server.' });
		}

		if (typeof password !== 'string' || password.length === 0) {
			return fail(400, { loginError: 'Password is required.' });
		}

		if (password !== adminPassword) {
			return fail(401, { loginError: 'Incorrect password.' });
		}

		cookies.set(COOKIE_NAME, computeSignature(adminPassword), {
			path: '/',
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 12
		});

		throw redirect(303, '/admin');
	},
	logout: async ({ cookies }) => {
		cookies.delete(COOKIE_NAME, { path: '/' });
		throw redirect(303, '/admin');
	},
	save: async ({ request, locals }) => {
		if (!locals.isAdmin) {
			throw error(401, 'Unauthorized');
		}

		const data = await request.formData();
		const slug = data.get('slug');
		const content = data.get('content');

		if (typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
			return fail(400, { saveError: 'Invalid slug supplied.' });
		}

		if (typeof content !== 'string') {
			return fail(400, { saveError: 'Invalid content payload.' });
		}

		const filePath = resolveSlug(slug);

		if (!fs.existsSync(filePath)) {
			return fail(404, { saveError: 'Post not found.' });
		}

		fs.writeFileSync(filePath, content.replace(/\r\n/g, '\n'), 'utf-8');

		throw redirect(303, `/admin?post=${encodeURIComponent(slug)}&saved=1`);
	}
};
