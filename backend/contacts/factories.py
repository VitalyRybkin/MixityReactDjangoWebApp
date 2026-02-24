import factory.fuzzy


class ContactFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "contacts.Contact"

    class Params:
        is_carrier = factory.Trait(
            carrier=factory.SubFactory("logistic.tests.factories.CarrierFactory"),
            warehouse=None,
        )
        is_warehouse = factory.Trait(
            warehouse=factory.SubFactory("stock.tests.factories.WarehouseFactory"),
            carrier=None,
        )

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    position = factory.Faker("job")

    carrier = factory.SubFactory("logistic.tests.factories.CarrierFactory")
    warehouse = None


class PhoneNumberFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "contacts.PhoneNumber"

    phone_number = factory.Sequence(lambda n: f"+7999{n:07d}")
    contact = factory.SubFactory("contacts.factories.ContactFactory")
