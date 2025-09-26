import { useEffect, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartData
} from 'chart.js';

import { Button } from "./ui/button";
import { useCallStateHooks } from "@stream-io/video-react-sdk";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export type GroupEngagementData = {
    engagement_score_mean: number;
    engagement_score_sd: number;
}

export type WSMessageType = "GROUP_ENGAGEMENT_DATA" | "RECOMMENDATION";

export type WSMessage =
    | { messageType: "GROUP_ENGAGEMENT_DATA"; content: WSEngagementPayload }
    | { messageType: "RECOMMENDATION"; content: string[] };

type CustomDataType = {
    label: string;
    data: number[],
    borderColor?: string,
    backgroundColor?: string
}

export type WSEngagementPayload = {
    groupData: GroupEngagementData[];
    participantData: {
        username: string;
        engagementScore: number;
    }[][];
};
const colorPalette = [
    { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)' }, // Blue
    { borderColor: 'rgb(255, 206, 86)', backgroundColor: 'rgba(255, 206, 86, 0.5)' }, // Yellow
    { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' }, // Teal
    { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)' }, // Purple
    { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)' }, // Orange
];

const EngagementVisualizationPanel = ({ ws, handleEngagementPanelClose }: { ws: React.RefObject<WebSocket | null>, handleEngagementPanelClose: () => void }) => {
    const participantMap: { [username: string]: CustomDataType } = {}
    const meanData: CustomDataType = {
        label: "Average Engagement Class",
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
    }

    const [recommendation, setRecommendation] = useState<string[]>([]);
    const [chartData, setchartData] = useState<ChartData<"line", number[], string>>({
        labels: [],
        datasets: []
    });

    const { useParticipants, useParticipantCount } = useCallStateHooks();

    const participantCount = useParticipantCount();
    const participants = useParticipants();

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        elements: {
            point: {
                radius: 0
            }
        },
        stacked: false,
        scales: {
            y: {
                type: 'linear' as const,
                min: 0,
                max: 100,
                display: true,
                position: 'left' as const,
                // ticks: {
                //     callback: function (
                //         tickValue: string | number,
                //     ): string | null {
                //         if (typeof tickValue === 'number' && [1, 2, 3].includes(tickValue)) {
                //             return tickValue.toString();
                //         }
                //         return '';
                //     },
                //     stepSize: 1,
                // },
            },
            x: {
                display: false
            }
        },
    };

    const parseEngagementata = (engagementData: WSEngagementPayload) => {
        const groupData = engagementData.groupData;
        const participantData = engagementData.participantData;
        const labels: string[] = [];

        participantData.forEach((timestamp) => {
            timestamp.forEach((p) => {
                participantMap[p.username].data.push(p.engagementScore * 100);
            })
        })

        groupData.forEach((e) => {
            meanData.data.push(e.engagement_score_mean * 100);
            labels.push('');
        })

        const datasets = [];
        for (const username in participantMap) {
            datasets.push(participantMap[username]);
        }
        datasets.push(meanData);

        const currChartData: ChartData<"line", number[], string> = {
            labels,
            datasets
        }

        setchartData(currChartData);
    }

    useEffect(() => {
        if (!ws.current) return;

        const handleMessage = (e: MessageEvent) => {
            const message: WSMessage = JSON.parse(e.data);
            if (message.messageType === 'GROUP_ENGAGEMENT_DATA') {
                parseEngagementata(message.content as WSEngagementPayload);
            } else {
                setRecommendation(message.content as string[]);
            }
        };

        ws.current.addEventListener("message", handleMessage);

        let colorIndex = 0;
        const setUpParticipantMap = () => {
            participants.forEach((p) => {
                const color = colorPalette[colorIndex++];

                participantMap[p.name] = {
                    label: p.name,
                    data: [],
                    borderColor: color.borderColor,
                    backgroundColor: color.backgroundColor,
                };
            });
        };

        setUpParticipantMap();

        return () => {
            ws.current?.removeEventListener("message", handleMessage);
        }
    }, [ws])

    return (
        <div className='col-span-1 p-2 border-1 border-gray-400 rounded-xl'>
            <div className='flex flex-col gap-5'>
                <div className='flex justify-between'>
                    <p className='text-[14px] mt-1'>Engagements [{participantCount}]</p>
                    <Button onClick={handleEngagementPanelClose} className='flex items-center justify-center rounded-full w-[31px] h-[31px] hover:cursor-pointer'>
                        <IoCloseOutline />
                    </Button>
                </div>
                <div className='text-sm h-50'>
                    <p className='font-medium'>Chart:</p>
                    <Line
                        data={chartData}
                        options={options}
                    />
                </div>
                <div className='text-sm'>
                    <p className='font-medium'>Recommendation:</p>
                    <p>{recommendation.length === 0 ? "No Recommendation yet" : recommendation[recommendation.length - 1]}</p>
                </div>
            </div>
        </div>
    )
}

export default EngagementVisualizationPanel;