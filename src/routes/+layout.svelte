<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { accessToken, idToken } from '$lib/stores/auth';
	import { page } from '$app/state';
	import Auth from '$lib/components/auth/Nav.svelte';
	import TokenRefresh from '$lib/components/auth/Refresh.svelte';

	accessToken.set(page.data.access_token);
	idToken.set(page.data.id_token);

	let darkMode = false;

	onMount(() => {
		const saved = localStorage.getItem('theme');
		if (saved) {
			darkMode = saved === 'dark';
		} else {
			darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		setHtmlClass(darkMode);
	});

	function toggleDark() {
		darkMode = !darkMode;
		setHtmlClass(darkMode);
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}

	function setHtmlClass(enable: any) {
		document.documentElement.classList.toggle('dark', enable);
	}
</script>

<div class="min-h-screen bg-gray-50 p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	<div class="mt-4 flex items-center justify-between rounded bg-white p-4 shadow dark:bg-gray-800">
		<div>
			<h1 class="text-3xl font-bold text-blue-600 dark:text-white">
				Hello, {$accessToken?.name || 'Guest'}!
			</h1>
		</div>
		<div>
			<Auth />
		</div>
	</div>

	<div class="mt-4 rounded bg-white p-4 shadow dark:bg-gray-800">
		<slot></slot>
	</div>
	<div>
		<TokenRefresh></TokenRefresh>
	</div>
	<div class="mt-6 flex items-center justify-between">
		<button
			on:click={toggleDark}
			class="me-2 mb-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
		>
			Dark / Light
		</button>
	</div>
</div>
