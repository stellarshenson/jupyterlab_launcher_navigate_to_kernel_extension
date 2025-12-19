/**
 * Unit tests for jupyterlab_nb_venv_kernels_ui_extension
 *
 * Tests cover helper function logic and data structures used by the extension.
 * The actual plugin import is avoided due to JupyterLab ESM dependency chain
 * complexity in Jest environment.
 */

/**
 * Helper function to expand tilde in path using the home directory extracted from absolutePath.
 * Mirrors the implementation in index.ts.
 */
function expandTilde(path: string, absolutePath: string): string {
  if (!path.startsWith('~')) {
    return path;
  }

  const match = absolutePath.match(/^(\/(?:home|Users)\/[^/]+)/);
  if (!match) {
    return path;
  }

  const homedir = match[1];
  if (path === '~') {
    return homedir;
  }
  if (path.startsWith('~/')) {
    return homedir + path.slice(1);
  }
  return path;
}

/**
 * Convert an absolute filesystem path to a path relative to the server root.
 * Mirrors the implementation in index.ts.
 */
function toRelativePath(
  absolutePath: string,
  serverRoot: string
): string | null {
  const normalizedPath = absolutePath.replace(/\/+$/, '');
  const normalizedRoot = expandTilde(serverRoot, absolutePath).replace(
    /\/+$/,
    ''
  );

  if (normalizedPath === normalizedRoot) {
    return '';
  }

  const rootPrefix = normalizedRoot + '/';
  if (normalizedPath.startsWith(rootPrefix)) {
    return normalizedPath.slice(rootPrefix.length);
  }

  return null;
}

/**
 * Check if an environment path is a local .venv environment.
 * Mirrors the implementation in index.ts.
 */
function isLocalVenvEnvironment(envPath: string): boolean {
  return envPath.includes('/.venv') || envPath.includes('\\.venv');
}

describe('toRelativePath', () => {
  it('should convert path inside server root to relative path', () => {
    const result = toRelativePath(
      '/home/user/workspace/project',
      '/home/user/workspace'
    );
    expect(result).toBe('project');
  });

  it('should handle nested paths', () => {
    const result = toRelativePath(
      '/home/user/workspace/deep/nested/path',
      '/home/user/workspace'
    );
    expect(result).toBe('deep/nested/path');
  });

  it('should return null for paths outside server root', () => {
    const result = toRelativePath('/var/lib/something', '/home/user/workspace');
    expect(result).toBeNull();
  });

  it('should return empty string for server root itself', () => {
    const result = toRelativePath(
      '/home/user/workspace',
      '/home/user/workspace'
    );
    expect(result).toBe('');
  });

  it('should handle paths with trailing slashes', () => {
    const result = toRelativePath(
      '/home/user/workspace/project/',
      '/home/user/workspace/'
    );
    expect(result).toBe('project');
  });

  it('should handle multiple trailing slashes', () => {
    const result = toRelativePath(
      '/home/user/workspace/project///',
      '/home/user/workspace///'
    );
    expect(result).toBe('project');
  });

  it('should expand tilde in server root', () => {
    const result = toRelativePath('/home/testuser/workspace/project', '~');
    expect(result).toBe('workspace/project');
  });

  it('should expand ~/path in server root', () => {
    const result = toRelativePath(
      '/home/testuser/workspace/project',
      '~/workspace'
    );
    expect(result).toBe('project');
  });
});

describe('expandTilde', () => {
  it('should expand ~ to home directory from Linux path', () => {
    const result = expandTilde('~', '/home/testuser/workspace');
    expect(result).toBe('/home/testuser');
  });

  it('should expand ~/path to full path', () => {
    const result = expandTilde('~/projects', '/home/testuser/workspace');
    expect(result).toBe('/home/testuser/projects');
  });

  it('should return path unchanged if no tilde', () => {
    const result = expandTilde('/absolute/path', '/home/testuser/workspace');
    expect(result).toBe('/absolute/path');
  });

  it('should handle macOS-style paths', () => {
    const result = expandTilde('~', '/Users/testuser/Documents');
    expect(result).toBe('/Users/testuser');
  });

  it('should handle ~/path on macOS', () => {
    const result = expandTilde('~/projects', '/Users/testuser/Documents');
    expect(result).toBe('/Users/testuser/projects');
  });

  it('should return path unchanged if home dir not extractable', () => {
    const result = expandTilde('~/projects', '/var/www/html');
    expect(result).toBe('~/projects');
  });

  it('should handle tilde-prefixed username (edge case)', () => {
    // ~username style is not supported, should return unchanged
    const result = expandTilde('~otheruser/path', '/home/testuser/workspace');
    expect(result).toBe('~otheruser/path');
  });
});

