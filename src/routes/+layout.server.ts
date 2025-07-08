import type { DecodedTokenType } from '$lib/types/auth';
import * as auth from '../lib/server/auth';

export async function load({ cookies }) {
	await auth.authorize(cookies, (access_token: DecodedTokenType, id_token: DecodedTokenType, refresh_token: DecodedTokenType) => {
		console.log(access_token);

		// other stuff? modify? unpack? etc.
		
		return {
			access_token,
			id_token,
			refresh_token
		}
	});

	// other stuff, not necessarily auth.
}
