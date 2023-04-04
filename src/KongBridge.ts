import {Channel, Client, GatewayIntentBits, Snowflake} from "discord.js";
import Plugin from "./plugins/Plugin";
import * as dotenv from "dotenv";
import log from "./log";
import MessageHandler from "./plugins/MessageHandler";
import {Bot, createBot} from "mineflayer";
import ChatHandler from "./plugins/ChatHandler";

export default class KongBridge extends Client {
    private static instance: KongBridge;

    private static token: string;
    private static email: string;
    private static bridgeChannel: string;

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

        this.addPlugin(new ChatHandler());
        this.addPlugin(new MessageHandler());

        await new Promise<void>(resolve => {
            this.bot.once("login", () => {
                resolve();
            });
        });

        log.info("Running post-init calls");

        this.plugins.forEach(plugin => plugin.postInit());
    }

    private addPlugin(plugin: Plugin): void {
        this.plugins.push(plugin);

        plugin.initialize(this);
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

        KongBridge.messageEmoji = process.env["MESSAGE_EMOJI"] ?? ":speech_balloon:"

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
