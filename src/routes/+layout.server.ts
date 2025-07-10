export async function load({ locals }) {
	console.log('/home/+layout.server.ts load');
	return {
		accessToken: locals?.tokens?.accessToken,
		idToken: locals?.tokens?.idToken,
		roles: locals?.roles
	}
}
