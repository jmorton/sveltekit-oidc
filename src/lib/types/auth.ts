import type { Jwt, VerifyOptions } from "jsonwebtoken";
import type { JwtPayload } from "jwt-decode";
import jwt from 'jsonwebtoken';

// TODO: move this, or replace with env???
// TODO: maybe try the env thing that gateway does?
export type Config = {
    authorization_endpoint?: string,
    token_endpoint?: string
}

// 'auto' means refresh happens only in the Refresh component,
//      but 'always' means refresh on all reloads as well.
export type RefreshOpts = 'auto' | 'always';
export type AuthorizeOpts = { refresh: RefreshOpts }

export type RawToken = string | null
export type RawTokenSet = {
    accessToken: RawToken,
    idToken: RawToken,
    refreshToken: RawToken
}

export type MaybeToken = JwtPayload | null;

export type MaybeTokenSet = {
    accessToken?: MaybeToken,
    idToken?: MaybeToken,
    refreshToken?: MaybeToken
}

export type Rule = (token: MaybeToken) => boolean;

export type JwtSecret = {
    // either key or jwk_url
    jwksUri?: string;
    key?: string;
    type: string;
};

export type VerifierFunction = (accessToken: string, options: VerifyOptions) => Promise<string | jwt.Jwt | jwt.JwtPayload>
