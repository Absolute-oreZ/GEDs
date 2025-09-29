import { Link, useLocation } from "react-router-dom";
import { MdGroups, MdLogout } from "react-icons/md";
import { GiPlagueDoctorProfile } from "react-icons/gi";

import { signOut } from "../services/authService";
import { VideoIcon } from "lucide-react";
import { useChatContext } from "stream-chat-react";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";

const navLinks = [
    {
        to: "/",
        icon: <MdGroups />,
        tooltip: "Groups",
    },
    {
        to: "/meeting",
        icon: <VideoIcon />,
        tooltip: "Meeting",
    },
    {
        to: "/profile",
        icon: <GiPlagueDoctorProfile />,
        tooltip: "My Profile",
    },
];


const LeftSideBar = () => {
    const location = useLocation();
    const { client: chatClient } = useChatContext();
    const videoClient = useStreamVideoClient();

    const handleSignOut = async () => {
        await chatClient.disconnectUser();
        await videoClient?.disconnectUser();
        signOut();
    };

    return (
        <div className="h-screen w-[70px] bg-sidebar-accent text-sidebar-accent-foreground border-1 border-sidebar-border ring-1 ring-sidebar-ring flex flex-col justify-between items-center py-10 shadow-md">
            <div className="flex flex-col gap-6">
                {navLinks.map(({ to, icon, tooltip }) => {
                    const isActive = location.pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            className={`group relative flex items-center justify-center p-3 rounded-md transition ${isActive
                                ? "bg-gray-700 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                                }`}
                            aria-label={tooltip}
                        >
                            <div className="text-xl">{icon}</div>
                            <span className="pointer-events-none absolute left-16 z-10 w-max px-2 py-1 text-sm text-white bg-black rounded opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                                {tooltip}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <button
                onClick={handleSignOut}
                className="group relative flex items-center justify-center p-3 rounded-md text-gray-400 hover:bg-red-600 hover:text-white transition"
                aria-label="Logout"
            >
                <MdLogout className="text-xl" />
                <span className="absolute left-16 z-10 w-max px-2 py-1 text-sm text-white bg-black rounded opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                    Logout
                </span>
            </button>
        </div>
    );
};

export default LeftSideBar;