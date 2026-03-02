# eventos/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import crear_evento_view, evento_detail_view, eventos_list_public, evento_detail_public, reservar_entradas, reservas_butacas, mis_reservas, eliminar_reserva

urlpatterns = [
    path('', crear_evento_view, name="crear_evento"),
    path('publicos/', eventos_list_public, name='eventos_list_public'),
    path('publico/<int:pk>/', evento_detail_public, name='evento_detail_public'),
    path('<int:pk>/', evento_detail_view, name='evento_detail'),
    path('<int:evento_id>/reservas/', reservas_butacas, name='reservas_butacas'),
    path('<int:evento_id>/mis-reservas/', mis_reservas, name='mis_reservas'),
    path('<int:evento_id>/eliminar-reserva/<str:zona>/<int:fila>/<int:butaca>/', eliminar_reserva, name='eliminar_reserva'),
    path('<int:evento_id>/reservar/', reservar_entradas, name='reservar_entradas'),
]
