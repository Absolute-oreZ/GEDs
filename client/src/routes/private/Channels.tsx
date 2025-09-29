import { useState, useEffect } from "react"
import { type User } from "stream-chat";
import { Channel, ChannelList, Thread, useChatContext } from "stream-chat-react";
import 'stream-chat-react/dist/css/v2/index.css';

import NoChannel from "@/components/NewChannel";
import ChannelListHeader from "@/components/ChannelListHeader";
import CustomWindow from "@/components/CustomWindow";

export type StreamUserData = {
    user: User;
    streamToken: string;
    hasChannels: boolean;
}

const Channels = () => {
    const { client: chatClient } = useChatContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hasChannels, setHasChannels] = useState(true);

    useEffect(() => {
        const checkChannels = async () => {
            if (!chatClient.user) {
                return;
            }
            try {
                const filter = { members: { $in: [chatClient.user.id] } };
                const channels = await chatClient.queryChannels(filter);

                setHasChannels(channels.length > 0);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkChannels();
    }, [])

    const handleChannelCreated = () => {
        setHasChannels(true); // triggers re-render with chat
    };

    if (loading) return <div>Loading chat...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!chatClient.user?.id) return <div>User not initialized.</div>;

    const filter = { members: { $in: [chatClient.user?.id] } };

    return hasChannels ? (
        <div className="flex h-full w-full">
            {/* <Chat client={chatClient}> */}
                {/* Left Panel: Sidebar */}
                <div className="w-[30%] min-w-[300px] h-full border-r border-gray-300 flex flex-col">
                    <ChannelListHeader onChannelCreated={handleChannelCreated} />
                    <ChannelList filters={filter} showChannelSearch additionalChannelSearchProps={{ searchForChannels: true }} />
                </div>

                {/* Right Panel: Main Chat Window */}
                <div className="flex-1 flex flex-col w-[70%] h-full">
                    <Channel>
                        <CustomWindow />
                        <Thread />
                    </Channel>
                </div>
            {/* </Chat> */}
        </div>
    ) : (
        <div className="flex h-full w-full items-center justify-center flex-col gap-3">
            <h2>Opps, seems like you are not in any channel yet</h2>
            <NoChannel onChannelCreated={handleChannelCreated} />
        </div>
    );
}

export default Channels