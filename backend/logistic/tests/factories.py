import factory

from logistic.models import Carrier, Driver, Truck, TruckCapacity, TruckType


class DriverFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Driver
        django_get_or_create = (
            "full_name",
            "carrier",
            "phone",
            "passport_number",
            "passport_issue_date",
            "passport_emitted_by",
        )

    carrier = 1
    phone = "+79991234567"
    full_name = factory.Faker("name")
    passport_number = "1234 567890"
    passport_issue_date = None
    passport_emitted_by = None


class TruckFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Truck
        django_get_or_create = (
            "license_plate",
            "carrier",
            "type",
            "capacity",
            "description",
        )

    carrier = 1
    type = 1
    license_plate = factory.Faker("license_plate")
    capacity = factory.Faker("random_int", min=1, max=1000)
    description = None


class TruckCapacityFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TruckCapacity
        django_get_or_create = ("capacity",)

    capacity = factory.Faker("random_int", min=1, max=1000)


class TruckTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TruckType

    type = factory.Faker("job")
    description = factory.Faker("text")


class CarrierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Carrier
        django_get_or_create = (
            "name",
            "full_name",
            "address",
            "description",
            "is_active",
        )

    name = factory.Faker("company")
    full_name = factory.Faker("company")
    address = factory.Faker("address")
    description = factory.Faker("text")
    is_active = True
