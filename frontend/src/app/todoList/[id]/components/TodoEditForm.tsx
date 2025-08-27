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
}

interface EditTodo {
  title: string;
  description: string;
  priority: number;
  startDate: string;
  dueDate: string;
}

interface TodoEditFormProps {
  todo: Todo;
  editTodo: EditTodo;
  formErrors: {[key: string]: string};
  onFormChange: (field: string, value: string | number) => void;
  onSubmit: (selectedLabels: number[]) => void; // 라벨 정보도 함께 전달
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
  const [originalLabels, setOriginalLabels] = useState<number[]>([]); // 원본 라벨 상태 추가
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

        // 2. 현재 Todo에 연결된 라벨 목록 불러오기
        const todoLabelsResponse = await fetch(`${API_BASE}/api/todos/${todo.id}/labels`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (todoLabelsResponse.ok) {
          const todoLabelsResult = await todoLabelsResponse.json();
          // 🔥 수정: labels 배열에서 id만 추출
          const currentLabelIds = todoLabelsResult.data?.labels?.map(label => label.id) || [];
          setSelectedLabels(currentLabelIds);
          setOriginalLabels(currentLabelIds); // 원본 라벨 상태도 저장
        } else {
          console.warn('Todo 라벨 목록 불러오기 실패:', todoLabelsResponse.status);
        }

      } catch (error) {
        console.error('라벨 데이터 불러오기 실패:', error);
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

  // 라벨 변경사항이 있는지 확인하는 함수
  const hasLabelChanges = () => {
    if (selectedLabels.length !== originalLabels.length) return true;
    return !selectedLabels.every(id => originalLabels.includes(id));
  };

  // 라벨 변경사항을 서버에 저장하는 함수
  const saveLabelChanges = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/todos/${todo.id}/labels`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          todoId: todo.id, 
          labelIds: selectedLabels 
        }),
      });

      if (!response.ok) {
        console.error('라벨 업데이트 실패:', response.status);
        throw new Error('라벨 업데이트 실패');
      }

      const result = await response.json();
      console.log('라벨 업데이트 성공:', result);
      setOriginalLabels([...selectedLabels]); // 원본 상태 업데이트
      return true;
    } catch (error) {
      console.error('라벨 업데이트 중 오류:', error);
      throw error;
    }
  };

  const handleLabelModalSave = async () => {
    try {
      await saveLabelChanges();
      setShowLabelModal(false);
    } catch (error) {
      alert('라벨 변경에 실패했습니다.');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowLabelModal(false);
    }
  };

  const selectedLabelObjects = availableLabels.filter(label => 
    selectedLabels.includes(label.id)
  );

  const handleChange = (field: string, value: string | number) => {
    onFormChange(field, value);
  };

  // 선택된 라벨과 함께 onSubmit 호출 - 라벨 변경사항도 먼저 저장
  const handleSubmitWithLabels = async () => {
    try {
      // 라벨 변경사항이 있으면 먼저 저장
      if (hasLabelChanges()) {
        await saveLabelChanges();
      }
      
      // 그 다음 기존 onSubmit 호출
      onSubmit(selectedLabels);
    } catch (error) {
      alert('라벨 변경 중 오류가 발생했습니다.');
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
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 폼 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid var(--border-light)'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ✏️ 할 일 수정
        </h2>
        <button
          onClick={onCancel}
          style={{
            padding: '0.5rem',
            background: 'transparent',
            border: '1px solid var(--border-medium)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ✕
        </button>
      </div>

      {/* 폼 내용 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        flex: 1,
        overflowY: 'auto'
      }}>
        {/* ID 표시 (읽기 전용) */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}>
            🔢 할 일 ID
          </label>
          <div style={{
            padding: '0.75rem',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-light)',
            borderRadius: '8px',
            fontSize: '1rem',
            color: 'var(--text-secondary)'
          }}>
            #{todo.id}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}>
            📝 제목 <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            value={editTodo.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="할 일의 제목을 입력하세요"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: formErrors.title ? '2px solid #dc2626' : '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
          {formErrors.title && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {formErrors.title}
            </p>
          )}
        </div>

        {/* 설명 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}>
            📄 설명
          </label>
          <textarea
            value={editTodo.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="할 일에 대한 자세한 설명을 입력하세요 (선택사항)"
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: '100px'
            }}
          />
        </div>

        {/* 우선순위 */}
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
          <select
            value={editTodo.priority}
            onChange={(e) => handleChange('priority', parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              background: 'white'
            }}
          >
            <option value={3}>높음</option>
            <option value={2}>중간</option>
            <option value={1}>낮음</option>
          </select>
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
              🚀 시작일 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(editTodo.startDate)}
              onChange={(e) => handleChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: formErrors.startDate ? '2px solid #dc2626' : '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {formErrors.startDate && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {formErrors.startDate}
              </p>
            )}
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem'
            }}>
              📅 마감일 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(editTodo.dueDate)}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: formErrors.dueDate ? '2px solid #dc2626' : '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {formErrors.dueDate && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {formErrors.dueDate}
              </p>
            )}
          </div>
        </div>

        {/* 라벨 섹션 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}>
            🏷️ 라벨 {hasLabelChanges() && (
              <span style={{
                fontSize: '0.75rem',
                color: '#f59e0b',
                fontWeight: '500',
                marginLeft: '0.5rem'
              }}>
                (변경됨)
              </span>
            )}
          </label>
          
          {/* 선택된 라벨 표시 */}
          {selectedLabelObjects.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              {selectedLabelObjects.map(label => (
                <span
                  key={label.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: label.color,
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  {label.name}
                  <button
                    onClick={() => handleLabelToggle(label.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '0',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* 라벨 수정 버튼 */}
          <button
            type="button"
            onClick={() => setShowLabelModal(true)}
            disabled={labelsLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              border: '2px dashed var(--border-medium)',
              borderRadius: '8px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              width: '100%',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.color = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {labelsLoading ? '로딩 중...' : (
              <>
                <span>🏷️</span>
                라벨 수정
                {selectedLabelObjects.length > 0 && (
                  <span style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {selectedLabelObjects.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* 완료 상태 */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={todo.completed}
              readOnly
              style={{ 
                width: '20px', 
                height: '20px',
                accentColor: 'var(--primary-color)'
              }}
            />
            📊 완료 상태: {todo.completed ? '✅ 완료됨' : '⏳ 진행중'}
          </label>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginTop: '0.5rem',
            marginLeft: '2rem'
          }}>
            완료 상태는 할 일 목록에서 체크박스로 변경할 수 있습니다.
          </p>
        </div>

        {/* 생성일/수정일 정보 */}
        <div style={{ 
          background: 'var(--bg-main)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <div>
              <strong>📝 생성일:</strong><br />
              {todo.createdAt ? new Date(todo.createdAt).toLocaleString('ko-KR') : '알 수 없음'}
            </div>
            <div>
              <strong>🔄 최종 수정일:</strong><br />
              {todo.updatedAt ? new Date(todo.updatedAt).toLocaleString('ko-KR') : '알 수 없음'}
            </div>
          </div>
        </div>

        {/* 제출 버튼들 */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)'
        }}>
          <button
            onClick={handleSubmitWithLabels}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ✅ 수정 완료
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ❌ 취소
          </button>
        </div>
      </div>

      {/* 라벨 선택 모달 */}
      {showLabelModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={handleOverlayClick}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                라벨 수정
              </h3>
              <button
                onClick={() => setShowLabelModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
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
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
                marginTop: 0
              }}>
                원하는 라벨을 선택하세요 (복수 선택 가능)
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableLabels.map(label => (
                  <label
                    key={label.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      border: selectedLabels.includes(label.id) 
                        ? '2px solid var(--primary-color)' 
                        : '1px solid var(--border-light)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedLabels.includes(label.id)
                        ? 'rgba(59, 130, 246, 0.05)'
                        : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedLabels.includes(label.id)) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedLabels.includes(label.id)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
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
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: label.color,
                        border: '1px solid rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <span style={{
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      fontWeight: selectedLabels.includes(label.id) ? '500' : '400'
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