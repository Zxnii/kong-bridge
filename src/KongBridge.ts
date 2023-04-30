import {Channel, Client, GatewayIntentBits, Snowflake} from "discord.js";
import Plugin from "./plugins/Plugin";
import * as dotenv from "dotenv";
import log from "./log";
import MessageHandler from "./plugins/MessageHandler";
import {Bot, createBot} from "mineflayer";
import ChatHandler from "./plugins/ChatHandler";
import CommandHandler from "./plugins/CommandHandler";
import OnlineCommand from "./commands/discord/OnlineCommand";
import PlaytimeCommand from "./commands/discord/PlaytimeCommand";
import fs from "fs/promises";
import OnlinePoll from "./plugins/OnlinePoll";

export default class KongBridge extends Client {
    private static instance: KongBridge;

    private static token: string;
    private static email: string;
    private static bridgeChannel: string;

    public static devGuildId?: string;
    public static messageEmoji: string;

    private readonly plugins: Plugin[] = [];

    private playtimes: Record<string, { totalLogins: number, lastLogin: number, lastLogout: number, totalPlaytime: number }> = {};
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

        this.on("error", e => {
            log.error(e);
        });
    }

    private async setup(): Promise<void> {
        await this.login(KongBridge.token);

        log.info(`Logged in as ${this.user!.tag}`);

        await this.createBot();

        await this.addPlugin(new CommandHandler()
            .addCommand(new OnlineCommand())
            .addCommand(new PlaytimeCommand()));
        await this.addPlugin(new ChatHandler());
        await this.addPlugin(new MessageHandler());
        await this.addPlugin(new OnlinePoll());

        log.info("Loading playtime");

        this.playtimes = JSON.parse(await fs.readFile("playtime.json", { encoding: "utf8" }).catch(() => "{}"));

        log.info("Running post-init calls");

        this.plugins.forEach(plugin => plugin.postInit());
    }

    private createBot(): Promise<void> {
        this.bot = createBot({
            username: KongBridge.email,
            brand: "vanilla",
            version: "1.8.9",
            host: "mc.hypixel.net",
            auth: "microsoft"
        });

        this.bot.once("kicked", (reason) => {
            if (reason.toLowerCase().includes("banned")) {
                log.info("Banned :(");
                return;
            }

            log.info("Got kicked! Rejoining.");
            void this.createBot();
        });

        return new Promise<void>(resolve => {
            this.bot.once("login", () => {
                resolve();

                log.info("Sending to limbo");

                this.bot.chat("§");
            });
        });
    }

    private async addPlugin(plugin: Plugin): Promise<void> {
        this.plugins.push(plugin);

        await plugin.initialize(this);

        log.info(`Added plugin: ${plugin.getName()}`);
    }

    public getBot(): Bot {
        return this.bot;
    }

    public getPlaytimes(): KongBridge["playtimes"] {
        return this.playtimes;
    }

    public async savePlaytimes() {
        await fs.writeFile("playtime.json", JSON.stringify(this.playtimes));
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
