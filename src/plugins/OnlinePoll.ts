import KongBridge from "../KongBridge";
import Plugin from "./Plugin";
import {getOnlinePlayers} from "../util/hypixel";
import {fetchUsername, fetchUuid} from "../util/fetch";

export default class OnlinePoll extends Plugin {
    public getName(): string {
        return "Online Poll"
    }

    public async initialize(bridge: KongBridge) {
        setInterval(async () => {
            await this.update(bridge);
        }, 60000);
    }

    private async update(bridge: KongBridge) {
        const { online } = await getOnlinePlayers(bridge);
        const playtimes = bridge.getPlaytimes();

        for (const player of Object.keys(playtimes)) {
            const username = await fetchUsername(player);

            if (!username) continue;

            if (!online.includes(username) && playtimes[player].lastLogin > playtimes[player].lastLogout) {
                playtimes[player].totalPlaytime += Date.now() - playtimes[player].lastLogin;
                playtimes[player].lastLogout = Date.now();
            }
        }

        for (const player of online) {
            const uuid = await fetchUuid(player);

            if (!uuid) continue;

            if (!playtimes[uuid]) {
                playtimes[uuid] = {
                    totalLogins: 1,
                    lastLogin: Date.now(),
                    lastLogout: 0,
                    totalPlaytime: 0
                };
            }
        }

        await bridge.savePlaytimes();
    }
}