describe('isLocalVenvEnvironment', () => {
  it('should detect .venv in Unix paths', () => {
    expect(isLocalVenvEnvironment('/home/user/project/.venv')).toBe(true);
  });

  it('should detect .venv in Windows paths', () => {
    expect(isLocalVenvEnvironment('C:\\Users\\user\\project\\.venv')).toBe(
      true
    );
  });

  it('should reject paths without .venv', () => {
    expect(isLocalVenvEnvironment('/home/user/miniconda3/envs/myenv')).toBe(
      false
    );
  });

  it('should reject conda environments', () => {
    expect(isLocalVenvEnvironment('/opt/conda/envs/base')).toBe(false);
  });

  it('should handle nested .venv paths', () => {
    expect(
      isLocalVenvEnvironment('/workspace/projects/myproject/.venv/lib/python3.10')
    ).toBe(true);
  });

  it('should reject virtualenv without dot prefix', () => {
    expect(isLocalVenvEnvironment('/home/user/project/venv')).toBe(false);
  });

  it('should detect .venv at start of relative path', () => {
    expect(isLocalVenvEnvironment('project/.venv')).toBe(true);
  });
});

describe('command IDs', () => {
  const SHOW_IN_BROWSER_CMD = 'launcher:show-kernel-in-file-browser';
  const OPEN_TERMINAL_CMD = 'launcher:open-terminal-at-kernel';
  const UNREGISTER_KERNEL_CMD = 'launcher:unregister-venv-kernel';
  const REMOVE_ENVIRONMENT_CMD = 'launcher:remove-venv-environment';

  it('should have correct show in browser command ID', () => {
    expect(SHOW_IN_BROWSER_CMD).toBe('launcher:show-kernel-in-file-browser');
  });

  it('should have correct open terminal command ID', () => {
    expect(OPEN_TERMINAL_CMD).toBe('launcher:open-terminal-at-kernel');
  });

  it('should have correct unregister kernel command ID', () => {
    expect(UNREGISTER_KERNEL_CMD).toBe('launcher:unregister-venv-kernel');
  });

  it('should have correct remove environment command ID', () => {
    expect(REMOVE_ENVIRONMENT_CMD).toBe('launcher:remove-venv-environment');
  });
});

describe('IKernelPathResponse interface', () => {
  interface IKernelPathResponse {
    kernel_name: string;
    display_name: string;
    resource_dir: string;
    executable_path: string | null;
    env_path: string | null;
    error?: string;
  }

  it('should match expected structure for system kernel', () => {
    const mockResponse: IKernelPathResponse = {
      kernel_name: 'python3',
      display_name: 'Python 3',
      resource_dir: '/usr/share/jupyter/kernels/python3',
      executable_path: '/usr/bin/python3',
      env_path: null
    };

    expect(mockResponse.kernel_name).toBe('python3');
    expect(mockResponse.env_path).toBeNull();
  });

  it('should handle venv kernel response', () => {
    const mockVenvResponse: IKernelPathResponse = {
      kernel_name: 'python-myenv',
      display_name: 'Python (myenv)',
      resource_dir: '/home/user/.local/share/jupyter/kernels/python-myenv',
      executable_path: '/home/user/project/.venv/bin/python',
      env_path: '/home/user/project/.venv'
    };

    expect(mockVenvResponse.env_path).not.toBeNull();
    expect(mockVenvResponse.env_path).toContain('.venv');
  });

  it('should handle error response', () => {
    const errorResponse: IKernelPathResponse = {
      kernel_name: '',
      display_name: 'Unknown',
      resource_dir: '',
      executable_path: null,
      env_path: null,
      error: 'Kernel not found'
    };

    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.error).toBe('Kernel not found');
  });
});

