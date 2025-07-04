import { authorize } from '$lib/server/auth';

export function load({ cookies, url }) {
	const access_token = authorize(cookies, url);
	return {
		access_token
	};
}
