console.log('The callback page handles OAuth2 callbacks from the identity provider.');

import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { accessToken } from '$lib/stores/auth';

/**
 * The login page produces a code verifier and an authorization URL.
 *
 * It is critical to implement the following security measures:
 *
 * 1. **State Parameter**: The state parameter is used to prevent CSRF attacks
 * 2. **PKCE**: The Proof Key for Code Exchange (PKCE) is used to enhance security in public clients.
 * 3. **Secure Cookies**: Cookies should be set with `httpOnly`, `secure`, and `sameSite` attributes to prevent XSS and CSRF attacks.
 * 4. **Validate iss, aud, and exp claims** to ensure it is issued by the expected identity provider and is not expired.
 *
 */
export const load: PageServerLoad = async ({ cookies, url }) => {
	console.debug('/auth/callback load');

	const { client, config } = await auth.init();
	const verifier = cookies.get('verifier') || '';
	const code = url.searchParams.get('code');
	const expectedState = cookies.get('oidc_state') || '';
	const returnedState = url.searchParams.get('state');
	const back = cookies.get('back') || '/';

	try {
		// Validate the state, verifier, and code.
		const problems = check({ config, verifier, code, expectedState, returnedState });

		// Exchange the code for tokens.
		const tokens = await client.validateAuthorizationCode(config.token_endpoint, code, verifier);

		// Check token validity.

		// The max age of the acces token is set to the expiration time of the token
		cookies.set('id_token', tokens.idToken(), { path: '/' });
		cookies.set('access_token', tokens.accessToken(), { path: '/' });
		cookies.set('refresh_token', tokens.refreshToken(), { path: '/auth' });

		// Cleanup cookies used for the OIDC flow.
		cookies.delete('verifier', { path: '/auth' });
		cookies.delete('back', { path: '/auth' });
		cookies.delete('oidc_state', { path: '/auth' });
	} catch (err) {
		throw error(500, `Failed to handle OIDC callback: ${err}`);
	}

	throw redirect(302, back);
};

function check({
	verifier,
	code,
	expectedState,
	returnedState
}: {
	config: {
		token_endpoint: string;
	};
	verifier: string | null;
	code: string | null;
	expectedState: string | null;
	returnedState: string | null;
}) {
	const problems = new Set<string>();
	expectedState || problems.add('Missing expected state');
	returnedState || problems.add('Missing returned state');
	expectedState === returnedState || problems.add('State parameter mismatch');
	verifier || problems.add('Missing verifier');
	code || problems.add('Missing code');
	return problems;
}
