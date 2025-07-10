import { describe, expect, it } from 'vitest';
import { getKey } from './key';

describe('JWKS key handlinging', () => {
	// it('get them from the environment specified location', async () => {
	// 	let key = getKey(process.env.OIDC_JWKS_URL)
	// 	expect(key).toBeDefined()
	// });
	it('is all good', () => {

		const meow = async function () {
			return "meow";
		}

		const moof = meow();

		expect(3).toBe(3);
	})
});
