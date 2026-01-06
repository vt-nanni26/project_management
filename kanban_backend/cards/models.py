from django.db import models
from lists.models import List

class Card(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    list = models.ForeignKey(List, related_name='cards', on_delete=models.CASCADE)
    position = models.IntegerField(default=0)

    def __str__(self):
        return self.title
