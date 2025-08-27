'use client';

import { useEffect, useState } from 'react';

// --- 인터페이스 정의 ---
interface Label {
  id: number;
  name: string;
  color: string;
}

interface LabelSelectorModalProps {
  todoId: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

const LabelSelectorModal = ({ todoId }: LabelSelectorModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. 모든 라벨 목록 불러오기 (쿠키 기반 인증)
        const allLabelsResponse = await fetch(`${API_BASE}/api/labels`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (allLabelsResponse.status === 401) {
          setError('인증이 필요합니다. 다시 로그인해주세요.');
          return;
        }

        if (!allLabelsResponse.ok) {
          const text = await allLabelsResponse.text();
          throw new Error(`모든 라벨 목록 불러오기 실패: ${allLabelsResponse.status} ${text}`);
        }

        const allLabelsData = await allLabelsResponse.json();
        const fetchedAllLabels = allLabelsData.data?.labels;
        if (Array.isArray(fetchedAllLabels)) {
          setAvailableLabels(fetchedAllLabels);
        } else {
          console.warn("API 응답에 'data.labels' 배열이 없습니다 (모든 라벨):", allLabelsData);
          setAvailableLabels([]);
        }

        // 2. 해당 Todo에 연결된 라벨 목록 불러오기
        const todoLabelsResponse = await fetch(`${API_BASE}/api/todos/${todoId}/labels`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (todoLabelsResponse.status === 401) {
          setError('인증이 필요합니다. 다시 로그인해주세요.');
          return;
        }

        if (!todoLabelsResponse.ok) {
          const text = await todoLabelsResponse.text();
          throw new Error(`Todo에 연결된 라벨 불러오기 실패: ${todoLabelsResponse.status} ${text}`);
        }

        const todoLabelsData = await todoLabelsResponse.json();
        
        // 🔥 수정: labels 배열에서 id만 추출하도록 변경
        const fetchedTodoLabels = todoLabelsData.data?.labels;
        if (Array.isArray(fetchedTodoLabels)) {
          const labelIds = fetchedTodoLabels.map(label => label.id);
          setSelectedLabels(labelIds);
        } else {
          console.warn(
            `API 응답에 'data.labels' 배열이 없습니다 (todoId: ${todoId}):`,
            todoLabelsData
          );
          setSelectedLabels([]);
        }
      } catch (err: any) {
        console.error('라벨 데이터 불러오기 실패:', err);
        setError(err.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabels();
  }, [todoId]);

  if (isLoading) {
    return <p className="text-center py-8">라벨 목록을 불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="text-center py-8 text-red-600">오류 발생: {error}</p>;
  }

  const handleLabelToggle = (labelId: number) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/todos/${todoId}/labels`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ todoId: todoId, labelIds: selectedLabels }),
      });

      if (response.status === 401) {
        alert('인증이 필요합니다. 다시 로그인해주세요.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`라벨 업데이트 실패: ${errorData.msg || response.statusText}`);
      }

      const responseData = await response.json();
      console.log('라벨이 성공적으로 업데이트되었습니다:', responseData);
      
      // 🔥 수정: 응답 데이터에서 labels 배열 확인
      if (responseData.data?.labels) {
        console.log('연결된 라벨들:', responseData.data.labels);
      }
      
      alert('라벨이 성공적으로 업데이트되었습니다!');
    } catch (err: any) {
      console.error('라벨 업데이트 중 오류 발생:', err);
      alert(`라벨 업데이트 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const currentSelectedLabels = availableLabels.filter((label) =>
    selectedLabels.includes(label.id)
  );
  const currentUnselectedLabels = availableLabels.filter(
    (label) => !selectedLabels.includes(label.id)
  );

  return (
    <div className="p-8 max-w-md mx-auto">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <span className="text-sm">🏷️</span>
        라벨 선택
        {selectedLabels.length > 0 && (
          <span className="bg-blue-700 text-white text-xs px-2 py-1 rounded-full">
            {selectedLabels.length}
          </span>
        )}
      </button>

      {selectedLabels.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">현재 Todo에 연결된 라벨:</p>
          <div className="flex flex-wrap gap-2">
            {currentSelectedLabels.map((label) => (
              <span
                key={`display-${label.id}`}
                className="px-2 py-1 text-white text-xs rounded-full flex items-center gap-1"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
                <button
                  onClick={() => handleLabelToggle(label.id)}
                  className="ml-1 text-white hover:text-gray-200 text-sm"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">라벨 선택</h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                원하는 라벨을 선택하세요 (복수 선택 가능)
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentSelectedLabels.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 font-semibold mb-1">선택된 라벨</p>
                    {currentSelectedLabels.map((label) => (
                      <label
                        key={`modal-selected-${label.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleLabelToggle(label.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          ></div>
                          <span className="text-sm text-gray-900">{label.name}</span>
                        </div>
                      </label>
                    ))}
                  </>
                )}

                {currentSelectedLabels.length > 0 && currentUnselectedLabels.length > 0 && (
                  <hr className="my-4 border-t border-gray-300" />
                )}

                {currentUnselectedLabels.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 font-semibold mb-1">모든 라벨</p>
                    {currentUnselectedLabels.map((label) => (
                      <label
                        key={`modal-unselected-${label.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleLabelToggle(label.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          ></div>
                          <span className="text-sm text-gray-900">{label.name}</span>
                        </div>
                      </label>
                    ))}
                  </>
                )}

                {currentSelectedLabels.length === 0 && currentUnselectedLabels.length === 0 && (
                  <p className="text-center text-gray-500">불러올 라벨이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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

export default LabelSelectorModal;