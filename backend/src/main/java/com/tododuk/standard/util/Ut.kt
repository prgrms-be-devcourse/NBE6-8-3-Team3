package com.tododuk.standard.util

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import java.security.Key
import java.util.*

class Ut {
    object jwt {
        fun toString(secret: String?, expireSeconds: Int, body: MutableMap<String?, Any?>): String {
            require(secret != null) { "JWT secret cannot be null" }

            val claimsBuilder = Jwts.claims()
            for (entry in body.entries) {
                claimsBuilder.add(entry.key, entry.value)
            }

            val claims = claimsBuilder.build()
            val issuedAt = Date()
            val expiration = Date(issuedAt.time + 1000L * expireSeconds)
            val secretKey: Key = Keys.hmacShaKeyFor(secret.toByteArray())

            return Jwts.builder()
                .claims(claims)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(secretKey)
                .compact()
        }

        fun isValid(secret: String?, jwt: String?): Boolean {
            if (secret == null || jwt == null) return false

            val secretKey = Keys.hmacShaKeyFor(secret.toByteArray())
            try {
                Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parse(jwt)
                return true
            } catch (e: Exception) {
                return false
            }
        }

        fun payload(secret: String?, jwt: String?): MutableMap<String?, Any?>? {
            if (secret == null || jwt == null) return null

            val secretKey = Keys.hmacShaKeyFor(secret.toByteArray())
            try {
                return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parse(jwt)
                    .payload as MutableMap<String?, Any?>?
            } catch (e: Exception) {
                return null
            }
        }
    }
}