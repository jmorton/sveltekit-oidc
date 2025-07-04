import { jwtDecode } from 'jwt-decode';
import { accessToken } from '$lib/stores/auth';

export function expiresAt(token: any): Date | void {
	if (token && token.exp) {
		console.log('Token expiration time:', token.exp);
		return new Date(token.exp * 1000);
	} else {
		throw new Error('Token does not have an expiration time');
	}
}

export async function refreshAccessToken(): Promise<void> {
	console.log('Refreshing access token...');
	const res = await fetch('/auth/refresh', { method: 'POST' });
	if (res.ok) {
		console.log('Access token refreshed successfully.');
		const data = await res.json();
		const token = jwtDecode(data.access_token);
		accessToken.set(token);
	} else if (res.status === 401) {
		console.error('Unauthorized: Access token refresh failed. Please log in again.');
		window.location.href = '/auth/login';
	} else {
		console.error('Failed to refresh access token:', res.statusText);
	}
}

export async function logout(): Promise<void> {
	console.log('Logging out...');
	const res = await fetch('/auth/logout', { method: 'POST' });
	if (res.ok) {
		console.log('Logged out successfully.');
		accessToken.set(null);
		window.location.href = '/';
	} else {
		console.error('Failed to log out:', res.statusText);
	}
}
