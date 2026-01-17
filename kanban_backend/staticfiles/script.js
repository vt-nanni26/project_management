class Task {
    constructor(id, content, listId, description = '', dueDate = null, priority = 'low') {
        this.id = id;
        this.content = content;
        this.listId = listId;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
    }
}

class List {
    constructor(id, title, boardId) {
        this.id = id;
        this.title = title;
        this.boardId = boardId;
        this.tasks = [];
    }

    addTask(task) {
        this.tasks.push(task);
    }

    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }
}

class Board {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.lists = [];
    }

    addList(list) {
        this.lists.push(list);
    }

    removeList(listId) {
        this.lists = this.lists.filter(list => list.id !== listId);
    }

    getList(listId) {
        return this.lists.find(list => list.id === listId);
    }
}

class App {
    constructor(appContainer) {
        this.appElement = appContainer;
        this.boards = [];
        this.currentBoardId = null;
        this.draggedTask = null;
    }

    async run() {
        this.setupThemeToggle();
        await this.loadData();
        this.render();
        this.addAppEventListeners();
    }

    // --- Toast Notifications ---
    showToast(message, type = 'info') { // info, success, error
        const toastContainer = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            info: 'fa-circle-info',
            success: 'fa-circle-check',
            error: 'fa-circle-xmark'
        };
        
