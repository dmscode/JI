// 导入文件系统操作模块
import { readFileSync, writeFileSync } from "fs";

// 从环境变量获取目标版本号
const targetVersion = process.env.npm_package_version;

// 更新 manifest.json 文件
let manifest = JSON.parse(readFileSync("manifest.json", "utf8")); // 读取并解析 manifest.json
const { minAppVersion } = manifest; // 获取最小支持的应用版本号
manifest.version = targetVersion; // 更新版本号为目标版本
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t")); // 保存更新后的 manifest.json

// 更新 versions.json 文件
let versions = JSON.parse(readFileSync("versions.json", "utf8")); // 读取并解析 versions.json
versions[targetVersion] = minAppVersion; // 添加新版本号与对应的最小支持版本
writeFileSync("versions.json", JSON.stringify(versions, null, "\t")); // 保存更新后的 versions.json
