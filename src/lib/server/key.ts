// key handling methods, all used in validate()
import { OIDC_JWKS, OIDC_AUDIENCE, OIDC_ISSUER } from '$env/static/private';
import type { JwtSecret, VerifierFunction } from '$lib/types/auth';
import jwt, { type GetPublicKeyOrSecret, type VerifyOptions } from 'jsonwebtoken';
import { JwksClient } from "jwks-rsa";
import { type JwtHeader } from 'jwt-decode';
import jws from 'jws';

// side-effecty because it deals with env vars
// TODO: other key types? I think it'll only ever be explicit or JWKS
export function getKey(url = OIDC_JWKS): string | jwt.Secret | jwt.PublicKey | GetPublicKeyOrSecret {
    const { key, jwksUri }: JwtSecret = JSON.parse(url);

    // If we have a URL to a JWKS, then we'll resolve it.
    if (jwksUri) {
        const client = new JwksClient({ jwksUri });
        return getJwksKey(client);
    }
    // Otherwise, I sure hope the key is set here.
    if (key) {
        return key;
    }
    throw Error('Misconfigured JWT Secret in .env. Please specify a OIDC_JWKS or a key.');
}

// made sense to curry this vs. define it in validate
const getJwksKey: (client: JwksClient) => GetPublicKeyOrSecret = (client: JwksClient) => {
    return async function(header: JwtHeader, callback) {
        client.getSigningKey(header.kid, function(err, key) {
            if (key) {
                const signingKey = key.getPublicKey();
                // const algorithm: jwt.Algorithm = key.alg as jwt.Algorithm;
                // algorithms.splice(1, 0, algorithm);
                callback(null, signingKey);
            }
            else {
                console.error(err)
                callback(err);
            }
        });
    }
}


// get the algorithm
export async function getAlgorithms(token: string): Promise<jwt.Algorithm[]> {
    const { type, jwksUri }: JwtSecret = JSON.parse(OIDC_JWKS);
    // best source is the actual jwksUri, if available
    if (jwksUri) {
        // https://www.npmjs.com/package/jsonwebtoken
        const client = new JwksClient({
            jwksUri: jwksUri
        });
        const alg: jwt.Algorithm = await getJwksAlg(client, token)
                                            .then(_alg => _alg)
                                            .catch(err => {throw err})
        return [alg];
    }
    else if (type) {
        return [type as jwt.Algorithm]
    }
    else {
        throw Error('Misconfigured JWT Secret in .env. Please specify a type, or a valid jwk_url.');
    }
}

function getJwksAlg(client: JwksClient, token: string): Promise<jwt.Algorithm> {
    // https://stackoverflow.com/questions/58517713/return-value-from-callback-in-typescript
    return new Promise((resolve, reject) => {
        client.getSigningKey(jws.decode(token)?.header.kid, function(err, key) {
            if (key) {
                resolve(key.alg as jwt.Algorithm);
            }
            else {
                reject(err)
            }
        })
    })
}

// TODO: I'm not sure how to do this other than just via env variables. there _should_ be a smarter way to do this I'd think...maybe if there's an endpoint that describes the client?
// 			said endpoint does exist but requires a token for access and we should be able to execute getAudience without a token...
export function getAudience(): [string | RegExp, ...(string | RegExp)[]] {
	return [ OIDC_AUDIENCE ]
}

export function getIssuer(): string {
	return OIDC_ISSUER;
}

// curried this so that it wouldn't have to be defined in validate, but we need to access key...
export const verifyUsing: (key: jwt.Secret | jwt.PublicKey | GetPublicKeyOrSecret) => VerifierFunction = (key: jwt.Secret | jwt.PublicKey | GetPublicKeyOrSecret) => {
	return async function(token: string, options: VerifyOptions = {}): Promise<string | jwt.Jwt | jwt.JwtPayload> {
		return await new Promise((resolve, reject) => {
			// is the signature, audience, and issuer (see options) correct?
			jwt.verify(token, key, options, (err, decoded) => {
				if (err || decoded === undefined) return reject(err);
				resolve(decoded);
			});
		});
	}
}