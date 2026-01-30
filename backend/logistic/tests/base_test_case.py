import logging
from decimal import Decimal
from typing import Any, Dict, Optional
from unittest import SkipTest

from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

logger = logging.getLogger(__name__)


class BaseAPIMixin(APITestCase):
    """
    Provides a base test case for API testing specific to truck-related models.

    Provides common functionalities for testing API
    endpoints. It is expected to be subclassed, and specific parameters like
    factory, url_name, and fields_map should be provided in the subclass for
    proper functioning.

    :ivar model: Model class associated with the API being tested.
    :type model: type
    :ivar factory: Factory instance used to create model instances.
    :type factory: Factory
    :ivar url_name: Name of the API endpoint's URL pattern.
    :type url_name: str
    :ivar fields_map: A mapping between API response fields and model fields.
        The mapping is a dictionary where the key is the API field name,
        and the value is a tuple containing the model field name and an
        optional data type for conversion during validation.
    :type fields_map: dict
    """

    __test__ = False

    model: Any = None
    factory: Any = None
    url_name: Optional[str] = None
    fields_map: Dict[str, Any] = {}

    def setUp(self) -> None:
        if self.factory is None or not self.url_name:
            raise SkipTest("Ресурс не найден, тест не имеет смысла")

        self.url = reverse(self.url_name)
        self.obj = self.factory.create()

    def _get_list_logic(self) -> None:
        """
        Validates the logic of retrieving and comparing list data from the API.

        Sends a GET request to the API endpoint and checks if the
        response status is 200 (successful). Additionally, it verifies that the
        retrieved data matches the expected values using field mappings
        defined in `fields_map`.

        :raises AssertionError: If the response status code is not 200 or if
            the data does not match the expected values based on `fields_map`.
        """
        header = f"\033[1;34m>>> TESTING ENDPOINT: {self.url_name} | [{self._testMethodName}] <<<\033[0m"
        logger.info(f"\n{header}")
        if not self.factory:
            return
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        for api_f, (mod_f, t, *_) in self.fields_map.items():
            val = response.data[0][api_f]
            if t == Decimal:
                val = Decimal(val)
            self.assertEqual(val, getattr(self.obj, mod_f))

    def _create_logic(self, payload: Dict[str, Any]) -> None:
        """
        Executes the logic for posting data to the specified endpoint and
        validates the response status code.

        :param payload: The data to be posted to the endpoint as part of the
            test.
        :type payload: dict
        :return: None
        """
        header = f"\033[1;34m>>> TESTING ENDPOINT: {self.url_name} | [{self._testMethodName}] <<<\033[0m"
        logger.info(f"\n{header}")
        response = self.client.post(self.url, data=payload)

        self.assertEqual(response.status_code, 201)

    def _str_method_logic(self, str_method_output: str) -> None:
        """
        Compares the string representation of an object to the expected output and logs the test result.

        :param str_method_output: The expected string representation output of the object being tested.
        :type str_method_output: str
        :return: None
        """
        header = f"\033[1;34m>>> TESTING ENDPOINT: {self.url_name} | [{self._testMethodName}] <<<\033[0m"
        logger.info(f"\n{header}")
        self.assertEqual(str(self.obj), str_method_output)

    def _validation_error_logic(self, field_name: str, payload: dict) -> None:

        header = f"\033[1;31m>>> TESTING VALIDATION: {field_name} is required | [{self._testMethodName}] <<<\033[0m"
        logger.info(f"\n{header}")

        invalid_payload = payload.copy()
        invalid_payload.pop(field_name, None)

        response = self.client.post(self.url, data=invalid_payload)

        self.assertEqual(
            response.status_code,
            400,
            msg=f"API should return 400 if field '{field_name}' is missing",
        )
        self.assertIn(
            field_name,
            response.data,
            msg=f"Response should contain an error for field '{field_name}'",
        )

    def _test_all_mandatory_fields(self, valid_payload: dict) -> None:
        import uuid

        for api_field, info in self.fields_map.items():
            is_required = info[2] if len(info) > 2 else False

            if not is_required:
                continue

            with self.subTest(field=api_field):
                current_payload = valid_payload.copy()
                for key, value in current_payload.items():
                    if isinstance(value, str):
                        current_payload[key] = f"{value}_{uuid.uuid4().hex[:4]}"

                self._validation_error_logic(api_field, current_payload)
