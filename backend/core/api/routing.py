from dataclasses import dataclass


@dataclass(frozen=True)
class ApiRoute:
    path: str
    name: str

    def __str__(self) -> str:
        return self.path