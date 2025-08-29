package com.tododuk.domain.reminder.controller

import com.tododuk.domain.reminder.dto.ReminderDto
import com.tododuk.domain.reminder.service.ReminderService
import com.tododuk.global.rsData.RsData
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import lombok.RequiredArgsConstructor
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("api/v1/reminders")
@RequiredArgsConstructor
@Tag(name = "ApiV1ReminderController", description = "API 리마인더 컨트롤러")
class ApiV1ReminderController {
    private val reminderService: ReminderService? = null

    @JvmRecord
    data class ReminderReqBody(
        val todoId: Int,
        val remindDateTime: LocalDateTime?,
        val method: String?
    )

    @PostMapping
    @Transactional
    @Operation(summary = "리마인더 생성")
    fun createReminder(
        @RequestBody remCreRqBody: @Valid ReminderReqBody
    ): RsData<ReminderDto?> {
        val reminder =
            reminderService!!.createReminder(remCreRqBody.todoId, remCreRqBody.remindDateTime!!, remCreRqBody.method!!)

        return RsData<ReminderDto?>("201-1", "리마인더가 생성되었습니다.", ReminderDto(reminder))
    }


    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "리마인더 삭제")
    fun deleteReminder(
        @PathVariable id: Int
    ): RsData<Void?> {
        return reminderService!!.deleteReminder(id)
    }

    // 단일 리마인더 조회
    @GetMapping("/{id}")
    @Transactional
    @Operation(summary = "리마인더 단건 조회")
    fun getReminderById(@PathVariable id: Int): RsData<ReminderDto?> {
        return reminderService!!.getReminderById(id) // RsData<ReminderDto> 반환
    }

    @get:Operation(summary = "리마인더 전체 조회")
    @get:Transactional
    @get:GetMapping
    val reminders: RsData<MutableList<ReminderDto?>?>
        // 전체 리마인더 리스트 조회
        get() = reminderService!!.getReminder() // RsData<List<ReminderDto>> 반환
}