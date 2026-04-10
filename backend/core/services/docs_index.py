from django.urls import NoReverseMatch, reverse


def build_docs_index_sections() -> list[dict[str, str]]:
    sections = {
        "Catalog Documentation": "swagger-catalog",
        "Logistic Documentation": "swagger-logistic",
        "Stock Documentation": "swagger-stock",
        "Contacts Documentation": "swagger-contacts",
        "Common Documentation": "swagger-common",
        "Client Documentation": "swagger-client",
        "Customer Documentation": "swagger-customer",
        "Order Documentation": "swagger-order",
        "Full API Schema (JSON)": "schema-json",
    }

    docs: list[dict[str, str]] = []

    for title, url_name in sections.items():
        try:
            docs.append({
                "title": title,
                "url": reverse(url_name),
            })
        except NoReverseMatch:
            continue

    return docs