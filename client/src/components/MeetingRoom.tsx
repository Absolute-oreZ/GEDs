import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CallControls,
    CallingState,
    PaginatedGridLayout,
    useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { ImStatsDots } from "react-icons/im";

import { useFeatureExtractor } from '@/hooks/useFeatureExtractor';
import { useEngagementModel } from '@/hooks/useEngagementModel';
import { useStreamMediaStream } from '@/hooks/useStreamMediaStream';

import Loader from './Loader';
import EndCallButton from './EndCallButton';
import { supabaseClient } from '@/clients/supabaseClient';
import { Button } from './ui/button';
import EngagementVisualizationPanel from './EngagamenetVisualizationPanel';

export type IndividualEngagementData = {
    timestamp: number;
    features: number[][];
    engagementScore: number;
}

const MeetingRoom = ({ callId }: { callId: string }) => {
    const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;
    const navigate = useNavigate();

    const [shownEngagementPanel, setShownEngagementPanel] = useState(true);
    const isProcessing = useRef(false);

    const { useCallCallingState, useCameraState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const cameraState = useCameraState();

    const { videoElement } = useStreamMediaStream();

    const ws = useRef<WebSocket | null>(null);

    const {
        isEngagementModelLoaded,
        loadModel: loadEngagementModel,
        predict,
    } = useEngagementModel();

    const {
        isMediaPipeModelLoaded,
        loadModel: loadMediaPipeModel,
        processFrame,
    } = useFeatureExtractor();

    useEffect(() => {
        const setupWebSocket = async () => {
            const { data } = await supabaseClient.auth.getSession();
            const token = data.session?.access_token;

            if (!token) {
                console.error("No access token found.");
                return;
            }

            const url = `${WS_URL}?token=${token}&sessionId=${callId}`;

            ws.current = new WebSocket(url);

            ws.current.onopen = () => console.log("WebSocket opened");
            ws.current.onclose = () => console.log("WebSocket closed");
            ws.current.onerror = (error) => console.error("WebSocket error:", error);
        };

        setupWebSocket();
        loadMediaPipeModel();
        loadEngagementModel();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        }
    }, [callId]);

    useEffect(() => {
        const cameraStatus = cameraState.status;
        if (!videoElement || !isMediaPipeModelLoaded || !isEngagementModelLoaded || cameraStatus !== 'enabled') {
            return;
        }

        if (isProcessing.current) {
            return;
        }

        isProcessing.current = true;

        let cancelled = false;
        const frameBuffer: number[][] = [];
        const frameInterval = 1000 / 30; // 30 FPS
        let lastFrameTime = 0;
        let predictionIntervalId: NodeJS.Timeout;

        const meanAlongAxis0 = (window: number[][]) => {
            const numItems = window.length;
            const frameSize = window[0].length;
            const avg = new Array(frameSize).fill(0);

            for (let i = 0; i < numItems; i++) {
                for (let j = 0; j < frameSize; j++) {
                    avg[j] += window[i][j];
                }
            }

            for (let j = 0; j < frameSize; j++) {
                avg[j] /= numItems;
            }

            return avg;
        };

        const processAndPredict = async () => {
            if (frameBuffer.length < 300) {
                return;
            }

            const latestFrames = frameBuffer.slice(-300);
            const averagedFrames: number[][] = [];

            for (let i = 0; i < 300; i += 5) {
                const chunk = latestFrames.slice(i, i + 5);
                if (chunk.length === 5) {
                    averagedFrames.push(meanAlongAxis0(chunk));
                }
            }

            const sequences: number[][] = [];
            for (let i = 0; i < 10; i++) {
                const j = i * 6;
                if (averagedFrames[j]) {
                    sequences.push(averagedFrames[j]);
                }
            }

            try {
                const predictedScore = await predict(sequences);

                if (ws.current?.readyState === WebSocket.OPEN) {
                    const engagementData: IndividualEngagementData = {
                        timestamp: Date.now(),
                        features: sequences,
                        engagementScore: predictedScore,
                    };
                    ws.current.send(JSON.stringify(engagementData));
                    console.log('Sent engagement data:', { score: predictedScore });
                }
            } catch (err) {
                console.error("Prediction error:", err);
            }
        };

        const captureLoop = (timestamp: number) => {
            if (cancelled) return;

            if (timestamp - lastFrameTime >= frameInterval) {
                try {
                    const features = processFrame(videoElement);
                    if (features && features.length === 6) {
                        frameBuffer.push(features);

                        if (frameBuffer.length > 300) {
                            frameBuffer.shift();
                        }
                    }
                } catch (err) {
                    console.error("Error processing frame:", err);
                }

                lastFrameTime = timestamp;
            }

            requestAnimationFrame(captureLoop);
        };

        // Start frame collection
        requestAnimationFrame(captureLoop);

        // Start prediction every second
        predictionIntervalId = setInterval(() => {
            processAndPredict();
        }, 1000);

        return () => {
            console.log('Cleaning up engagement processing...');
            cancelled = true;
            isProcessing.current = false;
            clearInterval(predictionIntervalId);
        };
    }, [videoElement, isMediaPipeModelLoaded, isEngagementModelLoaded, cameraState.status, processFrame, predict]);


    if (callingState !== CallingState.JOINED) return <Loader />;

    return (
        <div className="flex items-center justify-center h-full w-full">
            <section className="w-full items-center justify-center relative">
                {shownEngagementPanel ? (
                    <div className="grid grid-cols-5 gap-2 w-full px-4">
                        <div className="col-span-4">
                            <PaginatedGridLayout />
                        </div>
                        <EngagementVisualizationPanel
                            ws={ws}
                            handleEngagementPanelClose={() => setShownEngagementPanel(false)}
                        />
                    </div>
                ) : (
                    <div className="flex justify-center w-full">
                        <div className="w-[78%]">
                            <PaginatedGridLayout />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-center mt-4 gap-4">
                    <CallControls onLeave={() => navigate('/')} />

                    <Button
                        title='Engagements'
                        onClick={() => setShownEngagementPanel(true)}
                        variant={shownEngagementPanel ? "default" : "ghost"}
                        className='hover:cursor-pointer'
                    >
                        <ImStatsDots size={20} />
                    </Button>

                    <EndCallButton />
                </div>
            </section>
        </div>
    );
};

export default MeetingRoom;