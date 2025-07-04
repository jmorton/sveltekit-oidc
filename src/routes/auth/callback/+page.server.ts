console.log('The callback page handles OAuth2 callbacks from the identity provider.');

import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

/**
 * The login page produces a code verifier and an authorization URL.
 */
export const load: PageServerLoad = async ({ cookies, url }) => {
	console.debug('/auth/callback load');

	const { client, config } = await auth.init();
	const verifier = cookies.get('verifier');
	const code = url.searchParams.get('code');
	const back = cookies.get('back') || '/';

	try {
		const tokens = await client.validateAuthorizationCode(config.token_endpoint, code, verifier);
		const opts = {
			path: '/',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		};
		cookies.set('access_token', tokens.accessToken(), opts);
		cookies.set('refresh_token', tokens.refreshToken(), opts);
		cookies.delete('verifier', opts);
		cookies.delete('back', opts);
	} catch (err) {
		throw error(502, `Failed to handle OIDC callback: ${err}`);
	}

	throw redirect(302, back);
};
