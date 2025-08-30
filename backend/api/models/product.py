from django.db import models

class Product(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name="Название"
    )
    sku = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Артикул"
    )
    stock = models.PositiveIntegerField(
        default=0,
        verbose_name="Остаток"
    )

    class Meta:
        verbose_name = "Товар"

    def __str__(self):
        return f"{self.name} ({self.sku})"