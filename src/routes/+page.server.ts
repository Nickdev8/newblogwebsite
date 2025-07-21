import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export async function load() {
	const postsDir = 'src/posts';
	const files = fs.readdirSync(postsDir);

	const events = files
		.filter((filename) => filename.endsWith('.md'))
		.map((filename) => filename.replace(/\.md$/, ''));

	return { events };
}