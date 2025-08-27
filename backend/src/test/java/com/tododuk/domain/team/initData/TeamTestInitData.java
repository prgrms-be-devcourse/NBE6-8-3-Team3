package com.tododuk.domain.team.initData;

import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.team.entity.TeamMember;
import com.tododuk.domain.team.repository.TeamMemberRepository;
import com.tododuk.domain.team.repository.TeamRepository;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component // 스프링 빈으로 등록하여 @Autowired로 주입 가능하게 함
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 주입
public class TeamTestInitData {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;


    /**
     * 테스트에 필요한 사용자 데이터를 생성합니다.
     * userEmail과 nickName은 항상 고유하게 생성됩니다.
     * 이 메서드는 @Transactional이 적용된 테스트 메서드 내에서 호출되어야 합니다.
     * @param baseIdentifier 사용자 식별을 위한 기본 문자열 (예: "leader", "member")
     * @return 생성된 User 엔티티
     */
    @Transactional
    public User createUser(String baseIdentifier) {
        String uniqueId = UUID.randomUUID().toString().substring(0, 8); // 고유한 짧은 문자열 생성
        String userEmail = baseIdentifier.toLowerCase() + "_" + uniqueId + "@test.com"; // 이메일을 고유하게
        String nickName = baseIdentifier + "_" + uniqueId; // 닉네임도 고유하게

        return userRepository.save(User.builder()
                .userEmail(userEmail)
                .password("testpass")
                .nickName(nickName)
                .isAdmin(false)
                .profileImgUrl("http://example.com/profile/" + uniqueId + ".jpg")
                .apiKey(UUID.randomUUID().toString())
                // createDate와 modifyDate는 BaseEntity에서 자동으로 관리되므로 여기서는 설정하지 않음
                .build());
    }

    /**
     * 테스트 팀을 생성합니다.
     * @param teamName 팀 이름
     * @param description 팀 설명
     * @return 생성된 Team 엔티티
     */
    @Transactional
    public Team createTeam(String teamName, String description) {
        return teamRepository.save(Team.builder()
                .teamName(teamName)
                .description(description)
                // createDate와 modifyDate는 BaseEntity에서 자동으로 관리되므로 여기서는 설정하지 않음
                .build());
    }

    /**
     * 팀 멤버를 생성합니다.
     * @param user 팀 멤버가 될 사용자
     * @param team 소속될 팀
     * @param role 팀에서의 역할 (LEADER, MEMBER)
     * @return 생성된 TeamMember 엔티티
     */
    @Transactional
    public TeamMember createTeamMember(User user, Team team, TeamRoleType role) {
        return teamMemberRepository.save(TeamMember.builder()
                .user(user)
                .team(team)
                .role(role)
                // joinedAt은 TeamMember 엔티티에만 있으므로 필요하면 설정 (현재 @PrePersist에서 자동 설정됨)
                // createDate와 modifyDate는 BaseEntity에서 자동으로 관리되므로 여기서는 설정하지 않음
                .build());
    }

    /**
     * 모든 팀 관련 데이터 (팀 멤버, 팀) 및 사용자 데이터를 삭제합니다.
     * 각 테스트 메서드 실행 전 데이터 독립성을 위해 사용될 수 있습니다.
     */
    @Transactional
    public void clearTeamRelatedData() {
        teamMemberRepository.deleteAllInBatch();
        teamRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    /**
     * 특정 팀 멤버를 삭제합니다. (테스트 시나리오별로 필요할 때 호출)
     */
    @Transactional
    public void deleteTeamMember(int teamMemberId) {
        teamMemberRepository.deleteById(teamMemberId);
    }
}