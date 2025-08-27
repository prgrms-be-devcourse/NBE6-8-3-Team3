package com.tododuk.domain.team.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.team.dto.TeamMemberAddRequestDto;
import com.tododuk.domain.team.dto.TeamMemberUpdateRequestDto;
import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.team.initData.TeamTestInitData;
import com.tododuk.domain.team.repository.TeamMemberRepository;
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
class TeamMemberControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TeamMemberController teamMemberController;

    @Autowired
    private TeamTestInitData teamTestInitData;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @MockBean
    private Rq rq;

    private User leaderUser;
    private User memberUser;
    private User newMemberUser;
    private Team testTeam;

    @BeforeEach
    void setUp() {
        // MockMvc를 수동으로 설정하며 테스트용 예외 처리기를 등록
        mockMvc = MockMvcBuilders.standaloneSetup(teamMemberController)
                .setControllerAdvice(new TestGlobalExceptionHandler())
                .build();
                
        leaderUser = teamTestInitData.createUser("leader");
        memberUser = teamTestInitData.createUser("member");
        newMemberUser = teamTestInitData.createUser("newMember");
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
            if (resultCode.startsWith("409")) {
                return HttpStatus.CONFLICT;
            }
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
    
    @Test
    @DisplayName("1. 특정 팀의 멤버 목록 조회 성공")
    void getTeamMembersSuccess() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);
        
        // When & Then
        mockMvc.perform(get("/api/v1/teams/{teamId}/members", testTeam.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-OK"))
                .andExpect(jsonPath("$.data.size()").value(2))
                .andExpect(jsonPath("$.data[0].userNickname").value(leaderUser.getNickName()))
                .andExpect(jsonPath("$.data[1].userNickname").value(memberUser.getNickName()));
    }
    
    @Test
    @DisplayName("2. 특정 팀의 멤버 목록 조회 실패 - 팀 멤버 아님")
    void getTeamMembersFailure_notMember() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(newMemberUser); // 팀에 속하지 않은 사용자
        
        // When & Then
        mockMvc.perform(get("/api/v1/teams/{teamId}/members", testTeam.getId()))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.resultCode").value("403-NO_PERMISSION"))
                .andExpect(jsonPath("$.msg").value("해당 팀의 멤버 목록을 조회할 권한이 없습니다."));
    }
    
    @Test
    @DisplayName("3. 리더 - 팀 멤버 추가 성공")
    void addTeamMemberSuccess() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);
        TeamMemberAddRequestDto addDto = new TeamMemberAddRequestDto(newMemberUser.getId(), TeamRoleType.MEMBER);
        
        // When & Then
        mockMvc.perform(post("/api/v1/teams/{teamId}/members", testTeam.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-OK"))
                .andExpect(jsonPath("$.data.userNickname").value(newMemberUser.getNickName()));
                
        assertThat(teamMemberRepository.findByTeam_IdAndUser_Id(testTeam.getId(), newMemberUser.getId())).isPresent();
    }

    @Test
    @DisplayName("4. 리더 - 팀 멤버 추가 실패 - 권한 없음")
    void addTeamMemberFailure_NoPermission() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(memberUser); // 리더가 아닌 일반 멤버
        TeamMemberAddRequestDto addDto = new TeamMemberAddRequestDto(newMemberUser.getId(), TeamRoleType.MEMBER);

        // When & Then
        mockMvc.perform(post("/api/v1/teams/{teamId}/members", testTeam.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addDto)))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.resultCode").value("403-NO_PERMISSION"))
                .andExpect(jsonPath("$.msg").value("팀 멤버를 추가할 권한이 없습니다."));
    }

    @Test
    @DisplayName("5. 리더 - 팀 멤버 역할 변경 성공")
    void updateTeamMemberRoleSuccess() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);
        TeamMemberUpdateRequestDto updateDto = new TeamMemberUpdateRequestDto(TeamRoleType.LEADER);
        
        // When & Then
        mockMvc.perform(patch("/api/v1/teams/{teamId}/members/{memberUserId}/role", testTeam.getId(), memberUser.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-OK"))
                .andExpect(jsonPath("$.data.role").value(TeamRoleType.LEADER.name()));

        assertThat(teamMemberRepository.findByTeam_IdAndUser_Id(testTeam.getId(), memberUser.getId()).get().getRole()).isEqualTo(TeamRoleType.LEADER);
    }
    
    @Test
    @DisplayName("6. 리더 - 팀 멤버 역할 변경 실패 - 권한 없음")
    void updateTeamMemberRoleFailure_NoPermission() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(memberUser); // 리더가 아닌 일반 멤버
        TeamMemberUpdateRequestDto updateDto = new TeamMemberUpdateRequestDto(TeamRoleType.LEADER);

        // When & Then
        mockMvc.perform(patch("/api/v1/teams/{teamId}/members/{memberUserId}/role", testTeam.getId(), memberUser.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.resultCode").value("403-NO_PERMISSION"))
                .andExpect(jsonPath("$.msg").value("팀 멤버 역할을 변경할 권한이 없습니다."));
    }
    
    @Test
    @DisplayName("7. 리더 - 팀 멤버 제거 성공 (강퇴)")
    void deleteTeamMemberSuccess() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(leaderUser);

        // When & Then
        mockMvc.perform(delete("/api/v1/teams/{teamId}/members/{memberUserId}", testTeam.getId(), memberUser.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultCode").value("200-OK"));
        
        assertThat(teamMemberRepository.findByTeam_IdAndUser_Id(testTeam.getId(), memberUser.getId())).isNotPresent();
    }
    
    @Test
    @DisplayName("8. 리더 - 팀 멤버 제거 실패 - 권한 없음")
    void deleteTeamMemberFailure_NoPermission() throws Exception {
        // Given
        when(rq.getActor()).thenReturn(memberUser); // 리더가 아닌 일반 멤버

        // When & Then
        mockMvc.perform(delete("/api/v1/teams/{teamId}/members/{memberUserId}", testTeam.getId(), memberUser.getId()))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.resultCode").value("403-NO_PERMISSION"))
                .andExpect(jsonPath("$.msg").value("팀 멤버를 제거할 권한이 없습니다."));
    }

    @Test
    @DisplayName("9. 리더 - 팀 멤버 제거 실패 - 마지막 리더")
    void deleteTeamMemberFailure_LastLeaderCannotBeRemoved() throws Exception {
        // Given
        User leader2 = teamTestInitData.createUser("leader2");
        teamTestInitData.createTeamMember(leader2, testTeam, TeamRoleType.LEADER);
        when(rq.getActor()).thenReturn(leaderUser);
        
        // When
        teamMemberRepository.delete(teamMemberRepository.findByTeam_IdAndUser_Id(testTeam.getId(), leader2.getId()).get());

        // Then
        mockMvc.perform(delete("/api/v1/teams/{teamId}/members/{memberUserId}", testTeam.getId(), leaderUser.getId()))
                .andDo(print())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.resultCode").value("409-LAST_LEADER_CANNOT_BE_REMOVED"))
                .andExpect(jsonPath("$.msg").value("팀의 마지막 리더는 제거할 수 없습니다."));
    }
}