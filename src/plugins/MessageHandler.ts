import Plugin from "./Plugin";
import KongBridge from "../KongBridge";

export default class MessageHandler extends Plugin {
    public getName(): string {
        return "Discord Message Handler";
    }

    public initialize(bridge: KongBridge): void {
        bridge.on("messageCreate", message => {
            if (message.author.bot) return;
            if (message.content.trim().length === 0) return;
            if (message.channelId !== KongBridge.getBridgeChannelId()) return;

            (message.content.match(new RegExp(`.{1,${120 - message.author.username.length}}`, "g")) ?? [message.content])
                .forEach(chunk => {
                    bridge.getBot().chat(`/gc ${message.author.username} » ${chunk}`)
                });
        });
    }
}