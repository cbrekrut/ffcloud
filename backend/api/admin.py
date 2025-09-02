from django.contrib import admin

from api.models.product import Product
from api.models.store_product import StoreProduct
admin.site.register(Product)
admin.site.register(StoreProduct)