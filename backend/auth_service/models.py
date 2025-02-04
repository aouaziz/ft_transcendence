# auth_service/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class MyUser(AbstractUser):
    # OAuth fields
    intra_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    username= models.CharField(max_length=20, unique=True)
    # Personal Information
    image_link = models.URLField(blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    email = models.EmailField(unique=True)
    date_joined = models.DateTimeField(default=timezone.now)

    # Relationships
    friends = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='users_friends')
    blocked_users = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='blocked_users_relationship')

    # Authentication & Security

    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)
    backup_codes = models.JSONField(default=list)
    oauth_status = models.BooleanField(default=False)

    # Game Stats
    score = models.IntegerField(default=0)
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)

    # Status
    online_status = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)


    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'myapp_user'

    def __str__(self):
        return self.username

    def set_online(self):
        self.online_status = True
        self.last_activity = timezone.now()
        self.save()

    def set_offline(self):
        self.online_status = False
        self.save()