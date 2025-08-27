package com.tododuk.domain.user.controller;

import com.tododuk.domain.user.dto.UserDto;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.service.FileUploadService;
import com.tododuk.domain.user.service.UserService;
import com.tododuk.global.exception.ServiceException;
import com.tododuk.global.rq.Rq;
import com.tododuk.global.rsData.RsData;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import com.tododuk.global.exception.ServiceException;
import java.util.Map;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
@Slf4j
public class UserController {
    private final UserService userService;
    private final FileUploadService fileUploadService;
    private final Rq rq;

    record UserJoinReqDto(
            @NotBlank
            @Size(min = 2, max = 30)
            String email,
            @NotBlank
            @Size(min = 2, max = 30)
            String password,
            @NotBlank
            @Size(min = 2, max = 30)
            String nickname
    ) {
    }

    @PostMapping("/register")
    public ResponseEntity<?> join(
            @Valid @RequestBody UserJoinReqDto reqBody
    ) {
        if (userService.findByUserEmail(reqBody.email).isPresent()) {
            RsData<Void> errorRsData = new RsData<>("409-1", "이미 존재하는 이메일입니다.", null);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorRsData);
        }

        User user = userService.join(
                reqBody.email(),
                reqBody.password(),
                reqBody.nickname()
        );

        RsData<UserDto> successRsData = new RsData<>(
                "200-1", // 나중에 201로 수정 가능
                "%s님 환영합니다. 회원가입이 완료되었습니다.".formatted(user.getNickName()),
                new UserDto(user)
        );

        return ResponseEntity.ok(successRsData);
    }

    record UserLoginReqDto(
            @NotBlank
            @Size(min = 2, max = 30)
            String email,
            @NotBlank
            @Size(min = 2, max = 30)
            String password
    ) {
    }

    record UserLoginResDto(

            UserDto userDto,
            String apiKey,
            String accessToken
    ) {
    }
    @PostMapping("/login")
    public RsData<UserLoginResDto> login(
            @Valid @RequestBody UserLoginReqDto reqBody,
            HttpServletResponse response
    ) {

        System.out.println("로그인 요청: " + reqBody.email + ", " + reqBody.password);
        User user = userService.findByUserEmail(reqBody.email)
                .orElseThrow(() -> new ServiceException("404-1","존재하지 않는 이메일입니다."));

        // 비밀번호 체크
        userService.checkPassword(user, reqBody.password);
        // 로그인 성공 시 apiKey를 클라이언트 쿠키에 저장
        rq.setCookie("apiKey", user.getApiKey());
//        Cookie apiKeyCookie = new Cookie("apiKey", user.getApiKey());
//        apiKeyCookie.setPath("/");
//        apiKeyCookie.setHttpOnly(true);
//        response.addCookie(apiKeyCookie);
        // accessToken을 생성하고 쿠키에 저장
        String accessToken = userService.genAccessToken(user);
        rq.setCookie("accessToken", accessToken);

        //dto 안에 기본 정보만 포함되어있음
        return new RsData<>(
                "200-1",
                "%s님 환영합니다.".formatted(user.getNickName()),
                new UserLoginResDto(
                        new UserDto(user),
                        user.getApiKey(),
                        accessToken

                )
        );
    }

    // 내 정보 조회 : 고유번호, 이메일, 닉네임, 프로필 사진
    @GetMapping("/me")
    public RsData<UserDto> getMyInfo(){
        // 현재 로그인한 사용자의 정보를 가져오기
        User actor = rq.getActor();
        User user = userService.findById(actor.getId())
                .orElseThrow(() -> new ServiceException("404-1","존재하지 않는 사용자입니다."));

        return new RsData<>(
                "200-1",
                "내 정보 상세 조회 성공",
                new UserDto(user)
        );
    }



    // 내 정보 수정 : 닉네임, 프로필 사진 변경 가능
    @PostMapping("/me")
    public RsData<UserDto> updateMyInfo(
            @Valid @RequestBody UserDto reqBody
    ){
        // Authorization 헤더 대신 rq.getActor() 사용 (쿠키 기반 인증)
        User actor = rq.getActor();
        User user = userService.findById(actor.getId())
                .orElseThrow(() -> new ServiceException("404-1","존재하지 않는 사용자입니다."));

        userService.updateUserInfo(user, reqBody);

        return new RsData<>(
                "200-1",
                "내 정보 수정 성공",
                new UserDto(user)
        );
    }

    @PostMapping("/profile-image")
    public RsData<Map<String, String>> uploadProfileImage(
            @RequestParam("profileImage") MultipartFile file
    ) {
        // 현재 로그인한 사용자 정보 가져오기
        User actor = rq.getActor();
        if (actor == null) {
            throw new ServiceException("401-1", "로그인이 필요합니다.");
        }

        User user = userService.findById(actor.getId())
                .orElseThrow(() -> new ServiceException("404-1", "존재하지 않는 사용자입니다."));

        // 기존 프로필 이미지가 있다면 삭제
        if (user.getProfileImgUrl() != null && !user.getProfileImgUrl().isEmpty()) {
            fileUploadService.deleteProfileImage(user.getProfileImgUrl());
        }

        // 새 프로필 이미지 업로드
        String imageUrl = fileUploadService.uploadProfileImage(file, (long) user.getId());

        // 사용자 정보 업데이트 - 기존 UserService의 updateUserInfo 메서드 활용
        UserDto updateDto = new UserDto(
                user.getId(),
                user.getUserEmail(),
                user.getNickName(),
                imageUrl,  // 새로운 이미지 URL
                user.getCreateDate(),
                user.getModifyDate()
        );

        userService.updateUserInfo(user, updateDto);

        // 응답 데이터 구성
        Map<String, String> responseData = new HashMap<>();
        responseData.put("imageUrl", imageUrl);

        return new RsData<>(
                "200-1",
                "프로필 이미지 업로드 성공",
                responseData
        );
    }

    //로그 아웃
    @PostMapping("/logout")
    public RsData<Void> logout(HttpServletRequest request) {
        // 세션 무효화
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // 쿠키 삭제
        rq.deleteCookie("apiKey");
        rq.deleteCookie("accessToken");  // 이것도 있다면
        rq.deleteCookie("refreshToken"); // 이것도 있다면
        rq.deleteCookie("JSESSIONID");
        // 다른 쿠키들도...

        return new RsData<>(
                "200-1",
                "로그아웃 성공"
        );
    }

}