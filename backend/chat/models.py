# chat/models.py
from django.db import models
from auth_service.models import MyUser

class Message(models.Model):
    sender = models.ForeignKey(MyUser, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(MyUser, related_name='received_messages', on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.message}"