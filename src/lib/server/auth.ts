import { redirect, type Cookies } from '@sveltejs/kit';
import fetch from 'node-fetch';
import * as arctic from 'arctic';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import type { CookieSerializeOptions } from 'cookie';

import {
	OIDC_WELL_KNOWN_URL,
	OIDC_CLIENT_ID,
	OIDC_CLIENT_SECRET,
	OIDC_REDIRECT_URI,
	OIDC_AUTHORIZATION_URL,
	OIDC_TOKEN_URL
} from '$env/static/private';
import { accessToken } from '$lib/stores/auth';

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
	// const config = await fetch(OIDC_WELL_KNOWN_URL).then((res) => res.json());
	const config = {
		authorization_endpoint: OIDC_AUTHORIZATION_URL,
		token_endpoint: OIDC_TOKEN_URL
	}
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

export async function authorize(cookies: Cookies, rule: Function, opts: any = {}) {
	// TBD: check audience, issuer, signature...
	let decoded: any = decode(cookies);
	if (opts.refresh === 'force' || stale(decoded.access_token) && fresh(decoded.refresh_token)) {
		decoded = await refresh(decoded.refresh_token);
	}
	let result = rule(decoded);
	if (result)
		return { ...decoded, result }
	else
		throw redirect(403, '/auth/login')
}

function fresh(token: JwtPayload | null | undefined) {
	return !stale(token);
}

function stale(token: JwtPayload | null | undefined) {
	// check if the refresh_to
	return false;
}

async function refresh(refreshToken) {
	// if this is not a refresh token, laugh. point. bail.
	const { client, config } = await init();
	return await client.refreshAccessToken(config.token_endpoint, refreshToken, ["openid profile email"]);
}