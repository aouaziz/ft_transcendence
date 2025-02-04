from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

class FriendRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ]

    sender = models.ForeignKey(get_user_model(), related_name='sent_friend_requests', on_delete=models.CASCADE, null=True)
    receiver = models.ForeignKey(get_user_model(), related_name='received_friend_requests', on_delete=models.CASCADE, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver', 'status')
        verbose_name_plural = 'Friend Requests'

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


User = get_user_model()

class Friendship(models.Model):
    user = models.ForeignKey(User, related_name="friendship", on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name="friend_with", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')