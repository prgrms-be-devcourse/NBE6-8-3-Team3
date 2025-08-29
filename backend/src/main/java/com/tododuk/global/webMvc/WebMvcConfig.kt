package com.tododuk.global.webMvc

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.nio.file.Paths

@Configuration
class WebMvcConfig : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {
        registry
            .addMapping("/api/**")
            .allowedOrigins("https://cdpn.io", "http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
    }

    @Value("\${file.upload.path:uploads/profiles/}")
    private val uploadPath: String? = null

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        // 업로드된 파일을 정적 리소스로 서빙
        // 절대 경로로 변환
        val absolutePath = Paths.get(System.getProperty("user.dir"), "uploads").toUri().toString()

        registry.addResourceHandler("/uploads/**")
            .addResourceLocations(absolutePath)

        // 예: /uploads/profiles/profile_1_1234567890.jpg 요청 시
        // {프로젝트루트}/uploads/profiles/profile_1_1234567890.jpg 파일을 서빙
    }
}
