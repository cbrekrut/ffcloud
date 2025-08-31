from django.urls import path
from .views import product_list,ProductImportView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoreViewSet

router = DefaultRouter()
router.register(r"stores", StoreViewSet, basename="store")

urlpatterns = [
    path("products/", product_list, name="product-list"),
    path("products/import/", ProductImportView.as_view(), name="product-import"),
    path("", include(router.urls)),
]