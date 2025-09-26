import { Avatar, useCallStateHooks } from "@stream-io/video-react-sdk";

export const ParticipantsPreview = () => {
    const { useCallSession } = useCallStateHooks();
    const session = useCallSession();

    if (!session || session?.participants || session?.participants.length === 0) return <p>No preview Available</p>;

    return (
        <div>
            <div>Already in call ({session.participants.length}):</div>
            <div style={{ display: "flex" }}>
                {session.participants.map((participant) => (
                    <div>
                        <Avatar
                            name={participant.user.name}
                            imageSrc={participant.user.image}
                        />
                        {participant.user.name && <div>{participant.user.name}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};