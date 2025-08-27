'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Users,
  User,
  Clock,
  Target,
} from 'lucide-react';
import TodoListTemplate from "../_components/TodoList/TodoListTemplate";

// API 응답 타입 정의 (캘린더 페이지와 동일)
interface TodoResponseDto {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  isCompleted?: boolean;
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

// 내부 사용 타입 (캘린더 페이지와 동일)
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  todoListId: number;
  todoListName: string;
  startDate: Date;
  dueDate: Date | null;
}

interface TodoList {
  id: number;
  name: string;
  todos: Todo[];
  teamId?: number;
}

// API 응답 타입
interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T;
}

export default function MainPage() {
  // 오늘 날짜를 정확하게 설정하는 함수 (캘린더 페이지와 동일)
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

  // 사용자 정보 가져오기 (캘린더 페이지와 동일)
  const fetchUserInfo = async (): Promise<{ userId: number } | null> => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }
      
      const result = await response.json();
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

  // 우선순위 관련 함수들 (캘린더 페이지와 동일)
  const getPriorityString = (priority: number): 'high' | 'medium' | 'low' => {
    switch (priority) {
      case 1: return 'low';
      case 2: return 'medium';
      case 3: return 'high';
      default: return 'medium';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high': return '#dc2626'; // 빨간색
      case 'medium': return '#f59e0b'; // 연한 주황색
      case 'low': return '#16a34a'; // 밝은 초록색
      default: return '#6b7280';
    }
  };

  const getPriorityNumber = (priority: 'high' | 'medium' | 'low'): number => {
    switch (priority) {
      case 'high': return 1;
      case 'medium': return 2;
      case 'low': return 3;
      default: return 2;
    }
  };

  // API 호출 함수들 (캘린더 페이지와 동일)
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

  // 초기 사용자 정보 확인 (캘린더 페이지와 동일)
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

  // 데이터 로드 (캘린더 페이지와 동일)
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('=== API 응답 디버깅 ===');
        console.log('현재 userId:', userId);

        const [todoListsData, todosData] = await Promise.allSettled([
          fetchTodoLists(userId),
          fetchTodos(userId)
        ]);

        let todoListsMap = new Map<number, TodoListResponseDto>();
        if (todoListsData.status === 'fulfilled') {
          console.log('TodoLists 응답:', todoListsData.value);
          todoListsData.value.forEach(todoList => {
            todoListsMap.set(todoList.id, todoList);
          });
        } else {
          console.error('TodoList 조회 실패:', todoListsData.reason);
        }

        if (todosData.status === 'fulfilled') {
          console.log('Todos 응답:', todosData.value);

          const transformedTodos: Todo[] = todosData.value.map(todo => {
            const todoListInfo = todoListsMap.get(todo.todoList);
            const todoListName = todoListInfo ? todoListInfo.name : `TodoList ${todo.todoList}`;
            
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
              dueDate: todo.dueDate ? new Date(todo.dueDate) : null
            };
          });

          console.log('변환된 Todos:', transformedTodos);
          setAllTodos(transformedTodos);

          const todoListsWithTodos: TodoList[] = [];
          
          if (todoListsMap.size > 0) {
            todoListsMap.forEach((todoListInfo, todoListId) => {
              const todosForThisList = transformedTodos.filter(todo => todo.todoListId === todoListId);
              
              todoListsWithTodos.push({
                id: todoListId,
                name: todoListInfo.name,
                teamId: todoListInfo.teamId,
                todos: todosForThisList
              });
            });
          }

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

  // 달력 관련 함수들 (캘린더 페이지와 동일)
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
          const priorityDiff = getPriorityNumber(a.priority) - getPriorityNumber(b.priority);
          if (priorityDiff !== 0) return priorityDiff;
          
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          
          return a.title.localeCompare(b.title);
        })
    })).filter(list => list.todos.length > 0);
  };

  // 특정 날짜의 우선순위별 할일 개수 및 색상 정보 가져오기 (캘린더 페이지와 동일)
  const getTodoColorsForDate = (date: Date) => {
    const todosForDate = getTodosForDate(date);
    const priorityColors: { color: string; count: number }[] = [];
    
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    
    todosForDate.forEach(list => {
      list.todos.forEach(todo => {
        priorityCounts[todo.priority]++;
      });
    });

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

  // 날짜 클릭 핸들러 (캘린더 페이지와 동일)
  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  // 월 이동 (캘린더 페이지와 동일)
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

  // 할일 완료 토글 (캘린더 페이지와 동일)
  const toggleTodoComplete = async (todoId: number) => {
    if (!userId) return;

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
      
      setAllTodos(previousTodos);
      setTodoLists(previousTodoLists);
      
      console.warn('⚠️ 할일 상태를 서버에 저장하지 못했습니다. 새로고침 후 다시 시도해주세요.');
    }
  };

  // 로그인 페이지로 리다이렉트
  const handleLoginRedirect = () => {
    window.location.href = 'http://localhost:3000/login';
  };

  // 달력 렌더링 (캘린더 페이지와 동일한 로직)
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

  // 팀과 개인 할일 분리 함수
  const getTeamAndPersonalTodos = (date: Date) => {
    const todosForDate = getTodosForDate(date);
    const teamTodos: Todo[] = [];
    const personalTodos: Todo[] = [];

    todosForDate.forEach(list => {
      list.todos.forEach(todo => {
        // teamId가 1보다 큰 경우 팀 할일로 분류, 1이거나 null인 경우 개인 할일로 분류
        if (list.teamId && list.teamId > 1) {
          teamTodos.push({ ...todo, todoListName: list.name });
        } else {
          personalTodos.push({ ...todo, todoListName: list.name });
        }
      });
    });

    return { teamTodos, personalTodos };
  };

  const selectedDateTodos = getTeamAndPersonalTodos(selectedDate);

  // 로딩 상태
  if (loading) {
    return (
      <TodoListTemplate>
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
      <TodoListTemplate>
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
      <TodoListTemplate>
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
    <TodoListTemplate>
      <div className="main-page-wrapper">
        <div className="main-header">
          <div className="header-content">
            <div className="header-icon">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="header-title">할일 관리</h1>
              <p className="header-subtitle">효율적인 하루를 위한 스마트 플래너</p>
            </div>
          </div>
        </div>

        <div className="main-content">
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

          <div className="todos-sections">
            <div className="team-todos-section">
              <div className="section-header">
                <h3 className="section-title">
                  <div className="section-icon team">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  팀 할일
                </h3>
                <div className="section-date">
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                </div>
                <div className="section-count team">
                  {selectedDateTodos.teamTodos.filter(t => !t.completed).length} / {selectedDateTodos.teamTodos.length}
                </div>
              </div>

              <div className="todos-list">
                {selectedDateTodos.teamTodos.length === 0 ? (
                  <div className="no-todos">
                    <div className="no-todos-icon">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="no-todos-text">팀 할일이 없습니다</p>
                  </div>
                ) : (
                  selectedDateTodos.teamTodos.map(todo => (
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
                        <div className="todo-meta">
                          <div className={`todo-priority priority-${todo.priority}`}>
                            {todo.priority === 'high' ? '높음' : 
                             todo.priority === 'medium' ? '보통' : '낮음'}
                          </div>
                          <div className="todo-list-name">{todo.todoListName}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="personal-todos-section">
              <div className="section-header">
                <h3 className="section-title">
                  <div className="section-icon personal">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  개인 할일
                </h3>
                <div className="section-date">
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                </div>
                <div className="section-count personal">
                  {selectedDateTodos.personalTodos.filter(t => !t.completed).length} / {selectedDateTodos.personalTodos.length}
                </div>
              </div>

              <div className="todos-list">
                {selectedDateTodos.personalTodos.length === 0 ? (
                  <div className="no-todos">
                    <div className="no-todos-icon">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="no-todos-text">개인 할일이 없습니다</p>
                  </div>
                ) : (
                  selectedDateTodos.personalTodos.map(todo => (
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
                        <div className="todo-meta">
                          <div className={`todo-priority priority-${todo.priority}`}>
                            {todo.priority === 'high' ? '높음' : 
                             todo.priority === 'medium' ? '보통' : '낮음'}
                          </div>
                          <div className="todo-list-name">{todo.todoListName}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
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
        
        .welcome-message {
          background: white;
        }
        
        .main-page-wrapper {
          width: 100%;
          height: 100vh;
          background: white;
          padding: 1.5rem;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .main-header {
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .header-content {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
        }
        
        .header-icon {
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        
        .header-subtitle {
          color: #64748b;
          margin: 0.25rem 0 0 0;
          font-size: 0.9rem;
        }
        
        .main-content {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 1.5rem;
          height: calc(100vh - 140px);
          max-height: calc(100vh - 140px);
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
          overflow: hidden;
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
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
          margin: 0;
        }

        .calendar-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 1rem;
        }

        .weekday {
          text-align: center;
          padding: 0.75rem 0;
          font-weight: 700;
          color: #475569;
          font-size: 0.9rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: minmax(100px, 1fr);
          gap: 8px;
          flex: 1;
          overflow-y: auto;
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
          min-height: 100px;
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
          font-size: 1rem;
        }

        .todo-indicators {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: auto;
        }

        .todo-indicator {
          height: 3px;
          border-radius: 2px;
          opacity: 0.8;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .todo-more {
          font-size: 0.7rem;
          color: #64748b;
          text-align: center;
          margin-top: 2px;
          font-weight: 600;
          background: rgba(100, 116, 139, 0.1);
          padding: 1px 4px;
          border-radius: 6px;
        }
        
        .todos-sections {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
          overflow: hidden;
        }
        
        .team-todos-section,
        .personal-todos-section {
          background: white;
          border-radius: 16px;
          padding: 1.2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #f8fafc;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .section-icon {
          padding: 0.4rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .section-icon.team {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .section-icon.personal {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        
        .section-date {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }
        
        .section-count {
          font-size: 0.8rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .section-count.team {
          background: #ecfdf5;
          color: #059669;
        }
        
        .section-count.personal {
          background: #f3e8ff;
          color: #7c3aed;
        }
        
        .todos-list {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }
        
        .no-todos {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          text-align: center;
          height: 100%;
        }
        
        .no-todos-icon {
          margin-bottom: 0.75rem;
          opacity: 0.5;
        }
        
        .no-todos-text {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }
        
        .todo-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          transition: all 0.2s;
          border: 1px solid transparent;
          margin-bottom: 0.5rem;
        }

        .todo-item:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
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
          margin-top: 2px;
        }

        .todo-checkbox input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkmark {
          height: 18px;
          width: 18px;
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
          left: 5px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .todo-content {
          flex: 1;
          min-width: 0;
        }

        .todo-title {
          font-size: 0.9rem;
          color: #1e293b;
          font-weight: 500;
          word-break: break-word;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        
        .todo-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .todo-priority {
          font-size: 0.75rem;
          padding: 0.15rem 0.4rem;
          border-radius: 10px;
          font-weight: 500;
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
        
        .todo-list-name {
          font-size: 0.7rem;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.15rem 0.4rem;
          border-radius: 8px;
          white-space: nowrap;
        }

        @media (max-width: 1400px) {
          .main-content {
            grid-template-columns: 5fr 2fr;
          }
        }
        
        @media (max-width: 1200px) {
          .main-content {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
            gap: 1rem;
          }
          
          .todos-sections {
            flex-direction: row;
            height: auto;
            max-height: 350px;
          }
        }

        @media (max-width: 768px) {
          .main-page-wrapper {
            padding: 1rem;
          }
          
          .calendar-section,
          .team-todos-section,
          .personal-todos-section {
            padding: 1rem;
          }
          
          .calendar-day {
            min-height: 60px;
            font-size: 0.85rem;
            padding: 0.4rem;
          }
          
          .day-number {
            font-size: 0.85rem;
          }
          
          .nav-button {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
          
          .calendar-title {
            font-size: 1.3rem;
          }
          
          .header-title {
            font-size: 1.5rem;
          }
          
          .todos-sections {
            flex-direction: column;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .section-title {
            align-self: flex-start;
          }
          
          .section-date,
          .section-count {
            align-self: flex-end;
          }
        }
      `}</style>
    </TodoListTemplate>
  );
}