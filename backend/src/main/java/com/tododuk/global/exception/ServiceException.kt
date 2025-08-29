package com.tododuk.global.exception

import com.tododuk.global.rsData.RsData

class ServiceException(
    val resultCode: String,
    val msg: String
) : RuntimeException("$resultCode: $msg") {

    val rsData: RsData<Void>
        get() = RsData(resultCode, msg, null)
}