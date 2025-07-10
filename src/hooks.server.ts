import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	await auth.handler(event); // set locals.tokens
	return await resolve(event);
}