        toast.innerHTML = `
            <i class="fa-solid ${icons[type]} toast-icon"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger the animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Remove the toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            // Remove the element from the DOM after the fade-out animation completes
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // --- Theme Management ---
    setupThemeToggle() {
        this.themeToggle = this.appElement.querySelector('#theme-toggle');
        // Reflect the current theme state on the toggle
        if (document.body.classList.contains('dark-theme')) {
            this.themeToggle.checked = true;
        }
        // Add the event listener
        this.themeToggle.addEventListener('change', () => this.toggleTheme());
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('kanbanTheme', theme);
    }

    // --- Data Management ---
    saveData() {
        const appData = {
            boards: this.boards,
            currentBoardId: this.currentBoardId
        };
        localStorage.setItem('kanbanApp', JSON.stringify(appData));
    }

    async loadData() {
        try {
            const response = await fetch('/api/boards/');
            if (!response.ok) {
                throw new Error('Failed to fetch boards from the server.');
            }
            const boardsData = await response.json();

            if (boardsData && boardsData.length > 0) {
                this.boards = boardsData.map(boardData => {
                    const board = new Board(boardData.id, boardData.name);
                    // Assuming lists and tasks will be fetched separately or nested
                    board.lists = []; 
                    return board;
                });
                // Find the last viewed board ID from localStorage or default to the first board
                const lastViewedId = parseInt(localStorage.getItem('kanbanCurrentBoardId'));
                const boardExists = this.boards.some(b => b.id === lastViewedId);
                this.currentBoardId = boardExists ? lastViewedId : this.boards[0].id;

                // Now, fetch the lists and tasks for the current board
                await this.loadListsForCurrentBoard();

            } else {
                // If no boards exist on the server, create a sample one
                await this.createSampleBoardOnBackend();
            }
        } catch (error) {
            console.error("Failed to load data from server, trying to load from localStorage as a fallback.", error);
            this.showToast('Could not connect to the server. Loading a local backup.', 'error');
            this.loadDataFromLocalStorage(); // Fallback to localStorage if the server fails
        }
    }

    loadDataFromLocalStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('kanbanApp'));
            if (data && data.boards && data.boards.length > 0) {
                this.boards = data.boards.map(boardData => {
                    const board = new Board(boardData.id, boardData.name);
                    board.lists = boardData.lists.map(listData => {
                        const list = new List(listData.id, listData.title, listData.boardId);
                        list.tasks = listData.tasks.map(taskData => 
                            new Task(taskData.id, taskData.content, taskData.listId, taskData.description, taskData.dueDate, taskData.priority)
                        );
                        return list;
                    });
                    return board;
                });
                this.currentBoardId = data.currentBoardId;
            } else {
                 // If localStorage is also empty, create a sample board locally
                this.createSampleBoard();
            }
        } catch (error) {
            console.error("Failed to load data from localStorage, resetting.", error);
            localStorage.removeItem('kanbanApp');
            this.boards = []; // Clear any partially loaded data
            this.createSampleBoard();
            this.showToast('Could not load any saved data, starting fresh.', 'error');
        } finally {
            this.render(); // Ensure UI is rendered after fallback attempt
        }
    }
    
    async loadListsForCurrentBoard() {
        const board = this.getCurrentBoard();
        if (!board) return;

        try {
            // This endpoint should return lists with their nested tasks for a given board
            const response = await fetch(`/api/lists/?board_id=${this.currentBoardId}`); 
            if (!response.ok) {
                throw new Error('Failed to fetch lists.');
            }
            const listsData = await response.json();
            
            board.lists = listsData.map(listData => {
                const list = new List(listData.id, listData.title, listData.board);
                // Assuming the API returns tasks nested within each list
                list.tasks = (listData.tasks || []).map(taskData =>
                    new Task(taskData.id, taskData.title, taskData.list, taskData.description, taskData.due_date, taskData.priority)
                );
                return list;
            });

            this.saveData(); // Save the newly fetched data to localStorage as a backup
            this.render();

        } catch (error) {
            console.error(`Error fetching lists for board ${this.currentBoardId}:`, error);
            this.showToast('Could not load lists and tasks for the current board.', 'error');
        }
    }
    
    async createSampleBoardOnBackend() {
        try {
            // Get CSRF token
            const csrfToken = this.getCookie('csrftoken');
            
            // 1. Register a new user
            const username = `user${Date.now()}`;
            const password = 'password';
            const registerResponse = await fetch('/api/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ username, password }),
            });
            if (!registerResponse.ok) throw new Error('Failed to register sample user.');

            // 2. Log in the new user
            const loginResponse = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ username, password }),
            });
            if (!loginResponse.ok) throw new Error('Failed to log in sample user.');

            // 3. Create a new Project first
            const projectResponse = await fetch('/api/projects/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ name: 'Default Project' }), 
            });
            if (!projectResponse.ok) throw new Error('Failed to create sample project.');
            const project = await projectResponse.json();

            // 4. Create a new Board associated with the Project
            const boardResponse = await fetch('/api/boards/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ name: 'My First Board', project: project.id }),
            });
            if (!boardResponse.ok) throw new Error('Failed to create sample board.');
            const board = await boardResponse.json();
            this.currentBoardId = board.id;

            // 5. Create Lists for the Board
            const listTitles = ['To Do', 'In Progress', 'Done'];
            const listPromises = listTitles.map(title =>
                fetch('/api/lists/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                    body: JSON.stringify({ title: title, board: board.id }),
                }).then(res => res.json())
            );
            const lists = await Promise.all(listPromises);

            // 6. Create Tasks for the Lists
            const task1 = { title: 'Set up project structure', list: lists[0].id, description: 'Define the main classes and file structure.', priority: 'high' };
            const task2 = { title: 'Develop UI components', list: lists[0].id, description: 'Create HTML and CSS for lists and tasks.', priority: 'medium' };
            const task3 = { title: 'Implement drag and drop', list: lists[1].id, description: 'Add functionality to move tasks between lists.', priority: 'high' };
            const taskPromises = [task1, task2, task3].map(task =>
                fetch('/api/cards/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                    body: JSON.stringify(task),
                }).then(res => res.json())
            );
            await Promise.all(taskPromises);
            
            this.showToast('Created a sample board for you!', 'success');
            await this.loadData(); // Reload data from the server

        } catch (error) {
            console.error('Error creating sample board on backend:', error);
            this.showToast('Could not create a sample board on the server.', 'error');
            // Fallback to local creation if backend fails
            this.createSampleBoard();
            this.render();
        }
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    createSampleBoard() {
        const defaultBoard = new Board(Date.now(), 'My First Board');
        this.boards.push(defaultBoard);
        this.currentBoardId = defaultBoard.id;

        const todoList = new List(Date.now() + 1, 'To Do', this.currentBoardId);
        const doingList = new List(Date.now() + 2, 'In Progress', this.currentBoardId);
        const doneList = new List(Date.now() + 3, 'Done', this.currentBoardId);

        const task1 = new Task(Date.now() + 4, 'Set up project structure', todoList.id, 'Define the main classes and file structure.', new Date().toISOString().split('T')[0], 'high');
        const task2 = new Task(Date.now() + 5, 'Develop UI components', todoList.id, 'Create HTML and CSS for lists and tasks.', null, 'medium');
        const task3 = new Task(Date.now() + 6, 'Implement drag and drop', doingList.id, 'Add functionality to move tasks between lists.', null, 'high');
        
        todoList.addTask(task1);
        todoList.addTask(task2);
        doingList.addTask(task3);

        defaultBoard.addList(todoList);
        defaultBoard.addList(doingList);
        defaultBoard.addList(doneList);
        
        this.saveData();
    }

    getCurrentBoard() {
        return this.boards.find(board => board.id === this.currentBoardId);
    }

    // --- Board Operations ---
    addBoard(name) {
        if (!name.trim()) {
            this.showToast('Board name cannot be empty.', 'error');
            return;
        }
        const newBoard = new Board(Date.now(), name);
        this.boards.push(newBoard);
        this.currentBoardId = newBoard.id;
        this.saveData();
        this.render();
        this.showToast(`Board "${name}" created successfully.`, 'success');
    }

    renameBoard(newName) {
        if (!newName.trim()) {
            this.showToast('Board name cannot be empty.', 'error');
            return;
        }
        const board = this.getCurrentBoard();
        if (board) {
            const oldName = board.name;
            board.name = newName;
            this.saveData();
            this.renderHeader();
            this.showToast(`Board renamed from "${oldName}" to "${newName}".`, 'info');
        }
    }

    deleteBoard() {
        if (this.boards.length <= 1) {
            this.showToast("You can't delete the last board.", 'error');
            return;
        }
        
        const boardToDelete = this.getCurrentBoard();
        this.boards = this.boards.filter(board => board.id !== this.currentBoardId);
        this.currentBoardId = this.boards[0].id;
        this.saveData();
        this.render();
        this.showToast(`Board "${boardToDelete.name}" was deleted.`, 'success');
    }

    switchBoard(boardId) {
        this.currentBoardId = parseInt(boardId);
        this.saveData();
        this.render();
        const board = this.getCurrentBoard();
        this.showToast(`Switched to board "${board.name}".`, 'info');
    }

    // --- List Operations ---
    addList(title) {
        if (!title.trim()) {
            this.showToast('List title cannot be empty.', 'error');
            return;
        }
        const board = this.getCurrentBoard();
        if (board) {
            const newList = new List(Date.now(), title, this.currentBoardId);
            board.addList(newList);
            this.saveData();
            this.renderLists();
            this.showToast(`List "${title}" added.`, 'success');
        }
    }

    renameList(listId, newTitle) {
        if (!newTitle.trim()) {
            this.showToast('List title cannot be empty.', 'error');
            return;
        }
        const board = this.getCurrentBoard();
        const list = board.getList(listId);
        if (list) {
            list.title = newTitle;
            this.saveData();
            this.renderLists();
            this.showToast('List renamed successfully.', 'info');
        }
    }

    deleteList(listId) {
        const board = this.getCurrentBoard();
        const list = board.getList(listId);
        if (list) {
            board.removeList(listId);
            this.saveData();
            this.renderLists();
            this.showToast(`List "${list.title}" was deleted.`, 'success');
        }
    }

    // --- Task Operations ---
    addTask(listId, content) {
        if (!content.trim()) {
            this.showToast('Task content cannot be empty.', 'error');
            return;
        }
        const board = this.getCurrentBoard();
        const list = board.getList(listId);
        if (list) {
            const newTask = new Task(Date.now(), content, listId);
            list.addTask(newTask);
            this.saveData();

            const listEl = this.appElement.querySelector(`.list[data-list-id="${listId}"]`);
            if (listEl) {
                const tasksContainer = listEl.querySelector('.tasks-container');
                const taskElement = this.createTaskElement(newTask);
                tasksContainer.appendChild(taskElement);

                const taskCountEl = listEl.querySelector('.task-count');
                if (taskCountEl) {
                    taskCountEl.textContent = list.tasks.length;
                }
            } else {
                this.renderLists();
            }

            this.showToast('Task added.', 'success');
        }
    }

    updateTask(taskId, newContent) {
        if (!newContent.trim()) {
            this.showToast('Task content cannot be empty.', 'error');
            return;
        }
        const task = this.findTaskById(taskId).task;
        if (task) {
            task.content = newContent;
            this.saveData();
            this.renderLists();
        }
    }

    updateTaskDetails(taskId, details) {
        const task = this.findTaskById(taskId).task;
        if (task) {
            if (!details.content.trim()) {
                this.showToast('Task title cannot be empty.', 'error');
                return;
            }
            task.content = details.content;
            task.description = details.description;
            task.dueDate = details.dueDate;
            task.priority = details.priority;
            this.saveData();
            this.renderLists();
            this.closeTaskModal();
            this.showToast('Task updated successfully.', 'success');
        }
    }

    deleteTask(taskId) {
        const { list, task } = this.findTaskById(taskId);
        if (list && task) {
            list.removeTask(taskId);
            this.saveData();
            this.renderLists();
            this.showToast('Task deleted.', 'success');
        }
    }

    findTaskById(taskId) {
        const board = this.getCurrentBoard();
        for (const list of board.lists) {
            const task = list.getTask(taskId);
            if (task) return { task, list };
        }
        return { task: null, list: null };
    }

    // --- Drag and Drop ---
    handleDragStart(e) {
        this.draggedTask = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedTask = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        const container = e.target.closest('.tasks-container');
        if (container) {
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggable = this.draggedTask;
            if (afterElement == null) {
                container.appendChild(draggable);
            } else {
                container.insertBefore(draggable, afterElement);
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const targetListElement = e.target.closest('.list');
        if (!targetListElement || !this.draggedTask) return;

        const taskId = parseInt(this.draggedTask.dataset.taskId);
        const targetListId = parseInt(targetListElement.dataset.listId);
        const { task, list: sourceList } = this.findTaskById(taskId);

        if (task && sourceList.id !== targetListId) {
            sourceList.removeTask(taskId);
            const targetList = this.getCurrentBoard().getList(targetListId);
            task.listId = targetListId;
            targetList.addTask(task);
        }
        
        // Reorder tasks within the target list
        const targetList = this.getCurrentBoard().getList(targetListId);
        const taskElements = [...targetListElement.querySelectorAll('.task')];
        targetList.tasks = taskElements.map(el => targetList.getTask(parseInt(el.dataset.taskId)));

        this.saveData();
        this.renderLists();
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- Rendering ---
    render() {
        if (!this.appElement) return;
        this.renderHeader();
        this.renderLists();
    }

    renderHeader() {
        const boardNameEl = this.appElement.querySelector('#board-name-display');
        const boardSelectEl = this.appElement.querySelector('#board-select');
        const board = this.getCurrentBoard();

        if (board) {
            boardNameEl.textContent = board.name;
        }

        boardSelectEl.innerHTML = '';
        this.boards.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = b.name;
            if (b.id === this.currentBoardId) {
                option.selected = true;
            }
            boardSelectEl.appendChild(option);
        });
    }

    renderLists() {
        const boardContainer = this.appElement.querySelector('#board-container');
        boardContainer.innerHTML = '';
        const board = this.getCurrentBoard();
        if (!board) return;

        board.lists.forEach(list => {
            const listEl = document.createElement('div');
            listEl.className = 'list';
            listEl.dataset.listId = list.id;
            listEl.innerHTML = `
                <div class="list-header">
                    <h2 class="list-title">${list.title}</h2>
                    <span class="task-count">${list.tasks.length}</span>
                    <button class="delete-list-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="tasks-container"></div>
                <div class="add-task-container">
                    <input type="text" class="new-task-input" placeholder="Add a new task...">
                    <button class="add-task-btn">Add Task</button>
                </div>
            `;
            const tasksContainer = listEl.querySelector('.tasks-container');
            list.tasks.forEach(task => {
                tasksContainer.appendChild(this.createTaskElement(task));
            });
            boardContainer.appendChild(listEl);
        });
    }

    createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task priority-${task.priority}`;
        taskEl.dataset.taskId = task.id;
        taskEl.draggable = true;

