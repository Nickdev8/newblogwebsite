import { browser } from '$app/environment';

const READER_ID_KEY = 'reader_id';

const getStoredId = () => {
	if (!browser) return null;
	return localStorage.getItem(READER_ID_KEY);
};

export const getOrCreateReaderId = () => {
	if (!browser) return '';
	const stored = getStoredId();
	if (stored) return stored;
	const id = crypto.randomUUID();
	localStorage.setItem(READER_ID_KEY, id);
	return id;
};

export type ReaderEvent =
	| {
			kind: 'visit';
			path: string;
			referrer: string;
			device: 'mobile' | 'desktop';
	  }
	| {
			kind: 'post_view';
			event: string;
			path: string;
	  }
	| {
			kind: 'name';
			name: string;
	  }
	| {
			kind: 'language';
			language: 'en' | 'nl';
	  }
	| {
			kind: 'scroll';
			event: string;
			path: string;
			percent: number;
	  };

export const trackReaderEvent = async (payload: ReaderEvent) => {
	if (!browser) return;
	const anonId = getOrCreateReaderId();
	try {
		await fetch('/api/readers', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ ...payload, anonId })
		});
	} catch (error) {
		console.warn('Reader tracking failed', error);
	}
};
