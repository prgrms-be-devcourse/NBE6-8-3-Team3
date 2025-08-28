package com.tododuk.domain.todoLabel.repository

import com.tododuk.domain.todoLabel.entity.TodoLabel
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface TodoLabelRepository : JpaRepository<TodoLabel, Int> {
    fun findByTodoId(todoId: Int): MutableList<TodoLabel>

    fun findByTodoIdAndLabelId(todoId: Int, labelId: Int): Optional<TodoLabel>

    fun existsByTodoIdAndLabelId(todoId: Int, labelId: Int): Boolean
}