'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Calendar, User, Crown, Settings, Eye, Search, X, Filter, SortAsc, Star, Clock } from 'lucide-react';
import TodoListTemplate from '../_components/TodoList/TodoListTemplate';
// import { useToast } from '../_hooks/useToast';
// import { useAuth } from '../_hooks/useAuth';
// import { TeamCardSkeleton } from '../_components/skeletons/TeamCardSkeleton';

// 백엔드 API 응답 구조에 맞는 인터페이스
interface TeamMemberResponseDto {
  id: number;
  userId: number;
  userNickname: string;
  userAvatar?: string;
  teamId: number;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
  createDate: string;
  modifyDate: string;
}

interface TeamResponseDto {
  id: number;
  teamName: string;
  description: string;
  createDate: string;
  modifyDate: string;
  members: TeamMemberResponseDto[];
}

// API 응답 타입
interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T;
}

// 프론트엔드에서 사용할 팀 인터페이스 (백엔드 데이터를 변환)
interface Team {
  id: number;
  teamName: string;
  description: string;
  createDate: string;
  modifyDate: string;
  isStarred: boolean; // 프론트엔드에서만 사용
  members: TeamMemberResponseDto[];
  todoStats: {
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
  lastActivity: string;
}

// 정렬 타입
type SortType = 'name' | 'created' | 'modified' | 'members' | 'activity';
type FilterType = 'all' | 'leader' | 'member' | 'starred';

// 현재 사용자 타입
interface CurrentUser {
  id: number;
  nickname: string;
}

const TeamsPage: React.FC = () => {
  const router = useRouter();
  
  // 임시 Toast 함수 (useCallback으로 감싸기)
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    alert(`${type.toUpperCase()}: ${message}`);
  }, []);
  
  // 임시 현재 사용자 - 실제 로그인된 사용자 정보 사용
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ id: 1, nickname: '사용자' });
  
  // 실제 로그인된 사용자 정보 가져오기 (임시)
  const getCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/me', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser({ id: userData.data.id, nickname: userData.data.nickName });
      }
    } catch (err) {
      console.log('사용자 정보 가져오기 실패, 기본값 사용');
    }
  };

  // 상태 관리
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 팀 정보 수정 관련 상태
  const [showTeamEditModal, setShowTeamEditModal] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<{ id: number; teamName: string; description: string } | null>(null);
  
  // 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('modified');
  
  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    description: ''
  });
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  // 팀 통계 가져오기
  const fetchTeamStats = useCallback(async (teamId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/stats`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          return result.data;
        }
      }
    } catch (error) {
      console.error('팀 통계 가져오기 실패:', error);
    }
    
    // 기본값 반환
    return {
      total: 0,
      completed: 0,
      overdue: 0,
      inProgress: 0,
      completionRate: 0
    };
  }, []);

  // 팀 목록 가져오기
  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/teams/my', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.resultCode === '200-OK' || result.resultCode === 'SUCCESS') {
        // 각 팀의 통계와 상세 정보를 가져와서 설정
        const teamsData = await Promise.all(
          result.data.map(async (team: TeamResponseDto) => {
            const stats = await fetchTeamStats(team.id);
            
            // 항상 개별 팀 정보를 가져와서 정확한 멤버 정보를 확보
            let members = team.members;
            try {
              const teamDetailResponse = await fetch(`http://localhost:8080/api/v1/teams/${team.id}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (teamDetailResponse.ok) {
                const teamDetailResult = await teamDetailResponse.json();
                if (teamDetailResult.resultCode === '200-OK') {
                  members = teamDetailResult.data.members || [];
                }
              }
            } catch (error) {
              console.error(`팀 ${team.id} 멤버 정보 가져오기 실패:`, error);
              members = team.members || []; // 실패 시 원본 데이터 사용
            }
            
            return {
              ...team,
              members: members,
              isStarred: false, // 기본값
              todoStats: {
                total: stats.total || 0,
                completed: stats.completed || 0,
                overdue: stats.overdue || 0,
                completionRate: stats.completionRate || 0
              },
              lastActivity: team.modifyDate
            };
          })
        );
        setTeams(teamsData);
      } else {
        throw new Error(result.msg || 'Failed to fetch teams');
      }
    } catch (error) {
      console.error('팀 목록 가져오기 실패:', error);
      setError('팀 목록을 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchTeamStats]);

  // 팀 정보 수정
  const handleUpdateTeamInfo = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTeam || !editingTeam.teamName.trim()) {
      showToast('팀 이름을 입력해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${editingTeam.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName: editingTeam.teamName,
          description: editingTeam.description
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          showToast('팀 정보가 성공적으로 수정되었습니다.', 'success');
          setShowTeamEditModal(false);
          setEditingTeam(null);
          await fetchTeams();
          
          // 사이드바 새로고침을 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('teamUpdated'));
        } else {
          showToast(result.msg || '팀 정보 수정에 실패했습니다.', 'error');
        }
      } else {
        showToast('팀 정보 수정에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('팀 정보 수정 실패:', error);
      showToast('팀 정보 수정에 실패했습니다.', 'error');
    }
  }, [editingTeam, showToast, fetchTeams]);

  // 팀 정보 수정 모달 열기
  const openTeamEditModal = useCallback((team: Team) => {
    setEditingTeam({
      id: team.id,
      teamName: team.teamName,
      description: team.description
    });
    setShowTeamEditModal(true);
  }, []);

  // 팀 생성
  const handleCreateTeam = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTeam.teamName.trim()) {
      showToast('팀 이름을 입력해주세요.', 'error');
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/v1/teams', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName: newTeam.teamName,
          description: newTeam.description
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK' || result.resultCode === 'SUCCESS') {
        showToast('팀이 성공적으로 생성되었습니다.', 'success');
        setNewTeam({ teamName: '', description: '' });
        setShowCreateModal(false);
        fetchTeams();
        
        // 사이드바 새로고침을 위한 이벤트 발생
        window.dispatchEvent(new CustomEvent('teamUpdated')); // 팀 목록 새로고침
      } else {
        throw new Error(result.msg || 'Failed to create team');
      }
    } catch (error) {
      console.error('팀 생성 실패:', error);
      showToast('팀 생성에 실패했습니다.', 'error');
    } finally {
      setCreateLoading(false);
    }
  }, [newTeam, showToast, fetchTeams]);

  // 팀 클릭 핸들러 - 최신 정보 가져오기
  const handleTeamClick = useCallback(async (team: Team) => {
    try {
      // 선택된 팀의 최신 정보 가져오기
      const response = await fetch(`http://localhost:8080/api/v1/teams/${team.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('팀 정보를 가져올 수 없습니다.');
      }

      const result = await response.json();
      
      if (result.resultCode === '200-OK') {
        // 최신 팀 정보로 업데이트
        const updatedTeam: Team = {
          ...team,
          teamName: result.data.teamName,
          description: result.data.description,
          members: result.data.members,
          createDate: result.data.createDate,
          modifyDate: result.data.modifyDate,
          lastActivity: result.data.modifyDate
        };
        
        setSelectedTeam(updatedTeam);
        
        // 팀 목록도 업데이트
        setTeams(prev => prev.map(t => 
          t.id === team.id ? updatedTeam : t
        ));
      } else {
        throw new Error(result.msg || '팀 정보를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('팀 정보 가져오기 실패:', error);
      // 에러가 발생해도 기존 팀 정보로 선택
      setSelectedTeam(team);
    }
  }, []);

  // 팀 즐겨찾기 토글
  const handleToggleStar = useCallback((teamId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeams(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, isStarred: !team.isStarred }
        : team
    ));
  }, []);

  // 팀 상세 페이지로 이동
  const handleGoToTeamDetail = useCallback((teamId: number) => {
    router.push(`/teams/${teamId}`);
  }, [router]);

  // 검색된 팀 필터링
  const filteredAndSortedTeams = useCallback(() => {
    let filtered = teams.filter(team => {
      const matchesSearch = team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'leader' && team.members.some(m => m.role === 'LEADER' && m.userId === currentUser.id)) ||
                           (filterBy === 'member' && team.members.some(m => m.userId === currentUser.id)) ||
                           (filterBy === 'starred' && team.isStarred);
      
      return matchesSearch && matchesFilter;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.teamName.localeCompare(b.teamName);
        case 'created':
          return new Date(b.createDate).getTime() - new Date(a.createDate).getTime();
        case 'modified':
          return new Date(b.modifyDate).getTime() - new Date(a.modifyDate).getTime();
        case 'members':
          return b.members.length - a.members.length;
        case 'activity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [teams, searchTerm, filterBy, sortBy, currentUser.id]);

  // 날짜 포맷팅
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // 상대 시간 포맷팅
  const formatRelativeTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return formatDate(dateString);
  }, [formatDate]);

  // 검색어 초기화
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // 사용자 역할 가져오기
  const getUserRole = useCallback((team: Team): 'LEADER' | 'MEMBER' | null => {
    const member = team.members.find(m => m.userId === currentUser.id);
    return member ? member.role : null;
  }, [currentUser.id]);

  useEffect(() => {
    getCurrentUser();
    fetchTeams();
  }, [fetchTeams]);

  // 페이지 포커스 시 팀 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      fetchTeams();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchTeams]);

  return (
    <TodoListTemplate>
      <div style={{
        display: 'flex',
        width: '100%',
        height: 'calc(100vh - 120px)',
        gap: '2rem',
        paddingTop: '0',
        margin: '0',
        overflow: 'hidden'
      }}>
        {/* 왼쪽: 팀 목록 - 정확히 50% */}
        <div style={{
          width: '50%',
          minWidth: '50%',
          maxWidth: '50%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          height: '100%'
        }}>
          {/* 헤더 섹션 */}
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px var(--shadow-md)',
            border: '1px solid var(--border-light)',
            flexShrink: 0,
            width: '100%'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  👥 내 팀 목록
                  {teams.length > 0 && (
                    <span style={{
                      fontSize: '1.25rem',
                      color: 'var(--text-secondary)',
                      fontWeight: '400'
                    }}>
                      ({teams.length})
                    </span>
                  )}
                </h1>
                <p style={{color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  팀을 관리하고 새로운 팀을 만들어보세요
                </p>
              </div>

              {/* 검색 및 필터 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                {/* 검색 */}
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <input
                    type="text"
                    placeholder="팀 이름 또는 설명으로 검색..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color)';
                      e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-light)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <Search style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1.25rem',
                    height: '1.25rem',
                    color: 'var(--text-light)'
                  }} />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <X style={{ width: '1rem', height: '1rem', color: 'var(--text-light)' }} />
                    </button>
                  )}
                </div>

                {/* 필터 */}
                <select
                  value={filterBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterBy(e.target.value as FilterType)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="all">전체</option>
                  <option value="leader">리더</option>
                  <option value="member">멤버</option>
                  <option value="starred">즐겨찾기</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortType)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="modified">최근 수정</option>
                  <option value="created">생성일</option>
                  <option value="name">이름순</option>
                  <option value="members">멤버수</option>
                  <option value="activity">최근 활동</option>
                </select>

                {/* 팀 생성 버튼 */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
                  새 팀 만들기
                </button>
              </div>

              {/* 검색 및 필터 결과 표시 */}
              {(searchTerm || filterBy !== 'all') && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  {searchTerm && (
                    <span>"{searchTerm}"에 대한 검색 결과</span>
                  )}
                  {filterBy !== 'all' && (
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--primary-light)',
                      color: 'var(--primary-color)',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {filterBy === 'leader' && '리더'}
                      {filterBy === 'member' && '멤버'}
                      {filterBy === 'starred' && '즐겨찾기'}
                    </span>
                  )}
                  <span style={{ fontWeight: '600' }}>{filteredAndSortedTeams().length}개 팀</span>
                </div>
              )}
            </div>
          </div>

          {/* 팀 목록 블록 */}
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
            minHeight: 0
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
              🏢 팀 목록
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              flex: 1,
              overflowY: 'auto',
              paddingRight: '0.5rem',
              paddingTop: '0.5rem',
              maxHeight: '100%'
            }}>
              {/* 로딩 상태 */}
              {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} style={{
                      background: 'var(--bg-main)',
                      borderRadius: '8px',
                      padding: '1rem',
                      minHeight: '120px',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}>
                      <div style={{
                        height: '1rem',
                        background: 'var(--border-light)',
                        borderRadius: '4px',
                        width: '60%',
                        marginBottom: '0.5rem'
                      }}></div>
                      <div style={{
                        height: '0.75rem',
                        background: 'var(--border-light)',
                        borderRadius: '4px',
                        width: '40%',
                        marginBottom: '0.75rem'
                      }}></div>
                      <div style={{
                        height: '0.75rem',
                        background: 'var(--border-light)',
                        borderRadius: '4px',
                        width: '80%'
                      }}></div>
                    </div>
                  ))}
                </div>
              )}

              {/* 에러 상태 */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>
                    오류가 발생했습니다
                  </h3>
                  <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>
                  <button
                    onClick={fetchTeams}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {/* 팀 목록 */}
              {!isLoading && !error && (
                <>
                  {filteredAndSortedTeams().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div style={{
                        background: 'var(--bg-white)',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        margin: '0 auto'
                      }}>
                        {searchTerm || filterBy !== 'all' ? (
                          <>
                            <Search style={{ width: '4rem', height: '4rem', color: 'var(--text-light)', margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                              검색 결과가 없습니다
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                              조건과 일치하는 팀을 찾을 수 없습니다.
                            </p>
                            <button
                              onClick={() => {
                                setSearchTerm('');
                                setFilterBy('all');
                              }}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                cursor: 'pointer'
                              }}
                            >
                              전체 팀 보기
                            </button>
                          </>
                        ) : (
                          <>
                            <Users style={{ width: '4rem', height: '4rem', color: 'var(--text-light)', margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                              아직 참여한 팀이 없습니다
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                              새로운 팀을 만들거나 팀에 초대받아 협업을 시작해보세요
                            </p>
                            <button
                              onClick={() => setShowCreateModal(true)}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                cursor: 'pointer'
                              }}
                            >
                              첫 번째 팀 만들기
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    filteredAndSortedTeams().map((team: Team) => {
                      const userRole = getUserRole(team);
                      const completionRate = team.todoStats.total > 0
                        ? Math.round((team.todoStats.completed / team.todoStats.total) * 100)
                        : 0;

                      return (
                        <div
                          key={team.id}
                          style={{
                            background: selectedTeam?.id === team.id ? 'var(--primary-light)' : 'var(--bg-main)',
                            borderRadius: '8px',
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: selectedTeam?.id === team.id
                              ? '2px solid var(--primary-color)'
                              : '1px solid var(--border-light)',
                            minHeight: '120px',
                            maxHeight: '120px',
                            overflow: 'hidden',
                            width: '100%'
                          }}
                          onClick={() => handleTeamClick(team)}
                          onMouseEnter={(e) => {
                            if (selectedTeam?.id !== team.id) {
                              e.currentTarget.style.transform = 'translateX(4px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow-md)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTeam?.id !== team.id) {
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            height: '100%',
                            justifyContent: 'space-between'
                          }}>
                            {/* 상단: 팀명과 역할 */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <h3 style={{
                                fontWeight: '600',
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                                lineHeight: '1.4',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '70%'
                              }}>
                                {team.teamName}
                              </h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {userRole === 'LEADER' && (
                                  <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    background: '#fef3c7',
                                    color: '#d97706',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    <Crown style={{ width: '0.75rem', height: '0.75rem' }} />
                                    리더
                                  </span>
                                )}
                                {userRole === 'LEADER' && (
                                  <button
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      openTeamEditModal(team);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '0.25rem',
                                      color: 'var(--text-secondary)'
                                    }}
                                    title="팀 정보 수정"
                                  >
                                    <Settings style={{ width: '0.75rem', height: '0.75rem' }} />
                                  </button>
                                )}
                                <button
                                  onClick={(e: React.MouseEvent) => handleToggleStar(team.id, e)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem'
                                  }}
                                >
                                  <Star style={{
                                    width: '1rem',
                                    height: '1rem',
                                    color: team.isStarred ? '#fbbf24' : 'var(--text-light)',
                                    fill: team.isStarred ? '#fbbf24' : 'none'
                                  }} />
                                </button>
                              </div>
                            </div>

                            {/* 중간: 팀 설명 */}
                            <p style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.875rem',
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              height: '2.4em',
                              maxHeight: '2.4em',
                              marginBottom: '0.75rem'
                            }}>
                              {team.description || '팀 설명이 없습니다.'}
                            </p>

                            {/* 하단: 멤버수와 할일 통계 */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: 'auto'
                            }}>
                              {/* 좌측: 멤버수 */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <Users style={{ width: '0.75rem', height: '0.75rem', color: 'var(--primary-color)' }} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  {team.members && team.members.length > 0 ? team.members.length : '?'}명
                                </span>
                              </div>
                              
                              {/* 우측: 할일 통계 */}
                              {team.todoStats.total > 0 && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.2rem 0.4rem',
                                    background: '#f0fdf4',
                                    borderRadius: '4px',
                                    border: '1px solid #16a34a'
                                  }}>
                                    <span style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: '500' }}>
                                      총 할일
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '600' }}>
                                      {team.todoStats.total}
                                    </span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.2rem 0.4rem',
                                    background: '#fefce8',
                                    borderRadius: '4px',
                                    border: '1px solid #fbbf24'
                                  }}>
                                    <span style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: '500' }}>
                                      남음
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#eab308', fontWeight: '600' }}>
                                      {team.todoStats.total - team.todoStats.completed}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 선택된 팀 상세 정보 - 정확히 50% */}
        <div style={{
          width: '50%',
          minWidth: '50%',
          maxWidth: '50%',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {selectedTeam ? (
            <div style={{
              background: 'var(--bg-white)',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 12px var(--shadow-md)',
              border: '1px solid var(--border-light)',
              height: '100%',
              width: '100%',
              minWidth: '0',
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
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    lineHeight: '1.3',
                    marginBottom: '0.5rem'
                  }}>
                    {selectedTeam.teamName}
                  </h2>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    lineHeight: '1.5'
                  }}>
                    {selectedTeam.description || '팀 설명이 없습니다.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1rem' }}>
                  <button
                    onClick={() => handleGoToTeamDetail(selectedTeam.id)}
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
                    🚀 팀 상세보기
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
                {/* 팀 통계 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem'
                  }}>
                    📊 팀 통계
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
                        {selectedTeam.members.length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        총 멤버
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '0.25rem' }}>
                        {selectedTeam.todoStats.total}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        총 할일
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', marginBottom: '0.25rem' }}>
                        {selectedTeam.todoStats.completed}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        완료된 할일
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#eab308', marginBottom: '0.25rem' }}>
                        {selectedTeam.todoStats.total - selectedTeam.todoStats.completed}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        남은 할일
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626', marginBottom: '0.25rem' }}>
                        {selectedTeam.todoStats.overdue}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        지연된 할일
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.25rem' }}>
                        {selectedTeam.todoStats.completionRate}%
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        완료율
                      </div>
                    </div>
                  </div>
                </div>

                {/* 멤버 목록 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem'
                  }}>
                    👥 팀 멤버 ({selectedTeam.members.length}명)
                  </label>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {selectedTeam.members.map((member) => (
                      <div key={member.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: 'var(--bg-main)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-color)',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}>
                            {member.userNickname.charAt(0)}
                          </div>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                            {member.userNickname}
                          </span>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: member.role === 'LEADER' ? '#fef3c7' : '#f3f4f6',
                          color: member.role === 'LEADER' ? '#d97706' : '#6b7280'
                        }}>
                          {member.role === 'LEADER' ? '리더' : '멤버'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 최근 활동 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem'
                  }}>
                    📅 최근 활동
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        생성일
                      </div>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        background: 'var(--bg-main)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)'
                      }}>
                        {formatDate(selectedTeam.createDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        최근 수정
                      </div>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        background: 'var(--bg-main)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)'
                      }}>
                        {formatRelativeTime(selectedTeam.lastActivity)}
                      </div>
                    </div>
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
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--border-medium)'
            }}>
              <div style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👥</div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--text-secondary)'
                }}>
                  팀을 선택해주세요
                </h3>
                <p style={{ fontSize: '1rem' }}>
                  왼쪽에서 팀을 클릭하면 상세 정보가 표시됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 팀 생성 모달 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '28rem',
            margin: '0 1rem'
          }}>
            <form onSubmit={handleCreateTeam}>
              {/* 모달 헤더 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-light)'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  새 팀 만들기
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-light)' }} />
                </button>
              </div>

              {/* 모달 내용 */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    팀 이름 *
                  </label>
                  <input
                    type="text"
                    value={newTeam.teamName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="팀 이름을 입력하세요"
                    maxLength={255}
                    required
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color)';
                      e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-light)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    팀 설명
                  </label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTeam({ ...newTeam, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="팀에 대한 간단한 설명을 입력하세요 (선택사항)"
                    rows={3}
                    maxLength={1000}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary-color)';
                      e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-light)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* 모달 푸터 */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                padding: '1.5rem',
                borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-main)',
                borderRadius: '0 0 12px 12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    color: 'var(--text-secondary)',
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newTeam.teamName.trim()}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: createLoading || !newTeam.teamName.trim() ? 'var(--border-light)' : 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: createLoading || !newTeam.teamName.trim() ? 'not-allowed' : 'pointer',
                    opacity: createLoading || !newTeam.teamName.trim() ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {createLoading ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Plus style={{ width: '1rem', height: '1rem' }} />
                      팀 생성
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 팀 정보 수정 모달 */}
      {showTeamEditModal && editingTeam && (
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
            background: 'var(--bg-white)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '500px',
            margin: '0 1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-light)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                ✏️ 팀 정보 수정
              </h3>
              <button
                onClick={() => {
                  setShowTeamEditModal(false);
                  setEditingTeam(null);
                }}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateTeamInfo}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    팀 이름 *
                  </label>
                  <input
                    type="text"
                    value={editingTeam.teamName}
                    onChange={(e) => setEditingTeam({ ...editingTeam, teamName: e.target.value })}
                    placeholder="팀 이름을 입력하세요"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    팀 설명
                  </label>
                  <textarea
                    value={editingTeam.description}
                    onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}
                    placeholder="팀에 대한 설명을 입력하세요"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                padding: '1.5rem',
                borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-main)',
                borderRadius: '0 0 12px 12px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowTeamEditModal(false);
                    setEditingTeam(null);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-white)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: 'none',
                    background: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  수정하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TodoListTemplate>
  );
};

export default TeamsPage;