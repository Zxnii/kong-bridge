import {fetch, FetchResultTypes} from "@sapphire/fetch";
import {MojangAPIResponse} from "@lilithmod/unborn-hypixel";

const usernameCache: Record<string, string> = {};
const uuidCache: Record<string, string> = {};

export async function fetchUuid(username: string): Promise<string | undefined> {
    if (uuidCache[username.toLowerCase()]) {
        return uuidCache[username.toLowerCase()];
    }

    const response = await fetch<MojangAPIResponse>(`https://api.mojang.com/users/profiles/minecraft/${username}`, FetchResultTypes.JSON);

    if ("id" in response) {
        uuidCache[response.name.toLowerCase()] = response.id;
        usernameCache[response.id] = response.name;

        return response.id;
    } else {
        return undefined;
    }
}

export async function fetchUsername(uuid: string): Promise<string | undefined> {
    if (usernameCache[uuid]) {
        return usernameCache[uuid];
    }

    const response = await fetch<MojangAPIResponse>(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, FetchResultTypes.JSON);

    if ("id" in response) {
        uuidCache[response.name.toLowerCase()] = response.id;
        usernameCache[response.id] = response.name;

        return response.name;
    } else {
        return undefined;
    }
}
