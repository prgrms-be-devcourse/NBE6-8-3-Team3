'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Circle, Calendar, User, Crown, Settings, Eye, Search, X, Filter, SortAsc, Star, Clock, Users, Target, CheckSquare } from 'lucide-react';
import TodoListTemplate from '../../_components/TodoList/TodoListTemplate';

// 백엔드 API 응답 구조에 맞는 인터페이스
interface TeamMemberResponseDto {
  id: number;
  userId: number;
  userEmail: string;
  userNickname: string;
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

// 할일 목록 인터페이스
interface TodoList {
  id: number;
  name: string;
  description: string;
  userId: number;
  teamId: number;
  createDate: string;
  modifyDate: string;
  todos?: Todo[];
}

// 할일 인터페이스
interface Todo {
  id: number;
  title: string;
  description: string;
  priority: number;
  completed: boolean;
  todoListId: number;
  createdAt: string;
  updatedAt: string;
  assignedMemberId?: number | null;
  dueDate?: string | null;
}

// API 응답 타입
interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T;
}

const TeamDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const teamId = parseInt(params.id as string);

  // 임시 Toast 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // 상태 관리
  const [team, setTeam] = useState<TeamResponseDto | null>(null);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [selectedTodoList, setSelectedTodoList] = useState<TodoList | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 모달 상태
  const [showTodoListModal, setShowTodoListModal] = useState<boolean>(false);
  const [showTodoModal, setShowTodoModal] = useState<boolean>(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState<boolean>(false);
  const [showMemberAddModal, setShowMemberAddModal] = useState<boolean>(false);
  const [editingTodoList, setEditingTodoList] = useState<TodoList | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [newTodoList, setNewTodoList] = useState({ name: '', description: '' });
  const [newTodo, setNewTodo] = useState({ 
    title: '', 
    description: '', 
    priority: 2,
    assignedMemberId: null as number | null,
    dueDate: ''
  });
  const [newTodoAssignees, setNewTodoAssignees] = useState<number[]>([]);
  const [editingTodoAssignees, setEditingTodoAssignees] = useState<number[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<'LEADER' | 'MEMBER'>('MEMBER');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>([]);
  const [modalError, setModalError] = useState<string>('');

  // 담당자 권한 관련 상태
  const [assigneeMap, setAssigneeMap] = useState<Map<number, boolean>>(new Map());
  const [assigneesMap, setAssigneesMap] = useState<Map<number, any[]>>(new Map());
  const [assigneeLoadingMap, setAssigneeLoadingMap] = useState<Map<number, boolean>>(new Map());

  // 멤버 권한 변경 관련 상태
  const [showMemberRoleModal, setShowMemberRoleModal] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMemberResponseDto | null>(null);
  const [newMemberRoleForEdit, setNewMemberRoleForEdit] = useState<'LEADER' | 'MEMBER'>('MEMBER');
  
  // 팀 정보 수정 관련 상태
  const [showTeamEditModal, setShowTeamEditModal] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState({ teamName: '', description: '' });
  


  // 담당자 권한 체크 함수들
  const isTodoAssignee = (todoId: number): boolean => {
    const result = assigneeMap.get(todoId) || false;
    console.log(`isTodoAssignee(${todoId}):`, result);
    return Boolean(result);
  };

  const getTodoAssignees = (todoId: number): any[] => {
    const result = assigneesMap.get(todoId) || [];
    console.log(`getTodoAssignees(${todoId}):`, result);
    return result;
  };

  const checkAssigneeStatus = async (todoId: number) => {
    try {
      console.log(`checkAssigneeStatus 시작: todoId=${todoId}`);
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${todoId}/is-assignee`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`checkAssigneeStatus 응답:`, result);
        if (result.resultCode === '200-OK') {
          const isAssignee = result.data.isAssignee;
          setAssigneeMap(prev => new Map(prev.set(todoId, isAssignee)));
          console.log(`assigneeMap 업데이트: todoId=${todoId}, isAssignee=${isAssignee}`);
        }
      }
    } catch (error) {
      console.error('담당자 상태 확인 실패:', error);
    }
  };

  const fetchTodoAssignees = async (todoId: number) => {
    try {
      console.log(`fetchTodoAssignees 시작: todoId=${todoId}`);
      
      // 로딩 상태 시작
      setAssigneeLoadingMap(prev => new Map(prev.set(todoId, true)));
      
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${todoId}/assignees`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`fetchTodoAssignees 응답:`, result);
        if (result.resultCode === '200-OK') {
          // 백엔드에서 이미 ACTIVE 상태만 반환하므로 필터링 불필요
          const assignees = result.data || [];
          console.log(`설정할 담당자 정보:`, assignees);
          
          setAssigneesMap(prev => {
            const newMap = new Map(prev);
            newMap.set(todoId, assignees);
            console.log(`담당자 맵 업데이트 완료: todoId=${todoId}, assignees=`, assignees);
            return newMap;
          });
          
          // 강제로 리렌더링을 위한 상태 업데이트
          setSelectedTodo(prev => prev ? { ...prev } : null);
        }
      } else {
        console.error('담당자 정보 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.error('담당자 목록 가져오기 실패:', error);
    } finally {
      // 로딩 상태 종료
      setAssigneeLoadingMap(prev => new Map(prev.set(todoId, false)));
    }
  };

  const handleAssignMultipleAssignees = async () => {
    if (!selectedTodo) return;
    
    try {
      console.log('담당자 지정 요청:', selectedAssigneeIds);
      
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${selectedTodo.id}/assignees`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignedUserIds: selectedAssigneeIds })
      });

      console.log('담당자 지정 응답 상태:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('담당자 지정 응답:', result);
        
        if (result.resultCode === '200-OK') {
          showToast('담당자가 성공적으로 지정되었습니다.', 'success');
          setShowAssigneeModal(false);
          setSelectedAssigneeIds([]);
          
          // 담당자 정보 즉시 새로고침
          await fetchTodoAssignees(selectedTodo.id);
          await checkAssigneeStatus(selectedTodo.id);
          
          // 선택된 할일의 권한 상태도 새로고침
          if (selectedTodo) {
            await checkAssigneeStatus(selectedTodo.id);
          }
        } else {
          showToast(result.msg || '담당자 지정에 실패했습니다.', 'error');
        }
      } else {
        const errorText = await response.text();
        console.log('담당자 지정 오류 응답:', errorText);
        showToast('담당자 지정에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('담당자 지정 실패:', error);
      showToast('담당자 지정에 실패했습니다.', 'error');
    }
  };

  // 담당자 모달 열 때 현재 담당자들을 미리 선택
  const openAssigneeModal = async () => {
    if (!selectedTodo) return;
    
    try {
      // 백엔드에서 최신 담당자 정보 가져오기
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${selectedTodo.id}/assignees`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          const currentAssigneeIds = result.data.map((assignee: any) => assignee.assignedUserId);
          setSelectedAssigneeIds(currentAssigneeIds);
          
          // 담당자 목록도 업데이트
          setAssigneesMap(prev => new Map(prev.set(selectedTodo.id, result.data)));
        }
      }
      
      // 권한 상태도 새로고침
      await checkAssigneeStatus(selectedTodo.id);
    } catch (error) {
      console.error('담당자 정보 가져오기 실패:', error);
    }
    
    setShowAssigneeModal(true);
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim()) {
      setModalError('이메일을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          showToast('팀 멤버가 성공적으로 추가되었습니다.', 'success');
          setShowMemberAddModal(false);
          setNewMemberEmail('');
          setNewMemberRole('MEMBER');
          setModalError('');
          // 팀 정보 새로고침
          await fetchTeamInfo();
          
          // 사이드바 새로고침을 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('teamUpdated'));
        } else {
          setModalError(result.msg || '멤버 추가에 실패했습니다.');
        }
      } else {
        setModalError('멤버 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('멤버 추가 실패:', error);
      setModalError('멤버 추가에 실패했습니다.');
    }
  };

  // 멤버 권한 변경
  const handleUpdateMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/members/${editingMember.userId}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: newMemberRoleForEdit
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          showToast('멤버 권한이 성공적으로 변경되었습니다.', 'success');
          setShowMemberRoleModal(false);
          setEditingMember(null);
          setNewMemberRoleForEdit('MEMBER');
          // 팀 정보 새로고침
          await fetchTeamInfo();
          
          // 사이드바 새로고침을 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('teamUpdated'));
        } else {
          showToast(result.msg || '멤버 권한 변경에 실패했습니다.', 'error');
        }
      } else {
        showToast('멤버 권한 변경에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('멤버 권한 변경 실패:', error);
      showToast('멤버 권한 변경에 실패했습니다.', 'error');
    }
  };

  // 팀 정보 수정
  const handleUpdateTeamInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTeam.teamName.trim()) {
      showToast('팀 이름을 입력해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}`, {
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
          setEditingTeam({ teamName: '', description: '' });
          await fetchTeamInfo();
          
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
  };

  // 팀 정보 수정 모달 열기
  const openTeamEditModal = () => {
    if (team) {
      setEditingTeam({
        teamName: team.teamName,
        description: team.description
      });
      setShowTeamEditModal(true);
    }
  };

  // 멤버 삭제
  const handleDeleteMember = async (memberId: number, memberNickname: string) => {
    if (!confirm(`정말로 ${memberNickname}을(를) 팀에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          showToast('멤버가 성공적으로 제거되었습니다.', 'success');
          await fetchTeamInfo();
          
          // 담당자 정보 캐시 초기화
          setAssigneeMap(new Map());
          setAssigneesMap(new Map());
          
          // 선택된 할일이 있다면 담당자 정보 즉시 새로고침
          if (selectedTodo) {
            // 로딩 상태 미리 설정
            setAssigneeLoadingMap(prev => new Map(prev.set(selectedTodo.id, true)));
            
            // 즉시 새로고침 (setTimeout 제거)
            await checkAssigneeStatus(selectedTodo.id);
            await fetchTodoAssignees(selectedTodo.id);
          }
          
          // 사이드바 새로고침을 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('teamUpdated'));
        } else {
          showToast(result.msg || '멤버 제거에 실패했습니다.', 'error');
        }
      } else {
        showToast('멤버 제거에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('멤버 제거 실패:', error);
      showToast('멤버 제거에 실패했습니다.', 'error');
    }
  };

  // 팀 삭제
  const handleDeleteTeam = async () => {
    if (!confirm('정말로 이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          showToast('팀이 성공적으로 삭제되었습니다.', 'success');
          router.push('/teams');
        } else {
          showToast(result.msg || '팀 삭제에 실패했습니다.', 'error');
        }
      } else {
        showToast('팀 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('팀 삭제 실패:', error);
      showToast('팀 삭제에 실패했습니다.', 'error');
    }
  };

  // 멤버 권한 변경 모달 열기
  const openMemberRoleModal = (member: TeamMemberResponseDto) => {
    setEditingMember(member);
    setNewMemberRoleForEdit(member.role);
    setShowMemberRoleModal(true);
  };

  // 사용자 정보 가져오기
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
      console.log('사용자 정보 가져오기 실패');
    }
  };

  // 팀 정보 가져오기
  const fetchTeamInfo = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.resultCode === '200-OK') {
        setTeam(result.data);
      } else {
        throw new Error(result.msg || 'Failed to fetch team');
      }
    } catch (error) {
      console.error('팀 정보 가져오기 실패:', error);
      setError('팀 정보를 가져오는데 실패했습니다.');
    }
  };

  // 팀 할일 목록 가져오기
  const fetchTodoLists = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todo-lists`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.resultCode === '200-OK') {
        setTodoLists(result.data);
      } else {
        throw new Error(result.msg || 'Failed to fetch todo lists');
      }
    } catch (error) {
      console.error('할일 목록 가져오기 실패:', error);
      setError('할일 목록을 가져오는데 실패했습니다.');
    }
  };

    // 할일 목록별 할일 가져오기
  const fetchTodosByList = async (todoListId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todo-lists/${todoListId}/todos`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK') {
        setTodos(result.data);
        setSelectedTodo(null); // 할일 목록 변경 시 선택된 할일 초기화
      } else {
        throw new Error(result.msg || 'Failed to fetch todos');
      }
    } catch (error) {
      console.error('할일 가져오기 실패:', error);
      setError('할일을 가져오는데 실패했습니다.');
    }
  };

  // 할일 목록 생성
  const handleCreateTodoList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodoList.name.trim()) {
      showToast('할일 목록 이름을 입력해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todo-lists`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTodoList)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK') {
        showToast('할일 목록이 성공적으로 생성되었습니다.', 'success');
        setNewTodoList({ name: '', description: '' });
        setShowTodoListModal(false);
        fetchTodoLists();
      } else {
        throw new Error(result.msg || 'Failed to create todo list');
      }
    } catch (error) {
      console.error('할일 목록 생성 실패:', error);
      showToast('할일 목록 생성에 실패했습니다.', 'error');
    }
  };

  // 할일 목록 수정
  const handleUpdateTodoList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTodoList || !editingTodoList.name.trim()) {
      showToast('할일 목록 이름을 입력해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todo-lists/${editingTodoList.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingTodoList.name,
          description: editingTodoList.description
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK') {
        showToast('할일 목록이 성공적으로 수정되었습니다.', 'success');
        setEditingTodoList(null);
        setShowTodoListModal(false);
        fetchTodoLists();
      } else {
        throw new Error(result.msg || 'Failed to update todo list');
      }
    } catch (error) {
      console.error('할일 목록 수정 실패:', error);
      showToast('할일 목록 수정에 실패했습니다.', 'error');
    }
  };

  // 할일 목록 삭제
  const handleDeleteTodoList = async (todoListId: number) => {
    if (!confirm('정말로 이 할일 목록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todo-lists/${todoListId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK') {
        showToast('할일 목록이 성공적으로 삭제되었습니다.', 'success');
        if (selectedTodoList?.id === todoListId) {
          setSelectedTodoList(null);
          setTodos([]);
          setSelectedTodo(null);
        }
        fetchTodoLists();
      } else {
        throw new Error(result.msg || 'Failed to delete todo list');
      }
    } catch (error) {
      console.error('할일 목록 삭제 실패:', error);
      showToast('할일 목록 삭제에 실패했습니다.', 'error');
    }
  };

    // 할일 추가
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTodoList || !newTodo.title.trim()) {
      showToast('할일 제목을 입력해주세요.', 'error');
      return;
    }

    try {
      // 먼저 할일을 생성
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todo-lists/${selectedTodoList.id}/todos`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTodo,
          dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).toISOString() : null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK') {
        const newTodoId = result.data.id;
        
        // 담당자가 선택된 경우 담당자 지정
        if (newTodoAssignees.length > 0) {
          try {
            const assignResponse = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${newTodoId}/assignees`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ assignedUserIds: newTodoAssignees })
            });

            if (assignResponse.ok) {
              const assignResult = await assignResponse.json();
              if (assignResult.resultCode === '200-OK') {
                showToast('할일이 성공적으로 추가되었습니다.', 'success');
              }
            }
          } catch (assignError) {
            console.error('담당자 지정 실패:', assignError);
            showToast('할일은 추가되었지만 담당자 지정에 실패했습니다.', 'error');
          }
        } else {
          showToast('할일이 성공적으로 추가되었습니다.', 'success');
        }

        setNewTodo({ title: '', description: '', priority: 2, assignedMemberId: null, dueDate: '' });
        setNewTodoAssignees([]);
        setShowTodoModal(false);
        fetchTodosByList(selectedTodoList.id);
      } else {
        throw new Error(result.msg || 'Failed to add todo');
      }
    } catch (error) {
      console.error('할일 추가 실패:', error);
      showToast('할일 추가에 실패했습니다.', 'error');
    }
  };

  // 할일 수정
  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTodo || !editingTodo.title.trim()) {
      showToast('할일 제목을 입력해주세요.', 'error');
      return;
    }

    try {
      // 먼저 할일 정보 수정
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${editingTodo.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingTodo.title,
          description: editingTodo.description,
          priority: editingTodo.priority,
          dueDate: editingTodo.dueDate ? new Date(editingTodo.dueDate).toISOString() : null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK') {
        // 담당자 정보 업데이트
          try {
          const assignResponse = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${editingTodo.id}/assignees`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({ assignedUserIds: editingTodoAssignees })
            });

            if (assignResponse.ok) {
              const assignResult = await assignResponse.json();
              if (assignResult.resultCode === '200-OK') {
              showToast('할일이 성공적으로 수정되었습니다.', 'success');
              }
            }
          } catch (assignError) {
          console.error('담당자 업데이트 실패:', assignError);
          showToast('할일은 수정되었지만 담당자 업데이트에 실패했습니다.', 'error');
        }

        setEditingTodo(null);
        setEditingTodoAssignees([]);
        setShowTodoModal(false);
        if (selectedTodoList) {
          fetchTodosByList(selectedTodoList.id);
        }
        
        // 선택된 할일이 있다면 권한 상태 새로고침
        if (selectedTodo) {
          await checkAssigneeStatus(selectedTodo.id);
          await fetchTodoAssignees(selectedTodo.id);
        }
      } else {
        throw new Error(result.msg || 'Failed to update todo');
      }
    } catch (error) {
      console.error('할일 수정 실패:', error);
      showToast('할일 수정에 실패했습니다.', 'error');
    }
  };

  // 할일 삭제
  const handleDeleteTodo = async (todoId: number) => {
    if (!confirm('정말로 이 할일을 삭제하시겠습니까?')) {
      return;
    }

    console.log('삭제 요청 시작:', todoId);

    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${todoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      console.log('삭제 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('삭제 오류 응답:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('삭제 성공 응답:', result);

      if (result.resultCode === '200-OK') {
        showToast('할일이 성공적으로 삭제되었습니다.', 'success');
        if (selectedTodo?.id === todoId) {
          setSelectedTodo(null);
        }
        if (selectedTodoList) {
          fetchTodosByList(selectedTodoList.id);
        }
      } else {
        throw new Error(result.msg || 'Failed to delete todo');
      }
    } catch (error) {
      console.error('할일 삭제 실패:', error);
      showToast('할일 삭제에 실패했습니다.', 'error');
    }
  };

  // 할일 완료 상태 토글
  const handleToggleTodoComplete = async (todoId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${todoId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.resultCode === '200-OK') {
        // 로컬 상태 업데이트
        setTodos(prevTodos => 
          prevTodos.map(todo => 
            todo.id === todoId 
              ? { ...todo, completed: !todo.completed }
              : todo
          )
        );
        
        // 선택된 할일이 같은 할일이면 업데이트
        if (selectedTodo?.id === todoId) {
          setSelectedTodo(prev => prev ? { ...prev, completed: !prev.completed } : null);
        }
      } else {
        throw new Error(result.msg || 'Failed to toggle todo');
      }
    } catch (error) {
      console.error('할일 상태 변경 실패:', error);
      showToast('할일 상태 변경에 실패했습니다.', 'error');
    }
  };

  // 할일 목록 선택
  const handleSelectTodoList = (todoList: TodoList) => {
    setSelectedTodoList(todoList);
    setSelectedTodo(null); // 할일 목록 변경 시 선택된 할일 초기화
    fetchTodosByList(todoList.id);
  };

  // 할일 선택
  const handleSelectTodo = async (todo: Todo) => {
    setSelectedTodo(todo);
    
    // 로딩 상태 설정
    setAssigneeLoadingMap(prev => new Map(prev.set(todo.id, true)));
    
    // 담당자 정보 가져오기
    try {
      await checkAssigneeStatus(todo.id);
      await fetchTodoAssignees(todo.id);
      
      // 권한 정보가 로드될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`할일 ${todo.id} 권한 상태:`, {
        isAssignee: isTodoAssignee(todo.id),
        assignees: getTodoAssignees(todo.id),
        assigneeMap: assigneeMap,
        assigneesMap: assigneesMap
      });
    } catch (error) {
      console.error('권한 정보 로드 실패:', error);
    }
  };

  // 할일 목록 편집 모드
  const handleEditTodoList = (todoList: TodoList) => {
    setEditingTodoList(todoList);
    setShowTodoListModal(true);
  };

  // 할일 편집 모드
  const handleEditTodo = async (todo: Todo) => {
    setEditingTodo(todo);
    
    // 현재 담당자 정보 가져오기
    try {
      const response = await fetch(`http://localhost:8080/api/v1/teams/${teamId}/todos/${todo.id}/assignees`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.resultCode === '200-OK') {
          const currentAssigneeIds = result.data.map((assignee: any) => assignee.assignedUserId);
          setEditingTodoAssignees(currentAssigneeIds);
        }
      }
    } catch (error) {
      console.error('담당자 정보 가져오기 실패:', error);
      setEditingTodoAssignees([]);
    }
    
    setShowTodoModal(true);
  };

  // 우선순위 문자열 변환
  const getPriorityString = (priority: number): string => {
    switch (priority) {
      case 1: return '높음';
      case 2: return '보통';
      case 3: return '낮음';
      default: return '보통';
    }
  };

  // 우선순위 색상
  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 사용자 역할 가져오기
  const getUserRole = (): 'LEADER' | 'MEMBER' | null => {
    if (!team || !currentUser) return null;
    const member = team.members.find(m => m.userId === currentUser.id);
    return member ? member.role : null;
  };

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          getCurrentUser(),
          fetchTeamInfo(),
          fetchTodoLists()
        ]);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadData();
    }
  }, [teamId]);

  if (loading) {
    return (
      <TodoListTemplate>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 200px)',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid var(--border-light)',
            borderTop: '4px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            팀 정보를 불러오는 중...
          </p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </TodoListTemplate>
    );
  }

  if (error) {
    return (
      <TodoListTemplate>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 200px)',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            오류가 발생했습니다
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            다시 시도
          </button>
        </div>
      </TodoListTemplate>
    );
  }

  if (!team) {
    return (
      <TodoListTemplate>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 200px)',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            팀을 찾을 수 없습니다
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center' }}>
            요청하신 팀이 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            이전 페이지로
          </button>
        </div>
      </TodoListTemplate>
    );
  }

  const userRole = getUserRole();

  return (
    <TodoListTemplate>
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: 'calc(100vh - 120px)',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        gap: '1.5rem'
      }}>
        {/* 왼쪽: 팀 정보 (고정) */}
        <div style={{ 
          width: '25%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px var(--shadow-md)',
            border: '1px solid var(--border-light)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* 뒤로가기 버튼 */}
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => router.back()}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* 팀 기본 정보 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                👥 {team.teamName}
                </h1>
                {userRole === 'LEADER' && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    background: '#fef3c7',
                    color: '#d97706',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    <Crown className="w-3 h-3" />
                    리더
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {team.description}
              </p>
            </div>

            {/* 팀 통계 */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <span style={{
                background: 'var(--primary-light)',
                color: 'var(--primary-color)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                👥 멤버 {team.members.length}명
              </span>
              <span style={{
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                📋 할일목록 {todoLists.length}개
              </span>
              
            </div>

            {/* 팀 멤버 목록 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                👥 팀 멤버
              </h3>
                {userRole === 'LEADER' && (
                  <button
                    onClick={() => setShowMemberAddModal(true)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    멤버 추가
                  </button>
                )}
              </div>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-main)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      minHeight: '100px'
                    }}
                  >
                    {/* 멤버 정보 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>
                        {member.userNickname}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {member.userEmail}
                      </div>
                    </div>
                    </div>

                    {/* 역할과 권한 버튼 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}>
                      {/* 역할 표시 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {member.role === 'LEADER' ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#fef3c7',
                        color: '#d97706',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        리더
                      </span>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: '#f1f5f9',
                            color: '#64748b',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            멤버
                          </span>
                        )}
                      </div>

                      {/* 권한 변경 버튼 (리더만 보임) */}
                      {userRole === 'LEADER' && member.userId !== currentUser?.id && (
                        <div style={{
                          display: 'flex',
                          gap: '0.25rem'
                        }}>
                          <button
                            onClick={() => openMemberRoleModal(member)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'transparent',
                              border: '1px solid var(--border-medium)',
                              color: 'var(--text-secondary)',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Settings className="w-3 h-3" />
                            권한
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.userId, member.userNickname)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'transparent',
                              border: '1px solid #dc2626',
                              color: '#dc2626',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                            제거
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 팀 생성일 */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
              fontSize: '0.75rem',
              color: 'var(--text-light)',
              textAlign: 'center'
            }}>
              생성일: {formatDate(team.createDate)}
            </div>
            
            {/* 팀 관리 버튼들 */}
            {userRole === 'LEADER' && (
              <div style={{
                marginTop: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <button
                  onClick={openTeamEditModal}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                >
                  <Edit className="w-4 h-4" />
                  팀 정보 수정
                </button>
                <button
                  onClick={handleDeleteTeam}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid #dc2626',
                    color: '#dc2626',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  팀 삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 중간: TodoList 목록들 */}
        <div style={{ 
          width: '37.5%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px var(--shadow-md)',
            border: '1px solid var(--border-light)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
                               <h2 style={{
                   fontSize: '1.25rem',
                   fontWeight: '600',
                   color: 'var(--text-primary)',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem'
                 }}>
                   📋 할일 목록 (TodoList)
                 </h2>
              <button
                onClick={() => {
                  setEditingTodoList(null);
                  setShowTodoListModal(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus className="w-4 h-4" />
                목록 추가
              </button>
            </div>
            
            {todoLists.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: '1rem',
                color: 'var(--text-light)',
                border: '2px dashed var(--border-medium)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '3rem' }}>📋</div>
                                   <p style={{ fontSize: '1.1rem' }}>등록된 할일 목록 (TodoList)이 없습니다.</p>
                   <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>새로운 할일 목록 (TodoList)을 만들어보세요!</p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.75rem',
                flex: 1,
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                {todoLists.map((todoList) => (
                  <div
                    key={todoList.id}
                    style={{
                      background: selectedTodoList?.id === todoList.id ? 'var(--primary-light)' : 'var(--bg-main)',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: selectedTodoList?.id === todoList.id 
                        ? '2px solid var(--primary-color)' 
                        : '1px solid var(--border-light)',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => handleSelectTodoList(todoList)}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📋 {todoList.name}
                      </h3>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {todoList.description || '설명이 없습니다.'}
                      </p>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginLeft: '1rem'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTodoList(todoList);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-light)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTodoList(todoList.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-light)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

                 {/* 오른쪽: 선택된 TodoList의 할일들 */}
         <div style={{ 
           width: '37.5%',
           height: '100%',
           display: 'flex',
           flexDirection: 'column'
         }}>
          {!selectedTodoList ? (
            // TodoList가 선택되지 않았을 때
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
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📋</div>
                                 <h3 style={{ 
                   fontSize: '1.25rem', 
                   fontWeight: '600', 
                   marginBottom: '0.5rem',
                   color: 'var(--text-secondary)'
                 }}>
                   할일 목록 (TodoList)을 선택해주세요
                 </h3>
                                   <p style={{ fontSize: '1rem' }}>
                     중간에서 할일 목록 (TodoList)을 선택하면<br />할일 (Todo)들을 관리할 수 있습니다.
                   </p>
              </div>  
            </div>
                     ) : (
             // TodoList는 선택했지만 특정 할일은 선택하지 않았을 때 - 개인 투두리스트와 동일한 레이아웃
               <div style={{
                 background: 'var(--bg-white)',
                 borderRadius: '12px',
                 padding: '1.5rem',
                 boxShadow: '0 4px 12px var(--shadow-md)',
                 border: '1px solid var(--border-light)',
                 height: '100%',
                 display: 'flex',
                 flexDirection: 'column',
                 overflow: 'hidden'
               }}>
              {/* TodoList 정보 헤더 */}
              <div style={{
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-light)'
              }}>
                                 <h1 style={{ 
                   fontSize: '1.75rem', 
                   fontWeight: '700', 
                   color: 'var(--text-primary)', 
                   marginBottom: '0.5rem' 
                 }}>
                   📝 {selectedTodoList.name}
                 </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
                  {selectedTodoList.description || '설명이 없습니다.'}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  flexWrap: 'wrap'
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
                    완료 {todos.filter(t => t.completed).length}개
                  </span>
                  <span style={{
                    background: '#fefce8',
                    color: '#eab308',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    진행중 {todos.filter(t => !t.completed).length}개
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-light)',
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <span>생성일: {formatDate(selectedTodoList.createDate)}</span>
                  <span>수정일: {formatDate(selectedTodoList.modifyDate)}</span>
                </div>
              </div>

              {/* 할일 목록 */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
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
                   📝 할 일 목록 (Todo)
                 </h2>
                
                {todos.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    gap: '1rem',
                    color: 'var(--text-light)',
                    border: '2px dashed var(--border-medium)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '3rem' }}>📝</div>
                    <p style={{ fontSize: '1.1rem' }}>등록된 할일 (Todo)이 없습니다.</p>
                  </div>
                ) : (
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
                    {todos.map((todo) => (
                      <div
                        key={todo.id}
                        style={{
                          background: (selectedTodo && (selectedTodo as Todo).id === todo.id) ? 'var(--primary-light)' : 'var(--bg-main)',
                          borderRadius: '8px',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderLeft: `4px solid ${
                            todo.priority === 1 ? '#dc2626' : 
                            todo.priority === 2 ? '#eab308' : 
                            '#2563eb'
                          }`,
                          border: (selectedTodo && (selectedTodo as Todo).id === todo.id) 
                            ? '2px solid var(--primary-color)' 
                            : '1px solid var(--border-light)',
                          minHeight: '120px',
                          maxHeight: '120px',
                          overflow: 'hidden',
                          width: '100%'
                        }}
                        onClick={() => handleSelectTodo(todo)}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          {(() => {
                            const assignees = getTodoAssignees(todo.id);
                            const isAssignee = isTodoAssignee(todo.id);
                            const hasPermission = assignees.length === 0 || isAssignee;
                            console.log(`목록 권한 체크 - 할일 ${todo.id}:`, { assignees, isAssignee, hasPermission });
                            return hasPermission;
                          })() && (
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleTodoComplete(todo.id);
                            }}
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              marginTop: '0.125rem',
                              accentColor: 'var(--primary-color)'
                            }}
                          />
                          )}
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontWeight: '600',
                              fontSize: '1rem',
                              color: todo.completed ? 'var(--text-light)' : 'var(--text-primary)',
                              textDecoration: todo.completed ? 'line-through' : 'none',
                              marginBottom: '0.5rem',
                              lineHeight: '1.4',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
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
                              textOverflow: 'ellipsis',
                              height: '2.4em',
                              maxHeight: '2.4em'
                            }}>
                              {todo.description || '설명이 없습니다.'}
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
                                background: todo.priority === 1 ? '#fef2f2' : 
                                          todo.priority === 2 ? '#fefce8' : '#eff6ff',
                                color: todo.priority === 1 ? '#dc2626' : 
                                       todo.priority === 2 ? '#eab308' : '#2563eb'
                              }}>
                                {getPriorityString(todo.priority)}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-light)',
                                fontWeight: '500'
                              }}>
                                📅 {formatDate(todo.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                                 {/* 할일 추가 버튼 */}
                 <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                   <button
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       setEditingTodo(null);
                       setShowTodoModal(true);
                     }}
                     style={{
                       width: '100%',
                       padding: '1rem',
                       background: 'var(--primary-color)',
                       color: 'white',
                       border: 'none',
                       borderRadius: '8px',
                       fontSize: '1rem',
                       fontWeight: '600',
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       gap: '0.5rem'
                     }}
                   >
                     ➕ 새 할 일 추가
                   </button>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* 맨 오른쪽: 선택된 할일 상세 정보 */}
        <div style={{ 
          width: '37.5%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {!selectedTodo ? (
            // 할일이 선택되지 않았을 때
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
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📝</div>
                                 <h3 style={{ 
                   fontSize: '1.25rem', 
                   fontWeight: '600', 
                   marginBottom: '0.5rem',
                   color: 'var(--text-secondary)'
                 }}>
                   할일 (Todo)을 선택해주세요
                 </h3>
                                   <p style={{ fontSize: '1rem' }}>
                     오른쪽에서 할일 (Todo)을 클릭하면<br />상세 정보가 표시됩니다.
                   </p>
              </div>  
            </div>
          ) : (
            // 선택된 할일 상세 정보
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
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                  {(() => {
                    const assignees = getTodoAssignees(selectedTodo.id);
                    const isAssignee = isTodoAssignee(selectedTodo.id);
                    const hasPermission = assignees.length === 0 || isAssignee;
                    console.log(`권한 체크 - 할일 ${selectedTodo.id}:`, { assignees, isAssignee, hasPermission });
                    return hasPermission;
                  })() && (
                  <input
                    type="checkbox"
                    checked={selectedTodo.completed}
                    onChange={() => handleToggleTodoComplete(selectedTodo.id)}
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      marginTop: '0.25rem',
                      accentColor: 'var(--primary-color)',
                      transform: 'scale(1.3)'
                    }}
                  />
                  )}
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: selectedTodo.completed ? 'var(--text-light)' : 'var(--text-primary)',
                      textDecoration: selectedTodo.completed ? 'line-through' : 'none',
                      lineHeight: '1.3',
                      wordBreak: 'break-word'
                    }}>
                      {selectedTodo.title}
                    </h2>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem',
                flex: 1,
                overflowY: 'auto'
              }}>
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
                    wordBreak: 'break-word',
                    minHeight: '60px',
                    margin: 0
                  }}>
                    {selectedTodo.description || '설명이 없습니다.'}
                  </p>
                </div>

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
                      background: selectedTodo.priority === 1 ? '#fef2f2' : 
                                selectedTodo.priority === 2 ? '#fefce8' : '#eff6ff',
                      color: selectedTodo.priority === 1 ? '#dc2626' : 
                             selectedTodo.priority === 2 ? '#eab308' : '#2563eb'
                    }}>
                      {getPriorityString(selectedTodo.priority)}
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
                      background: selectedTodo.completed ? '#f0fdf4' : '#fefce8',
                      color: selectedTodo.completed ? '#16a34a' : '#eab308'
                    }}>
                      {selectedTodo.completed ? '✅ 완료' : '⏳ 진행중'}
                    </span>
                  </div>
                </div>

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
                    <div style={{ 
                      color: 'var(--text-primary)', 
                      fontSize: '0.9rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)'
                    }}>
                      {formatDate(selectedTodo.createdAt)}
                    </div>
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
                    <div style={{ 
                      color: 'var(--text-primary)', 
                      fontSize: '0.9rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)'
                    }}>
                      {formatDate(selectedTodo.updatedAt)}
                    </div>
                  </div>
                </div>
                
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
                      📅 마감기한
                    </label>
                    <div style={{ 
                      color: selectedTodo.dueDate ? 'var(--text-primary)' : 'var(--text-light)', 
                      fontSize: '0.9rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      fontStyle: selectedTodo.dueDate ? 'normal' : 'italic'
                    }}>
                      {selectedTodo.dueDate ? formatDate(selectedTodo.dueDate) : '설정되지 않음'}
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem'
                    }}>
                      👤 담당자
                    </label>
                    <div style={{ 
                      fontSize: '0.9rem',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      minHeight: '60px'
                    }}>
                      {(() => {
                        const isLoading = assigneeLoadingMap.get(selectedTodo.id);
                        const assignees = getTodoAssignees(selectedTodo.id);
                        
                        // 로딩 중이거나 로딩 상태가 undefined인 경우 아무것도 표시하지 않음
                        if (isLoading === true || isLoading === undefined) {
                          return null;
                        }
                        
                        // 담당자가 있으면 표시
                        if (assignees.length > 0) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {assignees.map((assignee: any, index: number) => (
                                <div key={index} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem',
                                  color: 'var(--text-primary)'
                                }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#3b82f6'
                                  }}></div>
                                  {assignee.assignedUserNickname || '담당자'}
                    </div>
                              ))}
                  </div>
                          );
                        }
                        
                        // 담당자가 없으면 "지정되지 않음" 표시
                        return (
                          <div style={{ 
                            color: 'var(--text-light)', 
                            fontStyle: 'italic'
                          }}>
                            지정되지 않음
                </div>
                        );
                      })()}
              </div>
            </div>
                </div>

                {/* 권한 경고 메시지 */}
                {!isTodoAssignee(selectedTodo.id) && getTodoAssignees(selectedTodo.id).length > 0 && (
                  <div style={{
                    background: '#fef3c7',
                    color: '#d97706',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    border: '1px solid #fbbf24'
                  }}>
                    ⚠️ 이 할일의 담당자만 수정/삭제할 수 있습니다.
                  </div>
                )}

                {/* 담당자 지정 버튼 */}
                <div style={{ marginBottom: '1rem' }}>
                  <button
                    onClick={() => openAssigneeModal()}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    👥 담당자 지정
                  </button>
                </div>

                {/* 수정/삭제 버튼들 */}
                {(() => {
                  const assignees = getTodoAssignees(selectedTodo.id);
                  const isAssignee = isTodoAssignee(selectedTodo.id);
                  const hasPermission = assignees.length === 0 || isAssignee;
                  console.log(`버튼 권한 체크 - 할일 ${selectedTodo.id}:`, { assignees, isAssignee, hasPermission });
                  return hasPermission;
                })() && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <button
                      onClick={() => handleEditTodo(selectedTodo)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 1rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(selectedTodo.id)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 1rem',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 할일 목록 생성/수정 모달 */}
      {showTodoListModal && (
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
                {editingTodoList ? '할일 목록 수정' : '새 할일 목록 만들기'}
              </h3>
              <button
                onClick={() => {
                  setShowTodoListModal(false);
                  setEditingTodoList(null);
                  setNewTodoList({ name: '', description: '' });
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
            <form onSubmit={editingTodoList ? handleUpdateTodoList : handleCreateTodoList}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    목록 이름 *
                  </label>
                  <input
                    type="text"
                    value={editingTodoList ? editingTodoList.name : newTodoList.name}
                    onChange={(e) => {
                      if (editingTodoList) {
                        setEditingTodoList({ ...editingTodoList, name: e.target.value });
                      } else {
                        setNewTodoList({ ...newTodoList, name: e.target.value });
                      }
                    }}
                    placeholder="할일 목록 이름을 입력하세요"
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
                    설명
                  </label>
                  <textarea
                    value={editingTodoList ? editingTodoList.description : newTodoList.description}
                    onChange={(e) => {
                      if (editingTodoList) {
                        setEditingTodoList({ ...editingTodoList, description: e.target.value });
                      } else {
                        setNewTodoList({ ...newTodoList, description: e.target.value });
                      }
                    }}
                    placeholder="할일 목록에 대한 설명을 입력하세요"
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
                    setShowTodoListModal(false);
                    setEditingTodoList(null);
                    setNewTodoList({ name: '', description: '' });
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
                  {editingTodoList ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 담당자 지정 모달 */}
      {showAssigneeModal && selectedTodo && (
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
                👥 담당자 지정
              </h3>
              <button
                onClick={async () => {
                  setShowAssigneeModal(false);
                  setSelectedAssigneeIds([]);
                  
                  // 담당자 변경 후 권한 상태 새로고침
                  if (selectedTodo) {
                    await checkAssigneeStatus(selectedTodo.id);
                    await fetchTodoAssignees(selectedTodo.id);
                  }
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
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                marginBottom: '1rem'
              }}>
                "{selectedTodo.title}" 할일의 담당자를 선택해주세요.
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {team?.members.map((member) => (
                                     <label key={member.id} style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.75rem',
                     padding: '0.75rem',
                     border: selectedAssigneeIds.includes(member.userId) ? '2px solid var(--primary-color)' : '1px solid var(--border-light)',
                     borderRadius: '8px',
                     cursor: 'pointer',
                     background: selectedAssigneeIds.includes(member.userId) ? 'var(--primary-light)' : 'transparent',
                     transition: 'all 0.2s ease'
                   }}>
                    <input
                      type="checkbox"
                      checked={selectedAssigneeIds.includes(member.userId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssigneeIds(prev => [...prev, member.userId]);
                        } else {
                          setSelectedAssigneeIds(prev => prev.filter(id => id !== member.userId));
                        }
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--primary-color)'
                      }}
                    />
                    <div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>
                        {member.userNickname}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {member.userEmail}
                      </div>
                    </div>
                  </label>
                ))}
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
                  setShowAssigneeModal(false);
                  setSelectedAssigneeIds([]);
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
                onClick={handleAssignMultipleAssignees}
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
                지정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멤버 권한 변경 모달 */}
      {showMemberRoleModal && editingMember && (
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
                👤 멤버 권한 변경
              </h3>
              <button
                onClick={() => {
                  setShowMemberRoleModal(false);
                  setEditingMember(null);
                  setNewMemberRoleForEdit('MEMBER');
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
            <form onSubmit={handleUpdateMemberRole}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    멤버 정보
                  </label>
                  <div style={{
                    background: 'var(--bg-main)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      {editingMember.userNickname}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {editingMember.userEmail}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    역할 *
                  </label>
                  <select
                    value={newMemberRoleForEdit}
                    onChange={(e) => setNewMemberRoleForEdit(e.target.value as 'LEADER' | 'MEMBER')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      background: 'white'
                    }}
                  >
                    <option value="MEMBER">멤버</option>
                    <option value="LEADER">리더</option>
                  </select>
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
                    setShowMemberRoleModal(false);
                    setEditingMember(null);
                    setNewMemberRoleForEdit('MEMBER');
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
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 팀 정보 수정 모달 */}
      {showTeamEditModal && (
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
                  setEditingTeam({ teamName: '', description: '' });
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
                    setEditingTeam({ teamName: '', description: '' });
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

      {/* 멤버 추가 모달 */}
      {showMemberAddModal && (
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
                👥 팀 멤버 추가
              </h3>
              <button
                onClick={() => {
                  setShowMemberAddModal(false);
                  setNewMemberEmail('');
                  setModalError('');
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
            <form onSubmit={handleAddTeamMember}>
              <div style={{ padding: '1.5rem' }}>
                {modalError && (
                  <div style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    border: '1px solid #fecaca'
                  }}>
                    {modalError}
                  </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    이메일 주소 *
                  </label>
                                     <input
                     type="email"
                     value={newMemberEmail}
                     onChange={(e) => setNewMemberEmail(e.target.value)}
                     placeholder="초대할 멤버의 이메일을 입력하세요"
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
                     역할 *
                   </label>
                   <select
                     value={newMemberRole}
                     onChange={(e) => setNewMemberRole(e.target.value as 'LEADER' | 'MEMBER')}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid var(--border-light)',
                       borderRadius: '8px',
                       fontSize: '0.95rem',
                       background: 'white'
                     }}
                   >
                     <option value="MEMBER">멤버</option>
                     <option value="LEADER">리더</option>
                   </select>
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
                    setShowMemberAddModal(false);
                    setNewMemberEmail('');
                    setNewMemberRole('MEMBER');
                    setModalError('');
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
                  초대하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 할일 생성/수정 모달 */}
      {showTodoModal && (
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
                {editingTodo ? '할일 수정' : '새 할일 만들기'}
              </h3>
              <button
                onClick={() => {
                  setShowTodoModal(false);
                  setEditingTodo(null);
                  setNewTodo({ title: '', description: '', priority: 2, assignedMemberId: null, dueDate: '' });
                  setNewTodoAssignees([]);
                  setEditingTodoAssignees([]);
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
            <form onSubmit={editingTodo ? handleUpdateTodo : handleAddTodo}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={editingTodo ? editingTodo.title : newTodo.title}
                    onChange={(e) => {
                      if (editingTodo) {
                        setEditingTodo({ ...editingTodo, title: e.target.value });
                      } else {
                        setNewTodo({ ...newTodo, title: e.target.value });
                      }
                    }}
                    placeholder="할일 제목을 입력하세요"
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
                    설명
                  </label>
                  <textarea
                    value={editingTodo ? editingTodo.description : newTodo.description}
                    onChange={(e) => {
                      if (editingTodo) {
                        setEditingTodo({ ...editingTodo, description: e.target.value });
                      } else {
                        setNewTodo({ ...newTodo, description: e.target.value });
                      }
                    }}
                    placeholder="할일에 대한 설명을 입력하세요"
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
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    우선순위
                  </label>
                  <select
                    value={editingTodo ? editingTodo.priority : newTodo.priority}
                    onChange={(e) => {
                      const priority = parseInt(e.target.value);
                      if (editingTodo) {
                        setEditingTodo({ ...editingTodo, priority });
                      } else {
                        setNewTodo({ ...newTodo, priority });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      background: 'white'
                    }}
                  >
                    <option value={1}>높음</option>
                    <option value={2}>보통</option>
                    <option value={3}>낮음</option>
                  </select>
                </div>
                
                {/* 담당멤버 선택 */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    담당멤버 (여러 명 선택 가능)
                  </label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    background: 'white'
                  }}>
                    {team?.members.map((member) => (
                      <label key={member.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        background: (editingTodo ? editingTodoAssignees : newTodoAssignees).includes(member.userId) ? 'var(--primary-light)' : 'transparent'
                      }}>
                        <input
                          type="checkbox"
                          checked={(editingTodo ? editingTodoAssignees : newTodoAssignees).includes(member.userId)}
                    onChange={(e) => {
                              if (e.target.checked) {
                      if (editingTodo) {
                                  setEditingTodoAssignees(prev => [...prev, member.userId]);
                      } else {
                                  setNewTodoAssignees(prev => [...prev, member.userId]);
                                }
                              } else {
                                if (editingTodo) {
                                  setEditingTodoAssignees(prev => prev.filter(id => id !== member.userId));
                                } else {
                                  setNewTodoAssignees(prev => prev.filter(id => id !== member.userId));
                                }
                      }
                    }}
                    style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--primary-color)'
                          }}
                        />
                        <div>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>
                            {member.userNickname}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)'
                          }}>
                            {member.userEmail}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* 마감기한 선택 */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    마감기한
                  </label>
                  <input
                    type="datetime-local"
                    value={editingTodo ? editingTodo.dueDate || '' : newTodo.dueDate || ''}
                    onChange={(e) => {
                      if (editingTodo) {
                        setEditingTodo({ ...editingTodo, dueDate: e.target.value });
                      } else {
                        setNewTodo({ ...newTodo, dueDate: e.target.value });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      fontSize: '0.95rem'
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
                    setShowTodoModal(false);
                    setEditingTodo(null);
                    setNewTodo({ title: '', description: '', priority: 2, assignedMemberId: null, dueDate: '' });
                    setNewTodoAssignees([]);
                    setEditingTodoAssignees([]);
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
                  {editingTodo ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TodoListTemplate>
  );
};

export default TeamDetailPage;