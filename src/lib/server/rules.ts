import type { JwtPayload } from "jwt-decode";

export const alwaysTrue = (accessToken: JwtPayload): true | false => {
        return true;
    };

export default {
    alwaysTrue
}