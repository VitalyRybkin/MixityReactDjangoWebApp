import factory

from logistic.models import Carrier, Driver, Truck, TruckCapacity, TruckType


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


class DriverFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Driver

    carrier = factory.SubFactory(CarrierFactory)
    phone = "+79991234567"
    full_name = factory.Faker("name")
    passport_number = "1234 567890"
    passport_issue_date = factory.Faker("date")
    passport_emitted_by = factory.Faker("company")
