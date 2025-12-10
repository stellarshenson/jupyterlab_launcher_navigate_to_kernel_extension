# jupyterlab_launcher_navigate_to_kernel_extension

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_launcher_navigate_to_kernel_extension/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_launcher_navigate_to_kernel_extension/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_launcher_navigate_to_kernel_extension.svg)](https://www.npmjs.com/package/jupyterlab_launcher_navigate_to_kernel_extension)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-launcher-navigate-to-kernel-extension.svg)](https://pypi.org/project/jupyterlab-launcher-navigate-to-kernel-extension/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab-launcher-navigate-to-kernel-extension)](https://pepy.tech/project/jupyterlab-launcher-navigate-to-kernel-extension)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)
[![Brought To You By KOLOMOLO](https://img.shields.io/badge/Brought%20To%20You%20By-KOLOMOLO-00ffff?style=flat)](https://kolomolo.com)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=flat)](https://www.paypal.com/donate/?hosted_button_id=B4KPBJDLLXTSA)

Navigate to your kernel's location from the launcher with a single click. Right-click on any kernel launcher button and select "Show in File Browser" to jump to the kernel's directory, or "Open Terminal at location" to open a terminal session there.

## Features

- **Context menu on kernel launcher buttons** - Right-click any kernel in the launcher to reveal navigation options
- **Show in File Browser** - Navigate the file browser to the kernel's working directory
- **Open Terminal at location** - Open a new terminal session at the kernel's location
- **Works with conda environments** - Detects conda environment paths and navigates accordingly

## Requirements

- JupyterLab >= 4.0.0

## Install

> [!IMPORTANT]
> Always install using `make install` to ensure `package.json` and `package-lock.json` are properly synchronized.

```bash
make install
```

## Uninstall

```bash
pip uninstall jupyterlab_launcher_navigate_to_kernel_extension
```
