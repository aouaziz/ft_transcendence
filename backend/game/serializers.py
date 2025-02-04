from rest_framework import serializers
from .models import  Game


class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.StringRelatedField()
    player2 = serializers.StringRelatedField()
    winner = serializers.StringRelatedField()
    room_code = serializers.StringRelatedField()
    status = serializers.StringRelatedField()
    player1_score = serializers.IntegerField()
    player2_score = serializers.IntegerField()

    class Meta:
        model = Game
        fields = [
            'id', 
            'room_code', 
            'status',
            'player1', 
            'player2',
            'winner',
            'player1_score', 
            'player2_score'   
        ]