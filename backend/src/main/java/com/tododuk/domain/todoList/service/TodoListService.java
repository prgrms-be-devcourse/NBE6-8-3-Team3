package com.tododuk.domain.todoList.service;

import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.team.repository.TeamRepository;
import com.tododuk.domain.todoList.dto.TodoListReqDto;
import com.tododuk.domain.todoList.dto.TodoListResponseDto;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.domain.todoList.repository.TodoListRepository;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TodoListService {

    private final TodoListRepository todoListRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    public List<TodoListResponseDto> getAllTodoLists() {
        return todoListRepository.findAll().stream()
                .map(TodoListResponseDto::from)
                .toList();
    }

    public TodoListResponseDto getTodoList(int id){
        TodoList todoList = todoListRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 todolistid는 존재하지 않습니다."));
        return TodoListResponseDto.from(todoList);
    }

    @Transactional
    public TodoList addTodoList(TodoListReqDto reqDto) {
        User user = userRepository.findById(reqDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("해당 유저가 없습니다."));

        Team team = teamRepository.findById(reqDto.getTeamId())
                .orElseThrow(() -> new IllegalArgumentException("해당 팀이 없습니다."));
        TodoList todoList = new TodoList(
                reqDto.getName(),
                reqDto.getDescription(),
                user, team
        );
        return todoListRepository.save(todoList);
    }

    @Transactional
    public TodoList updateTodoList(Integer listId, TodoListReqDto reqDto) {
        TodoList todoList = todoListRepository.findById(listId)
                .orElseThrow(() -> new IllegalArgumentException("해당 todolist가 존재하지 않습니다."));

        User user = userRepository.findById(reqDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("해당 유저가 없습니다."));

        Team team = teamRepository.findById(reqDto.getTeamId())
                .orElseThrow(() -> new IllegalArgumentException("해당 팀이 없습니다."));

        todoList.setName(reqDto.getName());
        todoList.setDescription(reqDto.getDescription());
        todoList.setUser(user);
        todoList.setTeam(team);

        return todoListRepository.save(todoList);
    }

    @Transactional
    public void deleteTodoList(Integer listId) {
        TodoList todoList = todoListRepository.findById(listId)
                .orElseThrow(()-> new IllegalArgumentException("해당 todolist는 존재하지 않습니다."));
        todoListRepository.delete(todoList);
    }

    public List<TodoListResponseDto> getUserTodoList(Integer userId) {
        List<TodoList> todoLists = todoListRepository.findAllByUserId(userId);
        return todoLists.stream()
                .map(TodoListResponseDto::from)  // DTO 변환 메서드가 있다고 가정
                .collect(Collectors.toList());
    }
}
