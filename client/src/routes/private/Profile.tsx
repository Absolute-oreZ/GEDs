import { useState, useEffect } from "react"

import { fetchUserData } from "../../services/userService";
import type { User } from "../../types";
import { CgProfile } from "react-icons/cg";

const Home = () => {
    const [userData, setUserData] = useState<User | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const getUserData = async () => {
            try {
                const data = await fetchUserData();
                console.log(data);
                setUserData(data);
            } catch (err: any) {
                setError(err.message);
            }
        };
        getUserData();
    }, []);

    if (error) {
        return <p>Error fetching user data</p>
    }

    if (!userData) {
        return <p>Loading...</p>;
    }

    const { username, email, profilePicturePath, learningPreference } = userData;
    const { country, personality, learningStyles } = learningPreference ?? {};

    return (
        <div className="w-full flex">
            <div className="mx-auto rounded-lg flex items-center gap-4">
                <div className="flex flex-col">
                    {profilePicturePath ? (
                        <img
                            src={profilePicturePath}
                            alt="Profile"
                            className="w-30 h-30 rounded-full object-cover mb-4 border-4 border-gray-600"
                        />
                    ) : (
                        <CgProfile className="w-30 h-30" />
                    )}

                    <div className="text-center">
                        <h1 className="text-3xl font-semibold">{username}</h1>
                        <p className="text-sm text-gray-400 mt-2 flex items-center justify-center">
                            <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 2a6 6 0 00-6 6c0 4.418 6 10 6 10s6-5.582 6-10a6 6 0 00-6-6zM8 8a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                            {country || "Unknown"}
                        </p>
                    </div>
                </div>

                <div className="max-w-2xl max-xl:max-w-md">
                    {/* <GradientText className="text-3xl mb-8 font-semibold text-start">
                            Hello There, {userData?.username} Here
                        </GradientText> */}
                    <p className="text-lg">
                        Hello, I'm {username} from {country || "an unknown location"}! I
                        enjoy learning through a combination of{" "}
                        {learningStyles?.map((learning_style: string, index: number) => (
                            <span
                                key={index}
                                className={`${index !== learningStyles?.length - 1 ? "mr-1" : ""
                                    } text-blue-400`}
                            >
                                {learning_style}
                                {index !== learningStyles?.length - 1 ? "," : ""}
                            </span>
                        ))}
                        . I'm actually an{" "}
                        <span className="text-cyan-400">{personality}</span>{" "}
                    </p>
                    <p>
                        Feel free to drop me a message at{" "}
                        <a
                            className="hover:underline hover:text-blue-400"
                            target="_blank"
                            href={`mailto:${email}`}
                        >
                            {email}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Home