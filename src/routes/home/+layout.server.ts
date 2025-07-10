import { enforce, type MaybeHasuraToken } from '$lib/server/auth';

export async function load({ locals: { tokens: { accessToken: token } } }) {
	enforce(token, (token: MaybeHasuraToken) => {
		const roles: string[] = token?.["https://hasura.io/jwt/claims"]?.['x-hasura-allowed-roles'] || [];
		return roles.length > 0;
	});
}