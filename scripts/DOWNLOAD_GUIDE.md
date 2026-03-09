# 自动下载 GitHub 构建指南

## 📋 功能说明

本工具可以自动从 GitHub Actions 下载最近的临时构建，并保存在本地的 `builds/` 目录中。

### 特点

- ✅ 自动下载最近 3 次构建
- ✅ 保留构建版本信息
- ✅ 自动清理旧构建
- ✅ 不会上传到 GitHub（已在 .gitignore 中排除）
- ✅ 独立于分支管理

---

## 🚀 使用方法

### 方法 1：使用批处理文件（推荐）

1. **生成 GitHub Token**
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 勾选 `repo` 权限
   - 生成并复制 token

2. **运行下载脚本**
   ```bash
   cd scripts
   download.bat <你的_GitHub_Token>
   ```
   
   示例：
   ```bash
   download.bat ghp_xxxxxxxxxxxxxxxxxxxx
   ```

### 方法 2：直接使用 PowerShell

```powershell
.\scripts\download-builds.ps1 -Token "ghp_xxxxxxxxxxxxxxxxxxxx"
```

### 方法 3：自定义参数

```powershell
.\scripts\download-builds.ps1 `
  -Token "ghp_xxxxxxxxxxxxxxxxxxxx" `
  -Repo "ilzozvye1/Formula-Visualization-in-2D" `
  -Branch "develop" `
  -KeepCount 3
```

**参数说明：**
- `-Token`: GitHub Personal Access Token（必需）
- `-Repo`: 仓库名称（默认：ilzozvye1/Formula-Visualization-in-2D）
- `-Branch`: 分支名称（默认：develop）
- `-KeepCount`: 保留的构建数量（默认：3）

---

## 📁 目录结构

下载完成后，`builds/` 目录结构如下：

```
builds/
├── 123_a1b2c3d/           # 构建编号_Commit 哈希
│   ├── build-info.txt     # 构建信息
│   ├── win-unpacked/      # 解压后的构建文件
│   └── ...
├── 122_e4f5g6h/
│   ├── build-info.txt
│   └── win-unpacked/
└── 121_i7j8k9l/
    ├── build-info.txt
    └── win-unpacked/
```

### build-info.txt 内容示例

```
构建版本信息
===========
构建编号：#123
Commit SHA: a1b2c3d
创建时间：2026-03-10T08:30:00Z
Artifact: windows-build-dev-a1b2c3d

提交信息：
feat: 添加新功能

下载时间：2026-03-10 16:30:00
```

---

## 🔍 区分临时构建和正式发布

### 临时构建（Development Build）

- **Artifact 名称**: `windows-build-dev-<commit_sha>`
- **触发条件**: 
  - 推送到 `develop` 分支
  - Pull Request
- **保留时间**: 7 天
- **下载方式**: 使用本脚本自动下载
- **用途**: 开发测试、快速验证

### 正式发布（Release Build）

- **位置**: GitHub Releases 页面
- **触发条件**: 推送到 `main` 或 `master` 分支
- **保留时间**: 永久
- **下载方式**: 
  - 访问：https://github.com/ilzozvye1/Formula-Visualization-in-2D/releases
  - 下载安装包（.exe）
- **用途**: 正式版本、用户分发

---

## ⚙️ 自动化配置

### 定时下载（可选）

创建计划任务，每天自动下载最新构建：

1. 打开 **任务计划程序**
2. 创建基本任务
3. 程序/脚本：
   ```
   C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
   ```
4. 添加参数：
   ```
   -ExecutionPolicy Bypass -File "E:\Model\Formula Visualization in 2D\scripts\download-builds.ps1" -Token "ghp_xxxxxxxxxxxx"
   ```

---

## 🔒 安全提示

### Token 安全

- ⚠️ **不要**将 token 提交到 Git
- ⚠️ **不要**在公共场合分享 token
- ✅ 使用 `.env` 文件存储 token（已添加到 .gitignore）

### 创建.env 文件（可选）

在 `scripts/` 目录创建 `.env` 文件：

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

然后修改脚本读取环境变量。

---

## 🛠️ 故障排除

### 问题 1：下载失败

**错误**: "403 Forbidden"

**解决方法**:
- 检查 token 是否有效
- 确认 token 有 `repo` 权限
- 重新生成 token

### 问题 2：找不到 artifacts

**错误**: "未找到临时构建 artifact"

**原因**: 
- 构建的是正式发布版本（不是临时构建）
- 构建已超过 7 天被自动删除

**解决方法**:
- 去 GitHub Releases 下载正式版本
- 触发新的构建

### 问题 3：速率限制

**错误**: "API rate limit exceeded"

**解决方法**:
- 等待一小时后再试
- 使用认证的 token（更高的限制）

---

## 📞 需要帮助？

如有问题，请查看：
- GitHub Actions: https://github.com/ilzozvye1/Formula-Visualization-in-2D/actions
- GitHub Releases: https://github.com/ilzozvye1/Formula-Visualization-in-2D/releases

---

**最后更新**: 2026-03-10
