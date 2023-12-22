import {CLIError} from '@react-native-community/cli-tools';
import path from 'path';
import {getPropertyFromBuildSettings} from './getPropertyFromBuildSettings';

export async function getBuildPath(
  buildSettings: string,
  scheme: string,
  target: string | undefined,
  platform: string = 'ios',
  isCatalyst: boolean = false,
) {
  const targetBuildDir = getPropertyFromBuildSettings(
    buildSettings,
    scheme,
    'TARGET_BUILD_DIR',
    target,
  );

  const executableFolderPath = getPropertyFromBuildSettings(
    buildSettings,
    scheme,
    'EXECUTABLE_FOLDER_PATH',
    target,
  );

  const fullProductName = getPropertyFromBuildSettings(
    buildSettings,
    scheme,
    'FULL_PRODUCT_NAME',
    target,
  );

  if (!targetBuildDir) {
    throw new CLIError('Failed to get the target build directory.');
  }

  if (!executableFolderPath) {
    throw new CLIError('Failed to get the app name.');
  }

  if (!fullProductName) {
    throw new CLIError('Failed to get product name.');
  }

  if (platform === 'macos') {
    return path.join(targetBuildDir, fullProductName);
  } else if (isCatalyst) {
    return path.join(targetBuildDir, '-maccatalyst', executableFolderPath);
  } else {
    return path.join(targetBuildDir, executableFolderPath);
  }
}
