import { redirect } from '@sveltejs/kit';
import { authorize } from '$lib/server/auth';
import type { JwtPayload } from 'jwt-decode';

export async function load({ url, cookies }) {
	// This will...
	// 1. Automatically refresh tokens and update cookies
	// 2. Verify issuer, audience, and freshness of token
	await authorize(cookies, (accessToken: JwtPayload): true | false => {
		// use claims and url to make an auth decision
		return true;
	});
}