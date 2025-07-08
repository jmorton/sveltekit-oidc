import type { AuthToken, DecodedAuthToken } from "$lib/types/auth";

// helpers to check if a token of any token type is fresh or stale
export function fresh(token: AuthToken | DecodedAuthToken): boolean {
	return !stale(token);
}

export function stale(token: AuthToken | DecodedAuthToken): boolean {
    if (isAuthToken(token)) {
        return staleAuthToken(token)
    }
    return staleDecodedAuthToken(token);
}
// because functionality varies slightly if the token is Auth or DecodedAuth, 
//      I have broken things down into helpers
function isAuthToken(token: AuthToken | DecodedAuthToken): token is AuthToken {
    return String(token) === token
}
function staleAuthToken(token: AuthToken) {
	return token === null || token.length > 0;
}
function staleDecodedAuthToken(token: DecodedAuthToken) {
    return token === null;
}