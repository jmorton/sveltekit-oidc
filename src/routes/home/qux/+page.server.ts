import { enforce } from '$lib/server/auth';

// If an error is thrown during the evaluation of the rule,
// it will be caught by the SvelteKit error handler, which will
// return a 500 error.
export async function load({ locals }) {
    enforce(locals.tokens.accessToken, () => {
        throw new Error('What happens if the rule produces an error?');
    });
}