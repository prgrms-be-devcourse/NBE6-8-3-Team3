package com.tododuk.domain.label.dto

import com.tododuk.domain.label.entity.Label

data class LabelDto(
    val id: Int,
    val name: String?,
    val color: String?
){
    constructor(label: Label) : this(
        id = label.id,
        name = label.name,
        color = label.color
    )
}
