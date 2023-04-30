import {SlashCommandOptionsOnlyBuilder} from "discord.js";

type CommandInfo = {
    name: string;
    description: string;
    addParameters?: (builder: SlashCommandOptionsOnlyBuilder) => void;
};

export default CommandInfo;
