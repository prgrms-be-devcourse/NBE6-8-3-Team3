package com.tododuk.domain.todoList.dto

import jakarta.validation.constraints.NotBlank
import lombok.AllArgsConstructor
import lombok.Getter
import lombok.NoArgsConstructor
import java.time.LocalDateTime

@Getter
@NoArgsConstructor
@AllArgsConstructor
class TodoListReqDto (
    var name: @NotBlank String? = null,

    var description: String? = null,

    var userId: Int = 0,
    var teamId: Int = 0,

    var createdAt: LocalDateTime? = null,
    var modifiedAt: LocalDateTime? = null
){
     //    public TodoList toEntity() {
    //        return new TodoList(name, description, userId, teamId);
    //    }
}
