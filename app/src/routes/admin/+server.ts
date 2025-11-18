import fs from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const adminIndexPath = path.join(process.cwd(), 'static', 'admin', 'index.html');

	if (!fs.existsSync(adminIndexPath)) {
		return new Response('Admin UI not configured', { status: 404 });
	}

	const html = fs.readFileSync(adminIndexPath, 'utf-8');

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8'
		}
	});
};
