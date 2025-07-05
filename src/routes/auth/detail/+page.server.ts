import type { PageServerLoad } from './$types';
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies }) => {
	console.debug('/auth/detail load');

	// It is possible there is no verifier. The only time a verifier is set is
	// between the login and callback pages. If the callback page fails to run
	// successfully after calling login, the verifier *may* be set.
	const verifier = cookies.get('verifier');

	// Access and refresh tokens are present after the callback runs successfully.
	const { access_token, id_token } = auth.decode(cookies);

	// There is a risk to exposing the value of the refresh token in the client.
	return { verifier, access_token, id_token };
};
