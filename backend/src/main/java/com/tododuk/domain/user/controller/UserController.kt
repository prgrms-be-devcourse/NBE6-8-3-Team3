package com.tododuk.domain.user.controller

import com.tododuk.domain.user.dto.UserDto
import com.tododuk.domain.user.dto.UserUpdateRequest
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
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1/user")
class UserController(
    private val userService: UserService,
    private val fileUploadService: FileUploadService,
    private val rq: Rq
) {

    @JvmRecord
    data class UserJoinReqDto(
        val email: @NotBlank @Size(min = 2, max = 30) String,
        val password: @NotBlank @Size(min = 2, max = 30) String,
        val nickname: @NotBlank @Size(min = 2, max = 30) String
    )

    @PostMapping("/register")
    fun join(
        @RequestBody @Valid reqBody: UserJoinReqDto
    ): ResponseEntity<*> {
        if (userService.findByUserEmail(reqBody.email).isPresent) {
            val errorRsData = RsData<Void?>("409-1", "이미 존재하는 이메일입니다.", null)
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorRsData)
        }

        val user = userService.join(
            reqBody.email,
            reqBody.password,
            reqBody.nickname
        )

        val successRsData = RsData(
            "200-1",
            "${user.nickName}님 환영합니다. 회원가입이 완료되었습니다.",
            UserDto(user)
        )

        return ResponseEntity.ok(successRsData)
    }

    @JvmRecord
    data class UserLoginReqDto(
        val email: @NotBlank @Size(min = 2, max = 30) String,
        val password: @NotBlank @Size(min = 2, max = 30) String
    )

    @JvmRecord
    data class UserLoginResDto(
        val userDto: UserDto?,
        val apiKey: String?,
        val accessToken: String?
    )

    @PostMapping("/login")
    fun login(
        @RequestBody @Valid reqBody: UserLoginReqDto,
        response: HttpServletResponse?
    ): RsData<UserLoginResDto?> {
        println("로그인 요청: ${reqBody.email}, ${reqBody.password}")
        val userOptional = userService.findByUserEmail(reqBody.email)

        if (!userOptional.isPresent) {
            throw ServiceException("404-1", "존재하지 않는 이메일입니다.")
        }

        val user = userOptional.get()

        // 비밀번호 체크
        userService.checkPassword(user, reqBody.password)

        // 로그인 성공 시 apiKey를 클라이언트 쿠키에 저장
        rq.setCookie("apiKey", user.apiKey)

        // accessToken을 생성하고 쿠키에 저장
        val accessToken = userService.genAccessToken(user)
        rq.setCookie("accessToken", accessToken)

        return RsData(
            "200-1",
            "${user.nickName}님 환영합니다.",
            UserLoginResDto(
                UserDto(user),
                user.apiKey,
                accessToken
            )
        )
    }

    @GetMapping("/me")
    fun getMyInfo(): RsData<UserDto?> {
        // 현재 로그인한 사용자의 정보를 가져오기
        val actorId: Int = rq.getActorId()
            ?: throw ServiceException("401-1", "인증된 사용자가 아닙니다.")

        val userOptional = userService.findById(actorId)
        if (!userOptional.isPresent) {
            throw ServiceException("404-1", "존재하지 않는 사용자입니다.")
        }

        val user = userOptional.get()

        return RsData(
            "200-1",
            "내 정보 상세 조회 성공",
            UserDto(user)
        )
    }

    @PostMapping("/me")
    fun updateMyInfo(
        @RequestBody reqBody: @Valid UserUpdateRequest
    ): RsData<UserUpdateRequest> {
        // 인증된 사용자 확인
        val actor = rq.getActor()
            ?: throw ServiceException("401-1", "인증된 사용자가 아닙니다.")

        val userOptional = userService.findById(actor.id)
        if (!userOptional.isPresent) {
            throw ServiceException("404-1", "존재하지 않는 사용자입니다.")
        }

        val user = userOptional.get()
        userService.updateUserInfo(user, reqBody)

        return RsData(
            "200-1",
            "내 정보 수정 성공",
            UserUpdateRequest(user)
        )
    }

    @PostMapping("/profile-image")
    fun manageProfileImage(
        @RequestParam("profileImage", required = false) file: MultipartFile?,
        @RequestParam("deleteImage", required = false, defaultValue = "false") deleteImage: Boolean
    ): RsData<MutableMap<String, String>> {
        val actor = rq.getActor() ?: throw ServiceException("401-1", "로그인이 필요합니다.")
        val user = userService.findById(actor.id).orElseThrow {
            ServiceException("404-1", "존재하지 않는 사용자입니다.")
        }

        val oldImageUrl = user.profileImgUrl
        var newImageUrl = ""

        // 기존 이미지 삭제 (업로드나 삭제 모든 경우)
        if (oldImageUrl.isNotEmpty()) {
            try {
                fileUploadService.deleteProfileImage(oldImageUrl)
            } catch (e: Exception) {
                println("기존 파일 삭제 실패: ${e.message}")
            }
        }

        // 이미지 삭제 요청이 아니고 파일이 있으면 업로드
        if (!deleteImage && file != null && !file.isEmpty) {
            newImageUrl = fileUploadService.uploadProfileImage(file, user.id.toLong())
        }
        // deleteImage가 true이면 newImageUrl은 빈 값("")으로 유지

        val responseData: MutableMap<String, String> = HashMap()
        responseData["imageUrl"] = newImageUrl

        return RsData(
            "200-1",
            if (deleteImage) "프로필 이미지 삭제 성공" else "프로필 이미지 업로드 성공",
            responseData
        )
    }

    //로그 아웃
    @PostMapping("/logout")
    fun logout(request: HttpServletRequest): RsData<Void?> {
        // 세션 무효화 지금은 안 쓰임
        val session = request.getSession(false)
        if (session != null) {
            session.invalidate()
        }

        // 쿠키 삭제
        rq.deleteCookie("apiKey")
        rq.deleteCookie("accessToken")
        rq.deleteCookie("refreshToken")
        rq.deleteCookie("JSESSIONID")

        return RsData(
            "200-1",
            "로그아웃 성공"
        )
    }
}