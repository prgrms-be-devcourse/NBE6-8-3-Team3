package com.tododuk.global.rsData

import com.fasterxml.jackson.annotation.JsonIgnore

data class RsData<T>(
    val resultCode: String,
    @field:JsonIgnore val statusCode: Int,
    val msg: String,
    val data: T?
) {
    constructor(resultCode: String, msg: String) : this(
        resultCode = resultCode,
        statusCode = resultCode.substringBefore("-").toIntOrNull() ?: 0,
        msg = msg,
        data = null
    )

    constructor(resultCode: String, msg: String, data: T?) : this(
        resultCode = resultCode,
        statusCode = resultCode.substringBefore("-").toIntOrNull() ?: 0,
        msg = msg,
        data = data
    )

    companion object {
        @JvmStatic
        fun <T> success(msg: String): RsData<T> =
            RsData("200-OK", msg)
        @JvmStatic
        fun <T> success(msg: String, data: T): RsData<T> =
            RsData("200-OK", msg, data)
    }
}