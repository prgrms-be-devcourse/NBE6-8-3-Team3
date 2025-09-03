'use client';
import TodoEmptyState from './components/TodoEmptyState';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TodoListTemplate from '../../_components/TodoList/TodoListTemplate';
import TodoListInfoComponent from './components/TodoListInfo';
import TodoListItems from './components/TodoListItems';
import TodoCreateForm from './components/TodoCreateForm';
import TodoDetailView from './components/TodoDetailView';
import TodoEditForm from './components/TodoEditForm';

interface Todo {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    priority: number;
    startDate: string;
    dueDate?: string | null;
    todoList: number;
    createdAt: string;
    updatedAt: string;
    labels?: Label[];
    isNotificationEnabled?: boolean;
}

interface Label {
    id: number;
    name: string;
    color: string;
}

interface TodoListInfo {
    id: number;
    name: string;
    description: string;
    userId: number;
    teamId: number;
    createDate: string;
    modifyDate: string;
}

// formatDateForInput 함수 정의 추가
const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().slice(0, 16);
    } catch (error) {
        console.error('Date formatting error:', error);
        return '';
    }
};

export default function TodoListPage() {
    const params = useParams();
    const todoListId = params.id as string;

    const [todos, setTodos] = useState<Todo[]>([]);
    const [todoListInfo, setTodoListInfo] = useState<TodoListInfo | null>(null);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [showEditForm, setShowEditForm] = useState<boolean>(false);

    const [newTodo, setNewTodo] = useState({
        title: '',
        description: '',
        priority: 2,
        startDate: '',
        dueDate: '',
        isNotificationEnabled: false
    });

    const [editTodo, setEditTodo] = useState({
        title: '',
        description: '',
        priority: 2,
        startDate: '',
        dueDate: '',
        isNotificationEnabled: false
    });
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    // TodoList 정보와 Todos 데이터 가져오기
    const fetchTodoListData = async () => {
        if (!todoListId) return;

        setLoading(true);
        setError(null);

        try {
            // 1. TodoList 정보 먼저 불러오기
            const todoListResponse = await fetch(`http://localhost:8080/api/todo-lists/${todoListId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            let todoListData = null;
            if (todoListResponse.ok) {
                const todoListResult = await todoListResponse.json();
                if (todoListResult.data) {
                    todoListData = {
                        id: todoListResult.data.id || parseInt(todoListId),
                        name: todoListResult.data.name || `TodoList ${todoListId}`,
                        description: todoListResult.data.description || `TodoList ${todoListId}의 할일 목록`,
                        userId: todoListResult.data.userId || 0,
                        teamId: todoListResult.data.teamId || 0,
                        createDate: todoListResult.data.createDate || new Date().toISOString(),
                        modifyDate: todoListResult.data.modifyDate || new Date().toISOString()
                    };
                    setTodoListInfo(todoListData);
                }
            }

            // 2. Todo 목록 불러오기
            const todosResponse = await fetch(`http://localhost:8080/api/todo/list/${todoListId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!todosResponse.ok) {
                throw new Error(`HTTP error! status: ${todosResponse.status}`);
            }

            const todosResult = await todosResponse.json();

            if (todosResult.resultCode === '200-OK' || todosResult.resultCode === 'SUCCESS' || todosResponse.ok) {
                if (!todoListData && todosResult.data && todosResult.data.length > 0) {
                    const firstTodo = todosResult.data[0];
                    setTodoListInfo({
                        id: firstTodo.todoList,
                        name: `TodoList ${firstTodo.todoList}`,
                        description: `TodoList ID ${firstTodo.todoList}의 할일 목록`,
                        userId: 0,
                        teamId: 0,
                        createDate: firstTodo.createdAt,
                        modifyDate: firstTodo.updatedAt
                    });
                }

                console.log('서버에서 받은 Todos 데이터:', todosResult.data); // 디버깅용

                // 3. 각 Todo에 대해 라벨 정보 추가로 불러오기
                const todosWithLabels = await Promise.all(
                    (todosResult.data || []).map(async (todo: any) => {
                        try {
                            const labelResponse = await fetch(`http://localhost:8080/api/todos/${todo.id}/labels`, {
                                method: 'GET',
                                credentials: 'include',
                                headers: {
                                    'Accept': 'application/json',
                                },
                            });

                            let labels = [];
                            if (labelResponse.ok) {
                                const labelResult = await labelResponse.json();
                                labels = labelResult.data?.labels || [];
                            }

                            // completed 필드 정규화 - 다양한 필드명 대응
                            const normalizedTodo = {
                                ...todo,
                                completed: todo.completed ?? todo.isCompleted ?? todo.isComplete ?? false,
                                labels
                            };

                            console.log(`Todo ${todo.id} completed 상태:`, {
                                original: todo,
                                normalized: normalizedTodo.completed
                            }); // 디버깅용

                            return normalizedTodo;
                        } catch (error) {
                            console.error(`Todo ${todo.id} 라벨 불러오기 실패:`, error);
                            return { 
                                ...todo, 
                                labels: [],
                                completed: todo.completed ?? todo.isCompleted ?? todo.isComplete ?? false
                            };
                        }
                    })
                );

                setTodos(todosWithLabels);
            } else {
                throw new Error(todosResult.msg || 'Failed to fetch todo list');
            }
        } catch (err) {
            console.error('Failed to fetch todo list:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodoListData();
    }, [todoListId]);

    const handleTodoClick = (todo: Todo) => {
        setSelectedTodo(todo);
        setShowCreateForm(false);
        setShowEditForm(false);
    };

    const handleCheckboxChange = async (todoId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/todo/${todoId}/complete`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.resultCode === 'S-1' || result.resultCode === 'SUCCESS' || response.ok) {
                const updatedTodo = result.data;

                setTodos(prevTodos =>
                    prevTodos.map(todo =>
                        todo.id === todoId
                            ? {
                                ...todo,
                                completed: updatedTodo?.completed !== undefined ? updatedTodo.completed : !todo.completed,
                                updatedAt: updatedTodo?.updatedAt || new Date().toISOString()
                            }
                            : todo
                    )
                );

                if (selectedTodo?.id === todoId) {
                    setSelectedTodo(prev => prev ? {
                        ...prev,
                        completed: updatedTodo?.completed !== undefined ? updatedTodo.completed : !prev.completed,
                        updatedAt: updatedTodo?.updatedAt || new Date().toISOString()
                    } : null);
                }

                console.log(`할 일 ${todoId} 상태가 변경되었습니다.`);
            } else {
                throw new Error(result.msg || result.message || 'Failed to toggle todo status');
            }
        } catch (error) {
            console.error('Failed to toggle todo:', error);
            let errorMessage = '할 일 상태 변경에 실패했습니다.';
            if (error instanceof Error) {
                if (error.message.includes('404')) {
                    errorMessage = '해당 할 일을 찾을 수 없습니다.';
                } else if (error.message.includes('403')) {
                    errorMessage = '할 일을 수정할 권한이 없습니다.';
                } else if (error.message.includes('500')) {
                    errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                }
            }
            alert(errorMessage);
        }
    };

    const handleEdit = () => {
        if (selectedTodo) {
            setEditTodo({
                title: selectedTodo.title || '',
                description: selectedTodo.description || '',
                priority: selectedTodo.priority || 2,
                startDate: formatDateForInput(selectedTodo.startDate) || '',
                dueDate: formatDateForInput(selectedTodo.dueDate) || '',
                isNotificationEnabled: selectedTodo.isNotificationEnabled || false
            });
            setShowEditForm(true);
            setShowCreateForm(false);
            setFormErrors({});
        }
    };

    const handleDelete = async () => {
        if (selectedTodo) {
            if (!confirm(`"${selectedTodo.title}" 할 일을 삭제하시겠습니까?`)) {
                return;
            }

            try {
                let csrfToken = null;
                try {
                    const metaCsrf = document.querySelector('meta[name="_csrf"]');
                    const metaCsrfHeader = document.querySelector('meta[name="_csrf_header"]');
                    if (metaCsrf && metaCsrfHeader) {
                        csrfToken = {
                            token: metaCsrf.getAttribute('content'),
                            header: metaCsrfHeader.getAttribute('content')
                        };
                    }
                } catch (e) {
                    console.log('CSRF token not found in meta tags');
                }

                const headers: any = {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                };

                if (csrfToken) {
                    headers[csrfToken.header] = csrfToken.token;
                }

                const response = await fetch(`http://localhost:8080/api/todo/${selectedTodo.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: headers
                });

                if (response.status === 401) {
                    alert('인증에 실패했습니다. CSRF 토큰이나 세션 문제일 수 있습니다.');
                    return;
                }

                if (!response.ok) {
                    let errorText = '';
                    try {
                        const errorBody = await response.text();
                        errorText = errorBody;
                        console.log('Error response body:', errorBody);
                    } catch (e) {
                        console.log('Could not read error response body');
                    }
                    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
                }

                const result = await response.json();

                if (result.resultCode === 'S-1' || result.resultCode === 'SUCCESS' || response.ok) {
                    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== selectedTodo.id));
                    setSelectedTodo(null);
                    await refreshTodoList();
                } else {
                    throw new Error(result.msg || result.message || 'Failed to delete todo');
                }
            } catch (error) {
                console.error('Failed to delete todo:', error);
                let errorMessage = '할 일 삭제에 실패했습니다.';
                if (error instanceof Error) {
                    if (error.message.includes('401')) {
                        errorMessage = '삭제 권한이 없습니다. CSRF 토큰이나 인증 설정을 확인해주세요.';
                    } else if (error.message.includes('404')) {
                        errorMessage = '해당 할 일을 찾을 수 없습니다.';
                    } else if (error.message.includes('403')) {
                        errorMessage = '할 일을 삭제할 권한이 없습니다.';
                    } else if (error.message.includes('400')) {
                        errorMessage = '삭제 요청이 올바르지 않습니다.';
                    } else if (error.message.includes('500')) {
                        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                    } else if (error.message.includes('Failed to fetch')) {
                        errorMessage = '네트워크 연결을 확인해주세요.';
                    }
                }
                alert(errorMessage + '\n\n개발자 도구의 Console과 Network 탭을 확인해보세요.');
                try {
                    await refreshTodoList();
                } catch (refreshError) {
                    console.error('Failed to refresh after error:', refreshError);
                }
            }
        }
    };

    const handleCreateTodo = () => {
        setShowCreateForm(true);
        setShowEditForm(false);
        setSelectedTodo(null);
        const now = new Date();
        const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
        const tomorrow = new Date(now.getTime() + 33 * 60 * 60 * 1000).toISOString().slice(0, 16);

        setNewTodo({
            title: '',
            description: '',
            priority: 2,
            startDate: today,
            dueDate: tomorrow,
            isNotificationEnabled: false
        });
        setFormErrors({});
    };

    const handleFormChange = (field: string, value: string | number | boolean) => {
        if (showEditForm) {
            setEditTodo(prev => ({ ...prev, [field]: value }));
        } else {
            setNewTodo(prev => ({ ...prev, [field]: value }));
        }
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};
        const currentTodo = showEditForm ? editTodo : newTodo;

        if (!currentTodo.title.trim()) {
            errors.title = '제목은 필수입니다.';
        }

        if (!currentTodo.startDate) {
            errors.startDate = '시작일은 필수입니다.';
        }

        if (!currentTodo.dueDate) {
            errors.dueDate = '마감일은 필수입니다.';
        }

        if (currentTodo.startDate && currentTodo.dueDate && new Date(currentTodo.startDate) > new Date(currentTodo.dueDate)) {
            errors.dueDate = '마감일은 시작일보다 늦어야 합니다.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // 수정된 handleSubmitTodo 함수
    const handleSubmitTodo = async (selectedLabels?: number[]) => {
        if (!validateForm()) return;

        const currentTodo = showEditForm ? editTodo : newTodo;

        try {
            const todoData = {
                title: currentTodo.title.trim(),
                description: currentTodo.description.trim(),
                priority: currentTodo.priority,
                isCompleted: selectedTodo?.completed || false,
                todoListId: parseInt(todoListId),
                startDate: currentTodo.startDate,
                dueDate: currentTodo.dueDate || null,
                isNotificationEnabled: currentTodo.isNotificationEnabled || false,
                createdAt: selectedTodo?.createdAt || new Date().toISOString(),
                modifyedAt: new Date().toISOString()
            };

            const isEdit = showEditForm && selectedTodo;
            const url = isEdit
                ? `http://localhost:8080/api/todo/${selectedTodo.id}`
                : 'http://localhost:8080/api/todo';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todoData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.resultCode === 'S-1' || result.resultCode === 'SUCCESS' || response.ok) {
                const newTodoData = result.data;
                
                // completed 필드 정규화
                if (newTodoData) {
                    newTodoData.completed = newTodoData.completed ?? newTodoData.isCompleted ?? newTodoData.isComplete ?? false;
                }

                if (isEdit) {
                    // 수정인 경우
                    setTodos(prevTodos =>
                        prevTodos.map(todo =>
                            todo.id === selectedTodo.id ? { ...todo, ...newTodoData } : todo
                        )
                    );
                    setSelectedTodo(prev => prev ? { ...prev, ...newTodoData } : null);
                } else {
                    // 새로 생성인 경우
                    await refreshTodoList(); // 목록 새로고침
                    
                    // 생성된 할일을 선택된 할일로 설정
                    if (newTodoData && newTodoData.id) {
                        // 약간의 지연 후 선택하여 UI 업데이트가 완료되도록 함
                        setTimeout(() => {
                            setSelectedTodo(newTodoData);
                        }, 100);
                    }
                }

                // 폼 상태 리셋
                setShowCreateForm(false);
                setShowEditForm(false);
                setNewTodo({
                    title: '',
                    description: '',
                    priority: 2,
                    startDate: '',
                    dueDate: '',
                    isNotificationEnabled: false
                });
                setEditTodo({
                    title: '',
                    description: '',
                    priority: 2,
                    startDate: '',
                    dueDate: '',
                    isNotificationEnabled: false
                });
                setFormErrors({});

                console.log(`할 일이 ${isEdit ? '수정' : '생성'}되었습니다.`);
            } else {
                throw new Error(result.msg || result.message || `Failed to ${isEdit ? 'update' : 'create'} todo`);
            }
        } catch (error) {
            console.error(`Todo ${showEditForm ? '수정' : '저장'} 실패:`, error);
            alert(`할 일 ${showEditForm ? '수정' : '저장'}에 실패했습니다.`);
        }
    };

    // 새로고침용 함수 (로딩 상태 없이)
    const refreshTodoList = async () => {
        if (!todoListId) return;

        try {
            const todoListResponse = await fetch(`http://localhost:8080/api/todo-lists/${todoListId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            let todoListData = null;
            if (todoListResponse.ok) {
                const todoListResult = await todoListResponse.json();
                if (todoListResult.data) {
                    todoListData = {
                        id: todoListResult.data.id || parseInt(todoListId),
                        name: todoListResult.data.name || `TodoList ${todoListId}`,
                        description: todoListResult.data.description || `TodoList ${todoListId}의 할일 목록`,
                        userId: todoListResult.data.userId || 0,
                        teamId: todoListResult.data.teamId || 0,
                        createDate: todoListResult.data.createDate || new Date().toISOString(),
                        modifyDate: todoListResult.data.modifyDate || new Date().toISOString()
                    };
                    setTodoListInfo(todoListData);
                }
            }

            const todosResponse = await fetch(`http://localhost:8080/api/todo/list/${todoListId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!todosResponse.ok) {
                throw new Error(`HTTP error! status: ${todosResponse.status}`);
            }

            const todosResult = await todosResponse.json();

            if (todosResult.resultCode === '200-OK' || todosResult.resultCode === 'SUCCESS' || todosResponse.ok) {
                if (!todoListData && todosResult.data && todosResult.data.length > 0) {
                    const firstTodo = todosResult.data[0];
                    setTodoListInfo({
                        id: firstTodo.todoList,
                        name: `TodoList ${firstTodo.todoList}`,
                        description: `TodoList ID ${firstTodo.todoList}의 할일 목록`,
                        userId: 0,
                        teamId: 0,
                        createDate: firstTodo.createdAt,
                        modifyDate: firstTodo.updatedAt
                    });
                }

                const todosWithLabels = await Promise.all(
                    (todosResult.data || []).map(async (todo: any) => {
                        try {
                            const labelResponse = await fetch(`http://localhost:8080/api/todos/${todo.id}/labels`, {
                                method: 'GET',
                                credentials: 'include',
                                headers: {
                                    'Accept': 'application/json',
                                },
                            });

                            let labels = [];
                            if (labelResponse.ok) {
                                const labelResult = await labelResponse.json();
                                labels = labelResult.data?.labels || [];
                            }

                            // completed 필드 정규화
                            return {
                                ...todo,
                                completed: todo.completed ?? todo.isCompleted ?? todo.isComplete ?? false,
                                labels
                            };
                        } catch (error) {
                            console.error(`Todo ${todo.id} 라벨 불러오기 실패:`, error);
                            return { 
                                ...todo, 
                                labels: [],
                                completed: todo.completed ?? todo.isCompleted ?? todo.isComplete ?? false
                            };
                        }
                    })
                );

                setTodos(todosWithLabels);
            }
        } catch (err) {
            console.error('Failed to refresh todo list:', err);
        }
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
        setShowEditForm(false);
        setNewTodo({
            title: '',
            description: '',
            priority: 2,
            startDate: '',
            dueDate: '',
            isNotificationEnabled: false
        });
        setEditTodo({
            title: '',
            description: '',
            priority: 2,
            startDate: '',
            dueDate: '',
            isNotificationEnabled: false
        });
        setFormErrors({});
    };

    if (loading) {
        return (
            <TodoListTemplate>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'calc(100vh - 200px)',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid var(--border-light)',
                        borderTop: '4px solid var(--primary-color)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        TodoList를 불러오는 중...
                    </p>
                    <style jsx>{`
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </TodoListTemplate>
        );
    }

    if (error) {
        return (
            <TodoListTemplate>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'calc(100vh - 200px)',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        오류가 발생했습니다
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        다시 시도
                    </button>
                </div>
            </TodoListTemplate>
        );
    }

    return (
        <TodoListTemplate>
            <style jsx global>{`
                .content {
                  max-width: none !important;
                  width: 100% !important;
                  align-items: stretch !important;
                  justify-content: flex-start !important;
                  text-align: left !important;
                  padding: 1rem !important;
                }
                .todo-list-template {
                  max-width: none !important;
                  width: 100% !important;
                }
                .main-container {
                  max-width: none !important;
                  width: 100% !important;
                }
            `}</style>

            <div style={{
                width: '70%',
                maxWidth: '1500px',
                minWidth: '800px',
                margin: '0 auto',
                padding: '0 2rem',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
                textAlign: 'left',
                height: '100%',
                overflowX: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    width: '100%',
                    height: 'calc(100vh - 120px)',
                    margin: 0,
                    padding: 0,
                    overflow: 'hidden',
                    gap: '2rem',
                    minWidth: '1100px'
                }}>
                    <div style={{
                        width: '40%',
                        minWidth: '400px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        flexShrink: 0
                    }}>
                        <TodoListInfoComponent
                            todoListInfo={todoListInfo}
                            todoListId={todoListId}
                            todos={todos}
                        />
                        <TodoListItems
                            todos={todos}
                            selectedTodo={selectedTodo}
                            onTodoClick={handleTodoClick}
                            onCheckboxChange={handleCheckboxChange}
                            onCreateTodo={handleCreateTodo}
                        />
                    </div>

                    <div style={{
                    <div style={{
                        width: '40%',
                        minWidth: '450px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0
                    }}>
                        {showCreateForm ? (
                            <TodoCreateForm
                                newTodo={newTodo}
                                formErrors={formErrors}
                                onFormChange={handleFormChange}
                                onSubmit={handleSubmitTodo}
                                onCancel={handleCancelCreate}
                            />
                        ) : showEditForm && selectedTodo ? (
                            <TodoEditForm
                                todo={selectedTodo}
                                editTodo={editTodo}
                                formErrors={formErrors}
                                onFormChange={handleFormChange}
                                onSubmit={handleSubmitTodo}
                                onCancel={handleCancelCreate}
                            />
                        ) : selectedTodo ? (
                            <TodoDetailView
                                todo={selectedTodo}
                                onCheckboxChange={handleCheckboxChange}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ) : (
                            <TodoEmptyState />
                        )}
                    </div>
                </div>
            </div>
        </TodoListTemplate>
    );
}