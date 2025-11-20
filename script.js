document.addEventListener('DOMContentLoaded', () => {
    const STATUS = {
        TODO: 'todo',
        DOING: 'doing',
        DONE: 'done'
    };
    const STATUS_DETAILS = {
        [STATUS.TODO]: { text: 'A fazer', cssClass: 'status-todo' },
        [STATUS.DOING]: { text: 'Fazendo', cssClass: 'status-doing' },
        [STATUS.DONE]: { text: 'Feito', cssClass: 'status-done' }
    };

    const state = {
        projects: [
        ], 
        tasks: [
        ], 
        currentViewProjectId: 'all',
        selectedTaskId: null,
        projectIdToDelete: null
    };

    const elements = {
        projectList: document.getElementById('projeto-lista'),
        newProjectForm: document.getElementById('novo-proj-form'),
        projectNameInput: document.getElementById('nome-projeto'),
        projectColorInput: document.getElementById('project-color-input'),
        
        taskList: document.getElementById('lista-tarefas'),
        taskListTitle: document.getElementById('tarefa-lista-titulo'),
        
        taskModal: document.getElementById('modal-nova-tarefa'),
        newTaskForm: document.getElementById('form-nova-tarefa'),
        taskNameInput: document.getElementById('nome-tarefa'),
        taskProjectSelect: document.getElementById('select-projeto'),
        taskStatusSelect: document.getElementById('select-status'),
        taskProjectSelectorWrapper: document.getElementById('wrapper-select-projeto'),
        modalFormGrid: document.getElementById('modal-grid-form'),
        
        deleteDoneTasksBtn: document.getElementById('del-tarefa-feita'),
        
        deleteConfirmModal: document.getElementById('modal-confirmar-del'),
        deleteConfirmMessage: document.getElementById('msg-confirmar-del'),
        
        deleteProjectModal: document.getElementById('modal-confirmar-del-proj'),
        deleteProjectMessage: document.getElementById('msg-confirmar-del-proj')
    };

    const utils = {
        generateId: () => Date.now(),
        findProject: (projectId) => state.projects.find(p => p.id == projectId),
        findTask: (taskId) => state.tasks.find(t => t.id === taskId),
        getFilteredTasks: () => state.tasks.filter(task => 
            state.currentViewProjectId === 'all' || task.projectId == state.currentViewProjectId
        ),
        getStatusDetails: (status) => STATUS_DETAILS[status] || STATUS_DETAILS[STATUS.TODO]
    };

    const modalManager = {
        open(modalEl) {
            if (modalEl === elements.taskModal) {
                this.handleTaskModalOpen();
            }
            modalEl.classList.add('modal-visible');
            modalEl.classList.remove('modal-hidden');
        },
        close(modalEl) {
            modalEl.classList.add('modal-hidden');
            modalEl.classList.remove('modal-visible');
        },
        handleTaskModalOpen() {
            // Garante que o dropdown esteja atualizado ao abrir o modal
            projectManager.updateDropdown();
            
            const isAllProjects = state.currentViewProjectId === 'all';
            elements.taskProjectSelectorWrapper.style.display = isAllProjects ? 'block' : 'none';
            elements.modalFormGrid.classList.toggle('single-col', !isAllProjects);
        },
        setupModal(openBtn, modal, closeBtn) {
            if(openBtn) openBtn.addEventListener('click', () => this.open(modal));
            if(closeBtn) closeBtn.addEventListener('click', () => this.close(modal));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close(modal);
            });
        }
    };

    const projectManager = {
        render() {
            elements.projectList.querySelectorAll('div.projeto-item-wrapper:not(:first-child)').forEach(el => el.remove());
            
            state.projects.forEach(project => {
                elements.projectList.appendChild(this.createProjectElement(project));
            });
            
            this.updateDropdown();
            this.updateActiveStyles();
        },
        createProjectElement(project) {
            const wrapper = document.createElement('div');
            wrapper.className = 'projeto-item-wrapper';
            
            const projectEl = document.createElement('a');
            projectEl.href = '#';
            projectEl.textContent = project.name;
            projectEl.dataset.projectId = project.id;
            projectEl.className = 'projeto-item';
            projectEl.addEventListener('click', (e) => this.handleProjectClick(e, project.id));
            
            const deleteBtn = this.createDeleteButton(project);
            
            wrapper.append(projectEl, deleteBtn);
            return wrapper;
        },
        createDeleteButton(project) {
            const button = document.createElement('button');
            button.className = 'delete-projeto-btn';
            button.title = `Apagar projeto "${project.name}"`;
            button.innerHTML = `<svg class="icon-small" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0l.346-9m3.54 0l-1.096-1.096a.75.75 0 00-1.06 0L12 7.904l-1.096-.096a.75.75 0 00-1.06 0l-1.096 1.096M14.74 9H9.26m-4.813 0h14.106c.338 0 .612.274.612.612v.016c0 .338-.274.612-.612.612H4.427a.612.612 0 01-.612-.612v-.016c0-.338.274-.612.612-.612zM4.427 9v10.188c0 .338.274.612.612.612h14.106c.338 0 .612-.274.612-.612V9.016" /></svg>`;
            
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleProjectDelete(project);
            });
            
            return button;
        },
        handleProjectClick(e, projectId) {
            e.preventDefault();
            state.currentViewProjectId = projectId;
            state.selectedTaskId = null;
            taskManager.render();
            this.updateActiveStyles();
        },
        handleProjectDelete(project) {
            elements.deleteProjectMessage.textContent = 
                `Tem certeza que quer apagar o projeto "${project.name}"? Todas as tarefas associadas a ele também serão apagadas.`;
            state.projectIdToDelete = project.id;
            modalManager.open(elements.deleteProjectModal);
        },
        updateDropdown() {
            elements.taskProjectSelect.innerHTML = '';
            state.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                elements.taskProjectSelect.appendChild(option);
            });
        },
        updateActiveStyles() {
            elements.projectList.querySelectorAll('a.projeto-item').forEach(a => {
                const projectId = a.dataset.projectId;
                const project = utils.findProject(projectId);
                
                a.classList.remove('active');
                a.style.color = '';
                
                if (projectId === 'all') {
                    a.style.color = '#374151';
                } else if (project) {
                    a.style.color = project.color;
                }
                
                if (projectId == state.currentViewProjectId) {
                    a.classList.add('active');
                }
            });
        },
        addNew(name, color) {
             state.projects.push({ id: utils.generateId(), name: name.trim(), color });
             this.render();
        },
        deleteProject(projectId) {
            state.projects = state.projects.filter(p => p.id !== projectId);
            state.tasks = state.tasks.filter(t => t.projectId !== projectId);
            if (state.currentViewProjectId == projectId) state.currentViewProjectId = 'all';
            this.render();
            taskManager.render();
        }
    };

    const taskManager = {
        render() {
            elements.taskList.innerHTML = '';
            const tasksToRender = utils.getFilteredTasks();
            this.updateTitle();
            tasksToRender.forEach(task => {
                const taskElement = this.createTaskElement(task);
                if (taskElement) elements.taskList.appendChild(taskElement);
            });
        },
        createTaskElement(task) {
            const project = utils.findProject(task.projectId);
            if (!project) return null;
            
            const statusDetails = utils.getStatusDetails(task.status);
            const taskEl = document.createElement('div');
            taskEl.dataset.taskId = task.id;
            taskEl.className = `item-tarefa ${task.id === state.selectedTaskId ? 'selected' : ''} ${task.status === STATUS.DONE ? 'done' : ''}`;
            
            if (task.status !== STATUS.DONE) {
                taskEl.style.borderColor = project.color;
            }
            
            taskEl.innerHTML = this.getTaskHTML(task, project, statusDetails);
            this.addTaskEventListeners(taskEl, task, project);
            return taskEl;
        },
        getTaskHTML(task, project, statusDetails) {
            return `
                <div class="item-tarefa-esq">
                    <button class="botao-concluir ${task.status === STATUS.DONE ? 'done' : ''}" 
                            style="${task.status !== STATUS.DONE ? `border-color: ${project.color}` : ''}"></button>
                    <p class="texto-tarefa" id="texto-tarefa-${task.id}">${task.text}</p>
                </div>
                <div class="item-tarefa-dir">
                    <span class="tag-tarefa ${statusDetails.cssClass}" id="tag-status-${task.id}" 
                          style="cursor: pointer;" title="Mudar status">
                        ${statusDetails.text}
                    </span>
                    <span class="tag-tarefa tag-projeto" style="color: ${project.color}">
                        ${project.name}
                    </span>
                </div>
            `;
        },
        addTaskEventListeners(taskEl, task, project) {
            const toggleBtn = taskEl.querySelector('.botao-concluir');
            const statusTag = taskEl.querySelector(`#tag-status-${task.id}`);
            const taskTextEl = taskEl.querySelector(`#texto-tarefa-${task.id}`);
            
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDone(task.id);
            });
            taskEl.addEventListener('click', () => {
                state.selectedTaskId = (state.selectedTaskId === task.id) ? null : task.id;
                this.render();
            });
            statusTag.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cycleStatus(task.id);
            });
            taskTextEl?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editText(taskEl, task);
            });
        },
        updateTitle() {
            if (state.currentViewProjectId === 'all') {
                elements.taskListTitle.textContent = 'Todas as Tarefas';
                elements.taskListTitle.style.color = '';
            } else {
                const project = utils.findProject(state.currentViewProjectId);
                elements.taskListTitle.textContent = project?.name || 'Tarefas';
                elements.taskListTitle.style.color = project?.color || '';
            }
        },
        toggleDone(taskId) {
            const task = utils.findTask(taskId);
            if (task) {
                task.status = task.status === STATUS.DONE ? STATUS.TODO : STATUS.DONE;
                this.render();
            }
        },
        cycleStatus(taskId) {
            const task = utils.findTask(taskId);
            if (!task) return;
            const statusOrder = [STATUS.TODO, STATUS.DOING, STATUS.DONE];
            const currentIndex = statusOrder.indexOf(task.status);
            task.status = statusOrder[(currentIndex + 1) % statusOrder.length];
            this.render();
        },
        editText(taskEl, task) {
            const taskTextP = taskEl.querySelector(`#texto-tarefa-${task.id}`);
            if (!taskTextP) return;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = task.text;
            input.className = 'input-editar-tarefa';
            
            const save = () => {
                const newText = input.value.trim();
                if (newText) task.text = newText;
                this.render();
            };
            input.addEventListener('blur', save);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
                if (e.key === 'Escape') { input.value = task.text; input.blur(); }
            });
            taskTextP.replaceWith(input);
            input.focus();
            input.select();
        },
        addNew(text, status, projectId) {
            state.tasks.push({
                id: utils.generateId(),
                text: text.trim(),
                projectId: projectId || parseInt(state.currentViewProjectId, 10),
                status
            });
            this.render();
        },
        deleteSelectedTask() {
            if (state.selectedTaskId !== null) {
                state.tasks = state.tasks.filter(task => task.id !== state.selectedTaskId);
                state.selectedTaskId = null;
                this.render();
            }
        },
        deleteAllVisible() {
            const tasksToDeleteIds = utils.getFilteredTasks().map(t => t.id);
            state.tasks = state.tasks.filter(task => !tasksToDeleteIds.includes(task.id));
            this.render();
        }
    };

    const eventManager = {
        init() {
            this.setupProjectEvents();
            this.setupTaskEvents();
            this.setupModalEvents();
            this.setupDeleteEvents();
        },
        setupProjectEvents() {
            elements.newProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = elements.projectNameInput.value;
                const color = elements.projectColorInput.value;
                if (name.trim()) {
                    projectManager.addNew(name, color);
                    elements.projectNameInput.value = '';
                }
            });
            elements.projectList.querySelector('a[data-project-id="all"]').addEventListener('click', (e) => {
                e.preventDefault();
                state.currentViewProjectId = 'all';
                state.selectedTaskId = null;
                taskManager.render();
                projectManager.updateActiveStyles();
            });
        },
        setupTaskEvents() {
            elements.newTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // 1. Limpa erros anteriores
                elements.taskProjectSelect.classList.remove('input-erro');
                elements.taskNameInput.classList.remove('input-erro');

                const text = elements.taskNameInput.value;
                const status = elements.taskStatusSelect.value;

                const projectId = state.currentViewProjectId === 'all' 
                    ? parseInt(elements.taskProjectSelect.value, 10)
                    : parseInt(state.currentViewProjectId, 10);

                // 2. Validação de Nome: SE NÃO TEM TEXTO, DAR ERRO
                if (!text.trim()) {
                    elements.taskNameInput.classList.add('input-erro'); 
                    return; 
                }

                // 3. Validação de Projeto: SE NÃO TEM PROJETO (projectId inválido)
                if (!projectId) {
                    if (state.currentViewProjectId === 'all') {
                        elements.taskProjectSelect.classList.add('input-erro');
                        
                        //if (state.projects.length === 0) {
                        //    alert("Crie um projeto antes de criar uma tarefa.");
                       // }
                    }
                    return; 
                }

                taskManager.addNew(text, status, projectId);
                elements.taskNameInput.value = '';
                elements.taskStatusSelect.value = STATUS.TODO;
                modalManager.close(elements.taskModal);
            });

            elements.taskProjectSelect.addEventListener('change', () => {
                elements.taskProjectSelect.classList.remove('input-erro');
            });
            elements.taskNameInput.addEventListener('input', () => {
                elements.taskNameInput.classList.remove('input-erro');
            });
        },
        setupModalEvents() {
            modalManager.setupModal(
                document.getElementById('abrir-modal-tarefa'),
                elements.taskModal,
                document.getElementById('fechar-modal-tarefa')
            );
        },
        setupDeleteEvents() {
            elements.deleteDoneTasksBtn.addEventListener('click', () => {
                if (state.selectedTaskId !== null) {
                    taskManager.deleteSelectedTask();
                } else {
                    const message = state.currentViewProjectId === 'all'
                        ? "Tem certeza que quer apagar TODAS as tarefas de TODOS os projetos visíveis?"
                        : `Tem certeza que quer apagar TODAS as tarefas deste projeto?`;
                    elements.deleteConfirmMessage.textContent = message;
                    modalManager.open(elements.deleteConfirmModal);
                }
            });
            document.getElementById('confirmar-del-btn').addEventListener('click', () => {
                taskManager.deleteAllVisible();
                modalManager.close(elements.deleteConfirmModal);
            });
            document.getElementById('cancelar-del-btn').addEventListener('click', () => {
                modalManager.close(elements.deleteConfirmModal);
            });
            
            document.getElementById('confirmar-del-proj-btn').addEventListener('click', () => {
                if (state.projectIdToDelete !== null) {
                    projectManager.deleteProject(state.projectIdToDelete);
                    modalManager.close(elements.deleteProjectModal);
                    state.projectIdToDelete = null;
                }
            });
            document.getElementById('cancelar-del-proj-btn').addEventListener('click', () => {
                modalManager.close(elements.deleteProjectModal);
                state.projectIdToDelete = null;
            });

            [elements.deleteConfirmModal, elements.deleteProjectModal].forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modalManager.close(modal);
                });
            });
        }
    };

    eventManager.init();
    projectManager.render();
    taskManager.render();
});