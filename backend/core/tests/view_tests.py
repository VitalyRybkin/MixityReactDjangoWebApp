from rest_framework.test import APIRequestFactory


class TestViewQuerysetContractMixin:
    """
    Contract tests for DRF views get_queryset()
    """

    def assert_queryset_contract(
        self,
        view_class: type,
        *,
        expected_prefetches: list[str] | None = None,
        expected_selects: list[str] | None = None,
        ordered: bool = True,
    ) -> None:
        factory = APIRequestFactory()
        request = factory.get("/")

        view = view_class()
        view.request = request
        view.args = ()
        view.kwargs = {}

        queryset = view.get_queryset()
        result = list(queryset)

        assert result, "Queryset is empty"

        if ordered:
            ids = [obj.id for obj in result]
            assert ids == sorted(ids), "Queryset is not ordered by id"

        for lookup in expected_prefetches or []:
            assert (
                lookup in queryset._prefetch_related_lookups
            ), f"Missing prefetch: {lookup}"

        if expected_selects:
            select = queryset.query.select_related
            for field in expected_selects:
                assert field in select, f"Missing select_related: {field}"
