import type { JwtPayload } from "jwt-decode";

// TODO: move this, or replace with env???
export type ConfigType = {
    authorization_endpoint: string,
    token_endpoint: string
}

export type RefreshOpts = 'auto' | 'always'; // auto means it happens just with Refresh, always means on reload here too...
export type CookieType = string | null
export type DecodedTokenType = JwtPayload | null
export type RuleType = (access_token: DecodedTokenType, id_token: DecodedTokenType, refresh_token: DecodedTokenType) => object
