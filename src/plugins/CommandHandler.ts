import Plugin from "./Plugin";
import KongBridge from "../KongBridge";
import DiscordCommand from "../commands/discord/DiscordCommand";
import {REST, Routes} from "discord.js";
import log from "../log";

export default class CommandHandler extends Plugin {
    private readonly commands: DiscordCommand[] = [];

    public getName(): string {
        return "Command Handler";
    }

    public addCommand(command: DiscordCommand): CommandHandler {
        this.commands.push(command);

        return this;
    }

    public async initialize(bridge: KongBridge): Promise<void> {
        const rest = new REST({ version: "10" }).setToken(KongBridge.getToken());
        const route = Routes.applicationCommands(bridge.application!.id);

        const commands: object[] = [];

        for (const command of this.commands) {
            commands.push(await command.build());
        }

        await rest.put(route, { body: commands });

        bridge.on("interactionCreate", async interaction => {
            if (interaction.isCommand()) {
                for (const command of this.commands) {
                    if (command.getInfo().name === interaction.commandName) {
                        try {
                            await interaction.deferReply();
                            await command.performAction(bridge, interaction);
                        } catch (e) {
                            log.error(e);
                        }
                    }
                }
            }
        });
    }
}
