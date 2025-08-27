package com.tododuk.domain.team.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TeamRoleType {
    LEADER("리더"),
    MEMBER("멤버");

    private final String description;

    // fromString 메서드를 추가하여 문자열을 enum으로 변환할 때 유용
    public static TeamRoleType fromString(String roleName) {
        // 1. 모든 TeamRoleType 상수들을 순회합니다.
        for (TeamRoleType role : TeamRoleType.values()) {
            // 2. 현재 순회 중인 TeamRoleType 상수의 이름을 가져와서
            //    입력으로 받은 roleName과 대소문자 구분 없이 비교합니다.
            if (role.name().equalsIgnoreCase(roleName)) {
                // 3. 만약 일치하는 상수를 찾으면, 해당 TeamRoleType 상수를 반환합니다.
                return role;
            }
        }
        // 4. 모든 상수를 순회했는데도 일치하는 것을 찾지 못하면,
        //    유효하지 않은 역할 이름이라는 예외를 발생시킵니다.
        throw new IllegalArgumentException("Invalid TeamRoleType: " + roleName);
    }
}