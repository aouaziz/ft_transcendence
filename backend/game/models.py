from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.

class Game(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
    ]
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='waiting')
    player1_name = models.CharField(max_length=100)
    player2_name = models.CharField(max_length=100)
    winner = models.CharField(max_length=100, null=True, blank=True)  # Set this after the game finishes

    def __str__(self):
        return f"Game {self.pk} - {self.status}"
    
    
class GameSession(models.Model):

    game = models.ForeignKey(Game, on_delete=models.CASCADE,related_name="sessions")
    accelerationSpeed = models.IntegerField(default=1)
    maxBallSpeed = models.IntegerField(default=10) 
    maxSpeed = models.IntegerField(default=5)
    gameHeight = models.IntegerField(default=600)
    gameWidth = models.IntegerField(default=1100)
    paddle1Speed = models.IntegerField(default=0)
    paddle2Speed = models.IntegerField(default=0)
    paddle1_y = models.IntegerField(default=255)
    paddle2_y = models.IntegerField(default=255)
    ball_x = models.IntegerField(default=541)
    ballSpeedX = models.IntegerField(default=4)
    ball_y = models.IntegerField(default=283)
    ballSpeedY = models.IntegerField(default=4)
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)

    def __str__(self):
        return f"Session {self.pk} for Game {self.game.pk}"
 