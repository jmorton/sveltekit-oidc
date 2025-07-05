import * as auth from '../lib/server/auth';

export async function load({ cookies }) {
	const { access_token, id_token } = auth.decode(cookies);
	return { access_token, id_token };
}
