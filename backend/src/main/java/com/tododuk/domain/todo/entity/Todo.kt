package com.tododuk.domain.todo.entity

import com.tododuk.domain.todo.dto.TodoReqDto
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import lombok.Builder
import java.time.LocalDateTime

@Entity
@Builder
open class Todo(
    var title: String? = null,
    var description: String? = null,
    var isCompleted: Boolean = false,
    var priority: Int = 2, // 1: Low, 2: Medium, 3: High
    var startDate: LocalDateTime = LocalDateTime.now(),
    var dueDate: LocalDateTime? = null,

    @ManyToOne
    @JoinColumn(name = "Todo_List_Id")
    var todoList: TodoList? = null
) : BaseEntity() {

    // 생성자 오버로딩 1
    constructor(title: String?, description: String?, completed: Boolean) : this(
        title = title,
        description = description,
        isCompleted = completed,
        priority = 2,
        startDate = LocalDateTime.now(),
        dueDate = null
    )

    // 생성자 오버로딩 2
    constructor(
        title: String?,
        description: String?,
        priority: Int,
        isCompleted: Boolean,
        todoListId: Int,
        startDate: LocalDateTime,
        dueDate: LocalDateTime?
    ) : this(
        title = title,
        description = description,
        priority = priority,
        isCompleted = isCompleted,
        startDate = startDate,
        dueDate = dueDate
    )


    fun update(dto: TodoReqDto) {
        this.title = dto.title
        this.description = dto.description
        this.priority = dto.priority
        this.isCompleted = dto.isCompleted
        this.dueDate = dto.dueDate
        // this.todoList = dto.toEntity().todoList
    }
}