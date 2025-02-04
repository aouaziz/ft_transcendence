from rest_framework import serializers
from .models import MyUser
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError


class UserProfileSerializer(serializers.ModelSerializer):
    win_percentage = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    total_matches = serializers.SerializerMethodField()
    total_wins = serializers.SerializerMethodField()
    total_losses = serializers.SerializerMethodField()
    win_rate = serializers.SerializerMethodField()
    match_history = serializers.SerializerMethodField()
    class Meta:
        model = MyUser
        fields = [
            'id', 'username', 'email', 'avatar',
            'games_won', 'games_lost', 'win_percentage',
            'friends', 'blocked_users', 'online_status', 'score', 'two_factor_enabled', 'oauth_status',
            'total_matches',
            'total_wins',
            'total_losses',
            'win_rate',
            'match_history'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate_username(self, value):
        if self.instance and value != self.instance.username:
            user_id = self.instance.id if self.instance else None
            if MyUser.objects.filter(username=value).exclude(id=user_id).exists():
                raise serializers.ValidationError(f"The username '{value}' is already taken. Please choose another one.")
        elif not self.instance and MyUser.objects.filter(username=value).exists():
            raise serializers.ValidationError(f"The username '{value}' is already taken. Please choose another one.")
        return value

    def validate_email(self, value):
        if self.instance and value != self.instance.email:
            user_id = self.instance.id if self.instance else None
            if MyUser.objects.filter(email=value).exclude(id=user_id).exists():
                raise serializers.ValidationError(f"The email '{value}' is already registered. Please choose another one.")
        elif not self.instance and MyUser.objects.filter(email=value).exists():
            raise serializers.ValidationError(f"The email '{value}' is already registered. Please choose another one.")
        return value


    def validate_password(self, value):
        try:
            validate_password(value)  
        except ValidationError as e:
            raise serializers.ValidationError(f"Password error: {', '.join(e.messages)}")

        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char in "!@#$%^&*()" for char in value):
            raise serializers.ValidationError("Password must contain at least one special character (!@#$%^&*()).")

        return value


    def update(self, instance, validated_data):
        password = validated_data.get('password')
        if password:
            instance.set_password(password)
        
        avatar_file = validated_data.get('avatar')
        if avatar_file:
             instance.avatar = avatar_file
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

    def get_win_percentage(self, obj):
        total_games = obj.games_won + obj.games_lost
        if total_games == 0:
            return 0
        return (obj.games_won / total_games) * 100

    def get_avatar(self, obj):
         if obj.avatar:
             return obj.avatar  
         return "/assets/default_avatar.jpg"
    def get_total_matches(self, obj):
        games_as_player1 =  getattr(obj, 'games_as_player1', [])
        games_as_player2 =  getattr(obj, 'games_as_player2', [])
        return len(games_as_player1 + games_as_player2)
    
    def get_total_wins(self, obj):
         games_as_player1 =  getattr(obj, 'games_as_player1', [])
         games_as_player2 =  getattr(obj, 'games_as_player2', [])
         return sum(1 for game in (games_as_player1 + games_as_player2) if game.winner == obj)


    def get_total_losses(self, obj):
        games_as_player1 =  getattr(obj, 'games_as_player1', [])
        games_as_player2 =  getattr(obj, 'games_as_player2', [])
        total_matches =  len(games_as_player1 + games_as_player2)
        return total_matches -  sum(1 for game in (games_as_player1 + games_as_player2) if game.winner == obj)

    def get_win_rate(self, obj):
        games_as_player1 =  getattr(obj, 'games_as_player1', [])
        games_as_player2 =  getattr(obj, 'games_as_player2', [])
        total_matches = len(games_as_player1 + games_as_player2)
        total_wins = sum(1 for game in (games_as_player1 + games_as_player2) if game.winner == obj)
        return (total_wins / total_matches * 100) if total_matches > 0 else 0
    
    def get_match_history(self, obj):
        games_as_player1 =  getattr(obj, 'games_as_player1', [])
        games_as_player2 =  getattr(obj, 'games_as_player2', [])
        match_history = []
        games = games_as_player1 + games_as_player2
        for game in games:
            match_history.append({
                "result": "win" if game.winner == obj else "loss",
                "player1": game.player1.username,
                "player2": game.player2.username if game.player2 else "Unknown",
                "score1": 0,
                "score2": 0,
                "timestamp": game.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            })
        return match_history