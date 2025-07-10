// See https://svelte.dev/docs/kit/types#app.d.ts

import type { DecodedAuthTokenSet, MaybeToken } from "$lib/types/auth";
import type { JwtPayload } from "jsonwebtoken";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			tokens: {
				accessToken: MaybeToken | MaybeHasuraToken;
				idToken: MaybeToken;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
