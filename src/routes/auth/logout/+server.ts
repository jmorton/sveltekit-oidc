import { json } from '@sveltejs/kit';

/**
 * The login page produces a code verifier and an authorization URL.
 */
export const POST = async ({ cookies }) => {
	console.debug('/auth/logout');

	cookies.delete('access_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });
	return json({
		logout: true
	});
};