        const today = new Date().toISOString().split('T')[0];
        const isOverdue = task.dueDate && task.dueDate < today;
        const dueDateEl = task.dueDate 
            ? `<span class="due-date ${isOverdue ? 'overdue' : ''}"><i class="fas fa-calendar-alt"></i> ${task.dueDate}</span>`
            : '';

        taskEl.innerHTML = `
            <div class="task-main">
                <span class="task-content">${task.content}</span>
                <div class="task-actions">
                    <button class="edit-task-btn-dummy"><i class="fas fa-edit"></i></button>
                    <button class="delete-task-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <div class="task-footer">
                ${dueDateEl}
                <span class="task-priority"><i class="fas fa-flag"></i> ${task.priority}</span>
            </div>
        `;
        return taskEl;
    }

    // --- Event Listeners ---
    setupEventListeners() {
        // This method is now deprecated, its logic is split into
        // setupLandingPageListener and addAppEventListeners
    }

    addAppEventListeners() {
        const boardContainer = this.appElement.querySelector('#board-container');
        const addListBtn = this.appElement.querySelector('#add-list-btn');
        const newListTitleInput = this.appElement.querySelector('#new-list-title');

        // Board actions
        this.appElement.querySelector('#add-board-btn').addEventListener('click', () => {
            const newBoardName = this.appElement.querySelector('#new-board-name').value;
            this.addBoard(newBoardName);
            this.appElement.querySelector('#new-board-name').value = '';
        });
        this.appElement.querySelector('#board-select').addEventListener('change', (e) => this.switchBoard(e.target.value));
        this.appElement.querySelector('#delete-board-btn').addEventListener('click', () => this.deleteBoard());
        this.appElement.querySelector('#rename-board-btn').addEventListener('click', () => {
            const board = this.getCurrentBoard();
            if (board) {
                const newName = prompt('Enter new board name:', board.name);
                if (newName) this.renameBoard(newName);
            }
        });

        // List actions
        addListBtn.addEventListener('click', () => {
            this.addList(newListTitleInput.value);
            newListTitleInput.value = '';
        });

        boardContainer.addEventListener('click', e => {
            // Add task
            if (e.target.classList.contains('add-task-btn')) {
                const listEl = e.target.closest('.list');
                const input = listEl.querySelector('.new-task-input');
                this.addTask(parseInt(listEl.dataset.listId), input.value);
                input.value = '';
            }
            // Delete list
            if (e.target.closest('.delete-list-btn')) {
                const listEl = e.target.closest('.list');
                this.deleteList(parseInt(listEl.dataset.listId));
            }
            // Delete task
            if (e.target.closest('.delete-task-btn')) {
                const taskEl = e.target.closest('.task');
                this.deleteTask(parseInt(taskEl.dataset.taskId));
            }
            // Open task modal (for edit)
            if (e.target.closest('.task') && !e.target.closest('.task-actions')) {
                const taskEl = e.target.closest('.task');
                this.openTaskModal(parseInt(taskEl.dataset.taskId));
            }
            if (e.target.closest('.edit-task-btn-dummy')) {
                 const taskEl = e.target.closest('.task');
                this.openTaskModal(parseInt(taskEl.dataset.taskId));
            }
        });

        // Editable list title
        boardContainer.addEventListener('dblclick', e => {
            if (e.target.classList.contains('list-title')) {
                this.makeTitleEditable(e.target, 'list');
            }
        });
        
        // Drag and Drop
        boardContainer.addEventListener('dragstart', e => this.handleDragStart(e));
        boardContainer.addEventListener('dragend', e => this.handleDragEnd(e));
        boardContainer.addEventListener('dragover', e => this.handleDragOver(e));
        boardContainer.addEventListener('drop', e => this.handleDrop(e));

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close-btn')) {
                this.closeTaskModal();
            }
            if (e.target.matches('#modal-save-btn')) {
                const taskId = parseInt(document.getElementById('task-modal').dataset.editingTaskId);
                const details = {
                    content: document.getElementById('modal-task-title').value,
                    description: document.getElementById('modal-task-description').value,
                    dueDate: document.getElementById('modal-task-due-date').value,
                    priority: document.getElementById('modal-task-priority').value
                };
                this.updateTaskDetails(taskId, details);
            }
            if (e.target.id === 'task-modal') {
                this.closeTaskModal();
            }
        });

        // Search/Filter
        this.appElement.querySelector('#search-input').addEventListener('input', e => this.filterTasks(e.target.value));
        
        // The theme toggle listener is now set up in setupThemeToggle()
    }

    makeTitleEditable(titleElement, type) {
        const originalTitle = titleElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalTitle;
        input.className = 'title-edit-input';
        
        titleElement.replaceWith(input);
        input.focus();

        const saveChanges = () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== originalTitle) {
                if (type === 'list') {
                    const listId = parseInt(input.closest('.list').dataset.listId);
                    this.renameList(listId, newTitle);
                }
            } else {
                // If title is empty or unchanged, restore original
                this.renderLists();
            }
        };

        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = originalTitle;
                input.blur();
            }
        });
    }

    // --- Search ---
    filterTasks(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const tasks = document.querySelectorAll('.task');

        tasks.forEach(taskElement => {
            const taskId = parseInt(taskElement.dataset.taskId);
            const { task } = this.findTaskById(taskId);

            if (task) {
                const taskContent = task.content.toLowerCase();
                const taskDescription = (task.description || '').toLowerCase();
                const isVisible = taskContent.includes(term) || taskDescription.includes(term);
                taskElement.classList.toggle('hidden', !isVisible);
            }
        });
    }

    // --- Modal ---
    openTaskModal(taskId) {
        const { task } = this.findTaskById(taskId);
        if (!task) return;

        const modal = document.getElementById('task-modal');
        modal.style.display = 'flex';
        modal.dataset.editingTaskId = taskId;

        document.getElementById('modal-task-title').value = task.content;
        document.getElementById('modal-task-description').value = task.description || '';
        document.getElementById('modal-task-due-date').value = task.dueDate || '';
        document.getElementById('modal-task-priority').value = task.priority || 'low';
    }

    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        modal.style.display = 'none';
        delete modal.dataset.editingTaskId;
    }
}

// --- App Initialization ---
window.startApp = function () {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    const app = new App(document.getElementById('app-container'));
    app.run();
};

document.addEventListener('DOMContentLoaded', () => {
    // Apply theme
    const savedTheme = localStorage.getItem('kanbanTheme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // Always show the landing page and attach the event to the Get Started button
    document.getElementById('get-started-btn')
        .addEventListener('click', () => startApp());
});
