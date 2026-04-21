# eventos/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import crear_evento_view, evento_detail_view, eliminar_evento_definitivo_view, eventos_list_public, evento_detail_public, reservar_entradas, reservas_butacas, reservas_vendidas, mis_reservas, eliminar_reserva, invitacions_sen_plano, listado_invitacions, eliminar_invitacion, eventos_activos_por_email, enviar_entradas_recuperadas, zonas_prezo_evento

from .views import enviar_entradas, ver_pdf_entrada, pdf_entradas_multipaxina, enviar_invitacion_individual, descargar_pdf_invitacion, descargar_pdf_listado
from .stripe_checkout import create_checkout_session

urlpatterns = [
    path('descargar-pdf-invitacion/<int:reserva_id>/', descargar_pdf_invitacion, name='descargar_pdf_invitacion'),
    path('pdf-entrada/', ver_pdf_entrada, name='ver_pdf_entrada'),
    path('pdf-entradas-multipaxina/', pdf_entradas_multipaxina, name='pdf_entradas_multipaxina'),
    path('<int:evento_id>/descargar-listado-pdf/', descargar_pdf_listado, name='descargar_pdf_listado'),
    path('', crear_evento_view, name="crear_evento"),
    path('publicos/', eventos_list_public, name='eventos_list_public'),
    path('publico/<int:pk>/', evento_detail_public, name='evento_detail_public'),
    path('<int:pk>/', evento_detail_view, name='evento_detail'),
    path('<int:pk>/eliminar-definitivo/', eliminar_evento_definitivo_view, name='eliminar_evento_definitivo'),
    path('<int:evento_id>/reservas/', reservas_butacas, name='reservas_butacas'),
    path('<int:evento_id>/reservas-vendidas/', reservas_vendidas, name='reservas_vendidas'),
    path('<int:evento_id>/mis-reservas/', mis_reservas, name='mis_reservas'),
    path('<int:evento_id>/invitacions-sen-plano/', invitacions_sen_plano, name='invitacions_sen_plano'),
    path('<int:evento_id>/listado-invitacions/', listado_invitacions, name='listado_invitacions'),
    path('<int:evento_id>/invitacions/<int:invitacion_id>/', eliminar_invitacion, name='eliminar_invitacion'),
    path('<int:evento_id>/eliminar-reserva/<str:zona>/<int:fila>/<int:butaca>/', eliminar_reserva, name='eliminar_reserva'),
    path('<int:evento_id>/reservar/', reservar_entradas, name='reservar_entradas'),
    path('<int:evento_id>/zonas-prezo/', zonas_prezo_evento, name='zonas_prezo_evento'),
    path('eventos-activos/', eventos_activos_por_email, name='eventos_activos_por_email'),
    path('entradas-recuperadas/enviar/', enviar_entradas_recuperadas, name='enviar_entradas_recuperadas'),
    path('<int:evento_id>/enviar-entradas/', enviar_entradas, name='enviar_entradas'),
    path('enviar_invitacion_individual/', enviar_invitacion_individual, name='enviar_invitacion_individual'),
    path('stripe/create-checkout-session/', create_checkout_session, name='create_checkout_session'),
]
