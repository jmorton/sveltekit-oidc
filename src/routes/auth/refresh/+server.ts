import { json } from '@sveltejs/kit';
import { init } from '$lib/server/auth';

/**
 * Requests a new access and refresh token.
 *
 * This endpoint is intended to be called from the client at a regular interval.
 *
 * @param { cookies } - Expected to contain a 'refresh_token' cookie.
 * @returns JSON response with new access token or error.
 */
export const POST = async ({ cookies }) => {
	console.debug('/auth/refresh');

	const refreshToken = cookies.get('refresh_token');
	if (!refreshToken) {
		return json({ error: 'unauthenticated' }, { status: 401 });
	}

	try {
		const { client, config } = await init();
		const scopes = ['openid', 'profile', 'email'];

		const tokens = await client.refreshAccessToken(config.token_endpoint, refreshToken, scopes);

		cookies.set('id_token', tokens.accessToken(), { path: '/' });
		cookies.set('access_token', tokens.accessToken(), { path: '/' });
		cookies.set('refresh_token', tokens.refreshToken(), { path: '/' });

		return json({
			access_token: tokens.accessToken(),
			id_token: tokens.idToken()
		});
	} catch (e) {
		console.error('Error refreshing token:', e);
		return json(
			{
				error: 'token_refresh_failed',
				message: e?.message || 'An error occurred while refreshing the token.'
			},
			{ status: 401 }
		);
	}
};
