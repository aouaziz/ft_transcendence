# chat/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.views import APIView
from .serializers import MessageSerializer 
from .models import Message 
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from auth_service.models import MyUser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q



@api_view(['GET'])
@permission_classes([IsAuthenticated]) 
def list_users(request):
    users = MyUser.objects.all()  
    serializer = UserSerializer(users, many=True)  
    return Response(serializer.data) 


class MessageListCreateView(APIView):
    permission_classes = [IsAuthenticated] 

    def post(self, request, *args, **kwargs):
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, *args, **kwargs):
        sender = request.query_params.get('sender')
        recipient = request.query_params.get('recipient')
        if sender and recipient:
            messages = Message.objects.filter(
                (Q(sender__username=sender) & Q(recipient__username=recipient)) |
                (Q(sender__username=recipient) & Q(recipient__username=sender))
            ).order_by('created_at') 
        else:
            messages = Message.objects.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)




class SendMessageView(APIView):
    def post(self, request):
        try:
            sender_id = request.data.get('sender')
            recipient_id = request.data.get('recipient')
            message = request.data.get('message')

            if not all([sender_id, recipient_id, message]):
                return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

            new_message = Message.objects.create(sender_id=sender_id, recipient_id=recipient_id, content=message)

            return Response({"id": new_message.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def send_message(request):
    try:
        sender_username = request.data.get('sender')
        recipient_username = request.data.get('recipient')
        message_content = request.data.get('message')

        if not all([sender_username, recipient_username, message_content]):
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sender = MyUser.objects.get(username=sender_username)
            recipient = MyUser.objects.get(username=recipient_username)
        except MyUser.DoesNotExist:
            return Response({"error": "Sender or recipient does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        # Create and save the new message
        new_message = Message.objects.create(
            sender=sender,
            recipient=recipient,
            message=message_content
        )

        # Serialize and return the message
        serializer = MessageSerializer(new_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request):
    sender = request.query_params.get('sender')
    recipient = request.query_params.get('recipient')
    try:
        messages = Message.objects.filter(
            (Q(sender__username=sender) & Q(recipient__username=recipient)) |
            (Q(sender__username=recipient) & Q(recipient__username=sender))
        ).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
def create_message(request):
    sender_username = request.data.get('sender')
    recipient_username = request.data.get('recipient')
    message_content = request.data.get('message')

    sender = MyUser.objects.get(username=sender_username)
    recipient = MyUser.objects.get(username=recipient_username)

    message = Message.objects.create(sender=sender, recipient=recipient, message=message_content)

    serializer = MessageSerializer(message)
    return Response(serializer.data)


