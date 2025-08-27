package com.tododuk.domain.team.service;

import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.team.entity.TeamMember;
import com.tododuk.domain.team.repository.TeamMemberRepository;
import com.tododuk.domain.team.repository.TeamRepository;
import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.repository.UserRepository;
import com.tododuk.global.rsData.RsData;
import com.tododuk.global.exception.ServiceException;
import com.tododuk.domain.team.dto.TeamCreateRequestDto;
import com.tododuk.domain.team.dto.TeamResponseDto;
import com.tododuk.domain.team.dto.TeamMemberResponseDto;
import com.tododuk.domain.team.dto.TeamMemberAddRequestDto;
import com.tododuk.domain.team.dto.TeamMemberUpdateRequestDto;
import com.tododuk.domain.team.dto.TeamUpdateRequestDto;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.todo.repository.TodoRepository;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.domain.todoList.repository.TodoListRepository;
import com.tododuk.domain.team.entity.TodoAssignment;
import com.tododuk.domain.team.repository.TodoAssignmentRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final TeamMemberService teamMemberService;
    private final TodoRepository todoRepository;
    private final TodoListRepository todoListRepository;
    private final TodoAssignmentRepository todoAssignmentRepository;

    // 1. 팀 생성
    @Transactional
    public RsData<TeamResponseDto> createTeam(TeamCreateRequestDto dto, int creatorUserId) {
        System.out.println("=== 팀 생성 시작 ===");
        System.out.println("생성자 ID: " + creatorUserId);
        
        User creatorUser = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다. ID: " + creatorUserId));
        
        System.out.println("생성자 정보: " + creatorUser.getUserEmail());

        Team team = new Team();
        team.setTeamName(dto.getTeamName());
        team.setDescription(dto.getDescription());
        teamRepository.save(team);
        System.out.println("팀 생성 완료, 팀 ID: " + team.getId());
        
        TeamMember leaderMember = teamMemberService.createLeaderMember(team, creatorUser);
        System.out.println("리더 멤버 생성 완료, 멤버 ID: " + leaderMember.getId());
        
        // 멤버가 실제로 추가되었는지 확인
        boolean isMemberExists = teamMemberRepository.existsByTeam_IdAndUser_Id(team.getId(), creatorUserId);
        System.out.println("멤버 존재 확인: " + isMemberExists);
        
        return RsData.success("팀이 성공적으로 생성되었습니다.", TeamResponseDto.from(team));
    }

    // 2. 사용자가 속한 팀 목록 조회
    public RsData<List<TeamResponseDto>> getMyTeams(int userId) {
        List<Team> teams = teamRepository.findTeamsByUserId(userId);
        
        if (teams.isEmpty()) {
            return RsData.success("속한 팀이 없습니다.", List.of());
        }
        
        // 각 팀의 멤버 정보를 명시적으로 로드
        List<TeamResponseDto> teamResponseDtos = teams.stream()
                .map(team -> {
                    // 팀의 멤버 정보를 명시적으로 로드
                    Team teamWithMembers = teamRepository.findByIdWithMembers(team.getId()).orElse(team);
                    return TeamResponseDto.from(teamWithMembers);
                })
                .collect(Collectors.toList());
        
        return RsData.success("팀 목록 조회 성공", teamResponseDtos);
    }

    // 사용자 ID로 팀 목록 조회 (컨트롤러에서 사용)
    public List<Team> getTeamsByUserId(int userId) {
        return teamRepository.findTeamsByUserId(userId);
    }

    // 모든 팀 목록 조회 (관리자용)
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    // 3. 특정 팀 상세 조회
    public RsData<TeamResponseDto> getTeamDetails(int teamId, int viewerUserId) {
        System.out.println("=== 팀 상세 조회 시작 ===");
        System.out.println("팀 ID: " + teamId);
        System.out.println("조회자 ID: " + viewerUserId);
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: " + teamId));

        boolean isMember = teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, viewerUserId);
        System.out.println("멤버 여부 확인: " + isMember);
        
        if (!isMember) {
            System.out.println("멤버가 아님 - 권한 없음");
            throw new ServiceException("403-NO_PERMISSION", "해당 팀의 정보를 조회할 권한이 없습니다.");
        }

        System.out.println("멤버 확인됨 - 상세 정보 반환");
        return RsData.success("팀 상세 정보 조회 성공", TeamResponseDto.from(team));
    }

    // 4. 팀 정보 수정 (PATCH)
    @Transactional
    public RsData<TeamResponseDto> updateTeamInfo(int teamId, TeamUpdateRequestDto dto, int modifierUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: " + teamId));

        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, modifierUserId, TeamRoleType.LEADER)) {
            throw new ServiceException("403-NO_PERMISSION", "팀 정보를 수정할 권한이 없습니다.");
        }

        team.updateTeam(dto.getTeamName(), dto.getDescription());
        teamRepository.save(team);
        return RsData.success("팀 정보가 성공적으로 수정되었습니다.", TeamResponseDto.from(team));
    }

    // 5. 팀 삭제
    @Transactional
    public RsData<Void> deleteTeam(int teamId, int deleterUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: " + teamId));

        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, deleterUserId, TeamRoleType.LEADER)) {
            throw new ServiceException("403-NO_PERMISSION", "팀을 삭제할 권한이 없습니다.");
        }

        // 팀과 관련된 모든 TodoAssignment 레코드 삭제
        todoAssignmentRepository.deleteByTeam_Id(teamId);
        
        // 팀과 관련된 모든 TodoList 삭제 (Todo는 cascade로 자동 삭제됨)
        List<TodoList> teamTodoLists = todoListRepository.findByTeamId(teamId);
        for (TodoList todoList : teamTodoLists) {
            // 각 TodoList의 Todo들에 대한 TodoAssignment 레코드들 삭제
            List<Todo> todos = todoRepository.findByTodoListId(todoList.getId());
            for (Todo todo : todos) {
                todoAssignmentRepository.deleteByTodo_Id(todo.getId());
            }
            // TodoList 삭제 (Todo는 cascade로 자동 삭제됨)
            todoListRepository.delete(todoList);
        }
        
        // 팀 삭제 (TeamMember는 cascade로 자동 삭제됨)
        teamRepository.delete(team);
        
        return RsData.success("팀이 성공적으로 삭제되었습니다.", null);
    }

    // 6. 팀 할일 목록 조회
    public RsData<List<Map<String, Object>>> getTeamTodos(int teamId, int userId) {
        // 팀 멤버 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ServiceException("403-NO_PERMISSION", "해당 팀의 할일 목록을 조회할 권한이 없습니다.");
        }

        // TodoList 조회 또는 생성
        TodoList todoList = todoListRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseGet(() -> {
                // 없으면 새로 생성
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
                Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다."));
                
                TodoList newList = new TodoList(
                    teamId == 0 ? "개인 할일 목록" : team.getTeamName() + " 할일 목록",
                    teamId == 0 ? "개인적으로 관리하는 할일들" : "팀원들과 함께 관리하는 할일들",
                    user,
                    teamId == 0 ? null : team
                );
                
                return todoListRepository.save(newList);
            });

        // DB에서 해당 TodoList의 할일 목록 조회
        List<Todo> todos = todoRepository.findAllByTodoListId(todoList.getId());
        
        // Map 형태로 변환
        List<Map<String, Object>> todoMaps = todos.stream()
            .map(todo -> {
                Map<String, Object> todoMap = new HashMap<>();
                todoMap.put("id", todo.getId());
                todoMap.put("title", todo.getTitle());
                todoMap.put("description", todo.getDescription());
                todoMap.put("isCompleted", todo.isCompleted());
                todoMap.put("priority", todo.getPriority());
                todoMap.put("dueDate", todo.getDueDate());
                todoMap.put("assignedMemberId", null); // Todo 엔티티에는 assignedMemberId가 없으므로 null
                todoMap.put("type", teamId == 0 ? "personal" : "team");
                todoMap.put("createdAt", todo.getCreateDate());
                return todoMap;
            })
            .collect(Collectors.toList());

        return RsData.success("할일 목록 조회 성공", todoMaps);
    }

    // 7. 팀 할일 추가
    @Transactional
    public RsData<Map<String, Object>> addTeamTodo(int teamId, int userId, Map<String, Object> todoRequest) {
        // 팀 멤버 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ServiceException("403-NO_PERMISSION", "해당 팀에 할일을 추가할 권한이 없습니다.");
        }

        // TodoList 조회 또는 생성
        TodoList todoList = todoListRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseGet(() -> {
                // 없으면 새로 생성
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
                Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다."));
                
                TodoList newList = new TodoList(
                    teamId == 0 ? "개인 할일 목록" : team.getTeamName() + " 할일 목록",
                    teamId == 0 ? "개인적으로 관리하는 할일들" : "팀원들과 함께 관리하는 할일들",
                    user,
                    teamId == 0 ? null : team
                );
                
                return todoListRepository.save(newList);
            });

        // Todo 엔티티 생성
        Todo todo = Todo.builder()
            .title((String) todoRequest.get("title"))
            .description((String) todoRequest.get("description"))
            .isCompleted(false)
            .priority((Integer) todoRequest.getOrDefault("priority", 1))
            .startDate(LocalDateTime.now())
            .dueDate(todoRequest.get("dueDate") != null ? 
                LocalDateTime.parse(((String) todoRequest.get("dueDate")).replace("Z", "")) : null)
            .todoList(todoList)
            .build();

        // DB에 저장
        Todo savedTodo = todoRepository.save(todo);

        // Map 형태로 변환하여 반환
        Map<String, Object> newTodo = new HashMap<>();
        newTodo.put("id", savedTodo.getId());
        newTodo.put("title", savedTodo.getTitle());
        newTodo.put("description", savedTodo.getDescription());
        newTodo.put("isCompleted", savedTodo.isCompleted());
        newTodo.put("priority", savedTodo.getPriority());
        newTodo.put("dueDate", savedTodo.getDueDate());
        newTodo.put("assignedMemberId", null); // Todo 엔티티에는 assignedMemberId가 없으므로 null
        newTodo.put("type", teamId == 0 ? "personal" : "team");
        newTodo.put("createdAt", savedTodo.getCreateDate());

        return RsData.success("할일 추가 성공", newTodo);
    }

    // 팀별 할일 목록 조회
    public RsData<List<Map<String, Object>>> getTeamTodoLists(int teamId, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        // 팀 객체 조회
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다."));

        // 해당 팀의 할일 목록 조회 (TodoList 엔티티에서 team 필드로 조회)
        List<TodoList> todoLists = todoListRepository.findAll().stream()
                .filter(todoList -> todoList.getTeam() != null && todoList.getTeam().getId() == teamId)
                .collect(Collectors.toList());

        List<Map<String, Object>> response = todoLists.stream()
                .map(todoList -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", todoList.getId());
                    map.put("name", todoList.getName());
                    map.put("description", todoList.getDescription());
                    map.put("userId", todoList.getUser().getId());
                    map.put("teamId", todoList.getTeam().getId());
                    map.put("createDate", todoList.getCreateDate());
                    map.put("modifyDate", todoList.getModifyDate());
                    return map;
                })
                .collect(Collectors.toList());

        return RsData.success("팀 할일 목록 조회 성공", response);
    }

    // 팀 할일 목록 생성
    @Transactional
    public RsData<Map<String, Object>> createTeamTodoList(int teamId, Map<String, Object> todoListRequest, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        // 사용자와 팀 객체 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다."));

        TodoList todoList = new TodoList();
        todoList.setName((String) todoListRequest.get("name"));
        todoList.setDescription((String) todoListRequest.get("description"));
        todoList.setUser(user);
        todoList.setTeam(team);
        todoListRepository.save(todoList);

        Map<String, Object> response = new HashMap<>();
        response.put("id", todoList.getId());
        response.put("name", todoList.getName());
        response.put("description", todoList.getDescription());
        response.put("userId", todoList.getUser().getId());
        response.put("teamId", todoList.getTeam().getId());
        response.put("createDate", todoList.getCreateDate());
        response.put("modifyDate", todoList.getModifyDate());

        return RsData.success("할일 목록이 성공적으로 생성되었습니다.", response);
    }

    // 팀 할일 목록 수정
    @Transactional
    public RsData<Map<String, Object>> updateTeamTodoList(int teamId, int todoListId, Map<String, Object> todoListRequest, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        TodoList todoList = todoListRepository.findById(todoListId)
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.getTeam() == null || todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.");
        }

        todoList.setName((String) todoListRequest.get("name"));
        todoList.setDescription((String) todoListRequest.get("description"));
        todoListRepository.save(todoList);

        Map<String, Object> response = new HashMap<>();
        response.put("id", todoList.getId());
        response.put("name", todoList.getName());
        response.put("description", todoList.getDescription());
        response.put("userId", todoList.getUser().getId());
        response.put("teamId", todoList.getTeam().getId());
        response.put("createDate", todoList.getCreateDate());
        response.put("modifyDate", todoList.getModifyDate());

        return RsData.success("할일 목록이 성공적으로 수정되었습니다.", response);
    }

    // 팀 할일 목록 삭제
    @Transactional
    public RsData<Void> deleteTeamTodoList(int teamId, int todoListId, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        TodoList todoList = todoListRepository.findById(todoListId)
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.getTeam() == null || todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.");
        }

        // TodoList 삭제 전에 관련된 모든 Todo의 TodoAssignment 레코드들 삭제
        List<Todo> todos = todoRepository.findByTodoListId(todoListId);
        for (Todo todo : todos) {
            todoAssignmentRepository.deleteByTodo_Id(todo.getId());
        }

        todoListRepository.delete(todoList);
        return RsData.success("할일 목록이 성공적으로 삭제되었습니다.");
    }

    // 팀 할일 목록별 할일 조회
    public RsData<List<Map<String, Object>>> getTeamTodosByList(int teamId, int todoListId, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        TodoList todoList = todoListRepository.findById(todoListId)
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.getTeam() == null || todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.");
        }

        List<Todo> todos = todoRepository.findByTodoListId(todoListId);
        List<Map<String, Object>> response = todos.stream()
                .map(todo -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", todo.getId());
                    map.put("title", todo.getTitle());
                    map.put("description", todo.getDescription());
                    map.put("priority", todo.getPriority());
                    map.put("completed", todo.isCompleted());
                    map.put("todoListId", todo.getTodoList().getId());
                    map.put("createdAt", todo.getCreateDate());
                    map.put("updatedAt", todo.getModifyDate());
                    map.put("startDate", todo.getStartDate());
                    map.put("dueDate", todo.getDueDate());
                    return map;
                })
                .collect(Collectors.toList());

        return RsData.success("할일 목록별 할일 조회 성공", response);
    }

    // 팀 할일 목록에 할일 추가
    @Transactional
    public RsData<Map<String, Object>> addTodoToTeamList(int teamId, int todoListId, Map<String, Object> todoRequest, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        TodoList todoList = todoListRepository.findById(todoListId)
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.getTeam() == null || todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.");
        }

        Todo todo = new Todo();
        todo.setTitle((String) todoRequest.get("title"));
        todo.setDescription((String) todoRequest.get("description"));
        todo.setPriority((Integer) todoRequest.get("priority"));
        todo.setCompleted(false);
        todo.setTodoList(todoList);
        todo.setStartDate(LocalDateTime.now()); // 시작일을 현재 시간으로 설정
        
        // 마감기한 설정
        if (todoRequest.get("dueDate") != null && !((String) todoRequest.get("dueDate")).isEmpty()) {
            try {
                LocalDateTime dueDate = LocalDateTime.parse(((String) todoRequest.get("dueDate")).replace("Z", ""));
                todo.setDueDate(dueDate);
            } catch (Exception e) {
                // 날짜 파싱 실패 시 null로 설정
                todo.setDueDate(null);
            }
        }
        
        todoRepository.save(todo);

        Map<String, Object> response = new HashMap<>();
        response.put("id", todo.getId());
        response.put("title", todo.getTitle());
        response.put("description", todo.getDescription());
        response.put("priority", todo.getPriority());
        response.put("completed", todo.isCompleted());
        response.put("todoListId", todo.getTodoList().getId());
        response.put("createdAt", todo.getCreateDate());
        response.put("updatedAt", todo.getModifyDate());
        response.put("startDate", todo.getStartDate());
        response.put("dueDate", todo.getDueDate());

        return RsData.success("할일이 성공적으로 추가되었습니다.", response);
    }

    // 팀 할일 수정
    @Transactional
    public RsData<Map<String, Object>> updateTeamTodo(int teamId, int todoId, Map<String, Object> todoRequest, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));

        // 할일이 해당 팀에 속하는지 확인
        if (todo.getTodoList().getTeam() == null || todo.getTodoList().getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
        }

        todo.setTitle((String) todoRequest.get("title"));
        todo.setDescription((String) todoRequest.get("description"));
        todo.setPriority((Integer) todoRequest.get("priority"));
        
        // 마감기한 설정
        if (todoRequest.get("dueDate") != null && !((String) todoRequest.get("dueDate")).isEmpty()) {
            try {
                LocalDateTime dueDate = LocalDateTime.parse(((String) todoRequest.get("dueDate")).replace("Z", ""));
                todo.setDueDate(dueDate);
            } catch (Exception e) {
                // 날짜 파싱 실패 시 null로 설정
                todo.setDueDate(null);
            }
        } else {
            todo.setDueDate(null);
        }
        
        todoRepository.save(todo);

        Map<String, Object> response = new HashMap<>();
        response.put("id", todo.getId());
        response.put("title", todo.getTitle());
        response.put("description", todo.getDescription());
        response.put("priority", todo.getPriority());
        response.put("completed", todo.isCompleted());
        response.put("todoListId", todo.getTodoList().getId());
        response.put("createdAt", todo.getCreateDate());
        response.put("updatedAt", todo.getModifyDate());
        response.put("startDate", todo.getStartDate());
        response.put("dueDate", todo.getDueDate());

        return RsData.success("할일이 성공적으로 수정되었습니다.", response);
    }

    // 팀 할일 삭제
    @Transactional
    public RsData<Void> deleteTeamTodo(int teamId, int todoId, int userId) {
        try {
            System.out.println("=== 할일 삭제 시작 ===");
            System.out.println("teamId: " + teamId + ", todoId: " + todoId + ", userId: " + userId);
            
            // 팀 멤버 확인
            TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                    .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));
            System.out.println("팀 멤버 확인 완료: " + member.getUser().getNickName());

            Todo todo = todoRepository.findById(todoId)
                    .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));
            System.out.println("할일 찾기 완료: " + todo.getTitle());

            // TodoList가 null인지 확인
            if (todo.getTodoList() == null) {
                System.out.println("ERROR: TodoList가 null입니다.");
                throw new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.");
            }
            System.out.println("TodoList 확인 완료: " + todo.getTodoList().getName());

            // 할일이 해당 팀에 속하는지 확인
            TodoList todoList = todo.getTodoList();
            if (todoList.getTeam() == null) {
                System.out.println("ERROR: TodoList의 Team이 null입니다.");
                throw new ServiceException("403-FORBIDDEN", "할일 목록이 팀에 속하지 않습니다.");
            }
            
            if (todoList.getTeam().getId() != teamId) {
                System.out.println("ERROR: 팀 ID 불일치. 요청된 팀: " + teamId + ", 실제 팀: " + todoList.getTeam().getId());
                throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
            }
            System.out.println("팀 확인 완료: " + todoList.getTeam().getTeamName());

            // 할일 삭제 전에 관련된 TodoAssignment 레코드들 먼저 삭제
            System.out.println("TodoAssignment 레코드 삭제 시작");
            todoAssignmentRepository.deleteByTodo_Id(todoId);
            System.out.println("TodoAssignment 레코드 삭제 완료");

            todoRepository.delete(todo);
            System.out.println("할일 삭제 완료");
            return RsData.success("할일이 성공적으로 삭제되었습니다.");
        } catch (ServiceException e) {
            System.out.println("ServiceException 발생: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("할일 삭제 중 예상치 못한 오류 발생: " + e.getMessage());
            e.printStackTrace();
            throw new ServiceException("500-2", "할일 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 팀 할일 완료 상태 토글
    @Transactional
    public RsData<Map<String, Object>> toggleTeamTodoComplete(int teamId, int todoId, int userId) {
        // 팀 멤버 확인
        TeamMember member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다."));

        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));

        // 할일이 해당 팀에 속하는지 확인
        if (todo.getTodoList().getTeam() == null || todo.getTodoList().getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
        }

        todo.setCompleted(!todo.isCompleted());
        todoRepository.save(todo);

        Map<String, Object> response = new HashMap<>();
        response.put("id", todo.getId());
        response.put("title", todo.getTitle());
        response.put("description", todo.getDescription());
        response.put("priority", todo.getPriority());
        response.put("completed", todo.isCompleted());
        response.put("todoListId", todo.getTodoList().getId());
        response.put("createdAt", todo.getCreateDate());
        response.put("updatedAt", todo.getModifyDate());

        return RsData.success("할일 완료 상태가 변경되었습니다.", response);
    }

    // ===== 담당자 관리 메서드들 =====

    // 담당자 지정
    @Transactional
    public RsData<Map<String, Object>> assignTodoToMember(int teamId, int todoId, int assignedUserId, int assignerUserId) {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignerUserId)) {
            throw new ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
        }

        // 담당자가 팀 멤버인지 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignedUserId)) {
            throw new ServiceException("403-FORBIDDEN", "담당자는 팀 멤버여야 합니다.");
        }

        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        TodoList todoList = todoListRepository.findById(todo.getTodoList().getId())
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        if (todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
        }

        User assignedUser = userRepository.findById(assignedUserId)
                .orElseThrow(() -> new ServiceException("404-USER_NOT_FOUND", "담당자로 지정할 사용자를 찾을 수 없습니다."));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다."));

        // 기존 활성 담당자 비활성화
        todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE)
                .ifPresent(existingAssignment -> {
                    existingAssignment.setStatus(TodoAssignment.AssignmentStatus.INACTIVE);
                    todoAssignmentRepository.save(existingAssignment);
                });

        // 새로운 담당자 지정
        TodoAssignment newAssignment = TodoAssignment.builder()
                .todo(todo)
                .assignedUser(assignedUser)
                .team(team)
                .build();

        todoAssignmentRepository.save(newAssignment);

        Map<String, Object> response = new HashMap<>();
        response.put("todoId", todoId);
        response.put("assignedUserId", assignedUserId);
        response.put("assignedUserNickname", assignedUser.getNickName());
        response.put("assignedAt", newAssignment.getAssignedAt());

        return RsData.success("담당자가 성공적으로 지정되었습니다.", response);
    }

    // 담당자 해제
    @Transactional
    public RsData<Void> unassignTodo(int teamId, int todoId, int unassignerUserId) {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, unassignerUserId)) {
            throw new ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
        }

        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        TodoList todoList = todoListRepository.findById(todo.getTodoList().getId())
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        if (todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
        }

        // 활성 담당자 비활성화
        todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE)
                .ifPresent(existingAssignment -> {
                    existingAssignment.setStatus(TodoAssignment.AssignmentStatus.INACTIVE);
                    todoAssignmentRepository.save(existingAssignment);
                });

        return RsData.success("담당자가 해제되었습니다.", null);
    }

    // Todo의 담당자 조회
    public RsData<Map<String, Object>> getTodoAssignment(int teamId, int todoId, int userId) {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
        }

        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        TodoList todoList = todoListRepository.findById(todo.getTodoList().getId())
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        if (todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
        }

        // 활성 담당자 조회
        Optional<TodoAssignment> assignment = todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE);

        Map<String, Object> response = new HashMap<>();
        if (assignment.isPresent()) {
            TodoAssignment activeAssignment = assignment.get();
            response.put("assignedUserId", activeAssignment.getAssignedUser().getId());
            response.put("assignedUserNickname", activeAssignment.getAssignedUser().getNickName());
            response.put("assignedUserEmail", activeAssignment.getAssignedUser().getUserEmail());
            response.put("assignedAt", activeAssignment.getAssignedAt());
        } else {
            response.put("assignedUserId", null);
            response.put("assignedUserNickname", null);
            response.put("assignedUserEmail", null);
            response.put("assignedAt", null);
        }

        return RsData.success("담당자 정보 조회 성공", response);
    }

    // 팀의 모든 담당자 기록 조회
    public RsData<List<Map<String, Object>>> getTeamAssignments(int teamId, int userId) {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
        }

        List<TodoAssignment> assignments = todoAssignmentRepository.findByTeam_IdOrderByAssignedAtDesc(teamId);

        List<Map<String, Object>> response = assignments.stream()
                .map(assignment -> {
                    Map<String, Object> assignmentMap = new HashMap<>();
                    assignmentMap.put("id", assignment.getId());
                    assignmentMap.put("todoId", assignment.getTodo().getId());
                    assignmentMap.put("todoTitle", assignment.getTodo().getTitle());
                    assignmentMap.put("assignedUserId", assignment.getAssignedUser().getId());
                    assignmentMap.put("assignedUserNickname", assignment.getAssignedUser().getNickName());
                    assignmentMap.put("assignedUserEmail", assignment.getAssignedUser().getUserEmail());
                    assignmentMap.put("assignedAt", assignment.getAssignedAt());
                    assignmentMap.put("status", assignment.getStatus());
                    return assignmentMap;
                })
                .collect(Collectors.toList());

        return RsData.success("팀 담당자 기록 조회 성공", response);
    }

    // ===== 담당자 권한 확인 메서드들 =====

    // 특정 할일의 담당자인지 확인
    public boolean isTodoAssignee(int teamId, int todoId, int userId) {
        // 팀 멤버인지 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            return false;
        }

        // 활성 담당자인지 확인 (여러 담당자 지원)
        List<TodoAssignment> activeAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId);
        return activeAssignments.stream()
                .filter(assignment -> assignment.getStatus() == TodoAssignment.AssignmentStatus.ACTIVE)
                .anyMatch(assignment -> assignment.getAssignedUser().getId() == userId);
    }

    // 특정 할일의 담당자 목록 조회 (여러 담당자 지원)
    public RsData<List<Map<String, Object>>> getTodoAssignees(int teamId, int todoId, int userId) {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
        }

        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        TodoList todoList = todoListRepository.findById(todo.getTodoList().getId())
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        if (todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
        }

        // 활성 담당자들 조회
        List<TodoAssignment> assignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId);
        List<TodoAssignment> activeAssignments = assignments.stream()
                .filter(assignment -> assignment.getStatus() == TodoAssignment.AssignmentStatus.ACTIVE)
                .collect(Collectors.toList());

        List<Map<String, Object>> response = activeAssignments.stream()
                .map(assignment -> {
                    Map<String, Object> assigneeMap = new HashMap<>();
                    assigneeMap.put("assignedUserId", assignment.getAssignedUser().getId());
                    assigneeMap.put("assignedUserNickname", assignment.getAssignedUser().getNickName());
                    assigneeMap.put("assignedUserEmail", assignment.getAssignedUser().getUserEmail());
                    assigneeMap.put("assignedAt", assignment.getAssignedAt());
                    return assigneeMap;
                })
                .collect(Collectors.toList());

        return RsData.success("담당자 목록 조회 성공", response);
    }

    // 여러 담당자 지정 (기존 담당자 중 유지할 것은 그대로 두고, 제거할 것만 비활성화, 새로 추가할 것만 생성)
    @Transactional
    public RsData<Map<String, Object>> assignMultipleTodoAssignees(int teamId, int todoId, List<Integer> assignedUserIds, int assignerUserId) {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignerUserId)) {
            throw new ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
        }

        // 모든 담당자가 팀 멤버인지 확인
        for (Integer assignedUserId : assignedUserIds) {
            if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignedUserId)) {
                throw new ServiceException("403-FORBIDDEN", "담당자는 팀 멤버여야 합니다.");
            }
        }

        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다."));

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        TodoList todoList = todoListRepository.findById(todo.getTodoList().getId())
                .orElseThrow(() -> new ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다."));

        if (todoList.getTeam().getId() != teamId) {
            throw new ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다."));

        // 기존 활성 담당자들 조회
        List<TodoAssignment> existingAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId);
        List<TodoAssignment> activeAssignments = existingAssignments.stream()
                .filter(assignment -> assignment.getStatus() == TodoAssignment.AssignmentStatus.ACTIVE)
                .collect(Collectors.toList());

        // 기존 담당자 ID 목록
        Set<Integer> existingAssigneeIds = activeAssignments.stream()
                .map(assignment -> assignment.getAssignedUser().getId())
                .collect(Collectors.toSet());

        // 새로 지정할 담당자 ID 목록
        Set<Integer> newAssigneeIds = new HashSet<>(assignedUserIds);

        // 제거할 담당자들 (기존에 있지만 새 목록에 없는 것들)
        Set<Integer> toRemoveIds = existingAssigneeIds.stream()
                .filter(id -> !newAssigneeIds.contains(id))
                .collect(Collectors.toSet());

        // 새로 추가할 담당자들 (새 목록에 있지만 기존에 없는 것들)
        Set<Integer> toAddIds = newAssigneeIds.stream()
                .filter(id -> !existingAssigneeIds.contains(id))
                .collect(Collectors.toSet());

        // 디버깅 로그 추가
        System.out.println("=== 담당자 지정 디버깅 ===");
        System.out.println("요청된 담당자 IDs: " + assignedUserIds);
        System.out.println("기존 활성 담당자 IDs: " + existingAssigneeIds);
        System.out.println("제거할 담당자 IDs: " + toRemoveIds);
        System.out.println("추가할 담당자 IDs: " + toAddIds);

        // 제거할 담당자들 비활성화
        for (TodoAssignment assignment : activeAssignments) {
            if (toRemoveIds.contains(assignment.getAssignedUser().getId())) {
                assignment.setStatus(TodoAssignment.AssignmentStatus.INACTIVE);
                todoAssignmentRepository.save(assignment);
            }
        }

        // 새로 추가할 담당자들 처리 (기존 INACTIVE 레코드 재활용 또는 새로 생성)
        List<TodoAssignment> newAssignments = new ArrayList<>();
        for (Integer assignedUserId : toAddIds) {
            User assignedUser = userRepository.findById(assignedUserId)
                    .orElseThrow(() -> new ServiceException("404-USER_NOT_FOUND", "담당자로 지정할 사용자를 찾을 수 없습니다."));

            // 기존 INACTIVE 레코드가 있는지 확인
            Optional<TodoAssignment> existingInactive = existingAssignments.stream()
                    .filter(assignment -> assignment.getAssignedUser().getId() == assignedUserId 
                            && assignment.getStatus() == TodoAssignment.AssignmentStatus.INACTIVE)
                    .findFirst();

            if (existingInactive.isPresent()) {
                // 기존 INACTIVE 레코드를 ACTIVE로 변경
                TodoAssignment reactivated = existingInactive.get();
                reactivated.setStatus(TodoAssignment.AssignmentStatus.ACTIVE);
                reactivated.setAssignedAt(LocalDateTime.now());
                newAssignments.add(todoAssignmentRepository.save(reactivated));
                System.out.println("기존 INACTIVE 레코드 재활용: User ID " + assignedUserId);
            } else {
                // 새로운 레코드 생성
                TodoAssignment newAssignment = TodoAssignment.builder()
                        .todo(todo)
                        .assignedUser(assignedUser)
                        .team(team)
                        .build();

                newAssignments.add(todoAssignmentRepository.save(newAssignment));
                System.out.println("새로운 레코드 생성: User ID " + assignedUserId);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("todoId", todoId);
        response.put("assignedUserIds", assignedUserIds);
        response.put("assignedCount", assignedUserIds.size());
        response.put("removedCount", toRemoveIds.size());
        response.put("addedCount", toAddIds.size());
        response.put("assignedAt", LocalDateTime.now());

        return RsData.success("담당자들이 성공적으로 지정되었습니다.", response);
    }

    // 팀 할일 통계 조회
    public RsData<Map<String, Object>> getTeamStats(int teamId, int userId) {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.");
        }

        // 팀 존재 확인
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다."));

        // 팀의 모든 TodoList 조회 (팀 ID로 조회하는 메서드가 없으므로 모든 TodoList를 가져와서 필터링)
        List<TodoList> allTodoLists = todoListRepository.findAll();
        List<TodoList> teamTodoLists = allTodoLists.stream()
                .filter(todoList -> todoList.getTeam() != null && todoList.getTeam().getId() == teamId)
                .collect(Collectors.toList());
        
        int totalTodos = 0;
        int completedTodos = 0;
        int overdueTodos = 0;

        // 각 TodoList의 할일들 조회하여 통계 계산
        for (TodoList todoList : teamTodoLists) {
            List<Todo> todos = todoRepository.findByTodoListId(todoList.getId());
            
            for (Todo todo : todos) {
                totalTodos++;
                
                if (todo.isCompleted()) {
                    completedTodos++;
                }
                
                // 마감기한이 지난 미완료 할일 체크
                if (!todo.isCompleted() && todo.getDueDate() != null) {
                    LocalDateTime now = LocalDateTime.now();
                    if (todo.getDueDate().isBefore(now)) {
                        overdueTodos++;
                    }
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", totalTodos);
        stats.put("completed", completedTodos);
        stats.put("overdue", overdueTodos);
        stats.put("inProgress", totalTodos - completedTodos - overdueTodos);
        stats.put("completionRate", totalTodos > 0 ? Math.round((double) completedTodos / totalTodos * 100) : 0);

        return RsData.success("팀 통계 조회 성공", stats);
    }
}