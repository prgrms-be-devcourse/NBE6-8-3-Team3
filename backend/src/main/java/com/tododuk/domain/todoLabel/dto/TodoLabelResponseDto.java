package com.tododuk.domain.todoLabel.dto;

import com.tododuk.domain.label.dto.LabelDto;

import java.util.List;

public record TodoLabelResponseDto(
        int todoId,
        List<LabelDto> labels
) {}
