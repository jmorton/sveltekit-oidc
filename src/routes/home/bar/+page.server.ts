import { roles } from '$lib/server/auth';
import * as rule from '$lib/server/rule';
import type { MaybeToken } from '$lib/types/auth.js';
import type { JwtPayload } from 'jsonwebtoken';

export async function load({ locals }) {
    roles(locals.tokens.accessToken).require('aerie_admin');
}



