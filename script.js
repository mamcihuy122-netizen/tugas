// TUGAS SAMID PRO - Advanced App Script
const app = {
    tasks: [],
    currentView: 'dashboard',
    theme: 'light',
    username: 'Mahasiswa',

    init() {
        this.loadData();
        this.applyTheme(this.theme);
        this.updateUsernameDisplay();
        this.cacheDOM();
        this.bindEvents();
        lucide.createIcons();
        this.updateDateDisplay();
        this.renderView('dashboard');
    },

    cacheDOM() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.views = document.querySelectorAll('.view');
        this.pageTitle = document.getElementById('page-title');
        
        this.taskModal = document.getElementById('task-modal-overlay');
        this.taskForm = document.getElementById('task-form');
        this.confirmModal = document.getElementById('confirm-modal-overlay');
        
        this.btnAdd = document.getElementById('btn-add-task-header');
        this.btnSave = document.getElementById('btn-save-task');
        this.btnTheme = document.getElementById('theme-toggle');
        
        this.globalSearch = document.getElementById('global-search');
        this.globalSearchMobile = document.getElementById('global-search-mobile');
        
        this.btnMobileMenu = document.getElementById('mobile-menu-btn');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
    },

    bindEvents() {
        // Nav
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = item.getAttribute('data-view');
                this.navigate(targetView);
                if(window.innerWidth <= 768) this.toggleSidebar(false);
            });
        });

        // Theme
        this.btnTheme.addEventListener('click', () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.applyTheme(this.theme);
            this.savePreferences();
        });
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selected = e.currentTarget.getAttribute('data-theme');
                this.theme = selected;
                this.applyTheme(selected);
                this.savePreferences();
            });
        });

        // Modals
        this.btnAdd.addEventListener('click', () => this.openTaskModal());
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeTaskModal();
            });
        });
        
        // Close modal on outside click
        this.taskModal.addEventListener('click', (e) => {
            if(e.target === this.taskModal) this.closeTaskModal();
        });

        this.btnSave.addEventListener('click', () => this.saveTask());

        // Keyboard Shortcut ( / ) for search
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                if(window.innerWidth > 768) this.globalSearch.focus();
                else this.globalSearchMobile.focus();
            }
        });

        // Search Handlers
        const handleSearch = (e) => {
            const val = e.target.value;
            if(e.target.id === 'global-search') this.globalSearchMobile.value = val;
            else this.globalSearch.value = val;
            
            if(this.currentView === 'dashboard' && val.trim() !== '') {
                this.navigate('all-tasks');
            }
            this.refreshCurrentView();
        };
        this.globalSearch.addEventListener('input', handleSearch);
        this.globalSearchMobile.addEventListener('input', handleSearch);

        // Filters
        ['all', 'todo', 'progress', 'done'].forEach(view => {
            ['status', 'priority'].forEach(type => {
                const el = document.getElementById(`filter-${type}-${view}`);
                if(el) el.addEventListener('change', () => this.refreshCurrentView());
            });
            const sort = document.getElementById(`sort-${view}`);
            if(sort) sort.addEventListener('change', () => this.refreshCurrentView());
        });

        // Mobile Sidebar
        this.btnMobileMenu.addEventListener('click', () => this.toggleSidebar(true));
        this.sidebarOverlay.addEventListener('click', () => this.toggleSidebar(false));

        // Settings
        document.getElementById('btn-save-username').addEventListener('click', () => {
            const input = document.getElementById('input-username').value.trim();
            if(input) {
                this.username = input;
                this.updateUsernameDisplay();
                this.savePreferences();
                this.showToast('Profil Diperbarui', 'Nama tampilan telah diganti.', 'info');
            }
        });

        document.getElementById('btn-export-data').addEventListener('click', () => this.exportData());
        
        const fileImport = document.getElementById('file-import-data');
        document.getElementById('btn-import-data').addEventListener('click', () => fileImport.click());
        fileImport.addEventListener('change', (e) => this.importData(e));

        document.getElementById('btn-delete-all').addEventListener('click', () => {
            this.confirmAction('Hapus Seluruh Data?', 'Tindakan ini akan menghapus semua tugas secara permanen dari browser.', () => {
                this.tasks = [];
                this.saveTasks();
                this.refreshCurrentView();
                this.updateNavCounts();
                this.showToast('Data Dihapus', 'Semua tugas telah dibersihkan.', 'success');
            });
        });
    },

    loadData() {
        const saved = localStorage.getItem('ts_tasks_v2');
        if(saved) { try { this.tasks = JSON.parse(saved); } catch(e) { this.tasks = []; } }
        
        const prefs = localStorage.getItem('ts_prefs_v2');
        if(prefs) {
            try {
                const p = JSON.parse(prefs);
                if(p.theme) this.theme = p.theme;
                if(p.username) this.username = p.username;
            } catch(e) {}
        }
    },

    saveTasks() { localStorage.setItem('ts_tasks_v2', JSON.stringify(this.tasks)); },
    savePreferences() { localStorage.setItem('ts_prefs_v2', JSON.stringify({theme: this.theme, username: this.username})); },

    applyTheme(theme) {
        const html = document.documentElement;
        const icon = document.getElementById('theme-icon');
        
        if(theme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
            if(icon) icon.setAttribute('data-lucide', 'sun');
        } else {
            html.classList.remove('dark');
            html.classList.add('light');
            if(icon) icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if(btn.getAttribute('data-theme') === theme) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    },

    updateUsernameDisplay() {
        const nameDisplay = document.getElementById('display-user-name');
        const greetingName = document.getElementById('greeting-name');
        const inputName = document.getElementById('input-username');
        
        if(nameDisplay) nameDisplay.textContent = this.username;
        if(greetingName) greetingName.textContent = this.username;
        if(inputName) inputName.value = this.username;
        
        // Update avatar based on name
        const avatarImg = document.querySelector('.avatar img');
        if(avatarImg) avatarImg.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(this.username)}&backgroundColor=transparent`;
    },
    
    updateDateDisplay() {
        const dateEl = document.querySelector('#current-date span');
        if(dateEl) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = new Date().toLocaleDateString('id-ID', options);
        }
    },

    updateNavCounts() {
        const countAll = document.getElementById('nav-count-all');
        if(countAll) countAll.textContent = this.tasks.length;
    },

    toggleSidebar(show) {
        if(show) {
            this.sidebar.classList.add('open');
            this.sidebarOverlay.classList.add('show');
        } else {
            this.sidebar.classList.remove('open');
            this.sidebarOverlay.classList.remove('show');
        }
    },

    navigate(targetId) {
        if(this.currentView === targetId) return;
        
        this.navItems.forEach(item => {
            if(item.getAttribute('data-view') === targetId) {
                item.classList.add('active');
                this.pageTitle.textContent = item.querySelector('.nav-text').textContent;
            } else {
                item.classList.remove('active');
            }
        });

        const currentEl = document.getElementById(`view-${this.currentView}`);
        const targetEl = document.getElementById(`view-${targetId}`);

        if(currentEl) {
            currentEl.classList.remove('view-enter');
            currentEl.classList.add('view-leave');
            
            setTimeout(() => {
                currentEl.classList.remove('active', 'view-leave');
                targetEl.classList.add('active', 'view-enter');
                this.currentView = targetId;
                this.renderView(targetId);
            }, 350); // Matches CSS transition duration
        } else {
            targetEl.classList.add('active', 'view-enter');
            this.currentView = targetId;
            this.renderView(targetId);
        }
        
        if(targetId !== 'all-tasks') {
            this.globalSearch.value = '';
            this.globalSearchMobile.value = '';
        }
    },

    renderView(viewId) {
        this.updateNavCounts();
        
        // Re-trigger staggered animations on view load
        const viewEl = document.getElementById(`view-${viewId}`);
        const animatedEls = viewEl.querySelectorAll('.animate-on-load');
        animatedEls.forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; /* trigger reflow */
            el.style.animation = null;
        });

        if(viewId === 'dashboard') this.renderDashboard();
        else if(viewId === 'all-tasks') this.renderTaskList('all-tasks', 'container-all-tasks', null);
        else if(viewId === 'todo-tasks') this.renderTaskList('todo-tasks', 'container-todo-tasks', 'Belum Dikerjakan');
        else if(viewId === 'progress-tasks') this.renderTaskList('progress-tasks', 'container-progress-tasks', 'Sedang Dikerjakan');
        else if(viewId === 'done-tasks') this.renderTaskList('done-tasks', 'container-done-tasks', 'Selesai');
    },

    refreshCurrentView() { this.renderView(this.currentView); },

    // Render Dashboard
    renderDashboard() {
        const total = this.tasks.length;
        const todo = this.tasks.filter(t => t.status === 'Belum Dikerjakan').length;
        const progress = this.tasks.filter(t => t.status === 'Sedang Dikerjakan').length;
        const done = this.tasks.filter(t => t.status === 'Selesai').length;

        // Animated count
        this.animateValue("stat-total", 0, total, 1000);
        this.animateValue("stat-todo", 0, todo, 1000);
        this.animateValue("stat-progress", 0, progress, 1000);
        this.animateValue("stat-done", 0, done, 1000);

        // Progress Bar
        const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
        document.getElementById('progress-count').textContent = done;
        document.getElementById('progress-total').textContent = total;
        document.getElementById('progress-percentage-badge').textContent = `${percentage}%`;
        
        setTimeout(() => {
            const bar = document.getElementById('progress-bar-fill');
            if(bar) bar.style.width = `${percentage}%`;
        }, 300);

        // Deadlines (Max 4)
        const todayStr = new Date().toISOString().split('T')[0];
        const deadlines = this.tasks
            .filter(t => t.status !== 'Selesai' && t.deadline)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 4);
        
        const container = document.getElementById('dashboard-deadlines-list');
        container.innerHTML = '';
        
        if(deadlines.length === 0) {
            container.innerHTML = `<div class="text-center py-6 text-muted text-sm">Tidak ada tugas dengan deadline terdekat. Santai dulu! ☕</div>`;
        } else {
            deadlines.forEach((task, index) => {
                const status = this.getDeadlineStatus(task.deadline, todayStr, task.status);
                let badgeClass = task.status === 'Belum Dikerjakan' ? 'bg-soft-slate' : 'bg-soft-orange';
                
                const div = document.createElement('div');
                div.className = 'small-task-item';
                div.style.animationDelay = `${0.3 + (index * 0.1)}s`;
                div.style.animation = `fadeUpIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
                div.style.opacity = '0';
                
                div.innerHTML = `
                    <div class="st-info">
                        <h4>${task.title}</h4>
                        <div class="st-meta ${status.class}">
                            <i data-lucide="calendar"></i> ${this.formatDate(task.deadline)} ${status.text}
                        </div>
                    </div>
                    <div class="st-status ${badgeClass}">${task.status === 'Belum Dikerjakan' ? 'Belum' : 'Progress'}</div>
                `;
                container.appendChild(div);
            });
        }
        lucide.createIcons();
    },

    animateValue(id, start, end, duration) {
        if (start === end) {
            document.getElementById(id).innerHTML = end;
            return;
        }
        let current = start;
        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        const obj = document.getElementById(id);
        const timer = setInterval(() => {
            current += increment;
            obj.innerHTML = current;
            if (current == end) clearInterval(timer);
        }, stepTime);
    },

    // Render Task Lists
    renderTaskList(viewPrefix, containerId, statusFilter) {
        let filtered = [...this.tasks];
        
        const query = this.globalSearch.value.toLowerCase();
        if(query) {
            filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query));
        }

        const sStatus = statusFilter || (document.getElementById(`filter-status-all`)?.value || 'all');
        const prioFilterEl = document.getElementById(`filter-priority-${viewPrefix === 'all-tasks' ? 'all' : 'todo'}`);
        const sPrio = prioFilterEl ? prioFilterEl.value : 'all';
        
        let sortId = `sort-${viewPrefix === 'all-tasks' ? 'all' : viewPrefix === 'todo-tasks' ? 'todo' : viewPrefix === 'progress-tasks' ? 'progress' : 'all'}`;
        const sSort = document.getElementById(sortId)?.value || 'deadline-asc';

        if(sStatus !== 'all') filtered = filtered.filter(t => t.status === sStatus);
        if(sPrio !== 'all') filtered = filtered.filter(t => t.priority === sPrio);

        filtered.sort((a, b) => {
            if(sSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if(sSort.startsWith('deadline')) {
                if(!a.deadline && !b.deadline) return 0;
                if(!a.deadline) return 1; 
                if(!b.deadline) return -1;
                const d = new Date(a.deadline) - new Date(b.deadline);
                return sSort === 'deadline-asc' ? d : -d;
            }
            if(sSort === 'priority-desc') {
                const p = { 'Tinggi': 3, 'Sedang': 2, 'Rendah': 1 };
                return p[b.priority] - p[a.priority];
            }
            return 0;
        });

        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if(filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state-modern animate-on-load">
                    <div class="es-icon"><i data-lucide="layout-list"></i></div>
                    <h3>Kosong.</h3>
                    <p>Tidak ada tugas yang sesuai kriteria.</p>
                    ${!query ? `<button onclick="app.openTaskModal()" class="btn-outline mx-auto"><i data-lucide="plus"></i> Tambah Baru</button>` : ''}
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        filtered.forEach((task, index) => {
            const card = document.createElement('div');
            card.className = 'task-card-modern show'; // Added show directly for JS animation control if needed
            card.setAttribute('data-prio', task.priority);
            
            // Staggered entry
            card.style.animation = `fadeUpIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
            card.style.animationDelay = `${index * 0.05}s`;

            const dlStatus = task.deadline ? this.getDeadlineStatus(task.deadline, todayStr, task.status) : { text: '', class: 'normal' };
            const dlHTML = task.deadline 
                ? `<div class="tc-date ${dlStatus.class}"><i data-lucide="calendar"></i> <span>${this.formatDate(task.deadline)} ${dlStatus.text}</span></div>`
                : `<div class="tc-date normal"><i data-lucide="minus"></i> <span>Tanpa deadline</span></div>`;

            let iconClass = 'todo', iconName = 'circle-dashed';
            if(task.status === 'Sedang Dikerjakan') { iconClass = 'progress'; iconName = 'loader'; }
            else if(task.status === 'Selesai') { iconClass = 'done'; iconName = 'check-circle-2'; }

            let actions = '';
            if(task.status === 'Belum Dikerjakan') {
                actions = `
                    <button class="action-icon-btn" title="Mulai Kerjakan" onclick="app.updateStatus('${task.id}', 'Sedang Dikerjakan')"><i data-lucide="play"></i></button>
                    <button class="action-icon-btn" title="Edit" onclick="app.editTask('${task.id}')"><i data-lucide="edit-2"></i></button>
                    <button class="action-icon-btn delete" title="Hapus" onclick="app.confirmDelete('${task.id}')"><i data-lucide="trash-2"></i></button>
                `;
            } else if (task.status === 'Sedang Dikerjakan') {
                actions = `
                    <button class="action-icon-btn done" title="Selesai" onclick="app.updateStatus('${task.id}', 'Selesai')"><i data-lucide="check"></i></button>
                    <button class="action-icon-btn" title="Kembalikan Status" onclick="app.updateStatus('${task.id}', 'Belum Dikerjakan')"><i data-lucide="rotate-ccw"></i></button>
                    <button class="action-icon-btn delete" title="Hapus" onclick="app.confirmDelete('${task.id}')"><i data-lucide="trash-2"></i></button>
                `;
            } else {
                actions = `
                    <button class="action-icon-btn" title="Kembalikan Status" onclick="app.updateStatus('${task.id}', 'Sedang Dikerjakan')"><i data-lucide="rotate-ccw"></i></button>
                    <button class="action-icon-btn delete" title="Hapus" onclick="app.confirmDelete('${task.id}')"><i data-lucide="trash-2"></i></button>
                `;
            }

            card.innerHTML = `
                <div class="tc-header">
                    <span class="tc-subject">${task.subject || 'Umum'}</span>
                    <div class="tc-status-icon ${iconClass}"><i data-lucide="${iconName}"></i></div>
                </div>
                <div class="tc-body">
                    <h4>${task.title}</h4>
                    ${task.description ? `<p class="tc-desc">${task.description}</p>` : ''}
                </div>
                <div class="tc-footer">
                    ${dlHTML}
                    <div class="tc-actions">${actions}</div>
                </div>
            `;
            container.appendChild(card);
        });
        
        lucide.createIcons();
    },

    // CRUD
    openTaskModal(task = null) {
        const error = document.getElementById('error-title');
        error.style.display = 'none';
        document.getElementById('task-title').parentElement.classList.remove('has-error');

        if(task) {
            document.getElementById('modal-title').textContent = 'Edit Tugas';
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-subject').value = task.subject;
            document.getElementById('task-desc').value = task.description;
            document.getElementById('task-deadline').value = task.deadline;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-status').value = task.status;
        } else {
            document.getElementById('modal-title').textContent = 'Tugas Baru';
            this.taskForm.reset();
            document.getElementById('task-id').value = '';
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('task-deadline').value = today;
        }
        
        this.taskModal.classList.add('show');
        setTimeout(() => document.getElementById('task-title').focus(), 300);
    },

    closeTaskModal() {
        this.taskModal.classList.remove('show');
    },

    saveTask() {
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value.trim();
        const titleGroup = document.getElementById('task-title').parentElement;
        
        if(!title) {
            titleGroup.classList.add('has-error');
            // Shake animation
            document.getElementById('task-title').style.animation = 'none';
            setTimeout(() => { document.getElementById('task-title').style.animation = 'pulse 0.3s 2'; }, 10);
            return;
        }
        titleGroup.classList.remove('has-error');

        const newTask = {
            id: id || Date.now().toString(),
            title: title,
            subject: document.getElementById('task-subject').value.trim(),
            description: document.getElementById('task-desc').value.trim(),
            deadline: document.getElementById('task-deadline').value,
            priority: document.getElementById('task-priority').value,
            status: document.getElementById('task-status').value,
            updatedAt: new Date().toISOString()
        };

        if(id) {
            const idx = this.tasks.findIndex(t => t.id === id);
            if(idx !== -1) {
                newTask.createdAt = this.tasks[idx].createdAt; 
                this.tasks[idx] = newTask;
                this.showToast('Tugas Diperbarui', 'Perubahan berhasil disimpan.', 'info');
            }
        } else {
            newTask.createdAt = new Date().toISOString();
            this.tasks.push(newTask);
            this.showToast('Tugas Ditambahkan', 'Tugas baru masuk ke daftar.', 'success');
        }

        this.saveTasks();
        this.closeTaskModal();
        this.refreshCurrentView();
    },

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if(task) this.openTaskModal(task);
    },

    updateStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id === id);
        if(task) {
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            
            let type = 'info';
            if(newStatus === 'Selesai') type = 'success';
            
            this.showToast('Status Berubah', `Tugas dipindahkan ke ${newStatus}.`, type);
            this.refreshCurrentView();
        }
    },

    confirmDelete(id) {
        this.confirmAction('Hapus Tugas?', 'Tugas ini akan dihapus secara permanen.', () => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.showToast('Dihapus', 'Tugas berhasil dihapus.', 'info');
            this.refreshCurrentView();
        });
    },

    confirmAction(title, desc, onConfirm) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-desc').textContent = desc;
        this.confirmModal.classList.add('show');
        
        const btnCancel = document.getElementById('btn-cancel-confirm');
        const btnAction = document.getElementById('btn-action-confirm');
        
        const newCancel = btnCancel.cloneNode(true);
        const newAction = btnAction.cloneNode(true);
        btnCancel.replaceWith(newCancel);
        btnAction.replaceWith(newAction);
        
        newCancel.addEventListener('click', () => this.confirmModal.classList.remove('show'));
        newAction.addEventListener('click', () => {
            this.confirmModal.classList.remove('show');
            onConfirm();
        });
    },

    // Modern Toast Notification
    showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast-modern toast-${type}`;
        
        const icon = type === 'success' ? 'check' : type === 'error' ? 'alert-circle' : 'info';
        
        toast.innerHTML = `
            <div class="toast-icon"><i data-lucide="${icon}"></i></div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        lucide.createIcons();
        
        requestAnimationFrame(() => {
            setTimeout(() => toast.classList.add('show'), 10);
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 4000);
    },

    formatDate(dateStr) {
        if(!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    },

    getDeadlineStatus(deadline, todayStr, status) {
        if(status === 'Selesai') return { text: '', class: 'normal' };
        if(deadline < todayStr) return { text: '(Terlewat)', class: 'danger' };
        
        const d1 = new Date(deadline);
        const d2 = new Date(todayStr);
        const diffTime = Math.abs(d1 - d2);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if(deadline >= todayStr && diffDays <= 1) return { text: '(Besok)', class: 'warning' };
        if(deadline === todayStr) return { text: '(Hari ini)', class: 'warning' };
        return { text: '', class: 'normal' };
    },

    exportData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TS_Pro_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Backup Berhasil', 'File JSON telah diunduh.', 'success');
    },

    importData(event) {
        const file = event.target.files[0];
        if(!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if(Array.isArray(parsed)) {
                    this.confirmAction('Pulihkan Data?', 'Data lama dengan ID yang sama akan ditimpa.', () => {
                        const existingIds = new Set(this.tasks.map(t => t.id));
                        const newTasks = parsed.filter(t => !existingIds.has(t.id));
                        this.tasks = [...this.tasks, ...newTasks];
                        this.saveTasks();
                        this.refreshCurrentView();
                        this.showToast('Pemulihan Sukses', 'Data tugas berhasil ditambahkan.', 'success');
                    });
                } else {
                    this.showToast('Format Salah', 'File JSON tidak sesuai struktur.', 'error');
                }
            } catch(err) {
                this.showToast('Error', 'Gagal membaca isi file.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
