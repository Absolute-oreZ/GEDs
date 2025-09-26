import { useCalls } from "@stream-io/video-react-sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const IncomingCallDialog = () => {
    const [idle, setIdle] = useState(true);
    const calls = useCalls();
    const navigate = useNavigate();

    // Filter for incoming calls (not created by current user)
    const incomingCall = calls.find(call => !call.isCreatedByMe);

    const handleAccept = async () => {
        if (!incomingCall) return;

        setIdle(false);

        navigate("/meeting", {
            state: {
                callId: incomingCall.id,
                callType: incomingCall.type
            }
        });
    };

    const handleReject = async () => {
        if (!incomingCall) return;

        const reason = incomingCall.isCreatedByMe ? "cancel" : "decline";
        await incomingCall.leave({ reject: true, reason });
        setIdle(false);
    };

    if (!incomingCall) return null;

    return (
        <Dialog open={idle} onOpenChange={setIdle}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Incoming Call</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <p>{incomingCall.state.createdBy?.name || "Someone"} is calling you</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="destructive" onClick={handleReject}>
                            Reject
                        </Button>
                        <Button onClick={handleAccept}>To waiting room</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default IncomingCallDialog;