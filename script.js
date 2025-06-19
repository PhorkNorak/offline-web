// Service Worker Registration
if ('serviceWorker' in navigator) {
    const swCode = `
        const CACHE_NAME = 'todo-app-v1';
        const urlsToCache = [
            '.',
            'index.html',
            'styles.css',
            'script.js',
            'data:application/json;base64,ewogICJuYW1lIjogIk9mZmxpbmUgVG8tRG8gQXBwIiwKICAic2hvcnRfbmFtZSI6ICJUb0RvIiwKICAic3RhcnRfdXJsIjogIi8iLAogICJkaXNwbGF5IjogInN0YW5kYWxvbmUiLAogICJiYWNrZ3JvdW5kX2NvbG9yIjogIiM2NjdlZWEiLAogICJ0aGVtZV9jb2xvciI6ICIjNjY3ZWVhIiwKICAiaWNvbnMiOiBbCiAgICB7CiAgICAgICJzcmMiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCM2FXUjBhRDBpTWpReElpQm9aV2xuYUhROUlqSTBNU0lnZG1sbGQwSnZlRDBpTUNBd0lESTBNU0F5TkRFaUlHWnBiR3c5SWlNMk5qZGxaV0VpUGp4d1lYUm9JR1E5SWsweE1qQXVOVlp5TmxNeE5qQXVNall4TGpVdE1USXlURGsyTGpReGJETTNMakV5YzJFek1pNHdOeUF6TWk0d055QXdJREF4TFM0d01pNHdPR3d0TVRJNElqQnRNaTR3TW1BeVNEYzJMakU0TFVjek5EY3VNaUE0T0RJdE1UUTBMams1VERJNExqUXlJSEEzTlY0aVBqd3ZjR0YwYUQ0OEwzTjJaejQ9IiwKICAgICAgInNpemVzIjogIjI0MXgyNDEiLAogICAgICAidHlwZSI6ICJpbWFnZS9zdmcreG1sIgogICAgfQogIF0KfQ=='
        ];

        self.addEventListener('install', event => {
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then(cache => cache.addAll(urlsToCache))
            );
        });

        self.addEventListener('fetch', event => {
            event.respondWith(
                caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        return fetch(event.request).catch(() => {
                            if (event.request.mode === 'navigate') {
                                return caches.match('index.html');
                            }
                        });
                    })
            );
        });

        self.addEventListener('message', event => {
            if (event.data && event.data.type === 'SKIP_WAITING') {
                self.skipWaiting();
            }
        });
    `;

    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    navigator.serviceWorker.register(swUrl)
        .then(registration => {
            console.log('ServiceWorker registration successful');
        })
        .catch(error => {
            console.log('ServiceWorker registration failed');
        });
}

class OfflineTodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.pendingSync = this.loadPendingSync();
        this.currentFilter = 'all';
        this.editingId = null;
        this.isOnline = navigator.onLine;
        
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.totalTasks = document.getElementById('totalTasks');
        this.activeTasks = document.getElementById('activeTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.offlineIndicator = document.getElementById('offlineIndicator');
        this.syncIndicator = document.getElementById('syncIndicator');
        this.syncBtn = document.getElementById('syncBtn');
        this.clearCacheBtn = document.getElementById('clearCacheBtn');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
        this.updateOnlineStatus();
        this.setupOfflineHandling();
    }
    
    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.updateFilterButtons();
                this.render();
            });
        });

        this.syncBtn.addEventListener('click', () => this.syncData());
        this.clearCacheBtn.addEventListener('click', () => this.clearCache());

        // Online/Offline event listeners
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
        });
    }

    setupOfflineHandling() {
        // Intercept form submissions and API calls for offline handling
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                console.log('Service Worker ready for offline functionality');
            });
        }
    }

    updateOnlineStatus() {
        if (this.isOnline) {
            this.offlineIndicator.className = 'offline-indicator online';
            setTimeout(() => {
                this.offlineIndicator.className = 'offline-indicator';
            }, 3000);
        } else {
            this.offlineIndicator.className = 'offline-indicator offline';
        }
    }

    showSyncIndicator(show = true) {
        this.syncIndicator.className = show ? 'sync-indicator syncing' : 'sync-indicator';
    }
    
    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;
        
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            syncStatus: this.isOnline ? 'synced' : 'pending'
        };
        
        this.todos.unshift(todo);
        this.todoInput.value = '';
        
        if (!this.isOnline) {
            this.addToPendingSync('create', todo);
        }
        
        this.saveTodos();
        this.render();
        this.updateStats();

        // Simulate API call if online
        if (this.isOnline) {
            this.simulateApiCall('create', todo);
        }
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.lastModified = new Date().toISOString();
            todo.syncStatus = this.isOnline ? 'synced' : 'pending';
            
            if (!this.isOnline) {
                this.addToPendingSync('update', todo);
            }
            
            this.saveTodos();
            this.render();
            this.updateStats();

            if (this.isOnline) {
                this.simulateApiCall('update', todo);
            }
        }
    }
    
    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.todos = this.todos.filter(t => t.id !== id);
            
            if (!this.isOnline) {
                this.addToPendingSync('delete', { id });
            }
            
            this.saveTodos();
            this.render();
            this.updateStats();

            if (this.isOnline) {
                this.simulateApiCall('delete', { id });
            }
        }
    }
    
    startEdit(id) {
        this.editingId = id;
        this.render();
    }
    
    saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            todo.lastModified = new Date().toISOString();
            todo.syncStatus = this.isOnline ? 'synced' : 'pending';
            this.editingId = null;
            
            if (!this.isOnline) {
                this.addToPendingSync('update', todo);
            }
            
            this.saveTodos();
            this.render();

            if (this.isOnline) {
                this.simulateApiCall('update', todo);
            }
        }
    }
    
    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    addToPendingSync(action, data) {
        const syncItem = {
            id: Date.now() + Math.random(),
            action,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.pendingSync.push(syncItem);
        this.savePendingSync();
    }

    async syncData() {
        if (!this.isOnline || this.pendingSync.length === 0) return;

        this.showSyncIndicator(true);

        try {
            // Process pending sync items
            for (const item of this.pendingSync) {
                await this.simulateApiCall(item.action, item.data);
                
                // Update sync status for the todo
                if (item.data.id) {
                    const todo = this.todos.find(t => t.id === item.data.id);
                    if (todo) {
                        todo.syncStatus = 'synced';
                    }
                }
            }

            // Clear pending sync items
            this.pendingSync = [];
            this.savePendingSync();
            this.saveTodos();
            this.render();

            // Show success message
            this.showNotification('Sync completed successfully!', 'success');

        } catch (error) {
            console.error('Sync failed:', error);
            this.showNotification('Sync failed. Will retry later.', 'error');
            
            // Mark items with sync errors
            this.todos.forEach(todo => {
                if (todo.syncStatus === 'pending') {
                    todo.syncStatus = 'error';
                }
            });
            this.render();
        } finally {
            this.showSyncIndicator(false);
        }
    }

    async simulateApiCall(action, data) {
        // Simulate network delay and potential failures
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Simulate occasional failures (10% chance)
        if (Math.random() < 0.1) {
            throw new Error('Network error');
        }
        
        console.log(`API ${action}:`, data);
        return { success: true };
    }

    async clearCache() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                
                // Also clear localStorage
                localStorage.removeItem('todos');
                localStorage.removeItem('pendingSync');
                
                this.showNotification('Cache cleared successfully!', 'success');
                
                // Reload the page
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error('Error clearing cache:', error);
                this.showNotification('Failed to clear cache', 'error');
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#51cf66' : type === 'error' ? '#ff6b6b' : '#4dabf7'};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
    
    updateFilterButtons() {
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }
    
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }
    
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;
        const pendingCount = this.pendingSync.length;
        
        this.totalTasks.textContent = `Total: ${total}`;
        this.activeTasks.textContent = `Active: ${active}`;
        this.completedTasks.textContent = `Completed: ${completed}`;
        
        // Update sync button text
        this.syncBtn.textContent = pendingCount > 0 ? `Sync (${pendingCount})` : 'Sync Now';
    }
    
    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = `
                <div class="empty-state">
                    ${this.currentFilter === 'all' ? 'No tasks yet. Add one above!' : 
                      this.currentFilter === 'active' ? 'No active tasks!' : 'No completed tasks!'}
                </div>
            `;
            return;
        }
        
        this.todoList.innerHTML = filteredTodos.map(todo => {
            if (this.editingId === todo.id) {
                return `
                    <li class="todo-item">
                        <div class="todo-left">
                            <input type="text" class="edit-input" value="${todo.text}" id="edit-${todo.id}">
                        </div>
                        <div class="edit-actions">
                            <button class="save-btn" onclick="app.saveEdit(${todo.id}, document.getElementById('edit-${todo.id}').value)">Save</button>
                            <button class="cancel-btn" onclick="app.cancelEdit()">Cancel</button>
                        </div>
                    </li>
                `;
            }
            
            const syncClass = todo.syncStatus === 'pending' ? 'pending-sync' : 
                            todo.syncStatus === 'error' ? 'sync-error' : '';
            
            return `
                <li class="todo-item ${todo.completed ? 'completed' : ''} ${syncClass}">
                    <div class="todo-left">
                        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                               onchange="app.toggleTodo(${todo.id})">
                        <span class="todo-text">${todo.text}</span>
                    </div>
                    <div class="todo-actions">
                        <button class="edit-btn" onclick="app.startEdit(${todo.id})" ${todo.completed ? 'disabled' : ''}>Edit</button>
                        <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">Delete</button>
                    </div>
                </li>
            `;
        }).join('');
        
        // Focus on edit input if editing
        if (this.editingId) {
            const editInput = document.getElementById(`edit-${this.editingId}`);
            if (editInput) {
                editInput.focus();
                editInput.select();
                
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.saveEdit(this.editingId, editInput.value);
                    } else if (e.key === 'Escape') {
                        this.cancelEdit();
                    }
                });
            }
        }
    }
    
    loadTodos() {
        try {
            const stored = localStorage.getItem('todos');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading todos:', error);
            return [];
        }
    }
    
    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos:', error);
        }
    }

    loadPendingSync() {
        try {
            const stored = localStorage.getItem('pendingSync');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading pending sync:', error);
            return [];
        }
    }

    savePendingSync() {
        try {
            localStorage.setItem('pendingSync', JSON.stringify(this.pendingSync));
        } catch (error) {
            console.error('Error saving pending sync:', error);
        }
    }
}

// Initialize the app
const app = new OfflineTodoApp();

// Auto-sync when coming back online
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine && app.pendingSync.length > 0) {
        setTimeout(() => app.syncData(), 1000);
    }
});