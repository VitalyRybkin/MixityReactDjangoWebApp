import uuid

import factory.fuzzy


class ContactFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "contacts.Contact"

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.LazyAttribute(
        lambda o: f"{o.first_name.lower()}_{uuid.uuid4().hex[:4]}@example.com"
    )
    position = factory.Faker("job")


class PhoneNumberFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "contacts.PhoneNumber"

    phone_number = factory.Sequence(lambda n: f"+7999{n:07d}")
    contact = factory.SubFactory("contacts.factories.ContactFactory")
