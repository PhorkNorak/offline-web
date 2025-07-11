﻿# 🌐 Offline Todo Web App

A fully functional todo application that works seamlessly online and offline using Service Workers and localStorage.

🌐 **[Live Demo](https://phorknorak.github.io/offline-web/)** | 📦 **[GitHub Repo](https://github.com/PhorkNorak/offline-web)**

## 🚀 Quick Start

### 1. Try it Online
**Instant demo:** [https://phorknorak.github.io/offline-web/](https://phorknorak.github.io/offline-web/)

### 2. Run Locally
```bash
# Clone the repository
git clone https://github.com/PhorkNorak/offline-web.git
cd offline-web

# Serve locally using VS Code Live Server
# 1. Install "Live Server" extension in VS Code
# 2. Right-click index.html → "Open with Live Server"
# 3. Open browser to: http://localhost:5500
```

### 3. Test Offline Features
- ✅ **Add tasks while online**
- 📡 **Turn off WiFi/internet** 
- ➕ **Add more tasks** (see orange borders = pending sync)
- 📶 **Turn WiFi back on** → watch auto-sync magic! ✨

## ✨ Features

- **🔄 Complete Offline Functionality** - Works without internet connection
- **⚡ Real-time Sync** - Automatically syncs when back online
- **💾 Data Persistence** - Never lose your tasks with localStorage
- **📱 Visual Status Indicators** - See online/offline status and sync progress
- **📝 Task Management** - Add, edit, delete, and filter tasks
- **🎨 Modern UI** - Clean, responsive design with smooth animations

## 📱 How to Use

### Basic Operations
- **Add Task**: Type in the input field and click "Add Task" or press Enter
- **Complete Task**: Click the checkbox to mark as done/undone
- **Edit Task**: Click "Edit" button, modify text, then "Save" or press Enter
- **Delete Task**: Click "Delete" button to remove task
- **Filter Tasks**: Use "All", "Active", or "Completed" filters

### Offline Features
- **🔴 Offline Indicator**: Red dot shows when you're offline
- **🔵 Sync Indicator**: Blue spinning indicator shows when syncing
- **🟠 Pending Changes**: Orange border on tasks waiting to sync
- **📤 Manual Sync**: Click "Sync (3)" to force sync pending changes
- **🗑️ Clear Cache**: Reset all cached data and stored tasks

## 🚀 How It Works

### Offline Technology
- **Service Worker**: Caches all app resources for offline access
- **Cache-First Strategy**: Loads from cache first, fallback to network
- **localStorage**: Stores tasks locally on your device
- **Background Sync**: Queues changes and syncs when online

### Offline Capabilities
1. **First Visit (Online)**: Service worker caches all files
2. **Subsequent Visits**: App loads instantly from cache, even offline
3. **Offline Usage**: Add, edit, delete tasks - all stored locally
4. **Back Online**: Automatically syncs all offline changes

## 📊 Data Flow

### 💾 Data Storage Locations

| Storage Location | Purpose | When Used |
|-----------------|---------|-----------|
| `localStorage.todos` | **All your tasks** | Always (online + offline) |
| `localStorage.pendingSync` | **"Send to server" queue** | Only when offline changes |
| **Browser Cache** | **App files (HTML/CSS/JS)** | Always (for offline loading) |

### 🔄 Data Flow Diagrams

#### **When ONLINE:**
```
User Action (Add/Edit/Delete Task)
           ↓
    Update todos array
           ↓
  Save to localStorage.todos  ←── Your tasks are safe here!
           ↓
    Update UI immediately
           ↓
   Send to server (simulated)
           ↓
  Mark as 'synced' ✅
```

#### **When OFFLINE:**
```
User Action (Add/Edit/Delete Task)
           ↓
    Update todos array
           ↓
  Save to localStorage.todos  ←── Your tasks are safe here!
           ↓
Add to localStorage.pendingSync  ←── Queue for later sync
           ↓
    Update UI immediately
           ↓
  Show orange border (pending) 🟠
```

#### **When BACK ONLINE:**
```
Connectivity Detected
           ↓
Process pendingSync queue
           ↓
For each pending item:
  ├── Send to server
  ├── Mark todo as 'synced'
  └── Remove orange border
           ↓
Clear pendingSync queue
           ↓
Show "Sync completed!" ✅
```

### 🔍 Connectivity Detection Flow

```
Every 3 seconds + on startup:
           ↓
Try fetch /offline-web/index.html
  ├── Success (response.ok) → ONLINE 🟢
  └── Fail/Timeout (2s) → OFFLINE 🔴
           ↓
Update offline indicator
           ↓
If went online: Auto-sync pending changes
```

### 📱 Visual Indicators

| Indicator | Meaning | When Shown |
|-----------|---------|------------|
| 🔴 **Red dot "Offline Mode"** | No internet connection | When offline |
| 🟢 **Green dot (3 seconds)** | Just came back online | When reconnected |
| 🔵 **Blue spinner "Syncing..."** | Sending changes to server | During sync |
| 🟠 **Orange left border on tasks** | Task waiting to sync | Offline changes |
| **"Sync (3)"** button text | 3 pending changes | When pending items exist |
| **"All Synced ✓"** button (disabled) | Everything is synced | When no pending changes |

### 🎯 Key Data Flow Principles

1. **Optimistic UI**: Changes appear instantly, regardless of network
2. **Local-First**: All data stored locally immediately 
3. **Never Lose Data**: Tasks saved to localStorage before any network calls
4. **Background Sync**: Server updates happen transparently
5. **Conflict-Free**: Last-write-wins strategy (simple but effective)

### 🔧 Technical Implementation

#### **Service Worker Cache Strategy:**
```javascript
// 1. Check cache first
response = cache.match(request)
if (response) return response;

// 2. Try network
try {
    return fetch(request);
} catch {
    // 3. Fallback to cached index.html for navigation
    return cache.match('/offline-web/index.html');
}
```

#### **Data Persistence Strategy:**
```javascript
// Always save locally first
this.todos.unshift(newTodo);
this.saveTodos(); // → localStorage.todos

// Then handle sync
if (offline) {
    this.addToPendingSync('create', newTodo); // → localStorage.pendingSync
} else {
    this.simulateApiCall('create', newTodo); // → server
}
```

#### **Sync Process:**
```javascript
// When back online
for (const item of pendingSync) {
    await apiCall(item.action, item.data);  // Send to server
    todo.syncStatus = 'synced';             // Update local status
}
pendingSync = [];  // Clear queue
```



## 🛠️ Technical Details

### Files Structure
```
offline-web/
├── index.html          # Main HTML structure
├── script.js           # App logic & Service Worker
├── styles.css          # All styling and animations
└── README.md           # This file
```

### Service Worker Implementation
- **Inline Registration**: Service worker code is embedded in script.js
- **Resource Caching**: Caches HTML, CSS, JS files
- **Offline Fallback**: Returns cached index.html for navigation requests
- **Cache Name**: `todo-app-v1` (update version to force cache refresh)

### Data Storage
- **Tasks**: Stored in `localStorage.todos` as JSON
- **Pending Sync**: Stored in `localStorage.pendingSync` for offline changes
- **Automatic Recovery**: Graceful handling of storage errors



## 🌐 Deployment

### GitHub Pages (Recommended)
1. **Fork this repository** or push to your GitHub
2. **Go to Settings → Pages**
3. **Select source branch** (usually `main`)
4. **Access at:** `https://yourusername.github.io/offline-web/`


## 🔧 Development

### Testing Offline Mode
1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox

### Cache Updates
- Change `CACHE_NAME` in script.js to force cache refresh
- Example: `'todo-app-v1'` → `'todo-app-v2'`

### Browser Support
- Modern browsers with Service Worker support
- Chrome, Firefox, Safari, Edge (recent versions)

## 📊 Features Breakdown

| Feature | Online | Offline |
|---------|--------|---------|
| Load App | ✅ | ✅ |
| View Tasks | ✅ | ✅ |
| Add Tasks | ✅ | ✅ |
| Edit Tasks | ✅ | ✅ |
| Delete Tasks | ✅ | ✅ |
| Filter Tasks | ✅ | ✅ |
| Data Sync | ✅ | ⏳ (queued) |

## 🎯 Use Cases

- **Personal Task Management** - Keep track of daily todos
- **Offline Work Environment** - Use without internet connection
- **Learning Project** - Understand Service Workers and offline-first design

## 🔍 Technical Notes

### Cache Strategy
```javascript
// Cache-first with network fallback
caches.match(request) || fetch(request)
```

### Offline Detection
```javascript
// Monitors online/offline status
navigator.onLine
window.addEventListener('online/offline')
```

### Data Synchronization
- **Optimistic UI**: Changes appear immediately
- **Queue System**: Offline changes stored for later sync
- **Conflict Resolution**: Last-write-wins strategy

