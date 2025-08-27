"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './TodoListTemplate.css';
import NotificationDropdown, { NotificationButton } from './NotificationDropdown';
import UserProfileDropdown, { UserProfileButton } from './UserProfileDropdown';

interface TodoListItem {
  id: number;
  name: string;
  description: string;
  userId: number;
  teamId: number;
  createDate: string;
  modifyDate: string;
}

interface TeamResponseDto {
  id: number;
  teamName: string;
  description: string;
  createDate: string;
  modifyDate: string;
  members: any[];
}

interface ContentItem {
  title: string;
  description: string;
}

interface PropsWithChildren {
  children: React.ReactNode;
  contentClassName?: string;
}

const TodoListTemplate: React.FC<PropsWithChildren> = ({ 
  children, 
  contentClassName = '' 
}) => {
  const pathname = usePathname();

  // 상태 관리
  const [todoLists, setTodoLists] = useState<TodoListItem[]>([]);
  const [teams, setTeams] = useState<TeamResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(true);
  const [isCreatingPersonal, setIsCreatingPersonal] = useState<boolean>(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState<boolean>(false);
  const [newTodoName, setNewTodoName] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeNavItem, setActiveNavItem] = useState<string>('project-a');
  const [activeProject, setActiveProject] = useState<string>('');
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  // 사용자 정보
  const userInfo = {
    name: "개발자님",
    email: "developer@example.com", 
    joinDate: "2024.01.15",
    role: "Frontend Developer",
    department: "개발팀"
  };

  const contentMap: Record<string, ContentItem> = {
    'inbox': {
      title: '개인 업무',
      description: '개인 업무 목록을 관리하는 공간입니다.\n총 5개의 할일이 있습니다.'
    },
    'project-a': {
      title: '프로젝트 A',
      description: '프로젝트 A 관련 업무를 관리합니다.\n총 8개의 할일이 진행 중입니다.'
    },
    'activities': {
      title: '취미 활동',
      description: '개인적인 취미 활동 계획을 관리합니다.\n총 3개의 활동이 예정되어 있습니다.'
    },
    'sprint24': {
      title: '개발팀 - Sprint 24',
      description: '개발팀의 스프린트 24 업무를 관리합니다.\n총 12개의 개발 태스크가 있습니다.'
    },
    'marketing-q2': {
      title: '마케팅 - Q2',
      description: '2분기 마케팅 캠페인을 관리합니다.\n총 7개의 마케팅 업무가 진행 중입니다.'
    }
  };

  // 로그인 체크
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromLogout = urlParams.get('logout') === 'true';
    
    const checkLogin = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/user/me', {
          method: 'GET',
          credentials: 'include'
        });
        if (!res.ok) {
          window.location.href = 'http://localhost:3000/login';
        }
      } catch (err) {
        console.error('로그인 체크 실패:', err);
        window.location.href = 'http://localhost:3000/login';
      }
    };
    
    if (fromLogout) {
      setTimeout(checkLogin, 500);
    } else {
      checkLogin();
    }
  }, []);

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-1') {
          setCurrentUser(result.data);
        }
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
    }
  };

  // 투두리스트 데이터 가져오기
  const fetchTodoLists = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/todo-lists/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK' || result.resultCode === '200-1') {
          setTodoLists(result.data);
        } else {
          console.warn('투두리스트 데이터 가져오기 실패:', result);
          setTodoLists([]);
        }
      } else {
        console.warn('투두리스트 API 응답 실패:', response.status);
        setTodoLists([]);
      }
    } catch (error) {
      console.error('투두리스트 가져오기 실패:', error);
      setTodoLists([]);
    } finally {
      setLoading(false);
    }
  };

  // 팀 목록 데이터 가져오기
  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      console.log('팀 목록 API 호출 시작...');
      
      const response = await fetch('http://localhost:8080/api/v1/teams/my', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('팀 목록 API 응답 상태:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('팀 목록 API 응답 데이터:', result);
        
        if (result.resultCode === '200-1' || result.resultCode === '200-OK') {
          console.log('팀 목록 설정:', result.data);
          setTeams(result.data || []);
        } else {
          console.warn('팀 목록 데이터 가져오기 실패:', result);
          setTeams([]);
        }
      } else {
        console.warn('팀 목록 API 응답 실패:', response.status, response.statusText);
        setTeams([]);
      }
    } catch (error) {
      console.error('팀 목록 가져오기 실패:', error);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  // 읽지 않은 알림 개수 업데이트
  const updateUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/notifications', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-1') {
          const unreadCount = result.data.filter((n: any) => !n.isRead).length;
          setUnreadNotificationCount(unreadCount);
        } else {
          console.warn('알림 데이터 가져오기 실패:', result);
          setUnreadNotificationCount(0);
        }
      } else {
        console.warn('알림 API 응답 실패:', response.status);
        setUnreadNotificationCount(0);
      }
    } catch (error) {
      console.error('알림 개수 가져오기 실패:', error);
      setUnreadNotificationCount(0);
    }
  };

  // 새 투두리스트 생성
  const createTodoList = async (isPersonal: boolean) => {
    if (!newTodoName.trim() || !currentUser) return;

    try {
      const todoListData = {
        name: newTodoName.trim(),
        description: `${newTodoName.trim()}의 description입니다`,
        userId: currentUser.id,
        teamId: isPersonal ? 1 : currentUser.teamId,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };

      const response = await fetch('http://localhost:8080/api/todo-lists', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(todoListData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK' || result.resultCode === '200-1') {
          await fetchTodoLists();
          setNewTodoName('');
          setIsCreatingPersonal(false);
          setIsCreatingTeam(false);
        } else {
          console.error('투두리스트 생성 실패:', result);
          alert('투두리스트 생성에 실패했습니다.');
        }
      } else {
        console.error('투두리스트 생성 API 실패:', response.status);
        alert('투두리스트 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('투두리스트 생성 에러:', error);
      alert('투두리스트 생성 중 오류가 발생했습니다.');
    }
  };

  // 생성 취소
  const cancelCreate = () => {
    setNewTodoName('');
    setIsCreatingPersonal(false);
    setIsCreatingTeam(false);
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent, isPersonal: boolean) => {
    if (e.key === 'Enter') {
      createTodoList(isPersonal);
    } else if (e.key === 'Escape') {
      cancelCreate();
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCurrentUser();
      fetchTodoLists();
      fetchTeams();
      updateUnreadCount();
    }, 1000);

    // 팀 업데이트 이벤트 리스너 추가
    const handleTeamUpdated = () => {
      console.log('팀 업데이트 이벤트 감지 - 사이드바 새로고침');
      fetchTeams();
    };

    window.addEventListener('teamUpdated', handleTeamUpdated);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('teamUpdated', handleTeamUpdated);
    };
  }, []);

  // 팀 데이터 디버깅용 useEffect
  useEffect(() => {
    console.log('Teams 상태 변경됨:', teams);
    console.log('Teams 길이:', teams.length);
    console.log('Teams 로딩 상태:', teamsLoading);
  }, [teams, teamsLoading]);

  // 개인 투두리스트와 팀 투두리스트 분리
  const personalTodoLists = todoLists.filter(todo => todo.teamId === 1);
  const teamTodoLists = todoLists.filter(todo => todo.teamId !== 1);

  // 현재 경로가 해당 투두리스트 페이지인지 확인
  const isCurrentPage = (todoId: number, isTeam: boolean) => {
    if (isTeam) {
      return pathname === `/TeamTodoList/${todoId}`;
    } else {
      return pathname === `/todoList/${todoId}`;
    }
  };

  // 현재 경로가 팀 관련 페이지인지 확인
  const isTeamPage = (teamId: number) => {
    return pathname === `/team/${teamId}`;
  };

  const toggleDropdown = (dropdownType: 'notification' | 'profile') => {
    if (dropdownType === 'notification') {
      setShowNotificationDropdown(!showNotificationDropdown);
      setShowProfileDropdown(false);
      if (!showNotificationDropdown) {
        updateUnreadCount();
      }
    } else {
      setShowProfileDropdown(!showProfileDropdown);
      setShowNotificationDropdown(false);
    }
  };

  const selectNavItem = (itemId: string) => {
    setActiveNavItem(itemId);
    setActiveProject('');
  };

  const selectProject = (projectId: string) => {
    setActiveProject(projectId);
    setActiveNavItem('');
  };

  // 투두리스트 아이콘 선택 함수
  const getTodoListIcon = (name: string, isTeam: boolean) => {
    if (isTeam) {
      if (name.toLowerCase().includes('개발') || name.toLowerCase().includes('sprint')) return '🚀';
      if (name.toLowerCase().includes('마케팅')) return '📊';
      if (name.toLowerCase().includes('디자인')) return '🎨';
      return '👥';
    } else {
      if (name.toLowerCase().includes('업무') || name.toLowerCase().includes('work')) return '📥';
      if (name.toLowerCase().includes('프로젝트') || name.toLowerCase().includes('project')) return '📋';
      if (name.toLowerCase().includes('취미') || name.toLowerCase().includes('활동')) return '⚡';
      return '📝';
    }
  };

  // 팀 아이콘 선택 함수
  const getTeamIcon = (teamName: string) => {
    if (teamName.toLowerCase().includes('개발') || teamName.toLowerCase().includes('dev')) return '💻';
    if (teamName.toLowerCase().includes('마케팅') || teamName.toLowerCase().includes('marketing')) return '📊';
    if (teamName.toLowerCase().includes('디자인') || teamName.toLowerCase().includes('design')) return '🎨';
    if (teamName.toLowerCase().includes('영업') || teamName.toLowerCase().includes('sales')) return '💼';
    if (teamName.toLowerCase().includes('기획') || teamName.toLowerCase().includes('plan')) return '📋';
    return '👥';
  };

  const getCurrentContent = (): ContentItem => {
    const currentId = activeNavItem || activeProject;
    return contentMap[currentId] || contentMap['project-a'];
  };

  // 외부 클릭 처리
  const handleOutsideClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      setShowNotificationDropdown(false);
      setShowProfileDropdown(false);
    }
  };

  // ESC 키 처리
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotificationDropdown(false);
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  const currentContent = getCurrentContent();

  return (
    <div className="todo-app" onClick={handleOutsideClick}>
      {/* 헤더 */}
      <header className="header">
        <Link href="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          tododuk
        </Link>
        <div className="header-actions">
          {/* 알림 드롭다운 */}
          <div className="dropdown">
            {showNotificationDropdown ? (
              <NotificationDropdown 
                isOpen={showNotificationDropdown}
                onClose={() => setShowNotificationDropdown(false)}
              />
            ) : (
              <NotificationButton 
                unreadCount={unreadNotificationCount}
                onClick={() => toggleDropdown('notification')}
              />
            )}
          </div>

          {/* 유저 프로필 드롭다운 */}
          <div className="dropdown">
            {showProfileDropdown ? (
              <UserProfileDropdown 
                isOpen={showProfileDropdown}
                onClose={() => setShowProfileDropdown(false)}
                userName={userInfo.name}
                userInfo={userInfo}
              />
            ) : (
              <UserProfileButton 
                onClick={() => toggleDropdown('profile')}
              />
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨테이너 */}
      <div className="main-container">
        {/* 사이드바 */}
        <aside className="sidebar">
          {/* 캘린더 버튼 */}
          <div className="sidebar-section">
            <nav className="sidebar-nav">
              <Link 
                href="/calendar"
                className="nav-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="item-left">
                  <span>📅</span>
                  <span>캘린더</span>
                </div>
              </Link>
            </nav>
          </div>

          {/* 개인 리스트 섹션 */}
          <div className="sidebar-section">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>개인 리스트</span>
              <button 
                className="add-todo-btn"
                onClick={() => setIsCreatingPersonal(true)}
                disabled={isCreatingPersonal || isCreatingTeam}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                  opacity: (isCreatingPersonal || isCreatingTeam) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isCreatingPersonal && !isCreatingTeam) {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCreatingPersonal && !isCreatingTeam) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
                title="새 개인 투두리스트 추가"
              >
                +
              </button>
            </div>
            <nav className="sidebar-nav">
              {/* 새 투두리스트 생성 입력 */}
              {isCreatingPersonal && (
                <div style={{ 
                  padding: '0.75rem 1.5rem',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="text"
                    value={newTodoName}
                    onChange={(e) => setNewTodoName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, true)}
                    placeholder="투두리스트 이름 입력"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => createTodoList(true)}
                      disabled={!newTodoName.trim()}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.8rem',
                        background: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: newTodoName.trim() ? 'pointer' : 'not-allowed',
                        opacity: newTodoName.trim() ? 1 : 0.5
                      }}
                    >
                      생성
                    </button>
                    <button
                      onClick={cancelCreate}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.8rem',
                        background: '#64748b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  로딩 중...
                </div>
              ) : personalTodoLists.length > 0 ? (
                personalTodoLists.map((todo) => (
                  <Link 
                    key={todo.id}
                    href={`/todoList/${todo.id}`}
                    className={`nav-item ${isCurrentPage(todo.id, false) ? 'active' : ''}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="item-left">
                      <span>{getTodoListIcon(todo.name, false)}</span>
                      <span>{todo.name}</span>
                    </div>
                    <span className="item-count">-</span>
                  </Link>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  개인 투두리스트가 없습니다
                </div>
              )}
            </nav>
          </div>

          {/* 팀 섹션 */}
          <div className="sidebar-section">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>팀 ({teams.length})</span>
              <Link 
                href="/teams"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }}
                title="팀 목록 보기"
              >
                전체보기
              </Link>
            </div>
            <div className="sidebar-nav">
              {teamsLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  팀 목록 로딩 중...
                </div>
              ) : teams && teams.length > 0 ? (
                <>
                  {teams.slice(0, 5).map((team) => {
                    return (
                      <Link 
                        key={team.id}
                        href={`/teams/${team.id}`}
                        className={`project-item ${isTeamPage(team.id) ? 'active-project' : ''}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        title={`${team.teamName} - ${team.description || '설명 없음'}`}
                      >
                        <div className="project-info">
                          <span className="project-icon">{getTeamIcon(team.teamName)}</span>
                          <span className="project-name">{team.teamName}</span>
                        </div>

                      </Link>
                    );
                  })}
                  
                  {teams.length > 5 && (
                    <Link 
                      href="/teams"
                      className="nav-item"
                      style={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        fontStyle: 'italic',
                        opacity: 0.8
                      }}
                    >
                      <div className="item-left">
                        <span>➕</span>
                        <span>더 많은 팀 보기 (+{teams.length - 5})</span>
                      </div>
                    </Link>
                  )}
                </>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  소속된 팀이 없습니다
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className={`content ${contentClassName}`}>
          <div className="welcome-message">
            {children}
          </div>
        </main>
      </div>

      {/* 푸터 */}
      <footer className="footer">
        <p>&copy; 2025 TodoList. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TodoListTemplate;