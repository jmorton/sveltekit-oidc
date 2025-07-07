import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import * as arctic from 'arctic';
import * as auth from '$lib/server/auth';

/**
 * The login page produces a code verifier and an authorization URL.
 */
export const load: PageServerLoad = async ({ cookies, url }) => {
	console.debug('/auth/login load');

	// Other pages in this app may redirect to the login page with a `back` query parameter.
	// This allows the login page to redirect back to the original page after a successful login.
	// If no `back` parameter is provided, it defaults to the root path.
	const back = url.searchParams.get('back') || '/';
	cookies.set('back', back, {
		httpOnly: true,
		path: '/'
	});

	// Generate a code verifier and store it in a cookie
	const verifier = arctic.generateCodeVerifier();
	cookies.set('verifier', verifier, {
		httpOnly: true,
		path: '/',
		secure: true,
		sameSite: 'lax',
		maxAge: 300
	});

	// Generate the authorization URL.
	let authorizer: URL;
	try {
		const state = arctic.generateState();
		const scopes = ['openid', 'profile', 'email'];
		const { client, config } = await auth.init();
		authorizer = client.createAuthorizationURLWithPKCE(
			config.authorization_endpoint,
			state,
			arctic.CodeChallengeMethod.S256,
			verifier,
			scopes
		);
		cookies.set('oidc_state', state, {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			secure: true,
			maxAge: 300
		});
	} catch (err) {
		let explainer = 'Unknown error occurred while generating the authorization URL.';
		if (err instanceof SyntaxError) {
			explainer = `Failed to parse the OIDC configuration. Please check the OIDC_WELL_KNOWN_URL, it must return a valid JSON object.`;
			console.error('Failed to parse OIDC configuration:', err);
		} else if (err instanceof arctic.OAuth2RequestError) {
			explainer = 'OAuth2 request error occurred. Please check the OIDC client configuration.';
			console.error('OAuth2 error:', err.message);
		} else if (err instanceof arctic.UnexpectedResponseError) {
			explainer = 'Unexpected response from the OIDC server. Please check the OIDC_WELL_KNOWN_URL.';
			console.error('Unexpected response from OIDC server:', err);
		} else {
			explainer = 'An unexpected error occurred while generating the authorization URL.';
			console.error('Unexpected error:', err);
		}
		throw error(502, explainer);
	}
	return redirect(302, authorizer.toString());
};
