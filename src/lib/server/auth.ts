import { redirect, type Cookies } from '@sveltejs/kit';
import * as arctic from 'arctic';
import { jwtDecode, type JwtHeader } from 'jwt-decode';
import { JwksClient } from 'jwks-rsa';
import jwt, { type GetPublicKeyOrSecret, type VerifyOptions } from 'jsonwebtoken'; 
import {
	OIDC_CLIENT_ID,
	OIDC_REDIRECT_URI,
	OIDC_AUTHORIZATION_URL,
	OIDC_TOKEN_URL
} from '$env/static/private';
import type { ConfigType, CookieType, DecodedTokenType, RefreshOpts, RuleType } from '$lib/types/auth';

/**
 * Initialize an OAuth2 client and fetches the OIDC configuration.
 *
 * @async
 * @function init
 * @returns {Promise<{ client: arctic.OAuth2Client, config: any }>}
 *
 * @returns An initialized OAuth2 client and the OIDC configuration.
 */

export async function init(): Promise<{ client: arctic.OAuth2Client; config: ConfigType }> {
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
 * @returns { access_token?: DecodedTokenType; refresh_token?: DecodedTokenType }
 */
export function decode(access_cookie: CookieType, id_cookie: CookieType, refresh_cookie: CookieType): {
	access_token: DecodedTokenType;
	id_token: DecodedTokenType;
	refresh_token: DecodedTokenType;
} {
	try {
		const access_token = access_cookie ? jwtDecode(access_cookie) : null;
		const id_token = id_cookie ? jwtDecode(id_cookie) : null;
		const refresh_token = refresh_cookie ? jwtDecode(refresh_cookie) : null;
		console.log({ id_token });
		return {
			access_token,
			id_token,
			refresh_token
		};
	} catch (error) {
		console.error('Error decoding access token:', error);
		return {
			access_token: null,
			id_token: null,
			refresh_token: null,
		};
	}
}

// made sense to curry this vs. define it in validate
// TODO: extract to a different file
const getJwksKey: (client: JwksClient) => GetPublicKeyOrSecret = (client: JwksClient) => {
	return function(header: JwtHeader, callback) {
		client.getSigningKey(header.kid, function(err, key) {
			if (key) {
				const signingKey = key.getPublicKey();
				// const algorithm: jwt.Algorithm = key.alg as jwt.Algorithm;
				// algorithms.splice(1, 0, algorithm);
				callback(null, signingKey);
			}
			else {
				console.error(err)
				callback(err);
			}
		});
	}
}




// TODO: implement this to validate token authenticity
// TODO: env vars
// key should be bound BEFORE validate is called

	// // https://www.npmjs.com/package/jsonwebtoken
	// const client = new JwksClient({
    //     jwksUri: "https://keycloak.shared-services.appdat.jsc.nasa.gov/auth/realms/ssmo-dev/protocol/openid-connect/certs" // env var
	// });
export async function validate(access_token: string, key: jwt.Secret | jwt.PublicKey | GetPublicKeyOrSecret) {
	// am I the intended audience for this token?
	const audience: [string | RegExp, ...(string | RegExp)[]] = [
		'ssmo-dev-missions-mms-aerie',
	] 

	// check is the issuer one we are familiar with?
	const issuer: string = 'https://keycloak.shared-services.appdat.jsc.nasa.gov/auth/realms/ssmo-dev'

	// set a default value for the algorithm, but we CAN get it from the key
	// TODO: figure out how to do this correctly
	const algorithms: jwt.Algorithm[] = ['RS256']

	const verifyJwt = async function(token: string, options: VerifyOptions = {}): Promise<string | jwt.Jwt | jwt.JwtPayload> {
		return new Promise((resolve, reject) => {
			// is the signature, audience, and issuer (see options) correct?
			jwt.verify(token, key, options, (err, decoded) => {
				if (err || decoded === undefined) return reject(err);
				resolve(decoded);
			});
		});
	}

	try {
		const jwtPayload = await verifyJwt(access_token, { algorithms, audience, issuer });
		console.log('JWT payload:', jwtPayload);
		return {jwtErrorMessage: '', jwtPayload: jwtPayload}
	} catch (err) {
		return {jwtErrorMessage: 'JWT verification failed: ' + err, jwtPayload: null}
	}
}

// TODO: define a type for tuple of access_token, id_token, refresh_token
function extractAuthTokens(cookies: Cookies): {
	access_cookie: CookieType,
	id_cookie: CookieType,
	refresh_cookie: CookieType
} {
	const access_cookie = cookies.get('access_token') || null;
	const id_cookie = cookies.get('id_token') || null;
	const refresh_cookie = cookies.get('refresh_token') || null;

	// TODO: should we just throw an error if something is null? none of these should be missing...
	return {
		access_cookie,
		id_cookie,
		refresh_cookie
	}
}

function getKey() {
	// get key from env vars

	// return it
}

export async function authorize(cookies: Cookies, rule: RuleType, opts: {refresh: RefreshOpts} = { refresh: 'auto'}) {
	let access_cookie: CookieType, id_cookie: CookieType, refresh_cookie: CookieType
	({ access_cookie, id_cookie, refresh_cookie } = extractAuthTokens(cookies));

	// optionally refresh, if we want to on reload
	if (opts.refresh === 'always' || stale(access_cookie) && fresh(refresh_cookie)) {
		// we know refresh_cookie is not null now, because it is fresh. unfortunately that syntactic sugar means we must cast.
		({ access_cookie, id_cookie, refresh_cookie } = await refresh(refresh_cookie as string));
	}

	// validate them
	const validated = await validate(access_token, getKey());

	if (validated.jwtPayload) {
		const { access_token, id_token, refresh_token} = decode(access_cookie, id_cookie, refresh_cookie);
		const result = rule(access_token, id_token, refresh_token); // check some rule on the tokens, i.e. all present or none present...
		if (result)
			return { access_token, id_token, refresh_token, result }
		else
			throw redirect(403, '/auth/login')
	}
	else {
		throw redirect(403, '/auth/login') // IS THIS GOOD?
	}
}

function fresh(token: CookieType) {
	return !stale(token);
}

function stale(token: CookieType) {
	return token && token.length > 0;
}

// TODO: universalize access_token vs. accessToken (snake_case vs. camelCase)
async function refresh(refreshToken: string): Promise<{ access_cookie: string, id_cookie: string, refresh_cookie: string }> {
	// if this is not a refresh token, laugh. point. bail.
	const { client, config } = await init();
	const tokens = await client.refreshAccessToken(config.token_endpoint, refreshToken, ["openid profile email"]);
	return {
		access_cookie: tokens.accessToken(),
		id_cookie: tokens.idToken(),
		refresh_cookie: tokens.refreshToken()
	}
}