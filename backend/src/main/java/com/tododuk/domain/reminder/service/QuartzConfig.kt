package com.tododuk.domain.reminder.service

import org.quartz.spi.JobFactory
import org.quartz.spi.TriggerFiredBundle
import org.springframework.beans.factory.config.AutowireCapableBeanFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.quartz.SchedulerFactoryBean
import org.springframework.scheduling.quartz.SpringBeanJobFactory

// QuartzConfig.java
@Configuration
class QuartzConfig(private val beanFactory: AutowireCapableBeanFactory) {
    @Bean
    fun schedulerFactoryBean(): SchedulerFactoryBean {
        val factory = SchedulerFactoryBean()
        factory.setJobFactory(springBeanJobFactory())
        return factory
    }

    @Bean
    fun springBeanJobFactory(): JobFactory {
        return object : SpringBeanJobFactory() {
            @Throws(Exception::class)
            override fun createJobInstance(bundle: TriggerFiredBundle): Any {
                val job = super.createJobInstance(bundle)
                beanFactory.autowireBean(job) //
                return job
            }
        }
    }
}