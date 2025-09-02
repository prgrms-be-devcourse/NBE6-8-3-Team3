'use client';

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
  isNotificationEnabled?: boolean; // 알림 필드 추가
}

interface EditTodo {
  title: string;
  description: string;
  priority: number;
  startDate: string;
  dueDate: string;
  isNotificationEnabled?: boolean; // 알림 필드 추가
}

interface TodoEditFormProps {
  todo: Todo;
  editTodo: EditTodo;
  formErrors: {[key: string]: string};
  onFormChange: (field: string, value: string | number | boolean) => void;
  onSubmit: (selectedLabels: number[]) => void;
  onCancel: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

const TodoEditForm: React.FC<TodoEditFormProps> = ({
                                                     todo,
                                                     editTodo,
                                                     formErrors,
                                                     onFormChange,
                                                     onSubmit,
                                                     onCancel
                                                   }) => {
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [originalLabels, setOriginalLabels] = useState<number[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelsLoading, setLabelsLoading] = useState(false);

  // 날짜 포맷 함수 (datetime-local 형식)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // 컴포넌트 마운트 시 라벨 정보 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLabelsLoading(true);

        // 1. 모든 라벨 목록 불러오기
        const labelsResponse = await fetch(`${API_BASE}/api/labels`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (labelsResponse.ok) {
          const labelsResult = await labelsResponse.json();
          const labels = labelsResult.data?.labels || [];
          setAvailableLabels(labels);
        } else {
          console.warn('라벨 목록 불러오기 실패:', labelsResponse.status);
        }

        // 2. 해당 Todo의 현재 라벨 불러오기
        const todoLabelsResponse = await fetch(`${API_BASE}/api/todos/${todo.id}/labels`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (todoLabelsResponse.ok) {
          const todoLabelsResult = await todoLabelsResponse.json();
          const todoLabels = todoLabelsResult.data?.labels || [];
          const labelIds = todoLabels.map((label: Label) => label.id);
          setSelectedLabels(labelIds);
          setOriginalLabels(labelIds);
        } else {
          console.warn('Todo 라벨 정보 불러오기 실패:', todoLabelsResponse.status);
        }
      } catch (error) {
        console.error('라벨 정보 불러오기 실패:', error);
      } finally {
        setLabelsLoading(false);
      }
    };

    fetchData();
  }, [todo.id]);

  const handleLabelToggle = (labelId: number) => {
    setSelectedLabels(prev =>
        prev.includes(labelId)
            ? prev.filter(id => id !== labelId)
            : [...prev, labelId]
    );
  };

  const handleLabelModalSave = () => {
    setShowLabelModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedLabels);
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
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--border-light)'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✏️ 할일 수정
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* 제목 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              📝 제목 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
                type="text"
                value={editTodo.title}
                onChange={(e) => onFormChange('title', e.target.value)}
                placeholder="할 일의 제목을 입력하세요"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: formErrors.title ? '2px solid #dc2626' : '1px solid var(--border-light)',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  boxSizing: 'border-box'
                }}
            />
            {formErrors.title && (
                <p style={{ color: '#dc2626', fontSize: '1rem', marginTop: '0.5rem' }}>
                  {formErrors.title}
                </p>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem'
            }}>
              📄 설명
            </label>
            <textarea
                value={editTodo.description}
                onChange={(e) => onFormChange('description', e.target.value)}
                placeholder="할 일에 대한 자세한 설명을 입력하세요 (선택사항)"
                rows={5}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '120px'
                }}
            />
          </div>

          {/* 우선순위 */}
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
            <select
                value={editTodo.priority}
                onChange={(e) => onFormChange('priority', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
            >
              <option value={3}>높음</option>
              <option value={2}>중간</option>
              <option value={1}>낮음</option>
            </select>
          </div>

          {/* 알림 설정 - 새로 추가된 부분 */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '1rem',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              transition: 'all 0.2s ease'
            }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = '#f0f9ff';
                     e.currentTarget.style.borderColor = 'var(--primary-color)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'var(--bg-main)';
                     e.currentTarget.style.borderColor = 'var(--border-light)';
                   }}
            >
              <input
                  type="checkbox"
                  checked={editTodo.isNotificationEnabled || false}
                  onChange={(e) => onFormChange('isNotificationEnabled', e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: 'var(--primary-color)',
                    cursor: 'pointer'
                  }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔔 알림 받기
            </span>
            </label>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              marginTop: '0.5rem',
              paddingLeft: '1rem'
            }}>
              마감일이 다가오거나 중요한 업데이트가 있을 때 알림을 받습니다.
            </p>
          </div>

          {/* 시작일 & 마감일 */}
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
                🚀 시작일 <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                  type="datetime-local"
                  value={editTodo.startDate}
                  onChange={(e) => onFormChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: formErrors.startDate ? '2px solid #dc2626' : '1px solid var(--border-light)',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    boxSizing: 'border-box'
                  }}
              />
              {formErrors.startDate && (
                  <p style={{ color: '#dc2626', fontSize: '1rem', marginTop: '0.5rem' }}>
                    {formErrors.startDate}
                  </p>
              )}
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '0.75rem'
              }}>
                📅 마감일 <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                  type="datetime-local"
                  value={editTodo.dueDate}
                  onChange={(e) => onFormChange('dueDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: formErrors.dueDate ? '2px solid #dc2626' : '1px solid var(--border-light)',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    boxSizing: 'border-box'
                  }}
              />
              {formErrors.dueDate && (
                  <p style={{ color: '#dc2626', fontSize: '1rem', marginTop: '0.5rem' }}>
                    {formErrors.dueDate}
                  </p>
              )}
            </div>
          </div>

          {/* 라벨 선택 */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <label style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                🏷️ 라벨 ({selectedLabels.length}개 선택됨)
              </label>
              <button
                  type="button"
                  onClick={() => setShowLabelModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
              >
                라벨 수정
              </button>
            </div>
            {selectedLabels.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: 'var(--bg-main)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)'
                }}>
                  {selectedLabels.map(labelId => {
                    const label = availableLabels.find(l => l.id === labelId);
                    return label ? (
                        <span
                            key={labelId}
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '15px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              background: label.color || '#e2e8f0',
                              color: label.color ?
                                  (parseInt(label.color.slice(1), 16) > 0x888888 ? '#000' : '#fff')
                                  : '#334155'
                            }}
                        >
                    {label.name}
                  </span>
                    ) : null;
                  })}
                </div>
            )}
          </div>

          {/* 버튼들 */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: 'auto',
            paddingTop: '2rem'
          }}>
            <button
                type="button"
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'white',
                  color: 'var(--text-secondary)',
                  border: '2px solid var(--border-medium)',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
            >
              취소
            </button>
            <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
            >
              ✏️ 수정완료
            </button>
          </div>
        </form>

        {/* 라벨 선택 모달 */}
        {showLabelModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* 모달 헤더 */}
                <div style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                    🏷️ 라벨 수정
                  </h3>
                  <button
                      onClick={() => setShowLabelModal(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                      }}
                  >
                    ×
                  </button>
                </div>

                {/* 라벨 목록 */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.5rem'
                }}>
                  <div style={{
                    display: 'grid',
                    gap: '0.75rem'
                  }}>
                    {availableLabels.map(label => (
                        <label
                            key={label.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              border: '1px solid var(--border-light)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              background: selectedLabels.includes(label.id) ? '#f0f9ff' : 'white'
                            }}
                        >
                          <input
                              type="checkbox"
                              checked={selectedLabels.includes(label.id)}
                              onChange={() => handleLabelToggle(label.id)}
                              style={{
                                width: '18px',
                                height: '18px',
                                accentColor: 'var(--primary-color)'
                              }}
                          />
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '15px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            background: label.color || '#e2e8f0',
                            color: label.color ?
                                (parseInt(label.color.slice(1), 16) > 0x888888 ? '#000' : '#fff')
                                : '#334155'
                          }}>
                      {label.name}
                    </span>
                        </label>
                    ))}
                  </div>

                  {availableLabels.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        padding: '3rem 2rem'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
                        <p style={{ margin: 0 }}>사용 가능한 라벨이 없습니다.</p>
                      </div>
                  )}
                </div>

                {/* 모달 버튼 */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1.5rem',
                  borderTop: '1px solid var(--border-light)',
                  backgroundColor: '#f8fafc'
                }}>
                  <button
                      onClick={() => setShowLabelModal(false)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '8px',
                        background: 'white',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                  >
                    취소
                  </button>
                  <button
                      onClick={handleLabelModalSave}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                  >
                    적용 ({selectedLabels.length}개 선택)
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default TodoEditForm;