import DiscordCommand from "./DiscordCommand";
import KongBridge from "../../KongBridge";
import CommandInfo from "./CommandInfo";
import {Colors, CommandInteraction, EmbedBuilder} from "discord.js";
import ms from "pretty-ms";
import {fetchUsername, fetchUuid} from "../../util/fetch";

export default class PlaytimeCommand extends DiscordCommand {
    public getInfo(): CommandInfo {
        return {
            name: "playtime",
            description: "Returns the playtime for a player",
            addParameters(builder) {
                builder.addStringOption(option => option
                    .setName("player")
                    .setDescription("Player to check playtime for")
                    .setMaxLength(20)
                    .setMinLength(1)
                    .setRequired(true));
            }
        };
    }

    public async performAction(bridge: KongBridge, interaction: CommandInteraction) {
        const player = interaction.options.get("player")?.value;

        const uuid = await fetchUuid(`${player}`);
        const embed = new EmbedBuilder();

        if (uuid) {
            const playtime = bridge.getPlaytimes()[uuid] ?? { lastLogin: 0, lastLogout: 0, totalPlaytime: 0, totalLogins: 0 };
            const online = playtime.lastLogin > playtime.lastLogout;
            const name = (await fetchUsername(uuid))!;

            const totalPlaytime = playtime.totalPlaytime + (online ? Date.now() - playtime.lastLogin : 0);

            embed
                .setTitle(`${name}'s playtime`)
                .addFields({
                        name: "Status",
                        value: online ? ":green_circle: Online" : ":red_circle: Offline"
                    },
                    {
                        name: "Playtime",
                        value: ms(Math.floor(totalPlaytime / 1000) * 1000, { unitCount: 4 })
                    },
                    {
                        name: "Total logins",
                        value: `${playtime.totalLogins}`
                    })
                .setColor(Colors.Blurple);

            if (!online) {
                embed.addFields({
                    name: "Last login",
                    value: playtime.lastLogin === 0 ? "Never" : `<t:${Math.floor(playtime.lastLogin / 1000)}:f>`
                });
            } else {
                embed.addFields({
                    name: "Last logout",
                    value: playtime.lastLogout === 0 ? "Never" : `<t:${Math.floor(playtime.lastLogout / 1000)}:f>`
                });
            }
        } else {
            embed
                .setTitle("Not found")
                .setDescription(`Could not get playtime for ${player}`)
                .setColor(Colors.Red)
        }

        await interaction.editReply({ embeds: [embed] });
    }
}
