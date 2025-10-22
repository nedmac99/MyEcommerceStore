from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),  # homepage
    path('category/<str:category_name>/', views.product_category, name='product_category'),  # category page
]
