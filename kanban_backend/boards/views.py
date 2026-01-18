from rest_framework import viewsets, permissions
from .models import Board
from .serializers import BoardSerializer

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Board.objects.filter(project__owner=self.request.user)

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        if project.owner != self.request.user:
            from rest_framework import permissions
            raise permissions.PermissionDenied("You do not have permission to create a board in this project.")
        serializer.save()

