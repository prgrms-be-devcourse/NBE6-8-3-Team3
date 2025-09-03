package com.tododuk.domain.reminder.entity

import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity
import java.time.LocalDateTime


@Entity
class Reminder (
    var todoId: Int?,
    var remindAt: LocalDateTime,
    var method: String
) : BaseEntity(){




    private constructor() : this(

        todoId = null,
        remindAt = LocalDateTime.now(),
        method = ""
    )
}