package com.tododuk.domain.todoLabel.entity

import com.tododuk.domain.label.entity.Label
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.ManyToOne


@Entity
class TodoLabel(
    @ManyToOne(fetch = FetchType.LAZY)
    var todo: Todo? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    var label: Label? = null
) : BaseEntity(){

}
