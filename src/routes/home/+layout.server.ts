import { enforce } from '$lib/server/auth';

export async function load({ locals }) {
	enforce(locals.tokens.accessToken, (token: any) => {
		const roles = token?.['resource_access']?.['ssmo-dev-missions-mms-aerie']?.['roles'];
		return roles && roles.includes('aerie-user')
	});
}