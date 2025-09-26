import { useEffect, useState } from 'react'
import { supabaseClient } from '../../clients/supabaseClient';
import { Navigate, Outlet } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import LeftSideBar from '../../components/LeftSideBar';
import StreamProvider from '@/providers/StreamProvider';
import IncomingCallDialog from '@/components/IncomingCallDialog';

const RootLayout = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!session) return <Navigate to="/signin" replace />;

    return (
        <div className='flex w-full h-full'>
            <LeftSideBar />
            <StreamProvider>
                <IncomingCallDialog />
                <Outlet />
            </StreamProvider>
        </div>
    )

}

export default RootLayout