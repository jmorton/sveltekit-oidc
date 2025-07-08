import type { JwtPayload } from 'jwt-decode';
import { writable } from 'svelte/store';

export const access_token = writable<JwtPayload | null>(null);
export const id_token = writable<JwtPayload | null>(null);
export const refresh_token = writable<JwtPayload | null>(null);
