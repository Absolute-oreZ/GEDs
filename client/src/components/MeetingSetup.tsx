import { useEffect, useState } from 'react';
import {
    DefaultVideoPlaceholder,
    Icon,
    LoadingIndicator,
    VideoPreview,
    createSoundDetector,
    useCall,
    useCallStateHooks,
    useConnectedUser,
    type StreamVideoParticipant,
} from '@stream-io/video-react-sdk';

import Alert from './Alert';
import { Button } from './ui/button';

import { FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';
import { CameraIcon } from 'lucide-react';

export const AudioVolumeIndicator = () => {
    const { useMicrophoneState } = useCallStateHooks();
    const { isEnabled, mediaStream } = useMicrophoneState();
    const [audioLevel, setAudioLevel] = useState(0);
    useEffect(() => {
        if (!isEnabled || !mediaStream) return;
        const disposeSoundDetector = createSoundDetector(
            mediaStream,
            ({ audioLevel: al }) => setAudioLevel(al),
            { detectionFrequencyInMs: 80, destroyStreamOnStop: false },
        );
        return () => {
            disposeSoundDetector().catch(console.error);
        };
    }, [isEnabled, mediaStream]);
    if (!isEnabled) return null;
    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0 1.25rem 1rem",
            }}
        >
            <Icon icon="mic" />
            <div
                style={{
                    flex: "1",
                    background: "#000",
                    height: "5px",
                    borderRadius: "4px",
                }}
            >
                <div
                    style={{
                        transform: `scaleX(${audioLevel / 100})`,
                        transformOrigin: "left center",
                        background: "var(--str-video__primary-color)",
                        width: "100%",
                        height: "100%",
                    }}
                />
            </div>
        </div>
    );
};

const DisabledVideoPreview = () => {
    const connectedUser = useConnectedUser();
    if (!connectedUser) return null;
    if (!connectedUser.image) {
        return <p className='w-full text-center h-full bg-gray-300'>Camera disableed</p>
    }
    return (
        <DefaultVideoPlaceholder
            participant={
                {
                    image: connectedUser.image,
                    name: connectedUser.name,
                } as StreamVideoParticipant
            }
        />
    );
};
const NoCameraPreview = () => (
    <div>
        <CameraIcon />
    </div>
);
const StartingCameraPreview = () => (
    <div>
        <LoadingIndicator />
    </div>
);


const MeetingSetup = ({
    setIsSetupComplete,
}: {
    setIsSetupComplete: (value: boolean) => void;
}) => {
    const { useCallEndedAt } = useCallStateHooks();
    const callEndedAt = useCallEndedAt();
    const callHasEnded = !!callEndedAt;

    const call = useCall();

    if (!call) {
        throw new Error(
            'useStreamCall must be used within a StreamCall component.',
        );
    }

    const [isCamOn, setIsCamOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);

    useEffect(() => {
        if (isCamOn) {
            call.camera.enable();
        } else {
            call.camera.disable();
        }
    }, [isCamOn]);

    useEffect(() => {
        if (isMicOn) {
            call.microphone.enable();
        } else {
            call.microphone.disable();
        }
    }, [isMicOn]);

    if (callHasEnded) {
        return (
            <Alert
                title="The call has been ended by the host"
                iconUrl="/icons/call-ended.svg"
            />
        );
    }

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
            <div className="flex w-[480px] h-[270px] rounded-md items-center justify-center border border-gray-300 overflow-hidden">
                <VideoPreview
                    DisabledVideoPreview={DisabledVideoPreview}
                    StartingCameraPreview={StartingCameraPreview}
                    NoCameraPreview={NoCameraPreview}
                />
            </div>

            <div className="flex justify-center items-center gap-4">
                {/* Toggle Camera */}
                <button
                    onClick={() => setIsCamOn(!isCamOn)}
                    className={`rounded-full p-3 text-xl transition ${isCamOn ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                        } hover:scale-105`}
                    aria-label={isCamOn ? 'Turn off camera' : 'Turn on camera'}
                >
                    {isCamOn ? <FiVideo /> : <FiVideoOff />}
                </button>

                {/* Toggle Microphone */}
                <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`rounded-full p-3 text-xl transition ${isMicOn ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                        } hover:scale-105`}
                    aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                    {isMicOn ? <FiMic /> : <FiMicOff />}
                </button>
                {/* <AudioVolumeIndicator /> */}

                <Button
                    className="rounded-md bg-green-500 px-6 py-2.5 text-white hover:bg-green-600"
                    onClick={() => {
                        call.join();
                        setIsSetupComplete(true);
                    }}
                >
                    Join Meeting
                </Button>
            </div>
            {/* <ParticipantsPreview /> */}
        </div>
    );
};

export default MeetingSetup;
