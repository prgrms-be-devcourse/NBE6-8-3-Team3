package com.tododuk.domain.label.controller

import com.tododuk.domain.label.entity.Label
import com.tododuk.domain.label.service.LabelService
import com.tododuk.global.rsData.RsData
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/labels")
@Tag(name = "label")
@CrossOrigin(origins = ["http://localhost:3000"])
class LabelController(
    private val LabelService: LabelService
) {
    data class LabelResDto(
        val labels: MutableList<Label?>
    )

    @GetMapping
    fun getlabels(): RsData<LabelResDto>{
            val labels = LabelService.labels
            val responseDto = LabelResDto(labels)
            return RsData<LabelResDto>("200-1", "라벨 조회를 성공적으로 조회했습니다.", responseDto)
    }
}
