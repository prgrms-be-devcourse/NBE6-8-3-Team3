package com.tododuk.global.initData;

import com.tododuk.domain.label.entity.Label;
import com.tododuk.domain.label.service.LabelService;
import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.team.entity.TeamMember;
import com.tododuk.domain.team.repository.TeamMemberRepository;
import com.tododuk.domain.team.repository.TeamRepository;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.todo.repository.TodoRepository;
import com.tododuk.domain.todoLabel.entity.TodoLabel;
import com.tododuk.domain.todoLabel.repository.TodoLabelRepository;
import com.tododuk.domain.todoLabel.service.TodoLabelService;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.repository.UserRepository;
import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.domain.todoList.repository.TodoListRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Transactional
@Configuration
public class BaseInitData {

    private final LabelService labelService;
    private final TodoLabelService todoLabelService;
    private final TodoLabelRepository todoLabelRepository;
    private final TodoRepository todoRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final TodoListRepository todoListRepository;


    @PostConstruct
    public void init(){
        System.out.println("초기데이터 입력");

        if(labelService.countLabels() ==0){
            // 사용자 생성 (비밀번호 암호화)
            User user1 = User.builder()
                    .nickName("김개발")
                    .userEmail("dev@test.com")
                    .password(passwordEncoder.encode("password123"))
                    .build();
            
            User user2 = User.builder()
                    .nickName("이코딩")
                    .userEmail("coding@test.com")
                    .password(passwordEncoder.encode("password123"))
                    .build();
            
            User user3 = User.builder()
                    .nickName("박서버")
                    .userEmail("server@test.com")
                    .password(passwordEncoder.encode("password123"))
                    .build();

            User user4 = User.builder()
                    .nickName("다란")
                    .userEmail("daran2@gmail.com")
                    .password(passwordEncoder.encode("password123"))
                    .build();

            userRepository.save(user1);
            userRepository.save(user2);
            userRepository.save(user3);
            userRepository.save(user4);

            // 팀 생성
            Team team1 = new Team();
            team1.setTeamName("프론트엔드 개발팀");
            team1.setDescription("React, Next.js를 활용한 웹 프론트엔드 개발팀");
            
            Team team2 = new Team();
            team2.setTeamName("백엔드 개발팀");
            team2.setDescription("Spring Boot, JPA를 활용한 백엔드 개발팀");

            teamRepository.save(team1);
            teamRepository.save(team2);

            // 팀 멤버 추가
            TeamMember member1 = TeamMember.builder()
                    .user(user1)
                    .team(team1)
                    .role(TeamRoleType.LEADER)
                    .build();
            
            TeamMember member2 = TeamMember.builder()
                    .user(user2)
                    .team(team1)
                    .role(TeamRoleType.MEMBER)
                    .build();
            
            TeamMember member3 = TeamMember.builder()
                    .user(user3)
                    .team(team2)
                    .role(TeamRoleType.LEADER)
                    .build();
            
            TeamMember member4 = TeamMember.builder()
                    .user(user1)
                    .team(team2)
                    .role(TeamRoleType.MEMBER)
                    .build();

            teamMemberRepository.save(member1);
            teamMemberRepository.save(member2);
            teamMemberRepository.save(member3);
            teamMemberRepository.save(member4);

            //label 생성
            Label label1 = labelService.createLabelIfNotExists("공부", "#FF4D4F"); // 빨강
            Label label2 = labelService.createLabelIfNotExists("운동", "#1890FF"); // 파랑
            Label label3 = labelService.createLabelIfNotExists("휴식", "#52C41A"); // 초록

            //todo 생성
            Todo todo1 = Todo.builder()
                    .title("자바 공부하기")
                    .description("백엔드 부트캠프 주차별 과제 수행")
                    .isCompleted(false)
                    .priority(3) // High
                    .startDate(LocalDateTime.of(2025, 7, 28, 9, 0))
                    .dueDate(LocalDateTime.of(2025, 8, 1, 18, 0))
                    .build();

            Todo todo2 = Todo.builder()
                    .title("운동하기")
                    .description("헬스장 가서 1시간 운동")
                    .isCompleted(false)
                    .priority(2) // Medium
                    .startDate(LocalDateTime.of(2025, 7, 29, 7, 0))
                    .dueDate(LocalDateTime.of(2025, 7, 29, 8, 0))
                    .build();

            TodoLabel todoLabel1 = TodoLabel.builder().todo(todo1).label(label1).build();
            TodoLabel todoLabel2 = TodoLabel.builder().todo(todo1).label(label2).build();
            TodoLabel todoLabel3 = TodoLabel.builder().todo(todo2).label(label1).build();

            todoRepository.save(todo1);
            todoRepository.save(todo2);
            labelService.createLabel(label1);
            labelService.createLabel(label2);
            labelService.createLabel(label3);
            todoLabelRepository.save(todoLabel1);
            todoLabelRepository.save(todoLabel2);
            todoLabelRepository.save(todoLabel3);

            // 할일 목록 생성
            TodoList todoList1 = new TodoList(
                    "기본 할일 목록",
                    "기본 할일 목록입니다.",
                    user1,
                    team1
            );

            todoListRepository.save(todoList1);

            // 할일을 할일 목록에 연결
            todo1.setTodoList(todoList1);
            todo2.setTodoList(todoList1);
            todoRepository.save(todo1);
            todoRepository.save(todo2);

            // 팀 할일 목록 생성 (기존 TodoList 사용)
            TodoList teamTodoList1 = new TodoList(
                    "프론트엔드 개발팀 할일 목록",
                    "팀원들과 함께 관리하는 할일들",
                    user1,
                    team1
            );

            todoListRepository.save(teamTodoList1);

            // 팀 할일 생성 (기존 Todo 사용)
            Todo teamTodo1 = Todo.builder()
                    .title("프론트엔드 컴포넌트 개발")
                    .description("React 컴포넌트 라이브러리 구축")
                    .isCompleted(false)
                    .priority(3)
                    .startDate(LocalDateTime.now())
                    .dueDate(LocalDateTime.of(2025, 8, 25, 18, 0))
                    .todoList(teamTodoList1)
                    .build();

            Todo teamTodo2 = Todo.builder()
                    .title("UI/UX 디자인 검토")
                    .description("새로운 디자인 시스템 검토 및 피드백")
                    .isCompleted(false)
                    .priority(2)
                    .startDate(LocalDateTime.now())
                    .dueDate(LocalDateTime.of(2025, 8, 22, 18, 0))
                    .todoList(teamTodoList1)
                    .build();

            todoRepository.save(teamTodo1);
            todoRepository.save(teamTodo2);
        } else{
            System.out.println("초기 데이터가 이미 존재합니다.");
        }
    }
}
