import {Channel, Client, GatewayIntentBits, Snowflake} from "discord.js";
import Plugin from "./plugins/Plugin";
import * as dotenv from "dotenv";
import log from "./log";
import MessageHandler from "./plugins/MessageHandler";
import {Bot, createBot} from "mineflayer";
import ChatHandler from "./plugins/ChatHandler";
import CommandHandler from "./plugins/CommandHandler";
import OnlineCommand from "./commands/OnlineCommand";

export default class KongBridge extends Client {
    private static instance: KongBridge;

    private static token: string;
    private static email: string;
    private static bridgeChannel: string;

    public static devGuildId?: string;
    public static messageEmoji: string;

    private readonly plugins: Plugin[] = [];
    private bot!: Bot;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ]
        });
    }

    private async setup(): Promise<void> {
        await this.login(KongBridge.token);

        log.info(`Logged in as ${this.user!.tag}`);

        this.bot = createBot({
            username: KongBridge.email,
            brand: "vanilla",
            version: "1.8.9",
            host: "mc.hypixel.net",
            auth: "microsoft"
        });

        await new Promise<void>(resolve => {
            this.bot.once("login", () => {
                resolve();
            });
        });

        const commandHandler = new CommandHandler()
            .addCommand(new OnlineCommand());

        await this.addPlugin(commandHandler);
        await this.addPlugin(new ChatHandler());
        await this.addPlugin(new MessageHandler());

        log.info("Running post-init calls");

        this.plugins.forEach(plugin => plugin.postInit());

        log.info("Sending to limbo");

        this.bot.chat("§");
    }

    private async addPlugin(plugin: Plugin): Promise<void> {
        this.plugins.push(plugin);

        await plugin.initialize(this);

        log.info(`Added plugin: ${plugin.getName()}`);
    }

    public getBot(): Bot {
        return this.bot;
    }

    public async getChannel(id: Snowflake): Promise<Channel | null> {
        return this.channels.cache.get(id) ?? await this.channels.fetch(id);
    }

    public static init(): void {
        dotenv.config();

        KongBridge.token = process.env["TOKEN"]!;
        KongBridge.email = process.env["EMAIL"]!;
        KongBridge.bridgeChannel = process.env["BRIDGE_CHANNEL"]!;

        if (!KongBridge.token || !KongBridge.email || !KongBridge.bridgeChannel) {
            throw "One or more fields were missing from the environment variables";
        }

        KongBridge.devGuildId = process.env["DEV_GUILD_ID"];
        KongBridge.messageEmoji = process.env["MESSAGE_EMOJI"] ?? ":speech_balloon:";

        KongBridge.instance = new KongBridge();
        KongBridge.instance.setup().then(() => {
            log.info("Ready!");
        });
    }

    public static getToken(): string {
        return KongBridge.token;
    }

    public static getInstance(): KongBridge {
        return KongBridge.instance;
    }

    public static getBridgeChannelId(): string {
        return KongBridge.bridgeChannel;
    }
}
