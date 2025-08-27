package com.tododuk.domain.team.service;

import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.team.dto.TeamMemberAddRequestDto;
import com.tododuk.domain.team.dto.TeamMemberResponseDto;
import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.team.entity.TeamMember;
import com.tododuk.domain.team.repository.TeamMemberRepository;
import com.tododuk.domain.team.repository.TeamRepository;
import com.tododuk.domain.team.repository.TodoAssignmentRepository;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.repository.UserRepository;
import com.tododuk.global.exception.ServiceException;
import com.tododuk.global.rsData.RsData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamMemberService {
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TodoAssignmentRepository todoAssignmentRepository;

    // 1. 팀 생성 시 초기 리더 멤버 추가 (TeamService에서 호출)
    @Transactional
    public TeamMember createLeaderMember(Team team, User leaderUser) {
        // 새로운 리더 멤버 생성
        TeamMember leaderMember = TeamMember.builder()
                .user(leaderUser)
                .team(team)
                .role(TeamRoleType.LEADER)
                .build();
        team.addMember(leaderMember);
        return teamMemberRepository.save(leaderMember);
    }

    // 2. 특정 팀의 모든 멤버 조회
    public RsData<List<TeamMemberResponseDto>> getTeamMembers(int teamId, int requesterUserId) {
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, requesterUserId)) {
            throw new ServiceException("403-NO_PERMISSION", "해당 팀의 멤버 목록을 조회할 권한이 없습니다.");
        }
        List<TeamMember> members = teamMemberRepository.findByTeam_Id(teamId);
        List<TeamMemberResponseDto> memberDtos = members.stream()
                .map(TeamMemberResponseDto::from)
                .collect(Collectors.toList());
        return RsData.success("팀 멤버 목록 조회 성공", memberDtos);
    }

    // 3. 팀 멤버 추가 (이메일 기반)
    @Transactional
    public RsData<TeamMemberResponseDto> addTeamMember(int teamId, TeamMemberAddRequestDto dto, int inviterUserId) {
        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, inviterUserId, TeamRoleType.LEADER)) {
            throw new ServiceException("403-NO_PERMISSION", "팀 멤버를 추가할 권한이 없습니다.");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: " + teamId));

        // 이메일로 사용자 찾기
        User newMemberUser = userRepository.findByUserEmail(dto.getEmail())
                .orElseThrow(() -> new ServiceException("404-USER_NOT_FOUND", "해당 이메일의 사용자를 찾을 수 없습니다: " + dto.getEmail()));

        // 이미 팀 멤버인지 확인 (이메일 기반)
        if (teamMemberRepository.existsByTeam_IdAndUser_UserEmail(teamId, newMemberUser.getUserEmail())) {
            throw new ServiceException("409-ALREADY_MEMBER", "이미 해당 팀의 멤버입니다. Email: " + newMemberUser.getUserEmail());
        }

        TeamMember teamMember = TeamMember.builder()
                .team(team)
                .user(newMemberUser)
                .role(dto.getRole())
                .build();
        team.addMember(teamMember);
        teamMemberRepository.save(teamMember);

        return RsData.success("팀 멤버가 성공적으로 추가되었습니다.", TeamMemberResponseDto.from(teamMember));
    }

    // 4. 팀 멤버 역할 변경 (이메일 기반)
    @Transactional
    public RsData<TeamMemberResponseDto> updateTeamMemberRole(int teamId, int userId, TeamRoleType newRole, int requesterUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: " + teamId));

        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, requesterUserId, TeamRoleType.LEADER)) {
            throw new ServiceException("403-NO_PERMISSION", "팀 멤버 역할을 변경할 권한이 없습니다.");
        }

        TeamMember teamMember = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow(() -> new ServiceException("404-MEMBER_NOT_FOUND", "해당 팀의 멤버를 찾을 수 없습니다. User ID: " + userId));

        teamMember.updateRole(newRole);
        return RsData.success("팀 멤버 역할이 성공적으로 변경되었습니다.", TeamMemberResponseDto.from(teamMember));
    }

    // 5. 팀 멤버 삭제
    @Transactional
    public RsData<Void> deleteTeamMember(int teamId, int memberUserIdToRemove, int removerUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: " + teamId));

        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, removerUserId, TeamRoleType.LEADER)) {
            throw new ServiceException("403-NO_PERMISSION", "팀 멤버를 제거할 권한이 없습니다.");
        }

        TeamMember teamMember = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, memberUserIdToRemove)
                .orElseThrow(() -> new ServiceException("404-MEMBER_NOT_FOUND", "해당 팀의 멤버를 찾을 수 없습니다. User ID: " + memberUserIdToRemove));

        if (teamMember.getRole() == TeamRoleType.LEADER) {
            long leaderCount = teamMemberRepository.countByTeam_IdAndRole(teamId, TeamRoleType.LEADER);
            if (leaderCount == 1) {
                throw new ServiceException("409-LAST_LEADER_CANNOT_BE_REMOVED", "팀의 마지막 리더는 제거할 수 없습니다.");
            }
        }

        // 해당 멤버가 담당자로 지정된 모든 할일의 담당자 정보 삭제
        System.out.println("=== 멤버 제거 시 담당자 정보 삭제 시작 ===");
        System.out.println("팀 ID: " + teamId + ", 제거할 멤버 User ID: " + memberUserIdToRemove);
        
        try {
            todoAssignmentRepository.deleteByTeam_IdAndAssignedUser_Id(teamId, memberUserIdToRemove);
            System.out.println("담당자 정보 삭제 완료");
        } catch (Exception e) {
            System.out.println("담당자 정보 삭제 실패: " + e.getMessage());
            e.printStackTrace();
        }

        teamMemberRepository.delete(teamMember);
        return RsData.success("팀 멤버가 성공적으로 제거되었습니다.", null);
    }
}