<script lang="ts">
	// When this component is mounted, it will set an interval to refresh the access token every 5 minutes.
	import { onMount } from 'svelte';
	import { refreshAccessToken } from '$lib/client/auth';
	import { accessToken } from '$lib/stores/auth';

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
</script>

<div class="fixed right-4 bottom-4 h-32 w-64 items-center justify-center rounded bg-blue-500 p-4">
	<div class="text-lg font-bold text-white">Token Refresh</div>
	{#if expired}
		<div class="text-red-500">Access token is expired!</div>
	{:else}
		<div>Refreshing in {countdown} seconds</div>
	{/if}
</div>
