import { redirect, type Cookies } from '@sveltejs/kit';
import * as arctic from 'arctic';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import jwt, { type GetPublicKeyOrSecret, type VerifyOptions } from 'jsonwebtoken'; 
import {
	OIDC_CLIENT_ID,
	OIDC_REDIRECT_URI,
	OIDC_AUTHORIZATION_URL,
	OIDC_TOKEN_URL
} from '$env/static/private';
import type { AuthorizeOpts, Config, Rule, AuthTokenSet, DecodedAuthTokenSet } from '$lib/types/auth';
import { getAlgorithms, getAudience, getIssuer, getKey, verifyJwt } from './key';
import { fresh, stale } from './util';

/**
 * Initialize an OAuth2 client and fetches the OIDC configuration.
 *
 * @async
 * @function init
 * @returns {Promise<{ client: arctic.OAuth2Client, config: any }>}
 *
 * @returns An initialized OAuth2 client and the OIDC configuration.
 */

export async function init(): Promise<{ client: arctic.OAuth2Client; config: Config }> {
	// const config = await fetch(OIDC_WELL_KNOWN_URL).then((res) => res.json());
	const config = {
		authorization_endpoint: OIDC_AUTHORIZATION_URL,
		token_endpoint: OIDC_TOKEN_URL
	}
	const client = new arctic.OAuth2Client(OIDC_CLIENT_ID, null, OIDC_REDIRECT_URI);
	return { client, config };
}

/**
 * Decodes the access and refresh tokens from cookies.
 *
 * @param cookies
 * @returns { access_token?: DecodedAuthToken; refresh_token?: DecodedAuthToken }
 */
export function decode(tokens: AuthTokenSet): DecodedAuthTokenSet {
	try {
		const decoded_access_token = tokens.access_token ? jwtDecode(tokens.access_token) : null;
		const decoded_id_token = tokens.id_token ? jwtDecode(tokens.id_token) : null;
		const decoded_refresh_token = tokens.refresh_token ? jwtDecode(tokens.refresh_token) : null;
		console.log({ decoded_id_token });
		return {
			decoded_access_token,
			decoded_id_token,
			decoded_refresh_token
		};
	} catch (error) {
		console.error('Error decoding access token:', error);
		return {
			decoded_access_token: null,
			decoded_id_token: null,
			decoded_refresh_token: null,
		};
	}
}

// TODO: implement this to validate token authenticity
// TODO: env vars
// NOTE: alternatively CAN use /realms/{realm}/protocol/openid-connect/token/introspect keycloak endpoint...
export async function validate(access_token: string, key: jwt.Secret | jwt.PublicKey | GetPublicKeyOrSecret): Promise<{jwtErrorMessage: string, jwtPayload: string | jwt.Jwt | JwtPayload | null}> {
	// get the audience and issuer
	const audience: [string | RegExp, ...(string | RegExp)[]] = getAudience();
	const issuer: string = getIssuer();

	// get the algorithms, ideally from the remote endpoint for decoding purpose?
	const algorithms: jwt.Algorithm[] = await getAlgorithms(access_token);

	// compile VerifyOptions
	const options: VerifyOptions = { audience, issuer, algorithms }

	// is the signature, audience, and issuer (see options) correct?
	try {
		const jwtPayload = await verifyJwt(key)(access_token, options);
		console.log('JWT payload:', jwtPayload);
		return {jwtErrorMessage: '', jwtPayload: jwtPayload}
	} catch (err) {
		return {jwtErrorMessage: 'JWT verification failed: ' + err, jwtPayload: null}
	}
}

function extractAuthCookies(cookies: Cookies): AuthTokenSet {
	const access_token = cookies.get('access_token') || null;
	const id_token = cookies.get('id_token') || null;
	const refresh_token = cookies.get('refresh_token') || null;

	return {
		access_token,
		id_token,
		refresh_token
	}
}


// This will...
// 1. Automatically refresh tokens and update cookies
// 2. Verify issuer, audience, and freshness of token
export async function authorize(cookies: Cookies, rule: Rule, opts: AuthorizeOpts = { refresh: 'auto'}): Promise<AuthTokenSet> {
	// extract cookies
	let tokens: AuthTokenSet = extractAuthCookies(cookies)

	// refresh, if needed
	if ((opts.refresh === 'always' || stale(tokens.access_token)) && fresh(tokens.refresh_token)) {
		// if refresh_token is fresh, we can cast it as a string because it is not null.
		tokens = await refresh(tokens.refresh_token as string);
	}

	// validate access_token
	if (fresh(tokens.access_token) && await validate(tokens.access_token as string, getKey())) {
		const decoded_tokens = decode(tokens)

		// check the rule
		const result: boolean = rule(decoded_tokens)
		if (result) {
			// return the tokens
			return tokens
		}
		else {
			// check the rule, if its false, fail
			console.error(`Rule evaluation over "${decoded_tokens}" failed...returning to login.`)
		}
	}
	else {
		// token is invalid, fail
		console.error(`Validation of access token "${tokens.access_token}" failed...returning to login.`)
	}
	throw redirect(403, '/auth/login')
}

// TODO: universalize access_token vs. accessToken (snake_case vs. camelCase)
async function refresh(refreshToken: string): Promise<AuthTokenSet> {
	// TODO: add refresh token validation? entirely clientside...we would add a nonce value when it's retrieved and check it here
	const { client, config } = await init();
	const tokens = await client.refreshAccessToken(config.token_endpoint, refreshToken, ["openid profile email"]);
	return {
		access_token: tokens.accessToken(),
		id_token: tokens.idToken(),
		refresh_token: tokens.refreshToken()
	}
}