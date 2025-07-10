import { json } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
// import { TokenExpiredError } from 'jsonwebtoken';

/**
 * Requests a new access and refresh token.
 *
 * This endpoint is intended to be called from the client at a regular interval.
 *
 * @param { cookies } - Expected to contain a 'refreshToken' cookie.
 * @returns JSON response with new access token or error.
 */
export const POST = async ({ cookies }) => {
	console.debug('/auth/refresh');

	const refreshToken = cookies.get('refreshToken');

	if (!refreshToken) {
		return json({ error: 'unauthenticated' }, { status: 401 });
	}

	try {
		const client = auth.Client.instance;
		const tokens = await client.refreshAccessToken(refreshToken);

		cookies.set('idToken', tokens.accessToken(), { path: '/' });
		cookies.set('accessToken', tokens.accessToken(), { path: '/' });
		cookies.set('refreshToken', tokens.refreshToken(), { path: '/' });

		return json({
			accessToken: tokens.accessToken(),
			idToken: tokens.idToken()
		});
	} catch (e) {
		console.error('Error refreshing token:', e);
		return json(
			{
				error: 'token_refresh_failed',
				message: e?.message || 'An error occurred while refreshing the token.'
			},
			{ status: 500 }
		);
	}
};
