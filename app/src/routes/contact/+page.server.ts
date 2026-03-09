import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const CONTACT_URL = 'https://contact.nickesselman.nl/';
const DEFAULT_SOURCE = 'nickesselman.nl';

export const prerender = false;

export const load: PageServerLoad = ({ url }) => {
  const target = new URL(CONTACT_URL);
  const params = new URLSearchParams(url.searchParams);

  if (!params.has('from')) {
    params.set('from', DEFAULT_SOURCE);
  }

  target.search = params.toString();

  throw redirect(308, target.toString());
};