describe('IVenvEnvironment interface', () => {
  interface IVenvEnvironment {
    name: string;
    custom_name: string | null;
    type: string;
    exists: boolean;
    has_kernel: boolean;
    path: string;
  }

  it('should match expected structure for venv', () => {
    const mockEnv: IVenvEnvironment = {
      name: 'myenv',
      custom_name: null,
      type: 'venv',
      exists: true,
      has_kernel: true,
      path: '/home/user/project/.venv'
    };

    expect(mockEnv.type).toBe('venv');
    expect(mockEnv.exists).toBe(true);
    expect(mockEnv.has_kernel).toBe(true);
  });

  it('should distinguish conda from venv environments', () => {
    const condaEnv: IVenvEnvironment = {
      name: 'base',
      custom_name: null,
      type: 'conda',
      exists: true,
      has_kernel: true,
      path: '/opt/conda/envs/base'
    };

    const venvEnv: IVenvEnvironment = {
      name: 'myproject',
      custom_name: 'My Project Env',
      type: 'venv',
      exists: true,
      has_kernel: true,
      path: '/home/user/myproject/.venv'
    };

    expect(condaEnv.type).toBe('conda');
    expect(venvEnv.type).toBe('venv');
    expect(condaEnv.type).not.toBe(venvEnv.type);
  });

  it('should handle custom name', () => {
    const envWithCustomName: IVenvEnvironment = {
      name: 'project-venv',
      custom_name: 'My Custom Kernel',
      type: 'venv',
      exists: true,
      has_kernel: true,
      path: '/home/user/project/.venv'
    };

    expect(envWithCustomName.custom_name).toBe('My Custom Kernel');
  });

  it('should handle non-existent environment', () => {
    const nonExistentEnv: IVenvEnvironment = {
      name: 'deleted-env',
      custom_name: null,
      type: 'venv',
      exists: false,
      has_kernel: false,
      path: '/home/user/old-project/.venv'
    };

    expect(nonExistentEnv.exists).toBe(false);
    expect(nonExistentEnv.has_kernel).toBe(false);
  });
});

describe('display name matching logic', () => {
  /**
   * Simulates the findVenvEnvironment matching logic.
   */
  function matchesDisplayName(
    displayName: string,
    envName: string,
    customName: string | null
  ): boolean {
    if (envName && displayName.includes(envName)) {
      return true;
    }
    if (customName && displayName.includes(customName)) {
      return true;
    }
    return false;
  }

  it('should match environment name in "Python (envname)" pattern', () => {
    expect(matchesDisplayName('Python (myenv)', 'myenv', null)).toBe(true);
  });

  it('should match environment name in "Python 3 (envname)" pattern', () => {
    expect(matchesDisplayName('Python 3 (myenv)', 'myenv', null)).toBe(true);
  });

  it('should match custom name exactly', () => {
    expect(
      matchesDisplayName('My Custom Kernel', 'venv-name', 'My Custom Kernel')
    ).toBe(true);
  });

  it('should match custom name when env name does not match', () => {
    expect(
      matchesDisplayName('Production Environment', 'prod', 'Production Environment')
    ).toBe(true);
  });

  it('should not match unrelated names', () => {
    expect(matchesDisplayName('Python (projectA)', 'projectB', null)).toBe(
      false
    );
  });

  it('should not match when both env and custom name are empty', () => {
    expect(matchesDisplayName('Python 3', '', null)).toBe(false);
  });

  it('should handle partial matches in env name', () => {
    // 'project' is contained in 'myproject'
    expect(matchesDisplayName('Python (myproject)', 'project', null)).toBe(
      true
    );
  });
});

describe('path handling edge cases', () => {
  it('should handle relative paths (already relative)', () => {
    const relativePath = 'project/subfolder';
    expect(relativePath.startsWith('/')).toBe(false);
  });

  it('should handle empty server root', () => {
    // When serverRoot is empty, it treats "/" as root and returns path after leading slash
    const result = toRelativePath('/home/user/project', '');
    expect(result).toBe('home/user/project');
  });

  it('should handle home-relative path extraction', () => {
    // Test the fallback regex for extracting home-relative paths
    const dirPath = '/home/testuser/workspace/project/.venv';
    const homeMatch = dirPath.match(/^\/(?:home|Users)\/[^/]+\/(.+)$/);
    expect(homeMatch).not.toBeNull();
    expect(homeMatch![1]).toBe('workspace/project/.venv');
  });

  it('should handle macOS home-relative path extraction', () => {
    const dirPath = '/Users/testuser/Documents/project/.venv';
    const homeMatch = dirPath.match(/^\/(?:home|Users)\/[^/]+\/(.+)$/);
    expect(homeMatch).not.toBeNull();
    expect(homeMatch![1]).toBe('Documents/project/.venv');
  });

  it('should not extract from non-home paths', () => {
    const dirPath = '/var/lib/jupyter/kernels';
    const homeMatch = dirPath.match(/^\/(?:home|Users)\/[^/]+\/(.+)$/);
    expect(homeMatch).toBeNull();
  });
});

describe('IUnregisterResponse interface', () => {
  interface IUnregisterResponse {
    success: boolean;
    message?: string;
    error?: string;
  }

  it('should handle successful unregister', () => {
    const successResponse: IUnregisterResponse = {
      success: true,
      message: 'Kernel unregistered successfully'
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.message).toBeDefined();
    expect(successResponse.error).toBeUndefined();
  });

  it('should handle failed unregister', () => {
    const failResponse: IUnregisterResponse = {
      success: false,
      error: 'Kernel not found in registry'
    };

    expect(failResponse.success).toBe(false);
    expect(failResponse.error).toBeDefined();
  });
});
