from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="engivault",
    version="1.0.0",
    author="Luqman Ismat",
    author_email="luqman@engivault.com",
    description="Python SDK for EngiVault Engineering Calculations API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Luqman-Ismat/engivault-python-sdk",
    project_urls={
        "Documentation": "https://engivault-api-production.up.railway.app/documentation",
        "API": "https://engivault-api-production.up.railway.app",
        "Bug Reports": "https://github.com/Luqman-Ismat/engivault-python-sdk/issues",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
        "pydantic>=2.0.0",
        "typing-extensions>=4.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "isort>=5.0.0",
            "flake8>=5.0.0",
            "mypy>=1.0.0",
        ],
        "docs": [
            "sphinx>=5.0.0",
            "sphinx-rtd-theme>=1.0.0",
        ],
    },
    keywords="engineering calculations hydraulics pumps pressure-drop npsh api sdk",
    include_package_data=True,
    zip_safe=False,
)
