<script lang="ts">
	import { accessToken, idToken } from '$lib/stores/auth';

	function expiresAt(token: any): Date | string {
		if (token && token.exp) {
			return new Date(token.exp * 1000);
		} else {
			return 'No .exp field in token';
		}
	}
</script>

<h2 class="text-2xl font-bold">Token Details</h2>

<div class="items-top flex justify-between">
	<div class="prose-base mt-4">
		<h3 class="text-xl font-bold">Access Token</h3>
		<p class="text">Expires in: {expiresAt($accessToken)}</p>
		<pre class="h-64 overflow-auto border p-4 text-xs">{JSON.stringify($accessToken, null, 2)}</pre>
	</div>

	<div class="prose-base mt-4">
		<h3 class="text-xl font-bold">ID Token</h3>
		<p class="text">Expires in: {expiresAt($idToken)}</p>
		<pre class="h-64 overflow-auto border p-4 text-xs">{JSON.stringify($idToken, null, 2)}</pre>
	</div>
</div>
