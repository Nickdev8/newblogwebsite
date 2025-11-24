import { env } from '$env/dynamic/public';

const fallbackWords = ['Neighborhood', 'Shipwrecked', 'Undercity', 'Hack Club'];

const parseWords = (raw?: string) =>
	raw
		?.split(/[,\\n]/)
		.map((word) => word.trim())
		.filter(Boolean);

const resolvedWords = parseWords(env.PUBLIC_NO_TRANSLATE_WORDS) ?? [];

export const noTranslateWords = resolvedWords.length > 0 ? resolvedWords : fallbackWords;

export function wrapNoTranslateWords(content: string): string {
	const sorted = [...new Set(noTranslateWords)].sort((a, b) => b.length - a.length);

	for (const word of sorted) {
		if (!word) continue;
		const escaped = word.replace(/[-/\\^$*+?.()|[\\\]{}]/g, '\\$&');
		const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
		content = content.replace(regex, '<span translate="no">$1</span>');
	}

	return content;
}
