import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import { FaGithub, FaGoogle } from "react-icons/fa";

import { signUpWithEmail, signInWithProvider } from '../../services/authService';
import Loader from '../../components/Loader';

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        const { error } = await signUpWithEmail(email, password);

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            setSuccessMsg(
                "Thanks for signing up! We've sent a confirmation email to your inbox. Please verify your email to activate your account."
            );
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-90 p-8 bg-white rounded-lg">
                <div className="flex flex-1 gap-2">
                    <img src="/icons/logo.png" alt="logo" className="w-16 h-16" />
                    <h2 className="text-2xl font-semibold text-purple-800 mb-2">
                        Ready to boost your <br />
                        learning journey?
                    </h2>
                </div>
                <p className="mb-6">Sign up now and start your learning journey!</p>

                <div className="flex mb-4 border-b-1 justify-between pb-4 gap-2">
                    <button
                        onClick={async () => { await signInWithProvider("google") }}
                        className="flex py-3 w-full bg-slate-100 justify-center items-center shadow-md rounded-md hover:cursor-pointer"
                    >
                        <FaGoogle className="h-5 w-5" />
                    </button>
                    <button
                        onClick={async () => { await signInWithProvider("github") }}
                        className="flex py-3 w-full bg-slate-100 justify-center items-center shadow-md rounded-md hover:cursor-pointer"
                    >
                        <FaGithub className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-[#004f66] text-sm mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border border-[#c0e2e9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c2cb]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[#004f66] text-sm mb-1">
                            Your Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-[#c0e2e9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c2cb]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#006994] hover:bg-[#00577e] text-white py-2 rounded-md transition duration-200 flex justify-center items-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader size={20} text="Creating account..." />
                        ) : (
                            "Sign Up"
                        )}
                    </button>
                </form>

                <p className="text-sm text-center text-purple-800 mt-1 underline">
                    <Link to="/signin">Already have an account? Sign in</Link>
                </p>

                <div className="min-h-[40px] mt-2 text-sm text-center">
                    {errorMsg && (
                        <div className="p-2 bg-pink-100 rounded-md text-red-600">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-2 bg-green-100 rounded-md text-green-700">
                            {successMsg}
                        </div>
                    )}
                </div>
                <p className="text-sm text-center text-transparent select-none mt-4 underline">
                    just a palceholder
                </p>
            </div>
        </div>
    );
}

export default SignUp