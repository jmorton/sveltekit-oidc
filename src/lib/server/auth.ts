import { error, type Config, type RequestEvent } from '@sveltejs/kit';
import * as arctic from 'arctic';
import jwt, { type Jwt, type JwtHeader } from 'jsonwebtoken';
import * as env from '$env/static/private';
import type { MaybeToken, MaybeHasuraToken, Rule } from '$lib/types/auth';
import { JwksClient } from 'jwks-rsa';

const DEFAULT_VERIFY_OPTS: jwt.VerifyOptions = {
	ignoreExpiration: false,
	algorithms: ['RS256'],
	issuer: env.OIDC_ISSUER,
}

/**
 * Verify ensures raw token values are signed by the expected issuer and haven't expired.
 *
 * @param token - The raw base64 encoded JWT token to verify. If null, the function will return null.
 * @param opts - Verification options to pass to jsonwebtoken. Defaults to sensible defaults.
 * @returns {Promise<jwt.JwtPayload | null>} The decoded token payload or null if the token is invalid.
 */
export async function verify(token: string, opts: jwt.VerifyOptions = DEFAULT_VERIFY_OPTS): Promise<string | jwt.Jwt | jwt.JwtPayload> {
	const client = new JwksClient({ jwksUri: env.OIDC_JWKS_URL });
	const header = jwt.decode(token, { complete: true })?.header;
	if (!header) throw new Error("Malformed token: no header present.");
	const key = await client.getSigningKey(header.kid);
	return jwt.verify(token, key.getPublicKey(), opts);
};

/**
 * Set `event.locals.tokens` with decoded and verified JWT access and id tokens.
 *
 * This handler **guarantees** that only valid tokens are set in locals.
 *
 * Refresh tokens are never verified or stored because a) they are not
 * signed and b) they are never to be used in client-side code.
 *
 * If tokens are invalid, they are set to `null` in `event.locals.tokens`.
 *
 * @param {RequestEvent} event - The SvelteKit request event containing cookies.
 */
export async function handler(event: RequestEvent): Promise<void> {

	// TBD:
	// 1. Does refreshing the token here make sense?
	// 2. Will setting locals cause cause problems with the client side refresh code?
	// 3. How does this interact with /auth/callback and /auth/refresh?
	//
	// await refresh(event.cookies).catch((err) => {
	// 	console.error('Error refreshing tokens:', err);
	// });

	try {
		console.log('Decoding access and ID tokens from cookies');
		const access = event.cookies.get('accessToken');
		const accessToken = access ? await verify(access) : null;
		const id = event.cookies.get('idToken');
		const idToken = id ? await verify(id) : null;
		event.locals.tokens = { accessToken, idToken }
		event.locals.roles = accessToken?.["https://hasura.io/jwt/claims"]?.["x-hasura-allowed-roles"]
	} catch (err) {
		console.error('Error verifying tokens:', err);
		event.locals.tokens = { accessToken: null, idToken: null };
	}
}

export class Client {

	private static _instance: Client;

	authorizationEndpoint: string;
	tokenEndpoint: string;
	redirectEndpoint: string;
	audience?: string;
	issuer?: string;
	clientId?: string;
	clientSecret?: string;
	client: arctic.OAuth2Client;

	private constructor(init?: Partial<Config>) {
		Object.assign(this, init);
		if (env.OIDC_WELL_KNOWN_URL) {
			fetch(env.OIDC_WELL_KNOWN_URL)
				.then((res) => res.json())
				.then((data) => {
					this.authorizationEndpoint ??= data.authorizationEndpoint;
					this.tokenEndpoint ??= data.tokenEndpoint;
					this.jwksUri ??= data.jwksUri;
					this.issuer ??= data.issuer;
					this.audience ??= data.audience;
				}).catch((err) => {
					console.error('Error fetching OIDC configuration:', err);
				});
		}
		this.authorizationEndpoint ??= env.OIDC_AUTHORIZATION_URL;
		this.tokenEndpoint ??= env.OIDC_TOKEN_URL;
		this.redirectEndpoint ??= env.OIDC_REDIRECT_URI;
		this.issuer ??= env.OIDC_ISSUER;
		this.audience ??= env.OIDC_AUDIENCE;
		this.clientId ??= env.OIDC_CLIENT_ID;;
		this.clientSecret ??= env.OIDC_CLIENT_PASSWORD;
		this.client = new arctic.OAuth2Client(this.clientId, this.clientSecret, this.redirectEndpoint);
		console.log(this);
	}

