import type { JwtPayload } from 'jwt-decode';
import { writable } from 'svelte/store';

export const accessToken = writable<JwtPayload | null>(null);

export const idToken = writable<JwtPayload | null>(null);
