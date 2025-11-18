import fs from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const configPath = path.join(process.cwd(), 'static', 'admin', 'config.yml');

	if (!fs.existsSync(configPath)) {
		return new Response('Config not found', { status: 404 });
	}

	const yaml = fs.readFileSync(configPath, 'utf-8');
	return new Response(yaml, {
		headers: {
			'Content-Type': 'text/yaml; charset=utf-8'
		}
	});
};
