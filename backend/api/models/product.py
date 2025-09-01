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
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Цена"
    )
    image_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        verbose_name = "Товар"

    def __str__(self):
        return f"{self.name} ({self.sku})"
