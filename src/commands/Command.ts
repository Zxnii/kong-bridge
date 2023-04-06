import KongBridge from "../KongBridge";
import CommandInfo from "./CommandInfo";
import {CommandInteraction, SlashCommandBuilder} from "discord.js";

export default abstract class Command {
    public abstract getInfo(): CommandInfo;
    public abstract performAction(bridge: KongBridge, interaction: CommandInteraction): Promise<void>;

    public async build(): Promise<object> {
        const commandInfo = this.getInfo();
        const builder = new SlashCommandBuilder()
            .setName(commandInfo.name)
            .setDescription(commandInfo.description);

        return builder.toJSON();
    }
}