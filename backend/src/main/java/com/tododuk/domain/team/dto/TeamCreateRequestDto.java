package com.tododuk.domain.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeamCreateRequestDto {
    @NotBlank(message = "팀 이름은 필수입니다.")
    @Size(max = 255, message = "팀 이름은 255자를 초과할 수 없습니다.")
    private String teamName; // 필드명 변경: name -> teamName

    @Size(max = 1000, message = "팀 설명은 1000자를 초과할 수 없습니다.")
    private String description;
}