from django.db import models


class Store(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name="Название магазина"
    )
    client_id = models.CharField(
        max_length=255,
        verbose_name="Client ID"
    )
    api_key = models.CharField(
        max_length=500,
        verbose_name="API Key"
    )
    class Meta:
        verbose_name = "Магазин"

    def __str__(self):
        return f"{self.name}"
