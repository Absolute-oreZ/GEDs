import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TypingIndicator,
    useChannelStateContext,
    useChatContext,
} from 'stream-chat-react';
import type { ChannelMemberResponse, UserResponse } from 'stream-chat';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { CgSearch } from 'react-icons/cg';
import { PhoneCallIcon } from 'lucide-react';
import { FaRegCaretSquareLeft } from 'react-icons/fa';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components//ui/button';
import { supabaseClient } from '@/clients/supabaseClient';

const UnMemoizedChannelHeader = () => {

    const navigate = useNavigate();
    const { client } = useChatContext();
    const videoClient = useStreamVideoClient();
    const [showChannelInfo, setShowChannelInfo] = useState(false);
    const [searchVal, setSearchVal] = useState('');
    const [debounceVal, setDebounceVal] = useState('');
    const [hasGoingCall, setHasOnGoingCall] = useState(false);
    const [searchUsers, setSearchUsers] = useState<UserResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
    const { channel, watcher_count, channelCapabilities } = useChannelStateContext();

    const handleVideoButtonClicked = async () => {
        const currOngoingCall = await queryOngoingCall();
        if (currOngoingCall) {
            setHasOnGoingCall(true);
            navigate("/meeting", {
                state: {
                    callId: currOngoingCall.id,
                    callType: currOngoingCall.type
                }
            });
        } else {
            if (!videoClient) throw new Error("Video client missing");
            if (!client.user) throw new Error("No user");
            if (!channel.id) throw new Error("No channel id");

            const callId = crypto.randomUUID();
            const call = videoClient.call("default", callId);

            const channelMembers = Object.values(channel.state.members);
            const callMembers: { user_id: string }[] = [];

            channelMembers.forEach(member => {
                if (member.user_id) {
                    callMembers.push({ user_id: member.user_id });
                }
            });

            await call.getOrCreate({
                ring: true,
                data: {
                    //@ts-ignore
                    created_by_id: client.user?.id,
                    custom: {
                        channelId: channel.id
                    },
                    members: callMembers,
                    settings_override: {
                        session: {
                            inactivity_timeout_seconds: 5
                        }
                    }
                }
            });

            supabaseClient.channel(`session:${callId}`, {
                config: {
                    private: true
                }
            })

            navigate("/meeting", {
                state: {
                    callId: callId,
                    callType: "default"
                }
            });
        }
    }

    const toggleUserSelection = (user: UserResponse) => {
        setSelectedUsers(prev => {
            const alreadySelected = prev.find(u => u.id === user.id);
            if (alreadySelected) {
                return prev.filter(u => u.id !== user.id);
            } else {
                return [...prev, user];
            }
        });
    };

    const handleInvite = async () => {
        const userIds = selectedUsers.map(u => u.id);
        await channel.inviteMembers(userIds);
        setSelectedUsers([]); // clear selection after invite
        setShowChannelInfo(false); // close dialog
    }

    const queryOngoingCall = async () => {
        if (!videoClient) {
            return null;
        }

        const response = await videoClient.queryCalls({
            filter_conditions: {
                ongoing: { $eq: true },
            },
            watch: true
        });

        for (const c of response.calls) {
            const callDetails = await c.get();
            if (callDetails.call.custom?.channelId === channel.id) {
                return c;
            }
        }

        return null;
    }

    useEffect(() => {
        if (!videoClient) return;

        const checkOngoingCall = async () => {
            const ongoingCall = await queryOngoingCall();
            setHasOnGoingCall(!!ongoingCall);
        };

        checkOngoingCall();

        const interval = setInterval(checkOngoingCall, 60000);
        return () => clearInterval(interval);
    }, [videoClient]);


    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounceVal(searchVal);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchVal]);

    useEffect(() => {
        if (debounceVal) {
            const searchChannels = async () => {

                const response = await client.queryUsers({
                    name: { $autocomplete: debounceVal },
                });

                setSearchUsers(response.users);
            }

            searchChannels();
        }
    }, [debounceVal])

    const renderAvatar = (imageUrl?: string, fallbackText?: string) => (
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden text-white text-sm font-medium">
            {imageUrl ? (
                <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                fallbackText?.[0]?.toUpperCase() ?? "?"
            )}
        </div>
    );

    const renderStatusBadge = (member: ChannelMemberResponse) => {
        if (member.banned) {
            return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Banned</span>;
        }
        if (member.invited && !member.invite_accepted_at) {
            return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Invited</span>;
        }

        if (member.invited && member.invite_rejected_at) {
            return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Rejected</span>;
        }

        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{member.role}</span>;
    };

    const members = channel.state.members;
    const totalMemberCount = Object.keys(members).length;
    const name = (channel.data as { name?: string })?.name || "Unnamed Channel";
    const image = (channel.data as { image?: string })?.image;
    const createdAt = (channel.data as { created_at?: string })?.created_at;
    const canUpdateChannelMembers = channelCapabilities['update-channel-members'];

    return (
        <>
            <div className="str-chat__header-livestream str-chat__channel-header">

                <div
                    className="header-info-clickable"
                    onClick={() => setShowChannelInfo(true)}
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, gap: '0.75rem' }}
                >
                    {renderAvatar(image, name)}
                    <div className="str-chat__header-livestream-left str-chat__channel-header-end">
                        <p className="str-chat__header-livestream-left--title str-chat__channel-header-title">
                            {name}
                        </p>
                        <p className="str-chat__header-livestream-left--members str-chat__channel-header-info">
                            {totalMemberCount} {totalMemberCount > 1 ? "Members" : "Member"}, {watcher_count} Online
                        </p>
                    </div>
                </div>
                <TypingIndicator />

                {hasGoingCall ?
                    <Button onClick={handleVideoButtonClicked} title='Join current video sesion' className='hover:cursor-pointer' variant="default">
                        <PhoneCallIcon />
                        <p>Join</p>
                    </Button> :
                    <Button onClick={handleVideoButtonClicked} title='Start video calling' className='hover:cursor-pointer' variant="ghost">
                        <PhoneCallIcon />
                    </Button>
                }
            </div>

            <Dialog open={showChannelInfo} onOpenChange={setShowChannelInfo}>
                <DialogContent className="max-w-md sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Channel Info</DialogTitle>
                        <DialogDescription>
                            Details and members of the channel.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            {renderAvatar(image, name)}
                            <div>
                                <p className="text-lg font-semibold">{name}</p>
                                {createdAt && (
                                    <p className="text-sm text-muted-foreground">
                                        Created: {new Date(createdAt).toLocaleDateString()}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    {totalMemberCount} {totalMemberCount > 1 ? "Members" : "Member"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Members:</h4>
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                {Object.values(members).map((member) => (
                                    <div key={member.user_id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {renderAvatar(member.user?.image, member.user?.name || member.user_id)}
                                            <span>{member.user?.name || member.user_id}</span>
                                        </div>
                                        {renderStatusBadge(member)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {canUpdateChannelMembers &&
                        <div className='flex flex-col gap-3'>
                            <div className='font-medium'>Invite new memebrs</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedUsers.map(user => (
                                    <div key={user.id} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm">
                                        {user.name || user.id}
                                        <button onClick={() => toggleUserSelection(user)} className="text-red-500 hover:underline ml-1">
                                            X
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className='flex justify-between w-full gap-2 items-center'>
                                <div className="flex w-full border-2 border-gray-400 rounded-md h-fit items-center px-2 gap-2">
                                    <CgSearch />
                                    <input
                                        placeholder="Enter your friend's name to search"
                                        className="w-full border-none focus:border-0"
                                        onChange={(e) => setSearchVal(e.target.value)}
                                    />
                                </div>
                                <Button
                                    disabled={selectedUsers.length === 0}
                                    onClick={handleInvite}
                                >
                                    Invite {selectedUsers.length} {selectedUsers.length === 1 ? "User" : "Users"}
                                </Button>

                            </div>
                            {debounceVal ?
                                searchUsers.length > 0 ?
                                    <div>
                                        {searchUsers.map((user) => {
                                            const isChecked = selectedUsers.some(u => u.id === user.id);

                                            return (
                                                <div key={user.id} className='flex justify-between items-center p-2 border rounded-md'>
                                                    <div className='flex gap-2 items-center'>
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => toggleUserSelection(user)}
                                                        />
                                                        {renderAvatar(user.image)}
                                                        <span>{user.name || user.id}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    </div>
                                    :
                                    <div className='flex justify-center items-center gap-2 text-muted-foreground'>
                                        <FaRegCaretSquareLeft />
                                        <p>No results matches the "{debounceVal}"</p>
                                    </div>
                                :
                                <div className='flex gap-2 items-center justify-center text-muted-foreground'>
                                    <FaRegCaretSquareLeft />
                                    <p>Enter a username to begin the search</p>
                                </div>}
                        </div>
                    }
                </DialogContent>
            </Dialog>
        </>
    );
};

const ChannelHeader = React.memo(UnMemoizedChannelHeader);

export default ChannelHeader;
