from rest_framework import serializers

from contacts.models import Contact, PhoneNumber


class PhoneNumberSerializer(serializers.ModelSerializer):
    """
    Serializer for PhoneNumber model.

    Attributes:
        phoneNumber (serializers.CharField): Maps the 'phone_number' field of the PhoneNumber model.

    Meta:
        fields (list): Defines the list of fields to be included in the serialized data.
    """

    phoneNumber = serializers.CharField(source="phone_number")

    class Meta:
        model = PhoneNumber
        fields = ["phoneNumber"]


class ContactSerializer(serializers.ModelSerializer):
    """
    Serializer for a Contact model.

    Attributes:
        firstName (serializers.CharField): Maps the 'first_name' field of the Contact model.
        lastName (serializers.CharField): Maps the 'last_name' field of the Contact model.
        phoneNumbers (PhoneNumberSerializer): Serializer for PhoneNumber model,
        used to serialize/deserialize phone numbers associated with a contact.

    Meta:
        fields (list): Defines the list of fields to be included in the serialized data.
    """

    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(
        source="last_name", required=False, allow_blank=True
    )
    email = serializers.EmailField(required=False, allow_null=True)
    phoneNumbers = PhoneNumberSerializer(
        source="phone_numbers", many=True, required=False
    )

    class Meta:
        model = Contact
        fields = ["id", "firstName", "lastName", "email", "phoneNumbers"]
