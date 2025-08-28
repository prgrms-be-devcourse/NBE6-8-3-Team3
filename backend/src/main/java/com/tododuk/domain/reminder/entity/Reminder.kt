package com.tododuk.domain.reminder.entity

import com.tododuk.domain.todo.entity.Todo
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne
import java.time.LocalDateTime


@Entity
class Reminder (
    @ManyToOne()
    var todo: Todo?,
    var remindAt: LocalDateTime,
    var method: String
) : BaseEntity(){




    private constructor() : this(

        todo = null,
        remindAt = LocalDateTime.now(),
        method = ""
    )
}