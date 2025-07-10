import type { MaybeToken, Rule } from "$lib/types/auth";

// Much like Hasura, Aerie expects a specific token structure.
const roleQuery = '.resource_access["ssmo-dev-missions-mms-aerie"].roles';

export const alwaysTrue: Rule = (_: MaybeToken): true | false => {
    return true;
};

export const allPresent: Rule = (token: MaybeToken) => {
    return !!token
};

export const isAdmin: Rule = (token: MaybeToken | any): true | false => {
    // maybe a jq exppression?
    const roles = token?.['resource_access']?.['ssmo-dev-missions-mms-aerie']?.['roles'];
    return roles && roles.includes('aerie-admin');
};

export const isUser: Rule = (token: MaybeToken | any): true | false => {
    const roles = token?.['resource_access']?.['ssmo-dev-missions-mms-aerie']?.['roles'];
    return roles && roles.includes('aerie-user');
};