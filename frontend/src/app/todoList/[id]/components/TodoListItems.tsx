import React from 'react';

interface Label {
    id: number;
    name: string;
    color: string;
}

interface Todo {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    priority: number;
    startDate: string;
    dueDate: string;
    todoList: number;
    createdAt: string;
    updatedAt: string;
    labels?: Label[];
    isNotificationEnabled?: boolean; // 알림 필드 추가
}

interface TodoListItemsProps {
    todos: Todo[];
    selectedTodo: Todo | null;
    onTodoClick: (todo: Todo) => void;
    onCheckboxChange: (todoId: number) => void;
    onCreateTodo: () => void;
}

const TodoListItems: React.FC<TodoListItemsProps> = ({
                                                         todos,
                                                         selectedTodo,
                                                         onTodoClick,
                                                         onCheckboxChange,
                                                         onCreateTodo
                                                     }) => {
    const getPriorityColor = (priority: number) => {
    switch (priority) {
        case 3:
            return '#dc2626'; // 높음 - 빨간색
        case 2:
            return '#eab308'; // 중간 - 노란색
        case 1:
            return '#16a34a'; // 낮음 - 초록색
        default:
            return '#6b7280'; // 기본 - 회색
    }
};

    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 3:
                return '높음';
            case 2:
                return '중간';
            case 1:
                return '낮음';
            default:
                return '일반';
        }
    };

    return (
        <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px var(--shadow-md)',
            border: '1px solid var(--border-light)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 헤더 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid var(--border-light)'
            }}>
                <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: 0
                }}>
                    📋 할일 목록 ({todos.length})
                </h3>
                <button
                    onClick={onCreateTodo}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ✨ 새 할일
                </button>
            </div>

            {/* Todo 리스트 */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {todos.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '1.1rem',
                        padding: '3rem 2rem'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                        <p style={{ margin: '0 0 1rem 0' }}>아직 등록된 할일이 없습니다.</p>
                        <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-light)' }}>
                            새 할일 버튼을 눌러 첫 번째 할일을 추가해보세요!
                        </p>
                    </div>
                ) : (
                    todos.map(todo => (
                        <div
                            key={todo.id}
                            onClick={() => onTodoClick(todo)}
                            style={{
                                padding: '1.5rem',
                                border: `2px solid ${
                                    selectedTodo?.id === todo.id
                                        ? 'var(--primary-color)'
                                        : 'var(--border-light)'
                                }`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: selectedTodo?.id === todo.id
                                    ? '#f0f9ff'
                                    : 'white',
                                opacity: todo.completed ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (selectedTodo?.id !== todo.id) {
                                    e.currentTarget.style.background = '#f8fafc';
                                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedTodo?.id !== todo.id) {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.borderColor = 'var(--border-light)';
                                }
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onCheckboxChange(todo.id);
                                    }}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        marginTop: '0.25rem',
                                        accentColor: 'var(--primary-color)',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* 제목 및 알림 표시 */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <h4 style={{
                                            fontSize: '1.2rem',
                                            fontWeight: '600',
                                            color: todo.completed ? 'var(--text-light)' : 'var(--text-primary)',
                                            textDecoration: todo.completed ? 'line-through' : 'none',
                                            margin: 0,
                                            wordBreak: 'break-word',
                                            flex: 1
                                        }}>
                                            {todo.title}
                                        </h4>
                                        {/* 알림 설정된 경우 종모양 이모지 표시 */}
                                        {todo.isNotificationEnabled && (
                                            <span
                                                style={{
                                                    fontSize: '1rem',
                                                    opacity: 0.7
                                                }}
                                                title="알림이 설정된 할일입니다"
                                            >
                        🔔
                      </span>
                                        )}
                                        {/* 우선순위 표시 */}
                                        <span style={{
                                            fontSize: '0.8rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                            background: todo.priority === 3 ? '#fef2f2' :
                                                todo.priority === 2 ? '#fefce8' : '#f0fdf4',
                                            color: getPriorityColor(todo.priority)
                                        }}>
                      {getPriorityLabel(todo.priority)}
                    </span>
                                    </div>

                                    {/* 설명 */}
                                    <p style={{
                                        fontSize: '1rem',
                                        color: 'var(--text-secondary)',
                                        margin: '0 0 1rem 0',
                                        lineHeight: '1.4',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {todo.description || '설명이 없습니다.'}
                                        {/* 설명에도 알림 표시 */}
                                        {todo.isNotificationEnabled && (
                                            <span
                                                style={{
                                                    fontSize: '0.9rem',
                                                    marginLeft: '0.5rem',
                                                    opacity: 0.6
                                                }}
                                                title="알림이 설정된 할일입니다"
                                            >
                        🔔
                      </span>
                                        )}
                                    </p>

                                    {/* 라벨 표시 */}
                                    {todo.labels && todo.labels.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem',
                                            marginBottom: '1rem'
                                        }}>
                                            {todo.labels.slice(0, 3).map(label => (
                                                <span
                                                    key={label.id}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '12px',
                                                        fontWeight: '500',
                                                        background: label.color || '#e2e8f0',
                                                        color: label.color ?
                                                            (parseInt(label.color.slice(1), 16) > 0x888888 ? '#000' : '#fff')
                                                            : '#334155'
                                                    }}
                                                >
                          {label.name}
                        </span>
                                            ))}
                                            {todo.labels.length > 3 && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '12px',
                                                    fontWeight: '500',
                                                    background: '#f1f5f9',
                                                    color: '#64748b'
                                                }}>
                          +{todo.labels.length - 3}
                        </span>
                                            )}
                                        </div>
                                    )}

                                    {/* 날짜 정보 */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-light)'
                                    }}>
                                        {todo.startDate && (
                                            <span>
                        🚀 {new Date(todo.startDate).toLocaleDateString('ko-KR')}
                      </span>
                                        )}
                                        {todo.dueDate && (
                                            <span style={{
                                                color: new Date(todo.dueDate) < new Date() && !todo.completed
                                                    ? '#dc2626'
                                                    : 'var(--text-light)'
                                            }}>
                        📅 {new Date(todo.dueDate).toLocaleDateString('ko-KR')}
                                                {new Date(todo.dueDate) < new Date() && !todo.completed && ' (지연)'}
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TodoListItems;