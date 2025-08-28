package com.tododuk.domain.todoLabel.dto


data class TodoLabelRequestDto(
    val todoId: Int,
    val labelIds: MutableList<Int>
) 