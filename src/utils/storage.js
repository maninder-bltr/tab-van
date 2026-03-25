import { supabase } from "../lib/supabase";

export const StorageService = {
    // Check if user is authenticated (not guest)
    isAuthenticated: async () => {
        return new Promise((resolve) => {
            chrome.storage.local.get(['currentUser'], (result) => {
                const user = result.currentUser;
                resolve(user && !user.is_guest);
            });
        });
    },

    // Get current user from chrome storage
    getCurrentUser: async () => {
        return new Promise((resolve) => {
            chrome.storage.local.get(['currentUser'], (result) => {
                resolve(result.currentUser);
            });
        });
    },

    // Get Supabase user
    getSupabaseUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // ==================== NOTES ====================

    saveNotes: async (notes) => {
        const isAuth = await StorageService.isAuthenticated();
        const user = await StorageService.getCurrentUser();

        if (isAuth && user) {
            // Save to Supabase
            const notesToUpsert = notes.map(note => ({
                id: note.id,
                user_id: user.id,
                content: note.content,
                domain: note.domain || null,
                source_url: note.sourceUrl || null,
                created_at: new Date(note.createdAt).toISOString(),
                updated_at: new Date(note.updatedAt).toISOString()
            }));

            const { error } = await supabase
                .from('notes')
                .upsert(notesToUpsert, { onConflict: 'user_id,id' });

            if (error) {
                console.error('Failed to save notes to Supabase:', error);
                // Fallback to local storage
                await chrome.storage.local.set({ notes });
                throw error;
            }
        } else {
            // Save to local storage (Guest mode)
            await chrome.storage.local.set({ notes });
        }
    },

    loadNotes: async () => {
        const isAuth = await StorageService.isAuthenticated();
        const user = await StorageService.getCurrentUser();

        if (isAuth && user) {
            // Load from Supabase
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Failed to load notes from Supabase:', error);
                // Fallback to local storage
                const { notes } = await chrome.storage.local.get('notes');
                return notes || [];
            }

            // Transform Supabase data to app format
            return data.map(note => ({
                id: note.id,
                content: note.content,
                domain: note.domain,
                sourceUrl: note.source_url,
                createdAt: new Date(note.created_at).getTime(),
                updatedAt: new Date(note.updated_at).getTime()
            }));
        } else {
            // Load from local storage (Guest mode)
            const { notes } = await chrome.storage.local.get('notes');
            return notes || [];
        }
    },

    // ==================== WORKSPACES ====================

    saveWorkspaces: async (workspaces) => {
        const isAuth = await StorageService.isAuthenticated();
        const user = await StorageService.getCurrentUser();

        if (isAuth && user) {
            console.log('[Storage] Saving workspaces to Supabase:', workspaces.length);

            // Transform workspaces for Supabase
            const workspacesToUpsert = workspaces.map(ws => ({
                id: ws.id,
                user_id: user.id,
                name: ws.name,
                tabs: ws.tabs || [],
                filter_mode: ws.filterMode || 'all',
                created_at: new Date(ws.createdAt).toISOString()
            }));

            console.log('[Storage] Upserting:', workspacesToUpsert);

            const { data, error } = await supabase
                .from('workspaces')
                .upsert(workspacesToUpsert, {
                    onConflict: 'user_id,id',
                    ignoreDuplicates: false
                })
                .select();

            if (error) {
                console.error('[Storage] Failed to save workspaces:', error);
                throw error;
            }

            console.log('[Storage] Workspaces saved successfully:', data);
        } else {
            // Save to local storage (Guest mode)
            await chrome.storage.local.set({ workspaces });
            console.log('[Storage] Workspaces saved to local storage');
        }
    },

    loadWorkspaces: async () => {
        const isAuth = await StorageService.isAuthenticated();
        const user = await StorageService.getCurrentUser();

        if (isAuth && user) {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to load workspaces from Supabase:', error);
                const { workspaces } = await chrome.storage.local.get('workspaces');
                return workspaces || [];
            }

            return data.map(ws => ({
                id: ws.id,
                name: ws.name,
                tabs: ws.tabs || [],
                filterMode: ws.filter_mode || 'all',
                createdAt: new Date(ws.created_at).getTime()
            }));
        } else {
            const { workspaces } = await chrome.storage.local.get('workspaces');
            return workspaces || [];
        }
    },

    // ==================== TIME GUARD HISTORY ====================

    saveTimeGuardHistory: async (history) => {
        const isAuth = await StorageService.isAuthenticated();
        const user = await StorageService.getCurrentUser();

        if (isAuth && user) {
            const historyToUpsert = history.map(day => ({
                user_id: user.id,
                date: day.date,
                total_seconds: day.totalSeconds || 0,
                sites: day.sites || []
            }));

            const { error } = await supabase
                .from('time_guard_history')
                .upsert(historyToUpsert, { onConflict: 'user_id,date' });

            if (error) {
                console.error('Failed to save time guard history:', error);
                await chrome.storage.local.set({ timeGuardHistory: history });
                throw error;
            }
        } else {
            await chrome.storage.local.set({ timeGuardHistory: history });
        }
    },

    loadTimeGuardHistory: async () => {
        const isAuth = await StorageService.isAuthenticated();
        const user = await StorageService.getCurrentUser();

        if (isAuth && user) {
            const { data, error } = await supabase
                .from('time_guard_history')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) {
                console.error('Failed to load time guard history:', error);
                const { timeGuardHistory } = await chrome.storage.local.get('timeGuardHistory');
                return timeGuardHistory || [];
            }

            return data.map(day => ({
                date: day.date,
                totalSeconds: day.total_seconds || 0,
                sites: day.sites || []
            }));
        } else {
            const { timeGuardHistory } = await chrome.storage.local.get('timeGuardHistory');
            return timeGuardHistory || [];
        }
    },

    // ==================== SYNC LOCAL TO CLOUD ====================

    syncLocalToCloud: async () => {
        const isAuth = await StorageService.isAuthenticated();
        if (!isAuth) {
            throw new Error('User must be authenticated to sync');
        }

        const user = await StorageService.getCurrentUser();
        const localData = await new Promise((resolve) => {
            chrome.storage.local.get(['notes', 'workspaces', 'timeGuardHistory'], resolve);
        });

        let syncedCount = 0;
        let errors = [];

        // Sync Notes
        if (localData.notes && localData.notes.length > 0) {
            try {
                const notesToUpsert = localData.notes.map(note => ({
                    id: note.id,
                    user_id: user.id,
                    content: note.content,
                    domain: note.domain || null,
                    source_url: note.sourceUrl || null,
                    created_at: new Date(note.createdAt).toISOString(),
                    updated_at: new Date(note.updatedAt).toISOString()
                }));

                const { error } = await supabase
                    .from('notes')
                    .upsert(notesToUpsert, { onConflict: 'user_id,id' });

                if (!error) {
                    syncedCount += localData.notes.length;
                } else {
                    errors.push(`Notes: ${error.message}`);
                }
            } catch (err) {
                errors.push(`Notes: ${err.message}`);
            }
        }

        // Sync Workspaces
        if (localData.workspaces && localData.workspaces.length > 0) {
            try {
                const workspacesToUpsert = localData.workspaces.map(ws => ({
                    id: ws.id,
                    user_id: user.id,
                    name: ws.name,
                    tabs: ws.tabs || [],
                    filter_mode: ws.filterMode || 'all',
                    created_at: new Date(ws.createdAt).toISOString()
                }));

                const { error } = await supabase
                    .from('workspaces')
                    .upsert(workspacesToUpsert, { onConflict: 'user_id,id' });

                if (!error) {
                    syncedCount += localData.workspaces.length;
                } else {
                    errors.push(`Workspaces: ${error.message}`);
                }
            } catch (err) {
                errors.push(`Workspaces: ${err.message}`);
            }
        }

        // Sync Time Guard History
        if (localData.timeGuardHistory && localData.timeGuardHistory.length > 0) {
            try {
                const historyToUpsert = localData.timeGuardHistory.map(day => ({
                    user_id: user.id,
                    date: day.date,
                    total_seconds: day.totalSeconds || 0,
                    sites: day.sites || []
                }));

                const { error } = await supabase
                    .from('time_guard_history')
                    .upsert(historyToUpsert, { onConflict: 'user_id,date' });

                if (!error) {
                    syncedCount += localData.timeGuardHistory.length;
                } else {
                    errors.push(`Time Guard: ${error.message}`);
                }
            } catch (err) {
                errors.push(`Time Guard: ${err.message}`);
            }
        }

        if (errors.length > 0) {
            console.error('Sync errors:', errors);
        }

        return { syncedCount, errors };
    },

    // Clear Local Storage (after successful sync)
    clearLocalData: async () => {
        await new Promise((resolve) => {
            chrome.storage.local.remove(['notes', 'workspaces', 'timeGuardHistory'], resolve);
        });
    }
};

export default StorageService;