from rest_framework import serializers

from logistic.models import Driver


class DriverSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    passportNumber = serializers.CharField(source="passport_number")
    passportIssueDate = serializers.DateField(source="passport_issue_date")
    passportEmittedBy = serializers.CharField(source="passport_emitted_by")

    class Meta:
        model = Driver
        fields = [
            "id",
            "carrier",
            "fullName",
            "phone",
            "passportNumber",
            "passportIssueDate",
            "passportEmittedBy",
        ]
