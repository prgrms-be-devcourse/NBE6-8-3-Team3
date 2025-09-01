package com.tododuk.global.initData

import com.tododuk.domain.label.service.LabelService
import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.team.entity.TeamMember
import com.tododuk.domain.team.repository.TeamMemberRepository
import com.tododuk.domain.team.repository.TeamRepository
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.todo.repository.TodoRepository
import com.tododuk.domain.todoLabel.entity.TodoLabel
import com.tododuk.domain.todoLabel.repository.TodoLabelRepository
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.domain.todoList.repository.TodoListRepository
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.repository.UserRepository
import jakarta.annotation.PostConstruct
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Transactional
@Configuration
class BaseInitData(
    val labelService: LabelService,
    val todoLabelRepository: TodoLabelRepository,
    val todoRepository: TodoRepository,
    val userRepository: UserRepository,
    val teamRepository: TeamRepository,
    val teamMemberRepository: TeamMemberRepository,
    val passwordEncoder: PasswordEncoder,
    val todoListRepository: TodoListRepository
) {
    @PostConstruct
    fun init() {
        println("초기데이터 입력")

        if (labelService.countLabels() == 0L) {
            // 사용자 생성 (비밀번호 암호화)
            val user1 = User(
                "dev@test.com",
                passwordEncoder.encode("password123"),
                "김개발"
            )

            val user2 = User(
                "coding@test.com",
                passwordEncoder.encode("password123"),
                "이코딩"

            )

            val user3 = User(
                "park@test.com",
                passwordEncoder.encode("password123"),
                "박서버"

            )

            val user4 = User(
                "daran2@gmail.com",
                passwordEncoder.encode("password123"),
                "다란"

            )

            userRepository.save<User?>(user1)
            userRepository.save<User?>(user2)
            userRepository.save<User?>(user3)
            userRepository.save<User?>(user4)

            // 팀 생성
            val team1 = Team(
                "프론트엔드 개발팀",
                "React, Next.js를 활용한 웹 프론트엔드 개발팀"
            )

            val team2 = Team(
                "백엔드 개발팀",
                "Spring Boot, JPA를 활용한 백엔드 개발팀"
            )

            teamRepository.save<Team?>(team1)
            teamRepository.save<Team?>(team2)

            // 팀 멤버 추가
            val member1 = TeamMember(
                user1,
                team1,
                TeamRoleType.LEADER,
                LocalDateTime.now()
            )

            val member2 = TeamMember(
                user2,
                team1,
                TeamRoleType.MEMBER,
                LocalDateTime.now()
            )

            val member3 = TeamMember(
                user3,
                team2,
                TeamRoleType.LEADER,
                LocalDateTime.now()
            )

            val member4 = TeamMember(
                user4,
                team2,
                TeamRoleType.MEMBER,
                LocalDateTime.now()
            )

            teamMemberRepository.save<TeamMember?>(member1)
            teamMemberRepository.save<TeamMember?>(member2)
            teamMemberRepository.save<TeamMember?>(member3)
            teamMemberRepository.save<TeamMember?>(member4)

            // 할일 목록 생성
            val todoList1 = TodoList(
                "기본 할일 목록",
                "기본 할일 목록입니다.",
                user1,
                team1
            )

            //todo 생성
            val todo1 = Todo(
                "자바 공부하기",
                "백엔드 부트캠프 주차별 과제 수행",
                false,
                1, // High
                LocalDateTime.of(2025, 7, 28, 9, 0),
                LocalDateTime.of(2025, 8, 1, 18, 0),
                todoList1
            )

            val todo2 = Todo(
                "운동하기",
                "헬스장 가서 1시간 운동",
                false,
                2, // Medium
                LocalDateTime.of(2025, 7, 29, 7, 0),
                LocalDateTime.of(2025, 7, 29, 8, 0),
                todoList1
            )

            //label 생성
            val label1 = labelService.createLabelIfNotExists("공부", "#FF4D4F") // 빨강
            val label2 = labelService.createLabelIfNotExists("운동", "#1890FF") // 파랑
            val label3 = labelService.createLabelIfNotExists("휴식", "#52C41A") // 초록

            val todoLabel1 = TodoLabel(todo1, label1)
            val todoLabel2 = TodoLabel(todo1, label2)
            val todoLabel3 = TodoLabel(todo2, label1)

            todoListRepository.save<TodoList?>(todoList1)
            todoRepository.save<Todo?>(todo1)
            todoRepository.save<Todo?>(todo2)
            labelService.createLabel(label1)
            labelService.createLabel(label2)
            labelService.createLabel(label3)
            todoLabelRepository.save<TodoLabel?>(todoLabel1)
            todoLabelRepository.save<TodoLabel?>(todoLabel2)
            todoLabelRepository.save<TodoLabel?>(todoLabel3)
//            todoRepository.save(todo1)
//            todoRepository.save(todo2)

            // 팀 할일 목록 생성 (기존 TodoList 사용)
            val teamTodoList1 = TodoList(
                "프론트엔드 개발팀 할일 목록",
                "팀원들과 함께 관리하는 할일들",
                user1,
                team1
            )

            todoListRepository.save<TodoList?>(teamTodoList1)

            // 팀 할일 생성 (기존 Todo 사용)
            val teamTodo1 = todo1
            val teamTodo2 = todo2

            todoRepository.save<Todo?>(teamTodo1)
            todoRepository.save<Todo?>(teamTodo2)

        } else {
            println("초기 데이터가 이미 존재합니다.")
        }
    }
}
