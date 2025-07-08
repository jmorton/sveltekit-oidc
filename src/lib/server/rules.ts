import type { DecodedAuthTokenSet, Rule } from "$lib/types/auth"; 

/* eslint-disable @typescript-eslint/no-unused-vars */
export const alwaysTrue: Rule = (_: DecodedAuthTokenSet): true | false => {
    return true;
};

export const allPresent: Rule = (tokens: DecodedAuthTokenSet) => {
    const { decoded_access_token, decoded_id_token, decoded_refresh_token } = tokens
    console.log(decoded_access_token);
    return decoded_access_token !== null 
                && decoded_id_token !== null 
                && decoded_refresh_token !== null
};
