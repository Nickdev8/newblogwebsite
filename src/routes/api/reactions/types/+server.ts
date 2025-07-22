import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

const TYPES_FILE = path.resolve('src/data/reactionTypes.json');

export const GET: RequestHandler = async () => {
	try {
		return json(JSON.parse(await fs.readFile(TYPES_FILE, 'utf8')));
	} catch {
		return json([]);
	}
};
