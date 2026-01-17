from django.db import models
from boards.models import Board

class List(models.Model):
    title = models.CharField(max_length=200)
    board = models.ForeignKey(Board, related_name='lists', on_delete=models.CASCADE)
    position = models.IntegerField(default=0)

    def __str__(self):
        return self.title
