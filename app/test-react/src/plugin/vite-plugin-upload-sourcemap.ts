// vite-plugin-upload-sourcemap.ts
import fs from 'fs/promises';
import path from 'path';
import type { Plugin } from 'vite';
import { buildVersion as defaultBuildVersion } from './utils';

/**
 * 插件配置选项类型定义
 */
export interface UploadSourcemapOptions {
  /** 构建输出目录，默认 'dist' */
  outputDir?: string;
  /** 上传后是否删除本地sourcemap文件，默认 true */
  deleteAfterUpload?: boolean;
  /** 应用 ID（与后端项目的 appId 对应） */
  appId: string;
  /** 后端上传接口地址 */
  uploadUrl: string;
}

async function uploadSourcemapToBackend(
  filePath: string,
  fileName: string,
  uploadUrl: string,
  appId: string,
  version: string,
  createTime: number,
): Promise<boolean> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, fileName);
    formData.append('version', version);
    formData.append('createTime', createTime.toString());

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'x-app-id': appId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 上传 sourcemap 失败: ${response.status} ${errorText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ 上传 sourcemap 失败:', error);
    return false;
  }
}

/**
 * 递归查找目录下所有的sourcemap文件
 * @param dir 要查找的目录路径
 * @returns 所有sourcemap文件的绝对路径数组
 */
async function findSourcemapFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 递归查找子目录
      files.push(...(await findSourcemapFiles(fullPath)));
    } else if (entry.isFile() && path.extname(entry.name) === '.map') {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Vite插件：构建后上传sourcemap文件
 * @param options 插件配置选项
 * @returns Vite插件对象
 */
export function vitePluginUploadSourcemap(options: UploadSourcemapOptions): Plugin {
  // 合并默认配置
  const { outputDir = 'dist', deleteAfterUpload = true, appId, uploadUrl } = options;
  const version = defaultBuildVersion;
  const createTime = Date.now();

  console.log('[vitePluginUploadSourcemap] 插件初始化: appId=%s, ', appId);

  // 验证必填配置
  if (!appId) {
    throw new Error('❌ 缺少必填配置：appId');
  }
  if (!uploadUrl) {
    throw new Error('❌ 缺少必填配置：uploadUrl');
  }

  return {
    name: 'vite-plugin-upload-sourcemap', // 插件名称（必填）
    // 构建完成后触发的钩子（Vite官方生命周期）
    async closeBundle() {
      try {
        // 使用项目根目录解析输出目录
        const distAbsolutePath = path.resolve(process.cwd(), outputDir);
        // 1. 查找所有sourcemap文件
        const sourcemapFiles = await findSourcemapFiles(distAbsolutePath);
        if (sourcemapFiles.length === 0) {
          console.log('⚠️ 未找到任何sourcemap文件，请检查vite.config.ts中build.sourcemap配置');
          return;
        }
        console.log('sourcemapFiles:', sourcemapFiles);

        // 2. 逐个上传并可选删除
        for (const filePath of sourcemapFiles) {
          const fileName = path.basename(filePath);
          const success = await uploadSourcemapToBackend(
            filePath,
            fileName,
            uploadUrl,
            appId,
            version,
            createTime,
          );

          if (success && deleteAfterUpload) {
            await fs.unlink(filePath);
            console.log(`🗑️ 已删除本地sourcemap文件: ${fileName}`);
          }
        }

        console.log(`🎉 所有sourcemap文件处理完成（共${sourcemapFiles.length}个）`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ sourcemap上传/删除失败:', errorMsg);
        // 可选：上传失败时终止构建（根据业务需求开启）
        // throw error;
      }
    },
  };
}
