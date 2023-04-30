import {ChatMessage} from "prismarine-chat";
import KongBridge from "../KongBridge";

export async function getOnlinePlayers(bridge: KongBridge) {
    const bot = bridge.getBot();

    let listResolve: (value: (PromiseLike<unknown> | unknown)) => void;
    let currentGroup: { name: string | null, rawList: string, players: string[] } = {
        name: null,
        rawList: "",
        players: []
    };

    const groups: (typeof currentGroup)[] = [];
    const listPromise = new Promise(resolve => listResolve = resolve);

    const messageHandler = (message: ChatMessage) => {
        const stringified = message.toMotd().trim();

        if (message.json.text === "Online Members: " && message.json.color === "yellow") {
            bot.off("message", messageHandler);
            listResolve(undefined);

            return;
        }

        if (message.json.text === "Total Members: " && message.json.color === "yellow") return;
        if (stringified === "§f") return;
        if (stringified.includes("§a-- ")) {
            currentGroup.name = /-- (.*) --/.exec(stringified)![1];

            return;
        }

        if (currentGroup.name) {
            currentGroup.rawList = message.toMotd();
            groups.push(currentGroup);

            currentGroup = {
                name: "<unknown>",
                rawList: "",
                players: []
            };
        }
    }

    bot.chat("/g list");
    bot.on("message", messageHandler);

    await listPromise;

    const online: string[] = [];

    groups.map(group => {
        const matches = group.rawList.matchAll(/§.(?:\[\S+] )?(\S+)§a ●/g);

        if (!matches) return group;

        for (const match of matches) {
            if (match[1] !== bot.username) {
                group.players.push(match[1]);
                online.push(match[1]);
            }
        }

        return group;
    });

    return {
        groups,
        online
    };
}
