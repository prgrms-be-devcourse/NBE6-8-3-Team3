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
  dueDate: string | null;
  todoList: number;
  createdAt: string;
  updatedAt: string;
  labels?: Label[]; // 라벨 정보 추가
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
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3:
        return { label: '높음', color: 'bg-red-100 text-red-600' };
      case 2:
        return { label: '중간', color: 'bg-yellow-100 text-yellow-600' };
      case 1:
        return { label: '낮음', color: 'bg-blue-100 text-blue-600' };
      default:
        return { label: '일반', color: 'bg-gray-100 text-gray-600' };
    }
  };

  // 날짜 표시 함수 - dueDate가 null이면 startDate 사용
  const getDisplayDate = (todo: Todo) => {
    const dateToShow = todo.dueDate || todo.startDate;
    const dateObj = new Date(dateToShow);
    const label = todo.dueDate ? '📅' : '🗓️'; // 마감일과 시작일 구분
    return `${label} ${dateObj.toLocaleDateString()}`;
  };

  return (
    <div style={{
      background: 'var(--bg-white)',
      borderRadius: '12px',
      padding: '2.5rem',
      boxShadow: '0 4px 12px var(--shadow-md)',
      border: '1px solid var(--border-light)',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        📝 할 일 목록
      </h2>
      
      {todos.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '1.5rem',
          color: 'var(--text-light)',
          border: '2px dashed var(--border-medium)',
          borderRadius: '8px',
          padding: '3rem'
        }}>
          <div style={{ fontSize: '4rem' }}>📝</div>
          <p style={{ fontSize: '1.3rem' }}>등록된 할 일이 없습니다.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          flex: 1,
          overflowY: 'auto',
          paddingRight: '0.75rem'
        }}>
          {todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                background: selectedTodo?.id === todo.id ? 'var(--primary-light)' : 'var(--bg-main)',
                borderRadius: '10px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: `5px solid ${
                  todo.priority === 3 ? '#dc2626' : 
                  todo.priority === 2 ? '#eab308' : 
                  '#2563eb'
                }`,
                border: selectedTodo?.id === todo.id 
                  ? '2px solid var(--primary-color)' 
                  : '1px solid var(--border-light)',
                minHeight: todo.labels && todo.labels.length > 0 ? '170px' : '140px' // 라벨이 있으면 높이 증가
              }}
              onClick={() => onTodoClick(todo)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={(e) => {
                    e.stopPropagation();
                    onCheckboxChange(todo.id);
                  }}
                  style={{ 
                    width: '24px',
                    height: '24px',
                    marginTop: '0.125rem',
                    accentColor: 'var(--primary-color)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontWeight: '600',
                    fontSize: '1.2rem',
                    color: todo.completed ? 'var(--text-light)' : 'var(--text-primary)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    marginBottom: '0.75rem',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {todo.title}
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '3em'
                  }}>
                    {todo.description}
                  </p>

                  {/* 우선순위, 날짜, 라벨을 한 줄에 표시 */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap' // 공간이 부족하면 줄바꿈 허용
                  }}>
                    {/* 왼쪽: 우선순위와 라벨들 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      flex: 1
                    }}>
                      <span style={{
                        fontSize: '0.85rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '15px',
                        fontWeight: '600',
                        background: todo.priority === 3 ? '#fef2f2' : 
                                  todo.priority === 2 ? '#fefce8' : '#eff6ff',
                        color: todo.priority === 3 ? '#dc2626' : 
                               todo.priority === 2 ? '#eab308' : '#2563eb'
                      }}>
                        {getPriorityLabel(todo.priority).label}
                      </span>

                      {/* 라벨들을 우선순위 바로 옆에 표시 */}
                      {todo.labels && todo.labels.length > 0 && (
                        <>
                          {todo.labels.slice(0, 2).map(label => (
                            <span
                              key={label.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                backgroundColor: label.color,
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: '500',
                                maxWidth: '70px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <div
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                  flexShrink: 0
                                }}
                              />
                              {label.name}
                            </span>
                          ))}
                          {todo.labels.length > 2 && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.4rem',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}>
                              +{todo.labels.length - 2}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* 오른쪽: 날짜 */}
                    <span style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-light)',
                      fontWeight: '500',
                      flexShrink: 0
                    }}>
                      {getDisplayDate(todo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* TODO 추가 버튼 */}
      <div style={{ 
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-light)' 
      }}>
        <button
          onClick={onCreateTodo}
          style={{
            width: '100%',
            padding: '1.25rem',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          ➕ 새 할 일 추가
        </button>
      </div>
    </div>
  );
};

export default TodoListItems;