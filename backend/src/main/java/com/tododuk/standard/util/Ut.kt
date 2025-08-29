package com.tododuk.standard.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ClaimsBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.Map;

public class Ut {
    public static class jwt {
        public static String toString(String secret, int expireSeconds, Map<String, Object> body) {
            ClaimsBuilder claimsBuilder = Jwts.claims();

            for (Map.Entry<String, Object> entry : body.entrySet()) {
                claimsBuilder.add(entry.getKey(), entry.getValue());
            }

            Claims claims = claimsBuilder.build();

            Date issuedAt = new Date();
            Date expiration = new Date(issuedAt.getTime() + 1000L * expireSeconds);

            Key secretKey = Keys.hmacShaKeyFor(secret.getBytes());

            String jwt = Jwts.builder()
                    .claims(claims)
                    .issuedAt(issuedAt)
                    .expiration(expiration)
                    .signWith(secretKey)
                    .compact();

            return jwt;
        }
        // jwt 유효성 검사
        public static boolean isValid(String secret, String jwt) {
            SecretKey secretKey = Keys.hmacShaKeyFor(secret.getBytes());

            try {
                Jwts.parser()
                        .verifyWith(secretKey)
                        .build()
                        .parse(jwt);
            } catch (Exception e) {
                return false;
            }
            return true;
        }

        // jwt에서 payload(실제 데이터) 추출
        public static Map<String, Object> payload(String secret, String jwt) {
            SecretKey secretKey = Keys.hmacShaKeyFor(secret.getBytes());
            try{
                return (Map<String, Object>) Jwts.parser()
                        .verifyWith(secretKey)
                        .build()
                        .parse(jwt)
                        .getPayload();
            } catch (Exception e){
                return null;
            }
        }
    }
}
