import KongBridge from "../KongBridge";

export default abstract class Plugin {
    public abstract getName(): string;
    public abstract initialize(bridge: KongBridge): void;

    public postInit(): void {

    }
}