<script lang="ts">
	// When this component is mounted, it will set an interval to refresh the access token every 5 minutes.
	import { onMount } from 'svelte';
	import { accessToken, idToken } from '$lib/stores/auth';
	import { jwtDecode } from 'jwt-decode';

	let expiresAt = $derived.by(() => {
		return $accessToken?.exp ? new Date($accessToken.exp * 1000) : null;
	});

	let refreshAt = $derived.by(() => {
		return expiresAt ? new Date(expiresAt.getTime() - 10 * 1000) : null;
	});

	let delay = $derived.by(() => {
		if (expiresAt && refreshAt && refreshAt > new Date())
			return Math.max(0, refreshAt.getTime() - Date.now());
		else return 0;
	});

	let expired = $derived.by(() => {
		return expiresAt ? new Date() > expiresAt : true;
	});

	let refreshing: ReturnType<typeof setTimeout> | null = null;
	let ticking: ReturnType<typeof setInterval> | null = null;

	let countdown: string = $state('');

	$effect(() => {
		if (refreshing) {
			console.log('Clearing previous refresh interval.');
			clearInterval(refreshing);
		}
		if (!expired) {
			console.log(`Next refresh in ${delay} ms`);
			refreshing = setTimeout(async () => {
				await refreshAccessToken();
			}, delay);
		} else {
			console.log('Token is expired.')
		}
	});

	onMount(() => {
		if (delay <= 0) {
			console.warn('Access token is already expired or will expire immediately.');
		}

		ticking = setInterval(() => {
			if (refreshAt) {
				countdown = ((refreshAt?.getTime() - new Date().getTime()) / 1000).toFixed(2);
			}
		}, 100);

		return () => {
			if (ticking) {
				console.log('Clearing ticking interval.');
				clearInterval(ticking);
			}
			if (refreshing) {
				console.log('Clearing refreshing timeout.');
				clearTimeout(refreshing);
			}
		};
	});

	async function refreshAccessToken(): Promise<void> {
		console.log('Refreshing access token');
		const res = await fetch('/auth/refresh', { method: 'POST' });
		if (res.ok) {
			const data = await res.json();
			accessToken.set(jwtDecode(data.accessToken));
			idToken.set(jwtDecode(data.idToken));
			console.log('Tokens refreshed successfully');
		} else if (res.status === 401) {
			console.error('Unauthorized: Access token refresh failed. Please log in again.');
			window.location.href = '/auth/login';
		} else {
			console.error('Failed to refresh access token:', res.statusText);
		}
	}
</script>

<div class="fixed right-4 bottom-4 h-32 w-64 items-center justify-center rounded bg-blue-500 p-4">
	<div class="text-lg font-bold text-white">Token Refresh</div>
	{#if expired}
		<div class="text-red-500">Access token is expired!</div>
	{:else}
		<div>Refreshing in {countdown} seconds</div>
	{/if}
	<button
		onclick={refreshAccessToken}
		class="me-2 mb-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
	>
		Refresh Now
	</button>
</div>
