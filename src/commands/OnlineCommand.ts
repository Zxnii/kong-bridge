import Command from "./Command";
import CommandInfo from "./CommandInfo";
import KongBridge from "../KongBridge";
import {ChatMessage} from "prismarine-chat";
import {CommandInteraction, EmbedBuilder} from "discord.js";

export default class OnlineCommand extends Command {
    public getInfo(): CommandInfo {
        return {
            name: "online",
            description: "Lists online users"
        };
    }

    public async performAction(bridge: KongBridge, interaction: CommandInteraction): Promise<void> {
        const bot = bridge.getBot();

        let listResolve: (value: (PromiseLike<unknown> | unknown)) => void;
        let currentGroup: { name: string | null, rawList: string, players: string[] } = {
            name: null,
            rawList: "",
            players: []
        };
        let onlinePlayers = 0;

        const groups: (typeof currentGroup)[] = [];
        const listPromise = new Promise(resolve => listResolve = resolve);

        const messageHandler = (message: ChatMessage) => {
            const stringified = message.toMotd().trim();

            if (message.json.text === "Online Members: " && message.json.color === "yellow") {
                bot.off("message", messageHandler);
                listResolve(undefined);

                onlinePlayers = parseInt(message.json.extra[0].text);

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

        const embedBuilder = new EmbedBuilder()
            .setTitle("Online Players")
            .setDescription(`${Math.max(onlinePlayers - 1, 0)} players online`)
            .setTimestamp(Date.now());

        groups.map(group => {
            const matches = group.rawList.matchAll(/§.(?:\[\S+] )?(\S+)§a ●/g);

            if (!matches) return group;

            for (const match of matches) {
                if (match[1] !== bot.username) {
                    group.players.push(`\`${match[1]}\``);
                }
            }

            return group;
        }).forEach(group => {
            if (group.players.length > 0) {
                embedBuilder.addFields({
                    name: group.name!,
                    value: group.players.join(", ")
                });
            }
        });

        await interaction.editReply({
            embeds: [ embedBuilder ]
        });
    }
}