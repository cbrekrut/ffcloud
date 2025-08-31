from django.urls import path
from .views import product_list,ProductImportView

urlpatterns = [
    path("products/", product_list, name="product-list"),
    path("products/import/", ProductImportView.as_view(), name="product-import"),
]