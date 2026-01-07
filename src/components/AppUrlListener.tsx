import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

const AppUrlListener = () => {
    const navigate = useNavigate();

    useEffect(() => {
        CapacitorApp.addListener('appUrlOpen', (data) => {
            // Example url: artemis://auth/callback?code=...
            const url = new URL(data.url);
            if (url.protocol === 'artemis:') {
                const path = url.pathname; // /auth/callback
                const search = url.search; // ?code=...
                // Navigate to the path with query params
                navigate(path + search);
            }
        });
    }, [navigate]);

    return null;
};

export default AppUrlListener;
