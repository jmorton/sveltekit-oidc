import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	console.debug('/auth/logout');

	// Do you want to invalidate the session on the OIDC server?

	cookies.delete('access_token', { path: '/' });
	cookies.delete('id_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });
	throw redirect(302, '/');
};
