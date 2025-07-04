<script lang="ts">
	import { expiresAt } from '$lib/client/auth';
	import { accessToken } from '$lib/stores/auth';
	export let data;
</script>

<h2 class="text-2xl font-bold">Token Details</h2>

<div class="items-top flex justify-between">
	<div class="prose-base mt-4">
		<h3 class="text-xl font-bold">Access Token</h3>
		<p class="text">Expires in: {expiresAt($accessToken)}</p>
		<pre class="h-64 overflow-auto border p-4 text-xs">{JSON.stringify($accessToken, null, 2)}</pre>
	</div>

	<div class="prose-base mt-4">
		<h3 class="text-xl font-bold">Refresh Token</h3>
		<p class="text">Expires in: {expiresAt(data.refresh_token)}</p>
		<pre class="h-64 overflow-auto border p-4 text-xs">{JSON.stringify(
				data.refresh_token,
				null,
				2
			)}</pre>
	</div>
</div>
