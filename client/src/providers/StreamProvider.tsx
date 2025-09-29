import { fetchStreamToken } from '@/services/streamService';
import { StreamTheme, StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

import { supabaseClient } from '@/clients/supabaseClient';

const StreamProvider = ({ children }: PropsWithChildren) => {
    const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

    useEffect(() => {
        if (!apiKey) {
            console.error("Stream API key missing");
            return;
        }

        const init = async () => {
            try {
                const { data } = await supabaseClient.auth.getUser();

                const userId = data.user?.id;

                if (!userId) {
                    throw new Error("User id missing");
                }

                const streamToken = await fetchStreamToken();

                const chatClient = StreamChat.getInstance(apiKey);
                await chatClient.connectUser({ id: userId }, streamToken);

                const response = await chatClient.queryUsers({
                    id: { $in: [userId] },
                });

                if (response.users.length == 0) {
                    throw new Error("Stream user missing");
                }

                const user = response.users[0];

                const videoClient = StreamVideoClient.getOrCreateInstance({ apiKey, user, token: streamToken });

                setChatClient(chatClient);
                setVideoClient(videoClient);
            } catch (err) {
                console.error("Error initializing Stream clients:", err);
            }
        };

        init();

        return () => {
            chatClient?.disconnectUser();
            videoClient?.disconnectUser();
        };
    }, []);

    if (!chatClient || !videoClient) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <StreamTheme>
            <Chat client={chatClient}>
                <StreamVideo client={videoClient}>
                    {children}
                </StreamVideo>
            </Chat>
        </StreamTheme>
    );
};

export default StreamProvider;
