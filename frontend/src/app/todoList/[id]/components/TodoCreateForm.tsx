import React, { useState, useEffect } from 'react';

interface Label {
  id: number;
  name: string;
  color: string;
}

interface NewTodo {
  title: string;
  description: string;
  priority: number;
  startDate: string;
  dueDate: string;
}

interface TodoCreateFormProps {
  newTodo: NewTodo;
  formErrors: {[key: string]: string};
  onFormChange: (field: string, value: string | number) => void;
  onSubmit: (selectedLabels: number[]) => void; // 라벨 정보도 함께 전달
  onCancel: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

const TodoCreateForm: React.FC<TodoCreateFormProps> = ({
  newTodo,
  formErrors,
  onFormChange,
  onSubmit,
  onCancel
}) => {
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelsLoading, setLabelsLoading] = useState(false);

  // 라벨 목록 불러오기
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        setLabelsLoading(true);
        const response = await fetch(`${API_BASE}/api/labels`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const labels = result.data?.labels || [];
          setAvailableLabels(labels);
        } else {
          console.warn('라벨 목록 불러오기 실패:', response.status);
        }
      } catch (error) {
        console.error('라벨 목록 불러오기 실패:', error);
      } finally {
        setLabelsLoading(false);
      }
    };

    fetchLabels();
  }, []);

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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowLabelModal(false);
    }
  };

  const selectedLabelObjects = availableLabels.filter(label => 
    selectedLabels.includes(label.id)
  );

  // 선택된 라벨과 함께 onSubmit 호출
  const handleSubmitWithLabels = () => {
    onSubmit(selectedLabels);
  };

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
      {/* 폼 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid var(--border-light)'
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          ➕ 새 할 일 추가
        </h2>
        <button
          onClick={onCancel}
          style={{
            padding: '0.75rem',
            background: 'transparent',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.4rem'
          }}
        >
          ✕
        </button>
      </div>

      {/* 폼 내용 */}
      <div style={{ 
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
            value={newTodo.title}
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
            value={newTodo.description}
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
            value={newTodo.priority}
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
              value={newTodo.startDate}
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
              value={newTodo.dueDate}
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

        {/* 라벨 섹션 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem'
          }}>
            🏷️ 라벨
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
              borderRadius: '10px',
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
          
          {/* 라벨 추가 버튼 */}
          <button
            type="button"
            onClick={() => setShowLabelModal(true)}
            disabled={labelsLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem',
              border: '2px dashed var(--border-medium)',
              borderRadius: '10px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1rem',
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
                라벨 {selectedLabelObjects.length > 0 ? '수정' : '추가'}
                {selectedLabelObjects.length > 0 && (
                  <span style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {selectedLabelObjects.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* 제출 버튼들 */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-light)'
        }}>
          <button
            onClick={handleSubmitWithLabels}
            style={{
              flex: 1,
              padding: '1.25rem',
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
            ✅ 할 일 추가
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '1.25rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
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
                라벨 선택
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

export default TodoCreateForm;