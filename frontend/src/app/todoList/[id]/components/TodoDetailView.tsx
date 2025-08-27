import React, { useState, useEffect } from 'react';

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
  labels?: Label[]; // 라벨 정보 추가
}

interface TodoDetailViewProps {
  todo: Todo;
  onCheckboxChange: (todoId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

const TodoDetailView: React.FC<TodoDetailViewProps> = ({
  todo,
  onCheckboxChange,
  onEdit,
  onDelete
}) => {
  const [todoLabels, setTodoLabels] = useState<Label[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  // Todo의 라벨 정보 불러오기
  useEffect(() => {
    const fetchTodoLabels = async () => {
      try {
        setLabelsLoading(true);
        const response = await fetch(`${API_BASE}/api/todos/${todo.id}/labels`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          const labels = result.data?.labels || [];
          setTodoLabels(labels);
        } else {
          console.warn('라벨 정보 불러오기 실패:', response.status);
        }
      } catch (error) {
        console.error('라벨 정보 불러오기 실패:', error);
      } finally {
        setLabelsLoading(false);
      }
    };
    
    fetchTodoLabels();
  }, [todo.id]);

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3:
        return { label: '높음', color: '#dc2626' };
      case 2:
        return { label: '중간', color: '#eab308' };
      case 1:
        return { label: '낮음', color: '#2563eb' };
      default:
        return { label: '일반', color: '#6b7280' };
    }
  };

  const priorityInfo = getPriorityLabel(todo.priority);

  return (
    <div style={{
      background: 'var(--bg-white)',
      borderRadius: '12px',
      padding: '3rem',
      boxShadow: '0 4px 12px var(--shadow-md)',
      border: '1px solid var(--border-light)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '2.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flex: 1 }}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onCheckboxChange(todo.id)}
            style={{ 
              width: '32px',
              height: '32px',
              marginTop: '0.25rem',
              accentColor: 'var(--primary-color)',
              transform: 'scale(1.3)'
            }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: todo.completed ? 'var(--text-light)' : 'var(--text-primary)',
              textDecoration: todo.completed ? 'line-through' : 'none',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              {todo.title}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginLeft: '1.5rem' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '1rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.05rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ✏️ 수정
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '1rem 1.5rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.05rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🗑️ 삭제
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem',
        flex: 1,
        overflowY: 'auto'
      }}>
        {/* 라벨 섹션 추가 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '1rem'
          }}>
            🏷️ 라벨
          </label>
          {labelsLoading ? (
            <div style={{
              background: 'var(--bg-main)',
              padding: '1.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              라벨 정보를 불러오는 중...
            </div>
          ) : todoLabels.length > 0 ? (
            <div style={{
              background: 'var(--bg-main)',
              padding: '1.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem' // 0.75rem -> 1rem으로 증가
            }}>
              {todoLabels.map(label => (
                <span
                  key={label.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.2rem', // 0.5rem 1rem -> 0.6rem 1.2rem으로 증가
                    backgroundColor: label.color,
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '1rem', // 0.95rem -> 1rem으로 증가
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'nowrap', // 텍스트가 한 줄로 유지되도록
                    minWidth: 'fit-content', // 최소 너비를 내용에 맞게
                    flexShrink: 0 // 축소 방지
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      flexShrink: 0 // 원점 축소 방지
                    }}
                  />
                  {label.name}
                </span>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-main)',
              padding: '1.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              연결된 라벨이 없습니다.
            </div>
          )}
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '1rem'
          }}>
            📝 설명
          </label>
          <p style={{
            color: 'var(--text-primary)',
            lineHeight: '1.6',
            fontSize: '1.1rem',
            background: 'var(--bg-main)',
            padding: '1.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
            wordBreak: 'break-word',
            minHeight: '80px',
            margin: 0
          }}>
            {todo.description || '설명이 없습니다.'}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              🎯 우선순위
            </label>
            <span style={{
              display: 'inline-block',
              fontSize: '1.1rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '20px',
              fontWeight: '600',
              background: todo.priority === 3 ? '#fef2f2' : 
                        todo.priority === 2 ? '#fefce8' : '#eff6ff',
              color: priorityInfo.color
            }}>
              {priorityInfo.label}
            </span>
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              📊 상태
            </label>
            <span style={{
              display: 'inline-block',
              fontSize: '1.1rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '20px',
              fontWeight: '600',
              background: todo.completed ? '#f0fdf4' : '#fefce8',
              color: todo.completed ? '#16a34a' : '#eab308'
            }}>
              {todo.completed ? '✅ 완료' : '⏳ 진행중'}
            </span>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              🚀 시작일
            </label>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontSize: '1.1rem',
              background: 'var(--bg-main)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)'
            }}>
              {todo.startDate ? new Date(todo.startDate).toLocaleDateString('ko-KR') : '설정되지 않음'}
            </div>
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              📅 마감일
            </label>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontSize: '1.1rem',
              background: 'var(--bg-main)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)'
            }}>
              {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('ko-KR') : '설정되지 않음'}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              📝 생성일
            </label>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontSize: '1rem',
              background: 'var(--bg-main)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)'
            }}>
              {todo.createdAt ? new Date(todo.createdAt).toLocaleDateString('ko-KR') : '알 수 없음'}
            </div>
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              🔄 수정일
            </label>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontSize: '1rem',
              background: 'var(--bg-main)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)'
            }}>
              {todo.updatedAt ? new Date(todo.updatedAt).toLocaleDateString('ko-KR') : '알 수 없음'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoDetailView;