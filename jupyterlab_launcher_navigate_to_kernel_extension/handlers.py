"""
API handlers for kernel path resolution.
"""
import json
import os
import re

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from jupyter_client.kernelspec import KernelSpecManager
import tornado


class KernelPathHandler(APIHandler):
    """Handler for getting kernel installation path by display name."""

    @tornado.web.authenticated
    async def get(self, display_name: str):
        """Get the path information for a kernel by its display name.

        Args:
            display_name: The display name of the kernel (URL-decoded by tornado)
        """
        try:
            # Get all available kernelspecs
            ksm = KernelSpecManager()
            all_specs = ksm.get_all_specs()

            # Find the kernel matching the display name
            kernel_info = None
            kernel_name = None

            for name, spec_data in all_specs.items():
                spec = spec_data.get("spec", {})
                if spec.get("display_name") == display_name:
                    kernel_name = name
                    kernel_info = spec_data
                    break

            if kernel_info is None:
                self.set_status(404)
                self.finish(json.dumps({
                    "error": f"Kernel with display name '{display_name}' not found"
                }))
                return

            spec = kernel_info.get("spec", {})
            resource_dir = kernel_info.get("resource_dir", "")

            # Extract executable path from argv
            argv = spec.get("argv", [])
            executable_path = argv[0] if argv else None

            # Try to determine the environment path (for conda environments)
            env_path = self._extract_env_path(executable_path, resource_dir)

            self.finish(json.dumps({
                "kernel_name": kernel_name,
                "display_name": display_name,
                "resource_dir": resource_dir,
                "executable_path": executable_path,
                "env_path": env_path
            }))

        except Exception as e:
            self.log.error(f"Error getting kernel path: {e}")
            self.set_status(500)
            self.finish(json.dumps({
                "error": str(e)
            }))

    def _extract_env_path(
        self,
        executable_path: str | None,
        resource_dir: str
    ) -> str | None:
        """Extract the conda/virtualenv environment path from the executable.

        Args:
            executable_path: Path to the Python executable
            resource_dir: The kernel's resource directory

        Returns:
            The environment root path or None if not in an environment
        """
        if not executable_path:
            return None

        # Resolve any symlinks to get the real path
        try:
            real_path = os.path.realpath(executable_path)
        except (OSError, ValueError):
            real_path = executable_path

        # Pattern 1: Conda environment - /path/to/envs/envname/bin/python
        # or /opt/conda/envs/envname/bin/python
        conda_match = re.match(
            r"^(.*/(?:envs|conda)/[^/]+)(?:/bin/python.*)?$",
            real_path
        )
        if conda_match:
            return conda_match.group(1)

        # Pattern 2: Base conda - /opt/conda/bin/python or similar
        base_conda_match = re.match(
            r"^(/opt/conda|/home/[^/]+/(?:mini)?conda3?|/usr/local/conda)(?:/bin/python.*)?$",
            real_path
        )
        if base_conda_match:
            return base_conda_match.group(1)

        # Pattern 3: Virtualenv - /path/to/venv/bin/python
        # Check if there's a pyvenv.cfg in the parent of bin/
        venv_match = re.match(r"^(.*)/bin/python.*$", real_path)
        if venv_match:
            potential_venv = venv_match.group(1)
            pyvenv_cfg = os.path.join(potential_venv, "pyvenv.cfg")
            if os.path.exists(pyvenv_cfg):
                return potential_venv

        # Pattern 4: System Python with kernelspec in share/jupyter/kernels
        # Return the directory containing the kernelspec
        if "/share/jupyter/kernels/" in resource_dir:
            # Go up to the environment root
            # e.g., /opt/conda/share/jupyter/kernels/python3 -> /opt/conda
            parts = resource_dir.split("/share/jupyter/kernels/")
            if parts[0]:
                return parts[0]

        # Fallback: try to find environment root from executable path structure
        # Look for common patterns like envname/bin/python
        bin_match = re.match(r"^(.*)/bin/python.*$", real_path)
        if bin_match:
            potential_env = bin_match.group(1)
            # Verify it looks like an environment (has bin, lib, etc.)
            if os.path.isdir(os.path.join(potential_env, "lib")):
                return potential_env

        return None


def setup_handlers(web_app):
    """Setup the API handlers.

    Args:
        web_app: The Jupyter server web application
    """
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    # Route pattern for kernel path endpoint
    # The display_name may contain special characters, so we use a broad pattern
    route_pattern = url_path_join(
        base_url,
        "api",
        "kernel-path",
        "(.+)"  # display_name parameter (URL-encoded)
    )

    handlers = [(route_pattern, KernelPathHandler)]
    web_app.add_handlers(host_pattern, handlers)
