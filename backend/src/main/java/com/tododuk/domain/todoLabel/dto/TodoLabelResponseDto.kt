package com.tododuk.domain.todoLabel.dto

import com.tododuk.domain.label.dto.LabelDto

data class TodoLabelResponseDto(
    val todoId: Int,
    val labels: MutableList<LabelDto?>?
)
