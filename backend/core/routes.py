from .routing import ApiRoute


class DocumentationRoutes:
    LIST = ApiRoute("documentation/", "documentation_list")
    DETAIL = ApiRoute("documentation/<int:pk>/", "documentation_detail")
    DOWNLOAD = ApiRoute("documentation/<int:pk>/download/", "documentation_download")
    DOWNLOAD_ZIP = ApiRoute("documentation/download-zip/", "documentation_download_zip")