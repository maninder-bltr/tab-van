// Default tab categorization rules (user can override)
export const DEFAULT_TAB_RULES = {
    work: {
        name: '💼 Work',
        color: 'blue',
        patterns: [
            'github.com',
            'gitlab.com',
            'bitbucket.org',
            'localhost',
            '127.0.0.1',
            'stackoverflow.com',
            'docs.',
            'notion.so',
            'figma.com',
            'jira.',
            'trello.com',
            'linear.app',
            'vercel.com',
            'netlify.app',
            'clickup.com'
        ]
    },
    distractions: {
        name: '🎮 Distractions',
        color: 'red',
        patterns: [
            'youtube.com',
            'reddit.com',
            'twitter.com',
            'x.com',
            'facebook.com',
            'instagram.com',
            'whatsapp.com',
            'tiktok.com',
            'netflix.com',
            'hotstar.com',
            'primevideo',
            'mxplayer',
            'twitch.tv'
        ]
    },
    learning: {
        name: '📚 Learning',
        color: 'yellow',
        patterns: [
            'coursera.org',
            'udemy.com',
            'freecodecamp.org',
            'medium.com',
            'dev.to',
            'hashnode.com'
        ]
    }
};

// Helper: Check if URL matches any pattern
export const matchesPattern = (url, patterns) => {
    try {
        const hostname = new URL(url).hostname;
        return patterns.some(pattern => {
            // Simple string match or regex
            if (pattern.startsWith('/') && pattern.endsWith('/')) {
                const regex = new RegExp(pattern.slice(1, -1), 'i');
                return regex.test(hostname);
            }
            return hostname.includes(pattern);
        });
    } catch {
        return false;
    }
};