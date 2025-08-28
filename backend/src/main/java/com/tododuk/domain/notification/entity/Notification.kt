
import com.tododuk.domain.user.entity.User
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne

@Entity
class Notification(
    @ManyToOne
    val user: User,
    val title: String,
    val description: String,
    val url: String
) : BaseEntity() {

    final var isRead: Boolean = false
        private set  // 외부에서 직접 변경 불가

    fun markAsRead() {
        this.isRead = true
    }

}