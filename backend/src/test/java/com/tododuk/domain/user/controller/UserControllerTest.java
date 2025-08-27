package com.tododuk.domain.user.controller;

import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.service.UserService;
import jakarta.servlet.http.Cookie;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class UserControllerTest {
    @Autowired
    private UserService UserService;
    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserService userService;

    @Test
    @DisplayName("회원가입")
    void t1() throws Exception {
        ResultActions resultActions = mvc
                .perform(
                        post("/api/v1/user/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                            "email": "usernew2@gmail.com",
                                            "password": "1234",
                                            "nickname": "무명2"
                                        }
                                        """.stripIndent())
                )
                .andDo(print());

        User user = userService.findByUserEmail("usernew2@gmail.com").get();

        resultActions
                .andExpect(status().isOk())  // 200
                .andExpect(jsonPath("$.resultCode").value("200-1"))
                .andExpect(jsonPath("$.msg").value("%s님 환영합니다. 회원가입이 완료되었습니다.".formatted(user.getNickName())))
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.id").value(user.getId()))
                .andExpect(jsonPath("$.data.email").value(user.getUserEmail()));
    }

    @Test
    @DisplayName("로그인")
    void t2() throws Exception {
        ResultActions resultActions = mvc
                .perform(
                        post("/api/v1/user/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                            "email": "usernew@gmail.com",
                                            "password": "1234"
                                        }
                                        """.stripIndent())
                )
                .andDo(print());

        User user = userService.findByUserEmail("usernew@gmail.com").get();

        resultActions
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-1"))
                .andExpect(jsonPath("$.msg").value("%s님 환영합니다.".formatted(user.getNickName())))
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.apiKey").value(user.getApiKey()))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());

        resultActions.andExpect(
                result -> {
                    Cookie apiKeyCookie = result.getResponse().getCookie("apiKey");
                    assertThat(apiKeyCookie.getValue()).isEqualTo(user.getApiKey());
                    assertThat(apiKeyCookie.getPath()).isEqualTo("/");
                    assertThat(apiKeyCookie.getAttribute("HttpOnly")).isEqualTo("true");

                    //엑세스 토큰도 확인
                    Cookie accessTokenCookie = result.getResponse().getCookie("accessToken");
                    assertThat(accessTokenCookie.getValue()).isNotBlank();
                    assertThat(accessTokenCookie.getPath()).isEqualTo("/");
                    assertThat(accessTokenCookie.getAttribute("HttpOnly")).isEqualTo("true");
                }
        );
    }

    @Test
    @DisplayName("내 정보 api쿠키 ver")
    void t3() throws Exception {
        User actor = userService.findByUserEmail("usernew@gmail.com").get();
        String actorApiKey = actor.getApiKey();

        ResultActions resultActions = mvc
                .perform(
                        get("/api/v1/user/me")
                                .cookie(new Cookie("apiKey", actorApiKey))
                )
                .andDo(print());

        User user = userService.findByUserEmail("usernew@gmail.com").get();

        resultActions
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-1"))
                .andExpect(jsonPath("$.msg").value("내 정보 조회 성공"))
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.id").value(user.getId()))
                .andExpect(jsonPath("$.data.email").value(user.getUserEmail()))
                .andExpect(jsonPath("$.data.nickname").value(user.getNickName()));
    }

    @Test
    @DisplayName("엑세스 토큰 만료/유효하지 않은 경우 apiKey를 통해 재발급")
    void t4() throws Exception {
        User actor = userService.findByUserEmail("usernew@gmail.com").get();
        String actorApiKey = actor.getApiKey();

        ResultActions resultActions = mvc
                .perform(
                        get("/api/v1/user/me")
                                .header("Authorization", "Bearer " + actorApiKey + " wrong-accessToken")
                )
                .andDo(print());

        resultActions
                .andExpect(status().isOk());

        resultActions.andExpect(
                result -> {
                    //엑세스 토큰 확인
                    Cookie accessTokenCookie = result.getResponse().getCookie("accessToken");
                    assertThat(accessTokenCookie.getValue()).isNotBlank();
                    assertThat(accessTokenCookie.getPath()).isEqualTo("/");
                    assertThat(accessTokenCookie.getAttribute("HttpOnly")).isEqualTo("true");
                    // 엑세스 토큰이 Authorization 헤더에 포함되어 있는지 확인
                    String headerAuthorization = result.getResponse().getHeader("Authorization");
                    assertThat(headerAuthorization).isNotBlank();
                    assertThat(headerAuthorization).isEqualTo(accessTokenCookie.getValue());
                }
        );
    }
}
