package com.tododuk.domain.label.controller;

import com.tododuk.domain.label.entity.Label;
import com.tododuk.domain.label.service.LabelService;
import com.tododuk.global.rsData.RsData;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/labels")
@Tag(name = "label")
@CrossOrigin(origins = "http://localhost:3000")
public class LabelController {

    private final LabelService LabelService;

    record LabelResDto(
            List<Label> labels
    ) {
    }

    @GetMapping
    public RsData<LabelResDto> getLabels() {
        List<Label> labels = LabelService.getLabels();

        LabelResDto responseDto = new LabelResDto(labels);

        return new RsData<>("200-1", "라벨 조회를 성공적으로 조회했습니다.", responseDto);
    }
}
