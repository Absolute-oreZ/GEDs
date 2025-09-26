import {
    StreamCall,
} from "@stream-io/video-react-sdk";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import Alert from "@/components/Alert";
import { useGetCallById } from "@/hooks/useGetCallById";
import { Loader } from "lucide-react";
import { supabaseClient } from "@/clients/supabaseClient";
import type { User } from "@supabase/supabase-js";

const Meeting = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const callId = location.state?.callId;
    const [user, setUser] = useState<User | null>(null);
    const [isUserLoaded, setIsUserLoaded] = useState(false);
    const { call, isCallLoading } = useGetCallById(callId);
    const [isSetupComplete, setIsSetupComplete] = useState(false);

    useEffect(() => {

        const fetchUser = async () => {
            try {
                const { data } = await supabaseClient.auth.getUser();
                setUser(data.user);
            } catch (error) {
                console.error(error);
                throw error;
            } finally {
                setIsUserLoaded(true);
            }
        }
        fetchUser();

        return (() => {
            setUser(null);
            setIsUserLoaded(false);
            setIsSetupComplete(false);
        })
    }, [])


    if (!isUserLoaded || isCallLoading) return <Loader />;

    if (!call) {
        return (
            <Dialog open>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>No Active Call</DialogTitle>
                    </DialogHeader>
                    <p className="mb-4">There's no ongoing or incoming call right now.</p>
                    <Button onClick={() => navigate("/")}>Back to Channels</Button>
                </DialogContent>
            </Dialog>
        );
    }

    const notAllowed = call.type === 'invited' && (!user || !call.state.members.find((m) => m.user.id === user.id));

    if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;

    return (
        <main className="h-screen w-full">
                <StreamCall call={call}>
                    {!isSetupComplete ? (
                        <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
                    ) : (
                        <MeetingRoom callId={callId} />
                    )}
                </StreamCall>
        </main>
    );
};

export default Meeting;