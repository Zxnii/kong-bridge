import Plugin from "./Plugin";
import KongBridge from "../KongBridge";
import { setTimeout as wait } from "timers/promises";

export default class MessageHandler extends Plugin {
    public getName(): string {
        return "Discord Message Handler";
    }

    public initialize(bridge: KongBridge): void {
        bridge.on("messageCreate", async message => {
            if (message.author.bot) return;
            if (message.content.trim().length === 0) return;
            if (message.channelId !== KongBridge.getBridgeChannelId()) return;

            const chunks = message.content.match(new RegExp(`.{1,${120 - message.author.username.length}}`, "g")) ?? [message.content];

            for (const chunk of chunks) {
                bridge.getBot().chat(`/gc ${message.author.username} » ${chunk}`);
                await wait(1000);
            }
        });
    }
}