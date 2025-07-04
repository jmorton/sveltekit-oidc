import * as auth from '../lib/server/auth';

export async function load({ cookies }) {
	const { access_token } = auth.decode(cookies);
	return { access_token };
}
