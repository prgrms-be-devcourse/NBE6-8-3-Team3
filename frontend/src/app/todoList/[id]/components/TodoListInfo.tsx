import React from 'react';

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

interface TodoListInfoProps {
  todoListInfo: TodoListInfo | null;
  todoListId: string;
  todos: Todo[];
}

const TodoListInfoComponent: React.FC<TodoListInfoProps> = ({ 
  todoListInfo, 
  todoListId, 
  todos 
}) => {
  // todos가 배열인지 확인하고, 아니면 빈 배열로 처리
  const safeTodos = Array.isArray(todos) ? todos : [];
  
  return (
    <div style={{
      background: 'var(--bg-white)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 12px var(--shadow-md)',
      border: '1px solid var(--border-light)',
      flexShrink: 0
    }}>
      <h1 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '700', 
        color: 'var(--text-primary)', 
        marginBottom: '0.5rem' 
      }}>
        📋 {todoListInfo?.name || `TodoList ${todoListId}`}
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
        {todoListInfo?.description || `TodoList ID ${todoListId}의 할일을 관리합니다.`}
      </p>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <span style={{
          background: 'var(--primary-light)',
          color: 'var(--primary-color)',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          총 {safeTodos.length}개
        </span>
        <span style={{
          background: '#f0fdf4',
          color: '#16a34a',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          완료 {safeTodos.filter(t => t.completed).length}개
        </span>
        <span style={{
          background: '#fefce8',
          color: '#eab308',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          진행중 {safeTodos.filter(t => !t.completed).length}개
        </span>
      </div>
      {todoListInfo && (
        <div style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-light)',
          display: 'flex',
          gap: '1rem'
        }}>
          <span>생성일: {new Date(todoListInfo.createDate).toLocaleDateString()}</span>
          <span>수정일: {new Date(todoListInfo.modifyDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

export default TodoListInfoComponent;