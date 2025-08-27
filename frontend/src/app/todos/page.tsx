'use client';

import React, { useState } from 'react';
import TodoListTemplate from '../_components/TodoList/TodoListTemplate';

interface Todo {
  id: number;
  title: string;
  description: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  start_date: string;
  due_date: string;
  todo_list_id: number;
  created_at: string;
  updated_at: string;
}

type TodoData = {
  [key: string]: Todo[];
};

export default function TodoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('개인업무');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const todoData: TodoData = {
    '개인업무': [
      {
        id: 1,
        title: '개인 블로그 포스팅',
        description: '최근 학습한 React Hooks에 대한 내용을 정리하여 블로그에 포스팅하기',
        is_completed: false,
        priority: 'medium',
        start_date: '2024-01-15',
        due_date: '2024-01-20',
        todo_list_id: 1,
        created_at: '2024-01-15 09:00:00',
        updated_at: '2024-01-15 09:00:00'
      },
      {
        id: 2,
        title: '운동 계획 세우기',
        description: '새해 건강 관리를 위한 주간 운동 스케줄 작성',
        is_completed: true,
        priority: 'low',
        start_date: '2024-01-10',
        due_date: '2024-01-12',
        todo_list_id: 1,
        created_at: '2024-01-10 08:00:00',
        updated_at: '2024-01-12 20:30:00'
      },
      {
        id: 3,
        title: '독서 목록 정리',
        description: '올해 읽을 책 목록을 정리하고 우선순위 설정하기',
        is_completed: false,
        priority: 'low',
        start_date: '2024-01-18',
        due_date: '2024-01-25',
        todo_list_id: 1,
        created_at: '2024-01-18 10:15:00',
        updated_at: '2024-01-18 10:15:00'
      }
    ],
    '프로젝트 A': [
      {
        id: 4,
        title: 'API 설계 문서 작성',
        description: '사용자 인증 및 데이터 관리를 위한 REST API 설계 문서 작성',
        is_completed: false,
        priority: 'high',
        start_date: '2024-01-16',
        due_date: '2024-01-19',
        todo_list_id: 2,
        created_at: '2024-01-16 09:30:00',
        updated_at: '2024-01-16 09:30:00'
      },
      {
        id: 5,
        title: '프론트엔드 컴포넌트 구현',
        description: '로그인, 회원가입, 대시보드 페이지의 React 컴포넌트 구현',
        is_completed: false,
        priority: 'high',
        start_date: '2024-01-20',
        due_date: '2024-01-25',
        todo_list_id: 2,
        created_at: '2024-01-20 08:45:00',
        updated_at: '2024-01-20 08:45:00'
      },
      {
        id: 6,
        title: '데이터베이스 스키마 설계',
        description: 'MySQL 데이터베이스 테이블 구조 설계 및 관계 정의',
        is_completed: true,
        priority: 'high',
        start_date: '2024-01-12',
        due_date: '2024-01-15',
        todo_list_id: 2,
        created_at: '2024-01-12 14:20:00',
        updated_at: '2024-01-15 16:40:00'
      }
    ],
    '취미활동': [
      {
        id: 7,
        title: '기타 연주 연습',
        description: '새로운 곡 연주를 위한 기타 연습 - Canon in D',
        is_completed: false,
        priority: 'low',
        start_date: '2024-01-17',
        due_date: '2024-01-31',
        todo_list_id: 3,
        created_at: '2024-01-17 19:00:00',
        updated_at: '2024-01-17 19:00:00'
      },
      {
        id: 8,
        title: '사진 편집 강의 수강',
        description: 'Adobe Lightroom 기초 강의 수강 및 실습',
        is_completed: false,
        priority: 'medium',
        start_date: '2024-01-22',
        due_date: '2024-02-05',
        todo_list_id: 3,
        created_at: '2024-01-22 11:30:00',
        updated_at: '2024-01-22 11:30:00'
      }
    ]
  };

  const todos = todoData[selectedCategory] || [];

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedTodo(null);
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
  };

  const handleCheckboxChange = (todoId: number) => {
    console.log(`Toggle todo ${todoId} completion status`);
  };

  const handleEdit = () => {
    if (selectedTodo) {
      console.log(`Edit todo ${selectedTodo.id}`);
    }
  };

  const handleDelete = () => {
    if (selectedTodo) {
      console.log(`Delete todo ${selectedTodo.id}`);
      setSelectedTodo(null);
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: '높음', color: 'bg-red-100 text-red-600' };
      case 'medium':
        return { label: '중간', color: 'bg-yellow-100 text-yellow-600' };
      case 'low':
        return { label: '낮음', color: 'bg-blue-100 text-blue-600' };
      default:
        return { label: '일반', color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <TodoListTemplate>
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: 'calc(100vh - 120px)', // 높이를 더 크게 조정
        gap: '2rem',
        paddingTop: '0', // 상단 패딩 제거
        margin: '0', // 마진 제거
        overflow: 'hidden' // 전체 컨테이너 오버플로우 숨김
      }}>
        {/* 왼쪽: 투두리스트 + 투두목록 - 정확히 50% */}
        <div style={{ 
          width: '50%',
          minWidth: '50%', // 최소 너비 고정
          maxWidth: '50%', // 최대 너비 고정
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          height: '100%'
        }}>
          {/* TodoList 정보 블록 */}
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px var(--shadow-md)',
            border: '1px solid var(--border-light)',
            flexShrink: 0, // 이 블록 크기 고정
            width: '100%'
          }}>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.5rem' 
            }}>
              📋 {selectedCategory}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {selectedCategory} 관련 할 일들을 관리합니다.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginTop: '1rem' 
            }}>
              <span style={{
                background: 'var(--primary-light)',
                color: 'var(--primary-color)',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                총 {todos.length}개
              </span>
              <span style={{
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                완료 {todos.filter(t => t.is_completed).length}개
              </span>
              <span style={{
                background: '#fefce8',
                color: '#eab308',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                진행중 {todos.filter(t => !t.is_completed).length}개
              </span>
            </div>
          </div>

          {/* Todos 목록 블록 */}
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px var(--shadow-md)',
            border: '1px solid var(--border-light)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            minHeight: 0 // flex item이 축소될 수 있도록
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📝 할 일 목록
            </h2>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              flex: 1,
              overflowY: 'auto',
              paddingRight: '0.5rem',
              paddingTop: '0.5rem', // 약간의 상단 패딩 추가
              maxHeight: '100%' // 최대 높이 설정
            }}>
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  style={{
                    background: selectedTodo?.id === todo.id ? 'var(--primary-light)' : 'var(--bg-main)',
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: `4px solid ${
                      todo.priority === 'high' ? '#dc2626' : 
                      todo.priority === 'medium' ? '#eab308' : 
                      '#2563eb'
                    }`,
                    border: selectedTodo?.id === todo.id 
                      ? '2px solid var(--primary-color)' 
                      : '1px solid var(--border-light)',
                    minHeight: '120px', // 최소 높이 고정
                    maxHeight: '120px', // 최대 높이 고정
                    overflow: 'hidden', // 넘치는 내용 숨김
                    width: '100%' // 너비 100% 고정
                  }}
                  onClick={() => handleTodoClick(todo)}
                  onMouseEnter={(e) => {
                    if (selectedTodo?.id !== todo.id) {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-md)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTodo?.id !== todo.id) {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={todo.is_completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCheckboxChange(todo.id);
                      }}
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        marginTop: '0.125rem',
                        accentColor: 'var(--primary-color)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: todo.is_completed ? 'var(--text-light)' : 'var(--text-primary)',
                        textDecoration: todo.is_completed ? 'line-through' : 'none',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', // 제목은 한 줄로 제한
                        maxWidth: '100%'
                      }}>
                        {todo.title}
                      </h3>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        marginBottom: '0.75rem',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis', // 말줄임표 추가
                        height: '2.4em', // 2줄 높이로 고정
                        maxHeight: '2.4em' // 최대 높이 제한
                      }}>
                        {todo.description}
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontWeight: '600',
                          background: todo.priority === 'high' ? '#fef2f2' : 
                                    todo.priority === 'medium' ? '#fefce8' : '#eff6ff',
                          color: todo.priority === 'high' ? '#dc2626' : 
                                 todo.priority === 'medium' ? '#eab308' : '#2563eb'
                        }}>
                          {getPriorityLabel(todo.priority).label}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-light)',
                          fontWeight: '500'
                        }}>
                          📅 {todo.due_date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 선택된 Todo 상세 정보 - 정확히 50% */}
        <div style={{ 
          width: '50%',
          minWidth: '50%', // 최소 너비 고정
          maxWidth: '50%', // 최대 너비 고정
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {selectedTodo ? (
            <div style={{
              background: 'var(--bg-white)',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 12px var(--shadow-md)',
              border: '1px solid var(--border-light)',
              height: '100%',
              width: '100%', // 너비 고정
              minWidth: '0', // flex 축소 허용
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* 헤더 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={selectedTodo.is_completed}
                    onChange={() => handleCheckboxChange(selectedTodo.id)}
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      marginTop: '0.25rem',
                      accentColor: 'var(--primary-color)',
                      transform: 'scale(1.3)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: selectedTodo.is_completed ? 'var(--text-light)' : 'var(--text-primary)',
                      textDecoration: selectedTodo.is_completed ? 'line-through' : 'none',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word', // 긴 단어 줄바꿈
                      hyphens: 'auto' // 하이픈 처리
                    }}>
                      {selectedTodo.title}
                    </h2>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1rem' }}>
                  <button
                    onClick={handleEdit}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3730a3';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--primary-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#b91c1c';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#dc2626';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>

              {/* 상세 내용 */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem',
                flex: 1,
                overflowY: 'auto'
              }}>
                {/* 설명 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem'
                  }}>
                    📝 설명
                  </label>
                  <p style={{
                    color: 'var(--text-primary)',
                    lineHeight: '1.6',
                    fontSize: '1rem',
                    background: 'var(--bg-main)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    wordBreak: 'break-word', // 긴 단어 줄바꿈
                    overflowWrap: 'break-word' // 단어 끊어서 줄바꿈
                  }}>
                    {selectedTodo.description}
                  </p>
                </div>

                {/* 우선순위 & 상태 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1.5rem' 
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem'
                    }}>
                      🎯 우선순위
                    </label>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontWeight: '600',
                      background: selectedTodo.priority === 'high' ? '#fef2f2' : 
                                selectedTodo.priority === 'medium' ? '#fefce8' : '#eff6ff',
                      color: selectedTodo.priority === 'high' ? '#dc2626' : 
                             selectedTodo.priority === 'medium' ? '#eab308' : '#2563eb'
                    }}>
                      {getPriorityLabel(selectedTodo.priority).label}
                    </span>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem'
                    }}>
                      📊 상태
                    </label>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontWeight: '600',
                      background: selectedTodo.is_completed ? '#f0fdf4' : '#fefce8',
                      color: selectedTodo.is_completed ? '#16a34a' : '#eab308'
                    }}>
                      {selectedTodo.is_completed ? '✅ 완료' : '⏳ 진행중'}
                    </span>
                  </div>
                </div>

                {/* 시작일 & 마감일 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1.5rem' 
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem'
                    }}>
                      🚀 시작일
                    </label>
                    <p style={{ 
                      color: 'var(--text-primary)', 
                      fontSize: '1rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)'
                    }}>
                      {selectedTodo.start_date}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem'
                    }}>
                      📅 마감일
                    </label>
                    <p style={{ 
                      color: 'var(--text-primary)', 
                      fontSize: '1rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)'
                    }}>
                      {selectedTodo.due_date}
                    </p>
                  </div>
                </div>

                {/* 생성일 & 수정일 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1.5rem' 
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem'
                    }}>
                      📝 생성일
                    </label>
                    <p style={{ 
                      color: 'var(--text-primary)', 
                      fontSize: '0.9rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)'
                    }}>
                      {selectedTodo.created_at}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem'
                    }}>
                      🔄 수정일
                    </label>
                    <p style={{ 
                      color: 'var(--text-primary)', 
                      fontSize: '0.9rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)'
                    }}>
                      {selectedTodo.updated_at}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-white)',
              borderRadius: '12px',
              padding: '3rem',
              boxShadow: '0 4px 12px var(--shadow-md)',
              height: '100%', // 전체 높이 사용
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--border-medium)'
            }}>
              <div style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📝</div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  marginBottom: '0.5rem',
                  color: 'var(--text-secondary)'
                }}>
                  할 일을 선택해주세요
                </h3>
                <p style={{ fontSize: '1rem' }}>
                  왼쪽에서 할 일을 클릭하면 상세 정보가 표시됩니다.
                </p>
              </div>  
            </div>
          )}
        </div>
      </div>
    </TodoListTemplate>
  );
}