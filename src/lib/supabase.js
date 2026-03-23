import { createClient } from '@supabase/supabase-js';

const VITE_SUPABASE_URL = 'https://qmwzbourkscontrhhyzd.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'sb_publishable_Ow8yX6MGgQoqifV0e1FRtA_dLZQd86C';

export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
    auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // ✅ CRITICAL: Use Chrome Storage for persistence
        storage: {
            getItem: (key) => {
                return new Promise((resolve) => {
                    if (typeof chrome?.storage?.local === 'undefined') {
                        resolve(null);
                        return;
                    }
                    chrome.storage.local.get([key], (result) => resolve(result[key] ?? null));
                });
            },
            setItem: (key, value) => {
                return new Promise((resolve) => {
                    if (typeof chrome?.storage?.local === 'undefined') {
                        resolve();
                        return;
                    }
                    // Supabase expects string values; keep strings as-is.
                    const storedValue = typeof value === 'string' ? value : String(value);
                    chrome.storage.local.set({ [key]: storedValue }, () => resolve());
                });
            },
            removeItem: (key) => {
                return new Promise((resolve) => {
                    if (typeof chrome?.storage?.local === 'undefined') {
                        resolve();
                        return;
                    }
                    chrome.storage.local.remove([key], () => resolve());
                });
            },
        },
    },
});