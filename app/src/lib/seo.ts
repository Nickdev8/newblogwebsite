export const SITE_URL = 'https://blog.nickesselman.nl';
export const SITE_NAME = "Nick's Blogs & Adventures";
export const SITE_AUTHOR = 'Nick Esselman';
export const SITE_AUTHOR_URL = 'https://nickesselman.nl';
export const SITE_DESCRIPTION =
	'Trip journals, build notes, and long-form travel stories by Nick Esselman.';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.jpg';
export const DEFAULT_OG_IMAGE = `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;
export const DEFAULT_ROBOTS =
	'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';

export type JsonLd = Record<string, unknown>;

export type SeoData = {
	title: string;
	description: string;
	canonical: string;
	robots: string;
	ogType: 'website' | 'article' | 'profile';
	image: string;
	imageAlt: string;
	structuredData: JsonLd[];
	publishedTime?: string;
	modifiedTime?: string;
};

type BuildSeoInput = {
	title?: string;
	description?: string;
	pathname?: string;
	robots?: string;
	ogType?: SeoData['ogType'];
	image?: string;
	imageAlt?: string;
	structuredData?: JsonLd[];
	publishedTime?: string;
	modifiedTime?: string;
};

const createPersonReference = () => ({
	'@type': 'Person',
	name: SITE_AUTHOR,
	url: SITE_AUTHOR_URL
});

export const toAbsoluteUrl = (pathname = '/') => {
	if (/^https?:\/\//i.test(pathname)) return pathname;
	const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return new URL(normalized, `${SITE_URL}/`).toString();
};

export const toAbsoluteImage = (value?: string) => {
	if (!value) return DEFAULT_OG_IMAGE;
	return /^https?:\/\//i.test(value) ? value : toAbsoluteUrl(value);
};

export const humanizeSlug = (value: string) =>
	value
		.split(/[-_]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

export const buildSeo = ({
	title,
	description = SITE_DESCRIPTION,
	pathname = '/',
	robots = DEFAULT_ROBOTS,
	ogType = 'website',
	image,
	imageAlt,
	structuredData = [],
	publishedTime,
	modifiedTime
}: BuildSeoInput = {}): SeoData => ({
	title: title ? `${title} | ${SITE_NAME}` : SITE_NAME,
	description,
	canonical: toAbsoluteUrl(pathname),
	robots,
	ogType,
	image: toAbsoluteImage(image),
	imageAlt: imageAlt || title || SITE_NAME,
	structuredData,
	publishedTime,
	modifiedTime
});

export const defaultSeo = buildSeo();

export const serializeJsonLd = (value: JsonLd) => JSON.stringify(value).replace(/</g, '\\u003c');

export const createWebsiteSchema = (): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: SITE_NAME,
	url: SITE_URL,
	description: SITE_DESCRIPTION,
	inLanguage: 'en',
	publisher: createPersonReference()
});

export const createCollectionPageSchema = ({
	name,
	description,
	pathname,
	image
}: {
	name: string;
	description: string;
	pathname: string;
	image?: string;
}): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'CollectionPage',
	name,
	description,
	url: toAbsoluteUrl(pathname),
	inLanguage: 'en',
	primaryImageOfPage: toAbsoluteImage(image),
	isPartOf: {
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_URL
	}
});

export const createItemListSchema = (
	items: { name: string; pathname: string; description?: string }[]
): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'ItemList',
	itemListElement: items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		url: toAbsoluteUrl(item.pathname),
		name: item.name,
		description: item.description
	}))
});

export const createAboutPageSchema = ({
	description,
	pathname,
	image
}: {
	description: string;
	pathname: string;
	image?: string;
}): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'AboutPage',
	name: `About ${SITE_AUTHOR}`,
	description,
	url: toAbsoluteUrl(pathname),
	inLanguage: 'en',
	about: createPersonReference(),
	primaryImageOfPage: toAbsoluteImage(image)
});

export const createPersonSchema = ({
	description,
	image
}: {
	description: string;
	image?: string;
}): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: SITE_AUTHOR,
	url: SITE_AUTHOR_URL,
	description,
	image: toAbsoluteImage(image),
	sameAs: [SITE_AUTHOR_URL]
});

export const createArticleSchema = ({
	headline,
	description,
	pathname,
	image,
	datePublished,
	dateModified
}: {
	headline: string;
	description: string;
	pathname: string;
	image?: string;
	datePublished?: string;
	dateModified?: string;
}): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	headline,
	description,
	url: toAbsoluteUrl(pathname),
	mainEntityOfPage: toAbsoluteUrl(pathname),
	image: [toAbsoluteImage(image)],
	inLanguage: 'en',
	author: createPersonReference(),
	publisher: createPersonReference(),
	datePublished,
	dateModified: dateModified || datePublished,
	isPartOf: {
		'@type': 'Blog',
		name: SITE_NAME,
		url: SITE_URL
	}
});

export const createBreadcrumbSchema = (
	items: { name: string; pathname: string }[]
): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.name,
		item: toAbsoluteUrl(item.pathname)
	}))
});
