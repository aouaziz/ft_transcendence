from django.db import models
from auth_service.models import MyUser



class Game(models.Model):
    room_code = models.CharField(max_length=6, unique=True)
    status = models.CharField(max_length=10, default='WAITING')
    player1 = models.ForeignKey(MyUser, related_name='player1', on_delete=models.CASCADE,null=True)
    player2 = models.ForeignKey(MyUser, related_name='player2', on_delete=models.CASCADE,null=True, blank=True)
    winner = models.ForeignKey(MyUser, related_name='winner', on_delete=models.CASCADE,null=True, blank=True)
    player1_score = models.IntegerField(default=0) 
    player2_score = models.IntegerField(default=0) 
    timestamp = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"Game {self.room.room_code} - Player 1: {self.player1}, Player 2: {self.player2}"


