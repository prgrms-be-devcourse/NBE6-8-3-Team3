package com.tododuk.domain.reminder.repository;

import com.tododuk.domain.reminder.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRepository extends JpaRepository<Reminder, Integer> {

}
