"use client";
import React, { useState, useEffect } from 'react';
import TodoListTemplate from "../_components/TodoList/TodoListTemplate";

// API 응답 타입 정의 (실제 응답 구조에 맞게 수정)
interface TodoResponseDto {
  id: number;
  title: string;
  description: string;
  completed: boolean; // 실제 API에서는 completed로 옴
  isCompleted?: boolean; // 혹시 백엔드에서 이것도 보내줄 경우 대비
  priority: number; // 1: 높음, 2: 보통, 3: 낮음
  startDate: string; // ISO 날짜 문자열
  dueDate: string | null; // ISO 날짜 문자열 또는 null
  todoList: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoListResponseDto {
  id: number;
  name: string;
  description: string;
  userId: number;
  teamId: number;
  createDate: string;
  modifyDate: string;
}

// 내부 사용 타입
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  todoListId: number;
  todoListName: string;
  startDate: Date;
  dueDate: Date | null; // null 허용
}

interface TodoList {
  id: number;
  name: string;
  todos: Todo[];
}

// API 응답 타입
interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T;
}

const CalendarPage: React.FC = () => {
  // 오늘 날짜를 정확하게 설정하는 함수
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const [currentDate, setCurrentDate] = useState(() => getTodayDate());
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate());
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // 사용자 정보 가져오기 (쿠키 기반 인증)
  const fetchUserInfo = async (): Promise<{ userId: number } | null> => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/me', {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }
      
      const result = await response.json();
      
      // API 응답 구조에 따라 userId 추출
      const userId = result.data?.id || result.data?.userId || result.id || result.userId;
      
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다');
      }
      
      return { userId };
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }
  };

  // 우선순위를 문자열로 변환
  const getPriorityString = (priority: number): 'high' | 'medium' | 'low' => {
    switch (priority) {
      case 1: return 'low';
      case 2: return 'medium';
      case 3: return 'high';
      default: return 'medium';
    }
  };

  // 우선순위별 색상 반환
  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high': return '#dc2626'; // 빨간색
      case 'medium': return '#f59e0b'; // 연한 주황색
      case 'low': return '#16a34a'; // 밝은 초록색
      default: return '#6b7280';
    }
  };

  // 우선순위를 숫자로 변환 (정렬용)
  const getPriorityNumber = (priority: 'high' | 'medium' | 'low'): number => {
    switch (priority) {
      case 'high': return 1;
      case 'medium': return 2;
      case 'low': return 3;
      default: return 2;
    }
  };

  // API 호출 함수들
  const fetchTodoLists = async (userId: number): Promise<TodoListResponseDto[]> => {
    try {
      const response = await fetch(`http://localhost:8080/api/todo-lists/user/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`TodoList 조회 실패: ${response.status}`);
      }
      
      const result: ApiResponse<TodoListResponseDto[]> = await response.json();
      console.log('✅ TodoList API 성공:', result);
      return result.data;
    } catch (error) {
      console.error('❌ TodoList 조회 오류:', error);
      throw error;
    }
  };

  const fetchTodos = async (userId: number): Promise<TodoResponseDto[]> => {
    try {
      const response = await fetch(`http://localhost:8080/api/todo/user/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Todo 조회 실패: ${response.status}`);
      }
      
      const result: ApiResponse<TodoResponseDto[]> = await response.json();
      console.log('✅ Todo API 성공:', result);
      return result.data;
    } catch (error) {
      console.error('❌ Todo 조회 오류:', error);
      throw error;
    }
  };

  // 초기 사용자 정보 확인
  useEffect(() => {
    const initializeUser = async () => {
      const userInfo = await fetchUserInfo();
      if (!userInfo) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      
      console.log('사용자 정보:', userInfo);
      setUserId(userInfo.userId);
    };

    initializeUser();
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('=== API 응답 디버깅 ===');
        console.log('현재 userId:', userId);

        // TodoList와 Todo 데이터를 병렬로 조회
        const [todoListsData, todosData] = await Promise.allSettled([
          fetchTodoLists(userId),
          fetchTodos(userId)
        ]);

        // TodoList 데이터 처리
        let todoListsMap = new Map<number, TodoListResponseDto>();
        if (todoListsData.status === 'fulfilled') {
          console.log('TodoLists 응답:', todoListsData.value);
          todoListsData.value.forEach(todoList => {
            todoListsMap.set(todoList.id, todoList);
          });
        } else {
          console.error('TodoList 조회 실패:', todoListsData.reason);
        }

        // Todo 데이터 처리
        if (todosData.status === 'fulfilled') {
          console.log('Todos 응답:', todosData.value);

          // Todo 데이터 변환 - 필드명 매핑과 필수 변환만 수행
          const transformedTodos: Todo[] = todosData.value.map(todo => {
            const todoListInfo = todoListsMap.get(todo.todoList);
            const todoListName = todoListInfo ? todoListInfo.name : `TodoList ${todo.todoList}`;
            
            // 실제 API 응답에서 completed 필드 확인
            const completedValue = todo.completed !== undefined ? todo.completed : 
                                 todo.isCompleted !== undefined ? todo.isCompleted : false;
            
            console.log(`Todo ${todo.id}: completed=${todo.completed}, isCompleted=${todo.isCompleted}, final=${completedValue}`);
            
            return {
              id: todo.id,
              title: todo.title,
              completed: completedValue,
              priority: getPriorityString(todo.priority),
              todoListId: todo.todoList,
              todoListName: todoListName,
              startDate: new Date(todo.startDate),
              dueDate: todo.dueDate ? new Date(todo.dueDate) : null // null 체크 추가
            };
          });

          console.log('변환된 Todos:', transformedTodos);
          setAllTodos(transformedTodos);

          // TodoList별로 그룹화
          const todoListsWithTodos: TodoList[] = [];
          
          // TodoList가 있는 경우
          if (todoListsMap.size > 0) {
            todoListsMap.forEach((todoListInfo, todoListId) => {
              const todosForThisList = transformedTodos.filter(todo => todo.todoListId === todoListId);
              
              todoListsWithTodos.push({
                id: todoListId,
                name: todoListInfo.name,
                todos: todosForThisList
              });
            });
          }

          // TodoList가 없거나 매핑되지 않은 Todo가 있는 경우 처리
          const unmappedTodos = transformedTodos.filter(todo => !todoListsMap.has(todo.todoListId));
          if (unmappedTodos.length > 0) {
            const unmappedTodoListIds = new Set(unmappedTodos.map(todo => todo.todoListId));
            unmappedTodoListIds.forEach(todoListId => {
              const todosForThisList = unmappedTodos.filter(todo => todo.todoListId === todoListId);
              if (todosForThisList.length > 0) {
                todoListsWithTodos.push({
                  id: todoListId,
                  name: `TodoList ${todoListId}`,
                  todos: todosForThisList
                });
              }
            });
          }

          console.log('최종 TodoLists:', todoListsWithTodos);
          setTodoLists(todoListsWithTodos);
        } else {
          console.error('Todo 조회 실패:', todosData.reason);
          setAllTodos([]);
          setTodoLists([]);
        }

      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setAllTodos([]);
        setTodoLists([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return formatDate(date1) === formatDate(date2);
  };

  const isToday = (date: Date) => {
    const today = getTodayDate();
    return isSameDay(date, today);
  };

  // 특정 날짜의 할일 가져오기 (시작일부터 마감일까지의 기간 포함)
  const getTodosForDate = (date: Date) => {
    const targetDateStr = formatDate(date);
    const targetDate = new Date(date);
    
    return todoLists.map(list => ({
      ...list,
      todos: list.todos
        .filter(todo => {
          const startDate = new Date(todo.startDate);
          startDate.setHours(0, 0, 0, 0);
          
          // dueDate가 있는 경우: 시작일부터 마감일까지의 기간에 포함되는지 확인
          if (todo.dueDate) {
            const dueDate = new Date(todo.dueDate);
            dueDate.setHours(23, 59, 59, 999); // 마감일 끝까지 포함
            
            return targetDate >= startDate && targetDate <= dueDate;
          } else {
            // dueDate가 없는 경우: 시작일에만 표시
            return formatDate(startDate) === targetDateStr;
          }
        })
        .sort((a, b) => {
          // 우선순위 순으로 정렬 (높은 우선순위가 먼저)
          const priorityDiff = getPriorityNumber(a.priority) - getPriorityNumber(b.priority);
          if (priorityDiff !== 0) return priorityDiff;
          
          // 우선순위가 같으면 완료되지 않은 것이 먼저
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          
          // 그 외에는 제목 알파벳 순
          return a.title.localeCompare(b.title);
        })
    })).filter(list => list.todos.length > 0);
  };

  // 특정 날짜의 우선순위별 할일 개수 및 색상 정보 가져오기
  const getTodoColorsForDate = (date: Date) => {
    const todosForDate = getTodosForDate(date);
    const priorityColors: { color: string; count: number }[] = [];
    
    // 우선순위별로 그룹화
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    
    todosForDate.forEach(list => {
      list.todos.forEach(todo => {
        priorityCounts[todo.priority]++;
      });
    });

    // 우선순위 높은 순서대로 색상 정보 생성
    if (priorityCounts.high > 0) {
      priorityColors.push({ color: getPriorityColor('high'), count: priorityCounts.high });
    }
    if (priorityCounts.medium > 0) {
      priorityColors.push({ color: getPriorityColor('medium'), count: priorityCounts.medium });
    }
    if (priorityCounts.low > 0) {
      priorityColors.push({ color: getPriorityColor('low'), count: priorityCounts.low });
    }

    return priorityColors;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  // 월 이동
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    newDate.setHours(0, 0, 0, 0);
    setCurrentDate(newDate);
  };

  // 할일 완료 토글
  const toggleTodoComplete = async (todoId: number) => {
    if (!userId) return;

    // 이전 상태 백업 (롤백용)
    const previousTodos = [...allTodos];
    const previousTodoLists = [...todoLists];

    try {
      const apiPath = `http://localhost:8080/api/todo/${todoId}/complete`;
      
      console.log(`🔄 Trying todo complete API: PATCH ${apiPath}`);
      
      const response = await fetch(apiPath, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Todo complete SUCCESS:`, result);
        
        if (result.data) {
          const updatedTodo = result.data;
          const newCompletedState = updatedTodo.completed;
          
          console.log(`🎯 Updating todo ${todoId} to completed: ${newCompletedState}`);
          
          setAllTodos(prev => 
            prev.map(todo => 
              todo.id === todoId ? { 
                ...todo, 
                completed: newCompletedState
              } : todo
            )
          );
          
          setTodoLists(prev => 
            prev.map(list => ({
              ...list,
              todos: list.todos.map(todo => 
                todo.id === todoId ? { 
                  ...todo, 
                  completed: newCompletedState
                } : todo
              )
            }))
          );
        }
      } else {
        console.log(`❌ Todo complete failed: Status ${response.status}`);
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Todo 상태 변경 실패:', error);
      
      // API 실패 시만 이전 상태로 롤백
      setAllTodos(previousTodos);
      setTodoLists(previousTodoLists);
      
      console.warn('⚠️ 할일 상태를 서버에 저장하지 못했습니다. 새로고침 후 다시 시도해주세요.');
    }
  };

  // 로그인 페이지로 리다이렉트
  const handleLoginRedirect = () => {
    window.location.href = 'http://localhost:3000/login';
  };

  // 달력 렌더링
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // 빈 날짜들 (이전 달)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // 실제 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      
      const todoColors = getTodoColorsForDate(date);
      const totalTodos = todoColors.reduce((sum, item) => sum + item.count, 0);
      const isSelected = isSameDay(date, selectedDate);
      const todayClass = isToday(date) ? 'today' : '';
      const selectedClass = isSelected ? 'selected' : '';

      // 우선순위별 색상 인디케이터 생성 (최대 3개까지 표시)
      const colorIndicators = [];
      let remainingCount = 0;
      
      todoColors.forEach((item, index) => {
        for (let i = 0; i < item.count; i++) {
          if (colorIndicators.length < 3) {
            colorIndicators.push(
              <div 
                key={`${index}-${i}`} 
                className="todo-indicator" 
                style={{ backgroundColor: item.color }}
              />
            );
          } else {
            remainingCount++;
          }
        }
      });

      days.push(
        <div
          key={day}
          className={`calendar-day ${todayClass} ${selectedClass}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="day-number">{day}</div>
          {totalTodos > 0 && (
            <div className="todo-indicators">
              {colorIndicators}
              {remainingCount > 0 && (
                <div className="todo-more">+{remainingCount}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedDateTodos = getTodosForDate(selectedDate);

  // 로딩 상태
  if (loading) {
    return (
      <TodoListTemplate contentClassName="calendar-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </TodoListTemplate>
    );
  }

  // 로그인 필요 상태
  if (!userId) {
    return (
      <TodoListTemplate contentClassName="calendar-content">
        <div className="error-container">
          <p className="error-message">로그인이 필요한 서비스입니다.</p>
          <button className="retry-button" onClick={handleLoginRedirect}>
            로그인하러 가기
          </button>
        </div>
      </TodoListTemplate>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <TodoListTemplate contentClassName="calendar-content">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </TodoListTemplate>
    );
  }

  return (
    <TodoListTemplate contentClassName="calendar-content">
      <div className="calendar-wrapper">
        <div className="calendar-container">
          {/* 캘린더 섹션 */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button 
                className="nav-button" 
                onClick={() => navigateMonth('prev')}
              >
                ←
              </button>
              <h2 className="calendar-title">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>
              <button 
                className="nav-button" 
                onClick={() => navigateMonth('next')}
              >
                →
              </button>
            </div>
            
            <div className="calendar-grid">
              <div className="weekdays">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              <div className="calendar-days">
                {renderCalendar()}
              </div>
            </div>
          </div>

          {/* 할일 목록 섹션 */}
          <div className="todos-section">
            <div className="todos-header">
              <h3 className="todos-title">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일의 할일
              </h3>
              <div className="todos-date">
                {selectedDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
            </div>

            <div className="todo-lists">
              {selectedDateTodos.length === 0 ? (
                <div className="no-todos">
                  <div className="no-todos-icon">📝</div>
                  <div className="no-todos-title">등록된 할일이 없습니다</div>
                  <div className="no-todos-description">
                    {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일에 예정된 할일이 없습니다.
                  </div>
                </div>
              ) : (
                selectedDateTodos.map(todoList => (
                  <div key={todoList.id} className="todo-list-group">
                    <div className="todo-list-header">
                      <h4 className="todo-list-name">{todoList.name}</h4>
                      <span className="todo-count">
                        {todoList.todos.filter(t => !t.completed).length} / {todoList.todos.length}
                      </span>
                    </div>
                    
                    <div className="todos">
                      {todoList.todos.map(todo => (
                        <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                          <label className="todo-checkbox">
                            <input
                              type="checkbox"
                              checked={todo.completed || false}
                              onChange={() => toggleTodoComplete(todo.id)}
                            />
                            <span className="checkmark"></span>
                          </label>
                          <div className="todo-content">
                            <div className="todo-title">{todo.title}</div>
                            <div className={`todo-priority priority-${todo.priority}`}>
                              {todo.priority === 'high' ? '높음' : 
                               todo.priority === 'medium' ? '보통' : '낮음'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .calendar-content {
          padding: 0 !important;
          height: 100% !important;
          overflow: hidden !important;
          width: 100% !important;
        }
        
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          color: #dc2626;
          font-size: 1.1rem;
          text-align: center;
        }
        
        .retry-button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }
        
        .retry-button:hover {
          background: #4338ca;
        }
        
        .calendar-wrapper {
          width: 100%;
          height: 100%;
          padding: 1rem;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .calendar-container {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          height: 100%;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }

        .calendar-section {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f8fafc;
        }

        .nav-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.4rem;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .nav-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .calendar-title {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
        }

        .calendar-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 720px;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(100px, 1fr));
          gap: 8px;
          margin-bottom: 1rem;
        }

        .weekday {
          text-align: center;
          padding: 0.75rem 0;
          font-weight: 700;
          color: #475569;
          font-size: 0.95rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, minmax(100px, 1fr));
          grid-auto-rows: minmax(110px, 1fr);
          gap: 8px;
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }

        .calendar-day {
          background: white;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          border-radius: 10px;
          border: 2px solid transparent;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          min-height: 120px;
        }

        .calendar-day:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: #e0e7ff;
        }

        .calendar-day.today {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-color: #3b82f6;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #4f46e5;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          transform: translateY(-3px);
        }

        .calendar-day.selected .day-number {
          color: white;
          font-weight: 700;
        }

        .calendar-day.empty {
          cursor: default;
          background: #f8fafc;
          opacity: 0.3;
          box-shadow: none;
        }

        .day-number {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .todo-indicators {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: auto;
        }

        .todo-indicator {
          height: 4px;
          border-radius: 2px;
          opacity: 0.8;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .todo-more {
          font-size: 0.75rem;
          color: #64748b;
          text-align: center;
          margin-top: 4px;
          font-weight: 600;
          background: rgba(100, 116, 139, 0.1);
          padding: 2px 6px;
          border-radius: 8px;
        }

        .todos-section {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .todos-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f8fafc;
        }

        .todos-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .todos-date {
          color: #64748b;
          font-size: 0.9rem;
        }

        .todo-lists {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }

        .no-todos {
          text-align: center;
          color: #64748b;
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .no-todos-icon {
          font-size: 3rem;
          opacity: 0.5;
        }

        .no-todos-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #475569;
        }

        .no-todos-description {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.5;
        }

        .todo-list-group {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .todo-list-group:last-child {
          margin-bottom: 0;
        }

        .todo-list-group:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .todo-list-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .todo-list-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          flex: 1;
          margin: 0;
        }

        .todo-count {
          font-size: 0.85rem;
          color: #64748b;
          background: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .todos {
          padding: 0.5rem;
        }

        .todo-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .todo-item:hover {
          background: #f8fafc;
        }

        .todo-item.completed {
          opacity: 0.6;
        }

        .todo-item.completed .todo-title {
          text-decoration: line-through;
        }

        .todo-checkbox {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .todo-checkbox input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkmark {
          height: 20px;
          width: 20px;
          background-color: white;
          border: 2px solid #cbd5e1;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .todo-checkbox:hover .checkmark {
          border-color: #4f46e5;
        }

        .todo-checkbox input:checked ~ .checkmark {
          background-color: #4f46e5;
          border-color: #4f46e5;
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }

        .todo-checkbox input:checked ~ .checkmark:after {
          display: block;
        }

        .todo-checkbox .checkmark:after {
          left: 6px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .todo-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }

        .todo-title {
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 500;
          word-break: break-word;
          flex: 1;
        }

        .todo-priority {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-weight: 500;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .priority-high {
          background: #fef2f2;
          color: #dc2626;
        }

        .priority-medium {
          background: #fffbeb;
          color: #f59e0b;
        }

        .priority-low {
          background: #f0fdf4;
          color: #16a34a;
        }

        @media (max-width: 1400px) {
          .calendar-container {
            grid-template-columns: 1fr 300px;
          }
        }
        
        @media (max-width: 1200px) {
          .calendar-container {
            grid-template-columns: 1fr 280px;
          }
        }

        @media (max-width: 1024px) {
          .calendar-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
            gap: 1rem;
          }
          
          .todos-section {
            max-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .calendar-wrapper {
            padding: 0.5rem;
          }
          
          .calendar-section,
          .todos-section {
            padding: 1rem;
          }
          
          .calendar-day {
            min-height: 80px;
            font-size: 0.85rem;
          }
          
          .day-number {
            font-size: 0.9rem;
          }
          
          .nav-button {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
          
          .calendar-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </TodoListTemplate>
  );
};

export default CalendarPage;