import DiscordCommand from "./DiscordCommand";
import CommandInfo from "./CommandInfo";
import KongBridge from "../../KongBridge";
import {CommandInteraction, EmbedBuilder} from "discord.js";
import {getOnlinePlayers} from "../../util/hypixel";

export default class OnlineCommand extends DiscordCommand {
    public getInfo(): CommandInfo {
        return {
            name: "online",
            description: "Lists online users"
        };
    }

    public async performAction(bridge: KongBridge, interaction: CommandInteraction): Promise<void> {
        const { groups, online } = await getOnlinePlayers(bridge);

        const embedBuilder = new EmbedBuilder()
            .setTitle("Online Players")
            .setDescription(`${online.length} players online`)
            .setTimestamp(Date.now());

        groups.forEach(group => {
            if (group.players.length > 0) {
                embedBuilder.addFields({
                    name: group.name!,
                    value: group.players.map(player => `\`${player}\``).join(", ")
                });
            }
        });

        await interaction.editReply({
            embeds: [ embedBuilder ]
        });
    }
}
