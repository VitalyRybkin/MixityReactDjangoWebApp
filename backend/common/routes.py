from core.api.routing import ApiRoute


class DocumentationRoutes:
    LIST = ApiRoute("documentation/", "documentation_list")
    DETAIL = ApiRoute("documentation/<int:pk>/", "documentation_detail")
    DOWNLOAD = ApiRoute("documentation/<int:pk>/download/", "documentation_download")
    DOWNLOAD_ZIP = ApiRoute("documentation/download-zip/", "documentation_download_zip")
    SHARE_LINKS = ApiRoute("documentation/share-links/", "documentation_share_links")
    SHARED_FILE = ApiRoute("documentation/shared/<str:token>/", "documentation_shared_file")
