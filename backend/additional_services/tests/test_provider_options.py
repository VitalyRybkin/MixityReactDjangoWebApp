"""Permissions for the restricted provider selector used by Additional Services UI."""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from logistic.models import Carrier
from repairs.models import RepairCompany


class TestProviderOptions(APITestCase):
    def setUp(self):
        self.url = reverse('additional_services:additional_services_provider_options')
        self.user = get_user_model().objects.create_user(
            username='provider_options_user', password='test_password',
        )
        self.client.force_authenticate(user=self.user)
        Carrier.objects.create(name='Перевозчик Тест')
        RepairCompany.objects.create(name='Компания Тест')

    def test_unprivileged_user_cannot_list_providers(self):
        response = self.client.get(self.url, {'type': 'carrier'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_permission_allows_id_name_only_for_both_provider_types(self):
        perm = Permission.objects.get(
            content_type__app_label='additional_services',
            codename='add_additionalservicerequest',
        )
        self.user.user_permissions.add(perm)
        for provider_type in ('carrier', 'repair_company'):
            with self.subTest(provider_type=provider_type):
                response = self.client.get(self.url, {'type': provider_type})
                self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
                self.assertTrue(response.data)
                self.assertEqual(set(response.data[0]), {'id', 'name'})
        self.assertFalse(self.user.has_perm('logistic.view_carrier'))
        self.assertFalse(self.user.has_perm('repairs.view_repaircompany'))

    def test_invalid_provider_type_returns_400(self):
        perm = Permission.objects.get(
            content_type__app_label='additional_services',
            codename='view_additionalservicerequest',
        )
        self.user.user_permissions.add(perm)
        response = self.client.get(self.url, {'type': 'something_else'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
