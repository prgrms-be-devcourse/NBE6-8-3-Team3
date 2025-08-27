package com.tododuk.domain.todoLabel.dto;

import java.util.List;

public record TodoLabelRequestDto(
        int todoId,
        List<Integer> labelIds
) {}