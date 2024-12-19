from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):
    room_code = models.CharField(max_length=6, unique=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, default='WAITING')
    def __str__(self):
        return f"Room {self.room_code} - {self.status}"

class Game(models.Model):
    room = models.OneToOneField(Room, on_delete=models.CASCADE, unique=True)
    player1 = models.ForeignKey(User, related_name='player1', on_delete=models.CASCADE,null=True)
    player2 = models.ForeignKey(User, related_name='player2', on_delete=models.CASCADE,null=True, blank=True)
    winner = models.ForeignKey(User, related_name='winner', on_delete=models.CASCADE,null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)  # Add this line

    def __str__(self):
        return f"Game {self.room.room_code} - Player 1: {self.player1}, Player 2: {self.player2}"


