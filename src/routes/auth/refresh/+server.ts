import { json } from '@sveltejs/kit';
import { init } from '$lib/server/auth';

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

		cookies.set('access_token', tokens.accessToken(), {
			httpOnly: false,
			path: '/',
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		});
		cookies.set('refresh_token', tokens.refreshToken(), {
			httpOnly: true,
			path: '/',
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		});

		return json({
			access_token: tokens.accessToken()
		});
	} catch (e) {
		console.error('Error refreshing token:', e);
		return json({ error: 'token_refresh_failed' }, { status: 401 });
	}
};
