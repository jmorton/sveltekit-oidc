import type { JwtPayload } from "jwt-decode";

// TODO: move this, or replace with env???
// TODO: maybe try the env thing that gateway does?
export type Config = {
    authorization_endpoint: string,
    token_endpoint: string
}

// 'auto' means refresh happens only in the Refresh component, 
//      but 'always' means refresh on all reloads as well.
export type RefreshOpts = 'auto' | 'always';
export type AuthorizeOpts = { refresh: RefreshOpts }
export type AuthToken = string | null
export type AuthTokenSet = {
    access_token: AuthToken,
    id_token: AuthToken,
    refresh_token: AuthToken
}
export type DecodedAuthToken = JwtPayload | null
export type DecodedAuthTokenSet = {
    decoded_access_token: DecodedAuthToken,
    decoded_id_token: DecodedAuthToken,
    decoded_refresh_token: DecodedAuthToken
}
export type Rule = (tokens: DecodedAuthTokenSet) => boolean

export type JwtSecret = {
    // either key or jwk_url
    jwk_url?: string; 
    key?: string;
  
    type: string;
  };
