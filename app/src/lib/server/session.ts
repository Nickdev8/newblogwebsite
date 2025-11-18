import crypto from 'crypto';

export const COOKIE_NAME = 'admin_session';

export const computeSignature = (password: string) =>
	crypto.createHash('sha256').update(password).digest('hex');
