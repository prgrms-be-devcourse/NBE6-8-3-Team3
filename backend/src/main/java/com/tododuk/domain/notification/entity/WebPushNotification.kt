package com.tododuk.domain.notification.entity

import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity

@Entity
open class WebPushNotification : BaseEntity {

    var userId: Int = 0
    var endPointBrowser: String = ""
    var p256dh: String = ""
    var auth : String = ""

    // JPA 기본 생성자
    protected constructor() : super()

    // 사용자 정의 생성자
    constructor(
        userId: Int,
        endPointBrowser: String,
        p256dh: String,
        auth: String
    ) : super() {
        this.userId = userId
        this.endPointBrowser = endPointBrowser
        this.p256dh = p256dh
        this.auth  = auth
    }

}