## Troubleshooting: mypy ImportError (incompatible architecture)

If you see an error like:

`mach-o file, but is an incompatible architecture (have 'arm64', need 'x86_64')`

it means the Python interpreter you’re running (x86_64 vs arm64) does not match the
architecture of the compiled `mypy` wheel installed in your virtualenv.

### Fix (recommended)

1. Ensure your terminal/IDE is not running under Rosetta (Apple Silicon).
2. Recreate the virtualenv from scratch:

```bash
cd backend
make sync
```

### Diagnose

```bash
cd backend
bash ./scripts/arch-doctor.sh
```
