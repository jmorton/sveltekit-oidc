import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	console.debug('/auth/logout');

	cookies.delete('access_token', { path: '/' });
	cookies.delete('id_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/auth' });
	throw redirect(302, '/');
};
