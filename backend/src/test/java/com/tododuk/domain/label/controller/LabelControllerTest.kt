package com.tododuk.domain.label.controller

import com.tododuk.domain.label.repository.LabelRepository
import com.tododuk.domain.label.service.LabelService
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithUserDetails
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.print
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.handler
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class LabelControllerTest{

    @Autowired
    private lateinit var labelService: LabelService
    @Autowired
    private lateinit var labelRepository: LabelRepository
    @Autowired
    private lateinit var mvc: MockMvc

    @Test
    @DisplayName("다건조회")
    @WithUserDetails("user1")
    fun t1(){
        val resultActions = mvc
            .perform(
                get("/api/labels")
            )
            .andDo(print())

        val labels = labelRepository.findAll()

        resultActions
            .andExpect(handler().handlerType(LabelController::class.java))
            .andExpect(status().isOk)
    }
}