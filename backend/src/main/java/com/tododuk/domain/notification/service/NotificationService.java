package com.tododuk.domain.notification.service;

import com.tododuk.domain.notification.dto.NotificationDto;
import com.tododuk.domain.notification.entity.Notification;
import com.tododuk.domain.notification.repository.NotificationRepository;
import com.tododuk.domain.reminder.dto.ReminderDto;
import com.tododuk.domain.reminder.service.ReminderService;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.service.UserService;
import com.tododuk.global.rsData.RsData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {


    private final NotificationRepository notificationRepository;
    private final ReminderService reminderService;
    private final UserService userService;

    public NotificationDto CreateNotification(User user, String title, String description, String url) {
        Notification notification = new Notification(user, title, description, url);
        notificationRepository.save(notification);
        return new NotificationDto(notification.getId(), user, title, description, url, false);
    }

    public Notification findById(int id) {

        return notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
    }

    public void deleteNotification(Notification noti) {

        notificationRepository.delete(noti);
    }

    public List<Notification> getNotifications() {

        return notificationRepository.findAll();
    }

    public NotificationDto CreateNotificationByReminder(int reminderId) {
        RsData<ReminderDto> reminder = reminderService.getReminderById(reminderId);
        User user = userService.findByUserEmail("awdawdawd@gamil.com").orElseThrow(() -> new IllegalArgumentException("User not found with email"));
        String title = reminder.data().todo().getTitle();
        String description = "Reminder for: " + reminder.data().todo().getDescription();
        String url = "api/v1//todo/" + reminder.data().todo().getId();
        return CreateNotification(user, title, description, url);
    }


    public Notification updateNotificationStatus(Optional<Notification> notificationDto) {
        Notification notification = findById(notificationDto.get().getId());
        notification.setIsRead(notificationDto.get().isRead());
        notificationRepository.save(notification);
        return notification;

    }

    public List<Notification> getNotificationsByUserId(int id) {
        return notificationRepository.findByUser_Id(id);
    }

}