	static get instance() {
		this._instance ??= new Client();
		return this._instance;
	}

	async validateAuthorizationCode(code: string, verifier: string): Promise<any> {
		if (!this.client) throw new Error('OAuth2 client not initialized');
		return this.client.validateAuthorizationCode(this.tokenEndpoint, code, verifier);
	}

	createAuthorizationURLWithPKCE(): { verifier: string, state: string, authorizationUrl: URL } {
		if (!this.client) throw new Error('OAuth2 client not initialized');
		const scopes: string[] = ['openid', 'profile', 'email'];
		const verifier: string = arctic.generateCodeVerifier();
		const state: string = arctic.generateState();
		const authorizationUrl: URL = this.client.createAuthorizationURLWithPKCE(
			this.authorizationEndpoint,
			state,
			arctic.CodeChallengeMethod.S256,
			verifier,
			scopes
		);
		return { verifier, state, authorizationUrl }
	}

	refreshAccessToken(refreshToken: string): Promise<arctic.OAuth2Tokens> {
		if (!this.client) throw new Error('OAuth2 client not initialized');
		const scopes: string[] = ['openid', 'profile', 'email'];
		return this.client.refreshAccessToken(this.tokenEndpoint, refreshToken, scopes);
	}

}

///
/// Helpers for guarding against unauthorized access.
///

/**
 * Helper function for +server.ts or +page.server.ts to enforce the existence of certain roles.
 *
 * @param token
 * @returns
 */
export function roles(token: MaybeHasuraToken) {
	if (!token) {
		throw error(401, "No token found, you must be logged in to view this page");
	}

	// This is intentionally specific to Hasura claims... Other parts of the Aerie system
	// rely on this to determine a user's roles. In theory, this could be factored out to use
	// a jq or JSON path expression provided as an environment variable, but that adds a lot
	// more sophistication than what we can handle right now.
	let roles = token?.["https://hasura.io/jwt/claims"]?.["x-hasura-allowed-roles"];

	// This error is intended to help people get their IdP configured properly. Without it
	// people could present perfectly valid tokens and still get an error that tells them
	// they don't have a role.
	if (!roles) {
		throw error(403, "Token is present but your IdP did not add Hasura claims 'https://hasura.io/jwt/claims'");
	}

	// We think it's ok to tell people the expected role without leaking sensitive security
	// details.
	return {
		require: (role: string) => {
			if (!roles.includes(role)) {
				throw error(403, `Your token's roles do not include '${role}'`)
			}
		}
	}
};

/*
 * This function provides developers with a way to evaluate their own rule
 * against an access token in +page.server.ts or +layout.server.ts
 *
 * It is **NOT** responsible for decoding the token, refreshing it, or
 * validating it.
 *
 * https://svelte.dev/docs/kit/load#Implications-for-authentication
 *
 * There are a few possible strategies to ensure an auth check occurs before protected code.
 *
 * To prevent data waterfalls and preserve layout load caches:
 *
 * Use hooks to protect multiple routes before any load functions run
 *
 * Use auth guards directly in +page.server.js load functions for route specific protection
 * Putting an auth guard in +layout.server.js requires all child pages to call
 * await parent() before protected code. Unless every child page depends on
 * returned data from await parent(), the other options will be more performant.
 */
export function enforce(accessToken: MaybeHasuraToken, rule: Rule): boolean {
	// Any value other than 'true' is considered a failure. This is intentional.
	if (rule(accessToken) === true) {
		return true;
	} else {
		throw error(403, 'Unauthorized access: Rule evaluation failed');
	};
}