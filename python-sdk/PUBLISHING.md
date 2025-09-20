# Publishing EngiVault Python SDK to PyPI

## Prerequisites

1. **PyPI Account**: Create accounts on [PyPI](https://pypi.org) and [TestPyPI](https://test.pypi.org)
2. **API Tokens**: Generate API tokens for both PyPI and TestPyPI
3. **Build Tools**: Install required build tools

```bash
pip install build twine
```

## Publishing Steps

### 1. Prepare for Release

```bash
# Update version in setup.py and __init__.py
# Update CHANGELOG.md with new features
# Ensure all tests pass
python -m pytest tests/ -v
```

### 2. Build the Package

```bash
# Clean previous builds
rm -rf build/ dist/ *.egg-info/

# Build source and wheel distributions
python -m build
```

### 3. Test on TestPyPI (Recommended)

```bash
# Upload to TestPyPI first
python -m twine upload --repository testpypi dist/*

# Test installation from TestPyPI
pip install --index-url https://test.pypi.org/simple/ engivault
```

### 4. Upload to PyPI

```bash
# Upload to production PyPI
python -m twine upload dist/*
```

### 5. Verify Installation

```bash
# Test installation from PyPI
pip install engivault

# Run basic test
python -c "import engivault; print('✅ SDK installed successfully')"
```

## Configuration Files

### ~/.pypirc

Create `~/.pypirc` with your API tokens:

```ini
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-YOUR-API-TOKEN-HERE

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-YOUR-TESTPYPI-TOKEN-HERE
```

## Automated Publishing (GitHub Actions)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.8'
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install build twine
    - name: Build package
      run: python -m build
    - name: Publish to PyPI
      uses: pypa/gh-action-pypi-publish@v1.8.10
      with:
        password: ${{ secrets.PYPI_API_TOKEN }}
```

## Version Management

### Semantic Versioning

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes, backwards compatible

### Update Version

Update version in these files:
- `setup.py`
- `pyproject.toml`
- `engivault/__init__.py`

## Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] CHANGELOG.md updated
- [ ] Build successful
- [ ] TestPyPI upload successful
- [ ] TestPyPI installation tested
- [ ] PyPI upload successful
- [ ] PyPI installation verified
- [ ] GitHub release created
- [ ] Documentation site updated

## Troubleshooting

### Common Issues

1. **Build Fails**: Check `setup.py` and `pyproject.toml` syntax
2. **Upload Fails**: Verify API tokens and permissions
3. **Installation Fails**: Check dependencies and Python version compatibility
4. **Import Errors**: Ensure `__init__.py` exports are correct

### Support

- **PyPI Help**: https://pypi.org/help/
- **Twine Docs**: https://twine.readthedocs.io/
- **Build Docs**: https://build.pypa.io/
