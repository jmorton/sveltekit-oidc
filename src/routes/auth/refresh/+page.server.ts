console.log('The refresh page obtains new access tokens using the refresh token.');

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import * as arctic from 'arctic';
import * as auth from '$lib/server/auth';

// These values should be read from environment variables or a configuration in production.

const { client, config } = await auth.init();
const scopes = ['openid', 'profile', 'email'];

export const load: PageServerLoad = async ({ cookies, url }) => {
	const refreshToken = cookies.get('refresh_token');
	if (!refreshToken) {
		throw redirect(302, '/auth/login');
	}

	try {
		// Pass an empty `scopes` array to keep using the same scopes.
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
	} catch (e) {
		console.error('Error refreshing access token:', e);
		throw redirect(302, '/auth/login');
	}
};
