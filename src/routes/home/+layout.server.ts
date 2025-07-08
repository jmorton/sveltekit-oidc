import { allPresent } from '$lib/server/rules';
import * as auth from '../../lib/server/auth';


export async function load({ cookies }) {
	await auth.authorize(cookies, allPresent);
}