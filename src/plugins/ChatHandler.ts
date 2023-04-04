import Plugin from "./Plugin";
import KongBridge from "../KongBridge";
import GuildMessage from "../util/types/GuildMessage";
import HypixelRank from "../util/HypixelRank";
import log from "../log";
import {TextChannel} from "discord.js";

export default class ChatHandler extends Plugin {
    public getName(): string {
        return "Chat Handler";
    }

    public initialize(bridge: KongBridge): void {
        const bot = bridge.getBot();

        bot.on("message", async message => {
            if (message.extra && message.extra.length > 0) {
                const firstComponent = message.extra[0];
                const messageTestRegex = /§2Guild > (?:(\S+]) (\S+)|§7(\S+))(?: \S+)?: /;

                if (firstComponent.json.text.startsWith("§2Guild > ")) {
                    const matches = messageTestRegex.exec(firstComponent.json.text);

                    log.info(message.toAnsi());

                    (<any>message)["with"] = [];
                    message.extra.forEach((extra: any) => extra.with = []);
                    message.extra.splice(0, 1);

                    const guildMessage: GuildMessage = {
                        text: message.toString(),
                        rank: HypixelRank.NONE,
                        sender: {
                            // todo
                            uuid: "unknown",
                            username: "unknown"
                        }
                    };

                    if (!matches) return;

                    if (!matches[3]) {
                        guildMessage.sender.username = matches[2];
                    } else {
                        guildMessage.sender.username = matches[3];
                    }

                    if (guildMessage.sender.username === bot.username) return;

                    const channel = await bridge.getChannel(KongBridge.getBridgeChannelId());

                    if (channel instanceof TextChannel) {
                        await channel.send(`${KongBridge.messageEmoji} \`${guildMessage.sender.username}\` > \`${guildMessage.text}\``);
                    }

                    return;
                }

                if (message.json.color === "dark_green") {
                    const player = firstComponent.json.text.trim();
                    const channel = await bridge.getChannel(KongBridge.getBridgeChannelId());

                    if (channel instanceof TextChannel) {
                        if (message.extra[1].json.text === "left.") {
                            await channel.send(`:outbox_tray: \`${player}\` left Hypixel!`);
                        } else {
                            await channel.send(`:inbox_tray: \`${player}\` joined Hypixel!`);
                        }
                    }
                }
            }
        });
    }
}