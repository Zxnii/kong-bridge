import HypixelRank from "../HypixelRank";

type GuildMessage = {
    text: string;
    rank: HypixelRank;
    sender: {
        username: string;
        uuid: string;
    };
};

export default GuildMessage;