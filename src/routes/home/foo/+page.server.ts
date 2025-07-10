import { roles } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

export async function load({ locals: { tokens: { accessToken: token } } }) {
	roles(token).require('aerie-super-user');
}