from dataclasses import dataclass


@dataclass(frozen=True)
class ApiRoute:
    path: str
    name: str

    def __str__(self) -> str:
        return f"ApiRoute(path='{self.path}', name='{self.name}')"

    def __repr__(self) -> str:
        return f"ApiRoute(path='{self.path}', name='{self.name}')"