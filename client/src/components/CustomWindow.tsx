import { useEffect, useState } from "react";
import { useChannelStateContext, useChatContext, MessageInput, MessageList, Window, Thread } from "stream-chat-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ChannelHeader from "./ChannelHeader";
import { Button } from "./ui/button";

const CustomWindow = () => {
    const [isMember, setIsMember] = useState(true);
    const { client, setActiveChannel } = useChatContext();
    const { channel } = useChannelStateContext();

    const userId = client.userID;
    const members = channel.state.members;

    useEffect(() => {
        if (!members || !userId) {
            return;
        }

        const memberObject = members[userId];

        if (!memberObject) {
            // user is not a member at all
            setIsMember(false);
            return;
        }

        // check if user is banned, invited, or has other non-active status
        const isActive = memberObject.status === 'member' as string;

        setIsMember(isActive);
    }, [channel, userId, members])

    const handleAccept = async () => {
        try {
            await channel.acceptInvite();
            setActiveChannel(channel);
        } catch (error) {
            console.error(`Error accepting invite: ${error}`);
        }
    }

    const handleReject = async () => {
        try {
            await channel.rejectInvite();
            setActiveChannel(undefined);
        } catch (error) {
            console.error(`Error rejecting invite: ${error}`);
        }
    }

    return isMember ? <div className="w-full h-full">
        <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput focus />
        </Window>
        <Thread />
    </div> : <AlertDialog open={!isMember}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>You are invited!</AlertDialogTitle>
                <AlertDialogDescription>
                    Accept the invitation to be part of it and start the conservation, or reject the invitation.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setActiveChannel(undefined)}>Ignore for now</AlertDialogCancel>
                <Button onClick={handleReject} variant="destructive">Reject</Button>
                <AlertDialogAction onClick={handleAccept}>Accept</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
}

export default CustomWindow