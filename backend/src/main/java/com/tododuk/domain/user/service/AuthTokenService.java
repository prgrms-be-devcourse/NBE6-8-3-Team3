package com.tododuk.domain.user.service;

import com.tododuk.domain.user.entity.User;
import com.tododuk.standard.util.Ut;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthTokenService {
    //yml 파일에서 설정값을 불러옴
    @Value("${custom.jwt.secretKey}")
    private String jwtSecretKey;

    @Value("${custom.accessToken.expirationSeconds}")
    private int accessTokenExpirationSeconds;
    //액세스 토큰 생성
    public String genAccessToken(User user) {
        long id = user.getId();
        String email = user.getUserEmail();

        return Ut.jwt.toString(
                jwtSecretKey,
                accessTokenExpirationSeconds,
                Map.of("id", id, "email", email)
        );
    }

    // 액세스 토큰에서 페이로드 추출
    public Map<String, Object> payload(String accessToken) {
        Map<String, Object> parsePayload = Ut.jwt.payload(jwtSecretKey, accessToken);

        if (parsePayload == null) {
            return null;
        }

        long id = (long) (Integer) parsePayload.get("id");
        String email = (String) parsePayload.get("email");

        return Map.of("id", id, "email", email);
    }

}
