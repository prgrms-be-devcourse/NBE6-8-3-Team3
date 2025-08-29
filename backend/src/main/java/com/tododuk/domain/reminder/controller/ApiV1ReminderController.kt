package com.tododuk.domain.reminder.controller;

import com.tododuk.domain.reminder.dto.ReminderDto;
import com.tododuk.domain.reminder.entity.Reminder;
import com.tododuk.domain.reminder.service.ReminderService;
import com.tododuk.global.rsData.RsData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("api/v1/reminders")
@RequiredArgsConstructor
@Tag(name = "ApiV1ReminderController", description = "API 리마인더 컨트롤러")
public class ApiV1ReminderController {
    private final ReminderService reminderService;

    record ReminderReqBody(

            int todoId,
            LocalDateTime remindDateTime,
            String method
    ) {
    }

    @PostMapping
    @Transactional
    @Operation(summary = "리마인더 생성")
    public RsData<ReminderDto> createReminder(
            @Valid @RequestBody ReminderReqBody remCreRqBody
    ) {

        Reminder reminder = reminderService.createReminder(remCreRqBody.todoId, remCreRqBody.remindDateTime, remCreRqBody.method);

        return new RsData<ReminderDto>("201-1", "리마인더가 생성되었습니다.", new ReminderDto(reminder));
    }




    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "리마인더 삭제")
    public RsData<Void> deleteReminder(
            @PathVariable int id
    ) {

        return reminderService.deleteReminder(id);
    }

    // 단일 리마인더 조회
    @GetMapping("/{id}")
    @Transactional
    @Operation(summary = "리마인더 단건 조회")
    public RsData<ReminderDto> getReminderById(@PathVariable int id) {
        return reminderService.getReminderById(id); // RsData<ReminderDto> 반환
    }

    // 전체 리마인더 리스트 조회
    @GetMapping
    @Transactional
    @Operation(summary = "리마인더 전체 조회")
    public RsData<List<ReminderDto>> getReminders() {
        return reminderService.getReminder(); // RsData<List<ReminderDto>> 반환
    }

}



