import { roles } from '$lib/server/auth';

// If an error is thrown during the evaluation of the rule,
// it will be caught by the SvelteKit error handler, which will
// return a 500 error.
export async function load({ locals: { tokens: { accessToken: token } } }) {
    roles(token).require('non-existent-role');
}