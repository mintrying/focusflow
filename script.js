/**
 * FocusFlow - Premium To-Do List Application Logic
 * Implements CRUD, status toggling, animations, filtering, theme handling, and localStorage persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const itemsLeft = document.getElementById('items-left');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // App State
    let todos = JSON.parse(localStorage.getItem('focusflow_todos')) || [];
    let currentFilter = 'all'; // 'all' | 'active' | 'completed'

    // Initialize Lucide Icons for static elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize App
    initTheme();
    renderTodos();

    /* ==========================================================================
       Theme Logic (Dark / Light Mode)
       ========================================================================== */

    function initTheme() {
        const savedTheme = localStorage.getItem('focusflow_theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('focusflow_theme', newTheme);
    });

    /* ==========================================================================
       Todo Operations (CRUD & Rendering)
       ========================================================================== */

    // Save todos to LocalStorage
    function saveTodos() {
        localStorage.setItem('focusflow_todos', JSON.stringify(todos));
        updateStats();
    }

    // Update statistics (items left counting)
    function updateStats() {
        const activeCount = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = `${activeCount}개의 할 일 남음`;
    }

    // Render todo items based on filter
    function renderTodos() {
        // Clear list
        todoList.innerHTML = '';

        // Filter todos
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });

        // Toggle Empty State visibility
        if (filteredTodos.length === 0) {
            emptyState.style.display = 'flex';
            todoList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            todoList.style.display = 'flex';
        }

        // Generate and append elements
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;

            li.innerHTML = `
                <div class="todo-checkbox-wrapper">
                    <div class="todo-checkbox">
                        <i data-lucide="check"></i>
                    </div>
                </div>
                <div class="todo-content">${escapeHTML(todo.text)}</div>
                <button class="delete-btn" aria-label="할 일 삭제" title="할 일 삭제">
                    <i data-lucide="trash-2"></i>
                </button>
            `;

            // Complete Toggle click event (clicking item body or checkbox wrapper toggles it)
            li.addEventListener('click', (e) => {
                // If user clicked the delete button or its child icon, ignore complete toggle
                if (e.target.closest('.delete-btn')) return;
                toggleTodo(todo.id);
            });

            // Delete click event
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop event bubbling to li click
                deleteTodo(todo.id, li);
            });

            todoList.appendChild(li);
        });

        // Re-initialize Lucide Icons for dynamic content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        updateStats();
    }

    // Add new Todo
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (!text) return;

        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false
        };

        todos.unshift(newTodo); // Add to the top
        saveTodos();
        renderTodos();
        
        todoInput.value = '';
        todoInput.focus();
    });

    // Toggle Todo Complete status
    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveTodos();
        renderTodos();
    }

    // Delete Todo item with custom fade-out animation
    function deleteTodo(id, itemElement) {
        // Add shrink and fade-out animation class
        itemElement.classList.add('remove-anim');
        
        // Wait for animation to finish before actual state deletion & re-render
        itemElement.addEventListener('animationend', () => {
            todos = todos.filter(todo => todo.id !== id);
            saveTodos();
            renderTodos();
        }, { once: true });
    }

    // Clear completed todos
    clearCompletedBtn.addEventListener('click', () => {
        const completedItems = todos.filter(todo => todo.completed);
        if (completedItems.length === 0) return;

        // Perform clean visual elimination:
        // Query current DOM list items which are completed and trigger transition
        const domItems = todoList.querySelectorAll('.todo-item.completed');
        let animationsPending = domItems.length;

        if (animationsPending > 0) {
            domItems.forEach(item => {
                item.classList.add('remove-anim');
                item.addEventListener('animationend', () => {
                    animationsPending--;
                    if (animationsPending === 0) {
                        // All completed animations finished, now update state
                        todos = todos.filter(todo => !todo.completed);
                        saveTodos();
                        renderTodos();
                    }
                }, { once: true });
            });
        } else {
            todos = todos.filter(todo => !todo.completed);
            saveTodos();
            renderTodos();
        }
    });

    /* ==========================================================================
       Filtering Logic
       ========================================================================== */

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all filters
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked filter
            btn.classList.add('active');

            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    /* ==========================================================================
       Helpers & Security
       ========================================================================== */

    // Simple HTML escaping helper to prevent XSS vulnerability
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
