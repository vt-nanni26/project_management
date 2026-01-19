from django.db import models
from projects.models import Project
from common.models import TimestampedModel

class Board(TimestampedModel):
    name = models.CharField(max_length=100)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
