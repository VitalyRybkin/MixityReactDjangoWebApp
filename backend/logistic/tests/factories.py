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


class TruckCapacityFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TruckCapacity

    capacity = factory.Faker("pydecimal", left_digits=1, right_digits=1, positive=True)
    description = factory.Faker("text")


class TruckTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TruckType

    name = factory.Sequence(lambda n: f"Truck type {n}")
    description = factory.Faker("text")


class CarrierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Carrier

    name = factory.Faker("company")
    full_name = factory.Faker("company")
    address = factory.Faker("address")
    description = factory.Faker("text")
    is_active = True


class TruckFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Truck

    carrier = factory.SubFactory(CarrierFactory)
    truck_type = factory.SubFactory(TruckTypeFactory)
    license_plate = factory.Faker("license_plate")
    capacity = factory.SubFactory(TruckCapacityFactory)
    description = factory.Faker("text")
