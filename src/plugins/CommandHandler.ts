import Plugin from "./Plugin";
import KongBridge from "../KongBridge";
import Command from "../commands/Command";
import {REST, Routes} from "discord.js";

export default class CommandHandler extends Plugin {
    private readonly commands: Command[] = [];

    public getName(): string {
        return "Command Handler";
    }

    public addCommand(command: Command): CommandHandler {
        this.commands.push(command);

        return this;
    }

    public async initialize(bridge: KongBridge): Promise<void> {
        const rest = new REST({ version: "10" }).setToken(KongBridge.getToken());
        const route = KongBridge.devGuildId ?
            Routes.applicationGuildCommands(bridge.application!.id, KongBridge.devGuildId) :
            Routes.applicationCommands(bridge.application!.id);

        const commands: object[] = [];

        for (const command of this.commands) {
            commands.push(await command.build());
        }

        await rest.put(route, { body: commands });

        bridge.on("interactionCreate", async interaction => {
            if (interaction.isCommand()) {
                for (const command of this.commands) {
                    if (command.getInfo().name === interaction.commandName) {
                        await interaction.deferReply();
                        await command.performAction(bridge, interaction);
                    }
                }
            }
        });
    }
}