<script lang="ts">
</script>

<p>This page is not protected. You are able to see it whether or not you have an access token.</p>

<p>Here are some protected pages:</p>

<ul>
	<li><a href="/home">/home</a></li>
	<li><a href="/home/foo">/home/foo</a> (admin only)</li>
	<li><a href="/home/bar">/home/bar</a> (user only)</li>
	<li><a href="/home/baz">/home/baz</a> (nobody has this role)</li>
	<li><a href="/home/qux">/home/qux</a> (rule raises error)</li>
</ul>

<p>
	If you click one of those links, it will initiate the login process and redirect to the page you
	attempted to access.
</p>

<style lang="postcss">
	@reference "tailwindcss";
</style>
