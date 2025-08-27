package com.tododuk.domain.team.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.team.dto.TeamCreateRequestDto;
import com.tododuk.domain.team.dto.TeamUpdateRequestDto;
import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.team.initData.TeamTestInitData;
import com.tododuk.domain.team.repository.TeamRepository;
import com.tododuk.domain.user.entity.User;
import com.tododuk.global.exception.ServiceException;
import com.tododuk.global.rq.Rq;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class TeamControllerTest {

    private MockMvc mockMvc; // MockMvc를 직접 주입받지 않고 인스턴스 변수로 선언

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TeamController teamController; // MockMvc 설정 시 사용할 컨트롤러를 주입

    @Autowired
    private TeamTestInitData teamTestInitData;

    @Autowired
    private TeamRepository teamRepository;

    @MockBean
    private Rq rq;

    private User leaderUser;
    private User memberUser;
    private Team testTeam;

    @BeforeEach
    void setUp() {
        // MockMvc를 수동으로 설정하며 테스트용 예외 처리기를 등록
        mockMvc = MockMvcBuilders.standaloneSetup(teamController)
                .setControllerAdvice(new TestGlobalExceptionHandler()) // 테스트용 예외 처리기 등록
                .build();

        leaderUser = teamTestInitData.createUser("leader");
        memberUser = teamTestInitData.createUser("member");
        testTeam = teamTestInitData.createTeam("테스트 팀", "테스트 팀 설명");
        teamTestInitData.createTeamMember(leaderUser, testTeam, TeamRoleType.LEADER);
        teamTestInitData.createTeamMember(memberUser, testTeam, TeamRoleType.MEMBER);
    }

    // 테스트용 예외 처리기 (내부 클래스로 정의)
    @RestControllerAdvice
    private static class TestGlobalExceptionHandler {
        @ExceptionHandler(ServiceException.class)
        public ResponseEntity<Map<String, Object>> handleServiceException(ServiceException e) {
            HttpStatus httpStatus = determineHttpStatus(e.getResultCode());
            Map<String, Object> responseBody = new LinkedHashMap<>();
            responseBody.put("resultCode", e.getResultCode());
            responseBody.put("msg", e.getMsg());

            return new ResponseEntity<>(responseBody, httpStatus);
        }

        private HttpStatus determineHttpStatus(String resultCode) {
            if (resultCode.startsWith("403")) {
                return HttpStatus.FORBIDDEN;
            }
            if (resultCode.startsWith("404")) {
                return HttpStatus.NOT_FOUND;
            }
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    @Test
    @DisplayName("1. 팀 생성 성공")
    void createTeamSuccess() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);
        TeamCreateRequestDto requestDto = new TeamCreateRequestDto("새로운 팀", "팀 설명");

        // When & Then
        mockMvc.perform(post("/api/v1/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-OK"))
                .andExpect(jsonPath("$.data.teamName").value("새로운 팀"));

        assertThat(teamRepository.findAll()).hasSize(2);
    }

    @Test
    @DisplayName("2. 팀 정보 수정 성공")
    void updateTeamInfoSuccess() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);
        TeamUpdateRequestDto requestDto = new TeamUpdateRequestDto("수정된 팀 이름", "수정된 설명");

        // When & Then
        mockMvc.perform(patch("/api/v1/teams/{teamId}", testTeam.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-OK"))
                .andExpect(jsonPath("$.data.teamName").value("수정된 팀 이름"));

        assertThat(teamRepository.findById(testTeam.getId()).get().getTeamName()).isEqualTo("수정된 팀 이름");
    }

    @Test
    @DisplayName("3. 팀 정보 수정 실패 - 권한 없음")
    void updateTeamInfoFailure_NoPermission() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(memberUser);
        TeamUpdateRequestDto requestDto = new TeamUpdateRequestDto("수정된 팀 이름", "수정된 설명");

        // When & Then
        mockMvc.perform(patch("/api/v1/teams/{teamId}", testTeam.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.resultCode").value("403-NO_PERMISSION"))
                .andExpect(jsonPath("$.msg").value("팀 정보를 수정할 권한이 없습니다."));
    }

    @Test
    @DisplayName("4. 팀 삭제 성공")
    void deleteTeamSuccess() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);

        // When & Then
        mockMvc.perform(delete("/api/v1/teams/{teamId}", testTeam.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-OK"));

        assertThat(teamRepository.findById(testTeam.getId())).isNotPresent();
    }

    @Test
    @DisplayName("5. 팀 삭제 실패 - 팀을 찾을 수 없음")
    void deleteTeamFailure_TeamNotFound() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);
        int nonExistentTeamId = -1;

        // When & Then
        mockMvc.perform(delete("/api/v1/teams/{teamId}", nonExistentTeamId))
                .andDo(print())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.resultCode").value("404-TEAM_NOT_FOUND"))
                .andExpect(jsonPath("$.msg").value("팀을 찾을 수 없습니다. ID: -1"));
    }
}