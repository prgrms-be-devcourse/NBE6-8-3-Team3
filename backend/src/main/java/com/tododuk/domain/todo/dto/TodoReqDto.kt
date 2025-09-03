package com.tododuk.domain.todo.dto

import com.tododuk.domain.todo.entity.Todo
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import lombok.AllArgsConstructor
import lombok.Getter
import lombok.NoArgsConstructor
import java.time.LocalDateTime

@Getter
@NoArgsConstructor
@AllArgsConstructor
class TodoReqDto (
    var title: @NotBlank(message = "제목은 필수 입니다.") String? = null,
    var description: String? = null,
    var priority: @NotNull Int = 0,
    var isCompleted: Boolean = false,
    var todoListId: Int = 0,
    var startDate: LocalDateTime = LocalDateTime.now(),
    var dueDate: LocalDateTime? = null,
    var createdAt: LocalDateTime? = null,
    var modifyedAt: LocalDateTime? = null

) {

    fun toEntity(): Todo {
        return Todo(title, description, priority, isCompleted, todoListId, startDate, dueDate)
    }
}
