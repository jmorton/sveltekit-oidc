import { roles } from '$lib/server/auth';

export async function load({ locals: { tokens: { accessToken: token } } }) {
	roles(token).require('aerie-user');
}