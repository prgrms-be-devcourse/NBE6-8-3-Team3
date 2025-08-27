package com.tododuk.domain.user.controller

import com.tododuk.domain.user.dto.UserDto
import com.tododuk.domain.user.service.FileUploadService
import com.tododuk.domain.user.service.UserService
import com.tododuk.global.exception.ServiceException
import com.tododuk.global.rq.Rq
import com.tododuk.global.rsData.RsData
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import lombok.RequiredArgsConstructor
import lombok.extern.slf4j.Slf4j
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.function.Supplier

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
@Slf4j
class UserController {
    private val userService: UserService? = null
    private val fileUploadService: FileUploadService? = null
    private val rq: Rq? = null

    @JvmRecord
    internal data class UserJoinReqDto(
        val email: @NotBlank @Size(min = 2, max = 30) String?,
        val password: @NotBlank @Size(min = 2, max = 30) String?,
        val nickname: @NotBlank @Size(min = 2, max = 30) String?
    )

    @PostMapping("/register")
    fun join(
        @RequestBody reqBody: @Valid UserJoinReqDto
    ): ResponseEntity<*> {
        if (userService!!.findByUserEmail(reqBody.email).isPresent()) {
            val errorRsData = RsData<Void?>("409-1", "이미 존재하는 이메일입니다.", null)
            return ResponseEntity.status(HttpStatus.CONFLICT).body<RsData<Void?>?>(errorRsData)
        }

        val user = userService.join(
            reqBody.email,
            reqBody.password,
            reqBody.nickname
        )

        val successRsData: RsData<UserDto?> = RsData<T?>(
            "200-1",  // 나중에 201로 수정 가능
            "%s님 환영합니다. 회원가입이 완료되었습니다.".formatted(user.getNickName()),
            UserDto(user)
        )

        return ResponseEntity.ok<RsData<UserDto?>?>(successRsData)
    }

    @JvmRecord
    internal data class UserLoginReqDto(
        val email: @NotBlank @Size(min = 2, max = 30) String?,
        val password: @NotBlank @Size(min = 2, max = 30) String?
    )

    @JvmRecord
    internal data class UserLoginResDto(
        val userDto: UserDto?,
        val apiKey: String?,
        val accessToken: String?
    )

    @PostMapping("/login")
    fun login(
        @RequestBody reqBody: @Valid UserLoginReqDto,
        response: HttpServletResponse?
    ): RsData<UserLoginResDto?> {
        println("로그인 요청: " + reqBody.email + ", " + reqBody.password)
        val user = userService!!.findByUserEmail(reqBody.email)
            .orElseThrow<ServiceException?>(Supplier { ServiceException("404-1", "존재하지 않는 이메일입니다.") })

        // 비밀번호 체크
        userService.checkPassword(user, reqBody.password)
        // 로그인 성공 시 apiKey를 클라이언트 쿠키에 저장
        rq!!.setCookie("apiKey", user.getApiKey())
        //        Cookie apiKeyCookie = new Cookie("apiKey", user.getApiKey());
//        apiKeyCookie.setPath("/");
//        apiKeyCookie.setHttpOnly(true);
//        response.addCookie(apiKeyCookie);
        // accessToken을 생성하고 쿠키에 저장
        val accessToken = userService.genAccessToken(user)
        rq.setCookie("accessToken", accessToken)

        //dto 안에 기본 정보만 포함되어있음
        return RsData<T?>(
            "200-1",
            "%s님 환영합니다.".formatted(user.getNickName()),
            UserLoginResDto(
                UserDto(user),
                user.getApiKey(),
                accessToken

            )
        )
    }

    @get:GetMapping("/me")
    val myInfo: RsData<UserDto?>
        // 내 정보 조회 : 고유번호, 이메일, 닉네임, 프로필 사진
        get() {
            // 현재 로그인한 사용자의 정보를 가져오기
            val actor = rq!!.getActor()
            val user = userService!!.findById(actor.getId())
                .orElseThrow<ServiceException?>(Supplier {
                    ServiceException(
                        "404-1",
                        "존재하지 않는 사용자입니다."
                    )
                })

            return RsData<UserDto?>(
                "200-1",
                "내 정보 상세 조회 성공",
                UserDto(user)
            )
        }


    // 내 정보 수정 : 닉네임, 프로필 사진 변경 가능
    @PostMapping("/me")
    fun updateMyInfo(
        @RequestBody reqBody: @Valid UserDto
    ): RsData<UserDto?> {
        // Authorization 헤더 대신 rq.getActor() 사용 (쿠키 기반 인증)
        val actor = rq!!.getActor()
        val user = userService!!.findById(actor.getId())
            .orElseThrow<ServiceException?>(Supplier { ServiceException("404-1", "존재하지 않는 사용자입니다.") })

        userService.updateUserInfo(user, reqBody)

        return RsData<UserDto?>(
            "200-1",
            "내 정보 수정 성공",
            UserDto(user)
        )
    }

    @PostMapping("/profile-image")
    fun uploadProfileImage(
        @RequestParam("profileImage") file: MultipartFile?
    ): RsData<MutableMap<String?, String?>?> {
        // 현재 로그인한 사용자 정보 가져오기
        val actor = rq!!.getActor()
        if (actor == null) {
            throw ServiceException("401-1", "로그인이 필요합니다.")
        }

        val user = userService!!.findById(actor.getId())
            .orElseThrow<ServiceException?>(Supplier { ServiceException("404-1", "존재하지 않는 사용자입니다.") })

        // 기존 프로필 이미지가 있다면 삭제
        if (user.getProfileImgUrl() != null && !user.getProfileImgUrl().isEmpty()) {
            fileUploadService!!.deleteProfileImage(user.getProfileImgUrl())
        }

        // 새 프로필 이미지 업로드
        val imageUrl = fileUploadService!!.uploadProfileImage(file, user.getId().toLong())

        // 사용자 정보 업데이트 - 기존 UserService의 updateUserInfo 메서드 활용
        val updateDto = UserDto(
            user.getId(),
            user.getUserEmail(),
            user.getNickName(),
            imageUrl,  // 새로운 이미지 URL
            user.getCreateDate(),
            user.getModifyDate()
        )

        userService.updateUserInfo(user, updateDto)

        // 응답 데이터 구성
        val responseData: MutableMap<String?, String?> = HashMap<String?, String?>()
        responseData.put("imageUrl", imageUrl)

        return RsData<MutableMap<String?, String?>?>(
            "200-1",
            "프로필 이미지 업로드 성공",
            responseData
        )
    }

    //로그 아웃
    @PostMapping("/logout")
    fun logout(request: HttpServletRequest): RsData<Void?> {
        // 세션 무효화
        val session = request.getSession(false)
        if (session != null) {
            session.invalidate()
        }

        // 쿠키 삭제
        rq!!.deleteCookie("apiKey")
        rq.deleteCookie("accessToken") // 이것도 있다면
        rq.deleteCookie("refreshToken") // 이것도 있다면
        rq.deleteCookie("JSESSIONID")

        // 다른 쿠키들도...
        return RsData<Void?>(
            "200-1",
            "로그아웃 성공"
        )
    }
}