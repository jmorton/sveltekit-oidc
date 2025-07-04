<script lang="ts">
	import { accessToken } from '$lib/stores/auth';
	import { refreshAccessToken, logout } from '$lib/client/auth';
	import { jwtDecode } from 'jwt-decode';
</script>

<div class="flex gap-2">
	{#if $accessToken}
		<button
			on:click={logout}
			class="me-2 mb-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
		>
			Logout
		</button>
		<button
			on:click={refreshAccessToken}
			class="me-2 mb-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
		>
			Refresh
		</button>
		<a
			href="/auth/detail"
			class="me-2 mb-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
		>
			Detail
		</a>
	{:else}
		<a
			href="/auth/login"
			class="me-2 mb-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
		>
			Login
		</a>
	{/if}
</div>
