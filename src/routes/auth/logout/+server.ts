import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	console.debug('/auth/logout');

	// Do you want to invalidate the session on the OIDC server?

	cookies.delete('accessToken', { path: '/' });
	cookies.delete('idToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
	throw redirect(302, '/');
};
