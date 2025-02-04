from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from .models import Game
from auth_service.models import MyUser  # Adjust based on your models
import random
import string
from django.db.models import Q

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def matchmaking(request):
    if request.method == 'POST':
        data = request.data
        if 'opponent_username' not in data:
            return Response({"error": "opponent_username not found"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = request.user  # Get the authenticated user
            opponent = MyUser.objects.get(username=data['opponent_username'])  # Fetch the opponent
        except MyUser.DoesNotExist:
            return Response({"error": "Opponent not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user is already in an ongoing game
        ongoing_game_for_user = Game.objects.filter(
            (Q(player1=user) | Q(player2=user)) & Q(status='STARTED')
        ).first()
        if ongoing_game_for_user:
            return Response(
                {
                    "error": "User is already in an unfinished game",
                    "room_code": ongoing_game_for_user.room_code,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the opponent is already in an ongoing game
        ongoing_game_for_opponent = Game.objects.filter(
            (Q(player1=opponent) | Q(player2=opponent)) & Q(status='STARTED')
        ).first()
        if ongoing_game_for_opponent:
            return Response(
                {
                    "error": "Opponent is already in an unfinished game",
                    "room_code": ongoing_game_for_opponent.room_code,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate a unique room code
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Game.objects.filter(room_code=code).exists():
                break

        # Create a new game with the user and opponent
        game = Game.objects.create(
            room_code=code,
            player1=user,
            player2=opponent,
            status='STARTED'
        )

        return JsonResponse({
            "room_code": game.room_code,
            "message": "Game created successfully."
        }, status=201)