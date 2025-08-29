package com.tododuk.domain.todo.entity

import com.tododuk.domain.todo.dto.TodoReqDto
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import lombok.AllArgsConstructor
import lombok.Builder
import lombok.NoArgsConstructor
import java.time.LocalDateTime

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
open class Todo : BaseEntity {
    //업데이트 날짜는 제외 (erd 수정 필요)
    //Getter
    var title: String?
    var description: String?
    var isCompleted: Boolean
    var priority: Int // 1: Low, 2: Medium, 3: High

    var startDate: LocalDateTime
    var dueDate: LocalDateTime?

    //initData test를 위해 일시적으로 주석처리
    @ManyToOne
    @JoinColumn(name = "Todo_List_Id")
    var todoList: TodoList? = null

    constructor(title: String?, description: String?, completed: Boolean) {
        this.title = title
        this.description = description
        this.isCompleted = completed
        this.priority = 2 // 기본값은 Medium으로 설정
        this.startDate = LocalDateTime.now() // 생성 시 현재 시간으로 설정
        this.dueDate = null // 기본값은 null로 설정
    }

    constructor(
        title: String?,
        description: String?,
        priority: Int,
        isCompleted: Boolean,
        todoListId: Int,
        startDate: LocalDateTime,
        dueDate: LocalDateTime?
    ) {
        this.title = title
        this.description = description
        this.isCompleted = isCompleted
        this.priority = priority
        this.startDate = startDate
        this.dueDate = dueDate
    }

    //baseInitData를 위해 생성자 추가
    constructor(
        title: String?,
        description: String?,
        priority: Int,
        isCompleted: Boolean,
        todoListId: Int,
        startDate: LocalDateTime,
        dueDate: LocalDateTime?,
        todoList: TodoList?
    ) {
        this.title = title
        this.description = description
        this.isCompleted = isCompleted
        this.priority = priority
        this.startDate = startDate
        this.dueDate = dueDate
        this.todoList = todoList
    }

    fun update(dto: TodoReqDto) {
        this.title = dto.title
        this.description = dto.description
        this.priority = dto.priority
        this.isCompleted = dto.isCompleted
        this.dueDate = dto.dueDate
        //        this.todoList = dto.toEntity().getTodoList();
    }
}
