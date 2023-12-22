import child_process from 'child_process';
import {CLIError, logger} from '@react-native-community/cli-tools';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import chalk from 'chalk';
import {getBuildPath} from './getBuildPath';
import {getBuildSettings} from './getBuildSettings';
import {getPropertyFromBuildSettings} from './getPropertyFromBuildSettings';
import path from 'path';

export default async function installApp(
  buildOutput: any,
  xcodeProject: IOSProjectInfo,
  mode: string,
  scheme: string,
  target?: string,
  udid?: string,
  binaryPath?: string,
  platform?: string,
) {
  let appPath = binaryPath;

  const buildSettings = await getBuildSettings(
    xcodeProject,
    mode,
    buildOutput,
    scheme,
  );

  if (!appPath) {
    appPath = await getBuildPath(buildSettings, scheme, target, platform);
  }

  const targetBuildDir = getPropertyFromBuildSettings(
    buildSettings,
    scheme,
    'TARGET_BUILD_DIR',
    target,
  );

  const infoPlistPath = getPropertyFromBuildSettings(
    buildSettings,
    scheme,
    'INFOPLIST_PATH',
    target,
  );

  if (!infoPlistPath) {
    throw new CLIError('Failed to find Info.plist');
  }

  if (!targetBuildDir) {
    throw new CLIError('Failed to get target build directory.');
  }

  logger.info(`Installing "${chalk.bold(appPath)}`);

  if (udid && appPath) {
    child_process.spawnSync('xcrun', ['simctl', 'install', udid, appPath], {
      stdio: 'inherit',
    });
  }

  const bundleID = child_process
    .execFileSync(
      '/usr/libexec/PlistBuddy',
      [
        '-c',
        'Print:CFBundleIdentifier',
        path.join(targetBuildDir, infoPlistPath),
      ],
      {encoding: 'utf8'},
    )
    .trim();

  logger.info(`Launching "${chalk.bold(bundleID)}"`);

  function handleLaunchResult(
    success: boolean,
    errorMessage: string,
    errorDetails = '',
  ) {
    if (success) {
      logger.success('Successfully launched the app');
    } else {
      logger.error(errorMessage, errorDetails);
    }
  }

  if (platform === 'macos') {
    child_process.exec(
      `open -b ${bundleID} -a "${appPath}"`,
      (error, _, stderr) => {
        handleLaunchResult(!error, 'Failed to launch the app', stderr);
      },
    );
  } else if (udid) {
    let result = child_process.spawnSync('xcrun', [
      'simctl',
      'launch',
      udid,
      bundleID,
    ]);

    handleLaunchResult(
      result.status === 0,
      'Failed to launch the app on simulator',
      result.stderr.toString(),
    );
  }
}
