import { redirect, type Cookies } from '@sveltejs/kit';
import fetch from 'node-fetch';
import * as arctic from 'arctic';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import type { CookieSerializeOptions } from 'cookie';

import {
	OIDC_WELL_KNOWN_URL,
	OIDC_CLIENT_ID,
	OIDC_CLIENT_SECRET,
	OIDC_REDIRECT_URI
} from '$env/static/private';

/**
 * Initialize an OAuth2 client and fetches the OIDC configuration.
 *
 * @async
 * @function init
 * @returns {Promise<{ client: arctic.OAuth2Client, config: any }>}
 *
 * @returns An initialized OAuth2 client and the OIDC configuration.
 */
export async function init(): Promise<{ client: arctic.OAuth2Client; config: any }> {
	const config = await fetch(OIDC_WELL_KNOWN_URL).then((res) => res.json());
	const client = new arctic.OAuth2Client(OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_REDIRECT_URI);
	return { client, config };
}

/**
 * Decodes the access and refresh tokens from cookies.
 *
 * @param cookies
 * @returns { access_token?: JwtPayload | null; refresh_token?: JwtPayload | null }
 */
export function decode(cookies: Cookies): {
	access_token?: JwtPayload | null;
	refresh_token?: JwtPayload | null;
	id_token?: JwtPayload | null;
} {
	try {
		const access_cookie = cookies.get('access_token') || null;
		const access_token = access_cookie && jwtDecode(access_cookie);
		const id_cookie = cookies.get('id_token') || null;
		const id_token = id_cookie && jwtDecode(id_cookie);
		const refresh_cookie = cookies.get('refresh_token') || null;
		const refresh_token = refresh_cookie && jwtDecode(refresh_cookie);
		console.log({ id_token });
		return {
			access_token,
			id_token,
			refresh_token
		};
	} catch (error) {
		console.error('Error decoding access token:', error);
		return {};
	}
}
