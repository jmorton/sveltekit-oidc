## Key Considerations

### What authentication flow should be used?

- OIDC Authorization Flow with PKCE.

### What additional libraries are required to facilitate authentication?

- [Arctic](https://www.npmjs.com/package/arctic): Provides functions for interacting with a wide variety of identity providers. ~78k weekly downloads, MIT License.
- [JwtDecode](https://www.npmjs.com/package/jwt-decode): ~9M weekly downloads, MIT License.

### What configuration is needed?

A URL to an OIDC provider's well known configuration. The configuration contains URLs to resources for initiating authorization, requesting, and refreshing tokens.

| Name                | Example                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------ |
| OIDC_WELL_KNOWN_URL | https://keycloak.platform.intelligent.space/realms/master/.well-known/openid-configuration |
| OIDC_CLIENT_ID      | development-client                                                                         |
| OIDC_REDIRECT_URI   | http://localhost:5173/auth/callback                                                        |
| OIDC_AUDIENCE       | development-client                                                                         |
| OIDC_SCOPE          | openid profile email                                                                       |

### What verification should be performed by the client application?

- The application must verify the 'state' value exchanged during authentication.
- The application must verify the token Issuer, Audience, Expiration.

### How are routes protected?

There are two options: a centralized route protecion using `server.hooks` or distributed across layouts and pages.

## What tokens are used?

1. An Access Token: Contains claims about what a user may do.
2. An Identity Token: Contains information about the user.
3. A Refresh Token: Used to obtain new access, identity, and refresh tokens.

### What values are needed and how are they made available?

| Value              | Sensitivity | Cookie? | Expire  | Path  | Svelte State? |
| ------------------ | ----------- | ------- | ------- | ----- | ------------- |
| Provider URL       | Low         | No      | –       |       | No            |
| Verifier           | Very High   | Yes     | 300s    |       | No            |
| Verifier Hash      | Low         | No      | –       |       | No            |
| Authorization Code | High        | No      | –       |       | No            |
| State              | Low         | Yes     | 300s    |       | No            |
| Identity Token     | Low         | Yes     | session | /auth | Yes           |
| Access Token       | High        | Yes     | session | /auth | Yes           |
| Refresh Token      | Very High   | Yes     | session | /auth | No            |
| Next Refresh Time  | Low         | No      | –       |       | Yes           |
| "Back" Context     | Low         | Yes     | –       |       | No            |

> **Important:**
> All cookies are stored in HttpOnly, Secure tokens. Cookies expire at the end of a session (when the browser is closed). Very-High sensitivity values are **never available to client side javascript**. Use cases that require these values **MUST** be executed on the server side in +server.ts or +page.server.ts functions. In addition, the path of these very-high sensitivty values is limited to the /auth path.

The access token is must be available to client side javascript so the access token can be added in the authorization header for requests to backing services. Access tokens expire to mitigate the risk of a compromised token.

## How are tokens refreshed?

Using a hidden component mounted in all pages. The component uses setTimeout to schedule refreshing tokens if a refresh token is available.

## How does a user end a session?

1. Closing the browser window will end a session. This will automatically clear all tokens becaues they are contained in session cookies.
2. By activating the logout feature of the app. This will execute server side code that deletes cookies containing tokens.

- What is the client application responsible for doing? Safely managing tokens, preventing leaks, refreshing expired tokens. Adding the access token to authorization header for requests to backing services.
- What are downstream token consumers responsible for doing? Issuer, Audience, Expiration
- How does rotating key material affect the client and downstream consumers?
- When stored as cookies, what precautions are taken to protect secrets?
- How is token invalidation handled?
- What is done with existing JWTs issued by gateway?

## Design

```
├── lib
│   ├── components
│   │   └── auth
│   │       └── Refresh.svelte
│   ├── server
│   │   └── auth.ts
│   └── stores
│       └── auth.ts
└── routes
    ├── auth
    │   ├── callback
    │   │   └── +page.server.ts
    │   ├── login
    │   │   └── +page.server.ts
    │   ├── logout
    │   │   └── +server.ts
    │   └── refresh
    │       └── +server.ts
    └── ...
```

### Libraries

The server module provides reusable functions for creating an Arctic OIDC client (using environment variables), and decoding base64 encode tokens in cookie into JwtPayloads.

No reusable client-side module functions have been identified as of yet.

The refresh component manages access token refresh using setTimeout. It works in tandem with the `/auth/refresh` route and sets client state to newly obtained tokens. This component calculates the time until an access token will expire and refresh a few seconds before scheduled expiration. The current implementation provides a countdown clock and a button to manually invoke the refresh workflow. It is not intended to be visible in normal circumstances.

The auth store makes access and identity tokens available in-memory. This approach avoids the need to process cookies client-side and allows us consistently rely on the default cookie setting `httpOnly: false`.

### Routes

The essential routes are:

1. Login
2. Callback
3. Refresh
4. Logout

A fifth route for displaying token details is also implemented, but does not need to exist in a real-world implementation.

#### Login

Login is implemented as a page because browsers should navigate to a page to initiate login instead of initiating login using `fetch`.

OIDC login requires a browser redirect to the identity provider. However, you can’t perform a login redirect from the result of a fetch because fetch requests **don’t follow redirects that change the browser’s top-level URL**.

Login will...

- Preserve the original location from which a login was initiated if a `back` query parameter was supplied.
- Generate a verifier cookie (using the Arctic library) and store it in a cookie.
- Generate a state (using the Arctic library) and store it in a cookie.
- Generate a URL to the authorization endpint (using the Arctic library).
- Redirect to the URL.

All values stored in cookies are short-lived and cleared when the identity provider redirects back to the callback route.

#### Callback

Callback is also implemented as a page. It will:

1. Verify the identity provider's actual state matches the expected state (generated by `/auth/login` and stored in a cookie).
2. Use the authorization code and previously generated verifier to request access, identity, and refresh tokens.
3. Verify the identity token issuer against previously resolved issuer configuration (specified by `OIDC_WELL_KNOWN_URL`).
4. Verify the application's configured audience matches the access token's audience (specified by `OIDC_AUDIENCE`).
5. Cleanup cookies generated by `/auth/login` (retaining the original location in a 'back' cookie).
6. Set session cookies for the access, identity, and refresh tokens.
7. Redirect to the original location specified by the back cookie.

#### Refresh

Refresh should be invoked by `fetch` requests from the `Auth` component a few seconds before the access token will expire. The fetch request automatically sends cookies to this handler. The handler obtains a new set of tokens from the identity provider. It returns a JSON object that contains the access and identity tokens so the `Auth` component can update in memory values of the same. If this request fails, the server sends a 401 to the client; the client _should_ initiate login but it _may_ display an error instead.

#### Logout

Currently, logout should be invoked by sending a `POST` via `form` submit or `fetch` requests from a navigation component. The `/auth/logout` route will delete the token related cookies and redirect to the home page.

For fetch requests, the client application can decide what to do next.
