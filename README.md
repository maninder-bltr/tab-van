# 🌲 Tab-Van

> **Smart Tab Manager with Context-Aware Notes, Workspace Snapshots & Distraction Tracking**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/your-extension-id?label=Chrome%20Store&color=4285F4)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB)](https://react.dev)

**Tab-Van** transforms your browser into a productivity powerhouse. Combine intelligent tab organization, context-aware note-taking, workspace snapshots, and distraction tracking to stay focused and get more done.

---

## ✨ Features

### 📝 Smart Notes System
- **Context-Aware Notes**: Attach notes to specific websites - they automatically appear when you revisit that site
- **Domain-Based Grouping**: Notes organized by website (e.g., all `github.com` notes together)
- **General Notes**: Quick notes accessible anytime, anywhere
- **Powerful Search**: Full-text search across all your notes
- **Cloud Sync**: Access notes across devices when signed in

### 💼 Workspace Snapshots
- **Save Tab Sessions**: Capture your entire workspace with one click
- **Smart Filters**: Save all tabs, exclude distractions, or save work tabs only
- **One-Click Restore**: Reopen saved workspaces instantly
- **Unlimited Workspaces**: Create as many snapshots as you need
- **Perfect For**: Research projects, daily workflows, meeting prep, learning sessions

### 🧠 AI-Powered Tab Organization
- **Auto-Group Tabs**: Tabs automatically grouped by category (Work, Social, Entertainment, Shopping, etc.)
- **Smart Detection**: Recognizes work vs. distraction tabs using pattern matching
- **Visual Groups**: Color-coded tab groups for instant recognition
- **Toggle On/Off**: Enable when you need focus, disable when you need flexibility

### ⏱️ Website Time Guard
- **Track Distraction Time**: See exactly how long you spend on distracting sites
- **Monetary Value**: Converts time to money (₹1 = 1 second) - visualize what you're really losing
- **Smart Nudges**: Gentle, contextual reminders when you've spent too long on distractions
- **Daily Analytics**: Visual bar charts showing your browsing patterns over time
- **Site-by-Site Breakdown**: Know exactly which sites consume your time

### 🔐 Flexible Storage Options
- **Guest Mode**: Use instantly without signup - all data stored locally in your browser
- **Cloud Sync**: Sign in with Google or Email to sync across devices via Supabase
- **One-Click Migration**: Easily move from local to cloud storage anytime
- **Privacy First**: Your data is encrypted, and you control where it's stored

### 🎨 Beautiful, Intuitive Interface
- **Modern Design**: Clean, professional UI that doesn't distract from your work
- **Keyboard Shortcuts**: Quick access with customizable hotkeys (`Ctrl+Shift+N`)
- **Side Panel Support**: Access notes without leaving your current tab
- **Responsive**: Works perfectly on any screen size

---

## 🎯 Who Should Use Tab-Van?

| User Type | Use Case |
|-----------|----------|
| 🎓 **Students** | Organize research tabs, annotate study materials, track social media time |
| 💼 **Professionals** | Save project workspaces, organize meeting tabs, stay focused during work hours |
| 👨‍💻 **Developers** | Keep coding resources organized, document solutions, track GitHub/Stack Overflow time |
| 🔬 **Researchers** | Save research sessions, annotate sources, monitor distraction time |
| 🧑‍🎨 **Freelancers** | Manage multiple client projects, switch between workspaces instantly |
| 🌍 **Anyone** | Stop losing important tabs, take better notes, reduce distraction time |

---

## 🚀 Quick Start

### Install from Chrome Web Store (Coming Soon)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for **"Tab-Van"**
3. Click **"Add to Chrome"** → **"Add Extension"**
4. Pin the extension to your toolbar for easy access

### Install from Source (Development)
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/tab-van.git
cd tab-van

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Build the extension
npm run build

# 5. Load in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode" (top right)
# - Click "Load unpacked"
# - Select the `dist` or `build` folder
```

---

## 📖 Usage Guide

### 🏠 Home Tab
- **Toggle Tab Organization**: Enable/disable auto-grouping of tabs
- **Quick Access**: Jump to Notes or Workspaces with one click
- **Time Guard Summary**: See your current distraction time and money lost

### 📝 Notes Tab
```
1. Click the "Notes" tab in the popup
2. Type in "Quick General Note" and press Enter to create a note
3. Visit any website → Click the sticky note widget to add a site-specific note
4. Use the search bar to find notes by content or domain
5. Filter by: All | Website | General
```

### 💼 Workspaces Tab
```
1. Open tabs for your current project/session
2. Click "Save Snap" in the Workspaces tab
3. Name your workspace and choose a filter option:
   • Save all tabs
   • Exclude Distractions  
   • Work tabs only
4. Click "Save Snapshot"
5. Later, click the restore button (↻) to reopen all tabs
```

### ⏱️ Time Guard Analytics
```
1. Click the "Analytics" button next to Website Time Guard
2. View:
   • Summary cards (Total time, Money lost, Days tracked)
   • Daily breakdown with site details
   • Visual bar chart showing trends over 7 days
3. Hover over bars to see exact values
```

### 🔐 Syncing Data to Cloud
```
1. Sign in with Google or Email from the login screen
2. If you have local data, a "Sync" button appears in the header
3. Click "Sync" to migrate your notes, workspaces, and time data to Supabase
4. Your data is now accessible across all your devices
```

---

## 🛠️ Development

### Project Structure
```
tab-van/
├── public/
│   ├── manifest.json          # Chrome extension manifest
│   ├── treeLogo.png           # Extension icon
│   └── index.html             # Popup entry point
├── src/
│   ├── App.jsx                # Main React component
│   ├── main.jsx               # React entry point
│   ├── lib/
│   │   └── supabase.js        # Supabase client configuration
│   ├── utils/
│   │   ├── storage.js         # Unified storage service (local + cloud)
│   │   └── domainUtils.js     # URL normalization for context-aware notes
│   ├── config/
│   │   └── tabRules.js        # Tab categorization rules
│   ├── background/
│   │   ├── index.js           # Background script (message handling)
│   │   └── workspaceTools.js  # Tab organization & workspace logic
│   ├── content/
│   │   ├── index.jsx          # Content script (note widget injection)
│   │   └── content.css        # Widget styling
│   └── sidepanel/
│       └── index.jsx          # Side panel component (optional)
├── .env.example               # Environment variables template
├── vite.config.js             # Vite + CRX plugin configuration
├── package.json               # Dependencies & scripts
└── README.md                  # This file
```

### Available Scripts
```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production (outputs to dist/)
npm run preview          # Preview production build locally

# Linting & Testing
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting errors
npm run test             # Run tests (if configured)

# Extension Specific
npm run build:watch      # Watch mode for extension rebuilding
npm run package          # Create .zip for Chrome Web Store submission
```

### Environment Variables
Create a `.env` file based on `.env.example`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (for Chrome Identity API)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Extension Configuration
VITE_EXTENSION_ID=your-extension-id  # Optional, for development
```

### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database/schema.sql`:
```sql
-- Create tables, indexes, and RLS policies
-- See database/schema.sql for full script
```
3. Enable Email & Google authentication in Supabase Dashboard
4. Add your Supabase URL and anon key to `.env`

### Adding New Features
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following the existing code style
3. Add/update tests if applicable
4. Update documentation as needed
5. Submit a pull request

---

## 🧰 Technologies Used

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, Vite, Lucide React (icons) |
| **Backend** | Supabase (Auth, Database, Realtime) |
| **Chrome APIs** | tabs, storage, tabGroups, identity, sidePanel, scripting |
| **Build Tools** | Vite, @crxjs/vite-plugin, ESLint |
| **State Management** | React Hooks (useState, useEffect, useRef, memo) |
| **Styling** | Inline styles with CSS variables (easy to customize) |
| **Testing** | (Ready for Vitest/Jest - not yet implemented) |

---

## 🔒 Privacy & Security

- **Your Data, Your Control**: Choose between local-only storage or encrypted cloud sync
- **No Tracking**: We don't track your browsing history, sell data, or serve ads
- **Open Source**: All code is transparent and auditable on GitHub
- **Secure Authentication**: Industry-standard OAuth 2.0 and PKCE flow
- **Minimal Permissions**: Only requests permissions necessary for core features
- **Row-Level Security**: Supabase RLS policies ensure users can only access their own data

### Permissions Explained
| Permission | Why We Need It |
|------------|---------------|
| `tabs` | Organize, group, and restore your tabs |
| `storage` | Save notes, workspaces, and settings locally |
| `sidePanel` | Access notes from Chrome's side panel |
| `scripting` | Inject the note-taking widget on web pages |
| `tabGroups` | Create and manage smart tab groups |
| `identity` | Enable Google sign-in for cloud sync |
| `contextMenus` | Right-click shortcuts for quick actions |

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

### Quick Start for Contributors
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/tab-van.git
cd tab-van

# Create a feature branch
git checkout -b feature/your-amazing-idea

# Make your changes, then:
git add .
git commit -m "feat: add amazing feature"
git push origin feature/your-amazing-idea

# Open a Pull Request on GitHub
```

### What We're Looking For
- 🐛 Bug fixes
- ✨ New features (please discuss in Issues first)
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Test coverage
- 🌍 Internationalization support

### Code Style
- Follow existing patterns in the codebase
- Use meaningful variable/function names
- Add JSDoc comments for complex functions
- Keep components small and focused
- Write descriptive commit messages

---

## 🐛 Reporting Issues

Found a bug or have a feature request? Please:

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs. actual behavior
   - Screenshots if helpful
   - Your environment (OS, Chrome version, extension version)

👉 [Report an Issue](https://github.com/yourusername/tab-van/issues/new)

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Context-aware notes with domain grouping
- [x] Workspace snapshots with filters
- [x] AI-powered tab organization
- [x] Time Guard with monetary value tracking
- [x] Guest mode + cloud sync with Supabase
- [x] Beautiful, responsive UI

### 🚧 In Progress
- [ ] Note pinning and favorites
- [ ] Custom tab grouping rules
- [ ] Advanced productivity reports
- [ ] Smart break reminders

### 💡 Planned
- [ ] Cross-browser support (Firefox, Edge)
- [ ] Custom themes and colors
- [ ] Team/shared workspaces
- [ ] AI-powered note summarization
- [ ] Browser history integration (opt-in)

Have an idea? [Open a discussion](https://github.com/yourusername/tab-van/discussions)!

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

```
MIT License

Copyright (c) 2024 Tab-Van Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Lucide](https://lucide.dev) for beautiful, consistent icons
- [Vite](https://vitejs.dev) and [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) for seamless extension development
- The open-source community for inspiration and support

---

## 📬 Support & Contact

**Having trouble?** We're here to help!

- 📧 **Email**: support@tabvan.com *(replace with your email)*
- 💬 **GitHub Discussions**: [Ask questions, share ideas](https://github.com/yourusername/tab-van/discussions)
- 🐛 **Bug Reports**: [Open an issue](https://github.com/yourusername/tab-van/issues)
- 📖 **Wiki**: [User guides & FAQs](https://github.com/yourusername/tab-van/wiki)

**Love Tab-Van?**
- ⭐ Star us on GitHub
- 📝 Leave a review on the [Chrome Web Store](https://chrome.google.com/webstore)
- 🐦 Follow updates: `@TabVanApp` *(optional)*
- 💙 Share with a friend who needs better browser organization

---

<div align="center">
  <sub>Built with 🌲 by the Tab-Van Team</sub>
  <br>
  <sub>Stay focused. Stay productive. Stay intentional.</sub>
</div>
