import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { RequestHandler } from './$types';

const TYPES_FILE = path.resolve('src/data/reaction-types.json');
const DEFAULT_TYPES = [
  { key: 'laugh', emoji: '🤣' },
  { key: 'cry',   emoji: '😢' },
  { key: 'wow',   emoji: '😮' },
  { key: 'heart', emoji: '❤️' },
  { key: 'up',    emoji: '👍' }
];

export const GET: RequestHandler = async () => {
  try {
    const raw = await fs.readFile(TYPES_FILE, 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) return json(arr);
  } catch {}
  return json(DEFAULT_TYPES);
};

