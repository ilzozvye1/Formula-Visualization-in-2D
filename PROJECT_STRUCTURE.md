# 项目结构说明

## 📁 目录结构

```
Formula-Visualization-in-2D/
├── .github/                    # GitHub 配置
│   └── workflows/              # GitHub Actions 工作流
│       └── build.yml           # 自动构建配置
│
├── scripts/                    # 构建脚本和工具
│   ├── build/                  # 构建脚本
│   ├── test/                   # 测试脚本
│   ├── download-builds.ps1     # 下载 GitHub 构建的脚本
│   └── 下载指南.md              # 下载指南
│
├── builds/                     # ⭐ GitHub 构建产物（自动下载）
│   ├── 5_960b349/              # 构建 #5
│   ├── 4_da97b52/              # 构建 #4
│   └── 3_b9b6ff6/              # 构建 #3
│   └── ...                     # 自动保留最近 3 个
│
├── src/                        # 源代码
│   ├── modules/                # 模块
│   ├── presets/                # 预设公式
│   └── ...
│
├── tests/                      # 测试文件
│
├── docs/                       # 文档
│
├── download.bat                # 🚀 快速下载构建（根目录）
├── cleanup-build-output.bat    # 清理旧的构建目录
│
├── package.json                # 项目配置
└── README.md                   # 项目说明
```

## 📋 重要目录说明

### 1. `builds/` - GitHub 构建产物

**用途**: 存储从 GitHub Actions 下载的自动构建

**特点**:
- ✅ 自动从 GitHub 下载
- ✅ 保留最近 3 个构建
- ✅ 不上传到 GitHub（在 .gitignore 中）
- ✅ 独立于 Git 分支

**使用方法**:
```bash
# 下载最新构建
.\download.bat <GitHub_Token>

# 或使用 PowerShell
powershell -File .\scripts\download-builds.ps1 -Token "ghp_xxx"
```

**目录结构**:
```
builds/
├── 5_960b349/              # 构建编号_Commit 哈希
│   ├── build-info.txt      # 构建信息
│   ├── win-unpacked/       # x64 版本
│   └── win-ia32-unpacked/  # ia32 版本
```

### 2. `scripts/` - 构建脚本

**用途**: 存放所有自动化脚本

**包含**:
- `build/` - 项目构建脚本
- `test/` - 测试脚本
- `download-builds.ps1` - 下载 GitHub 构建
- `下载指南.md` - 下载详细指南

### 3. `.github/workflows/` - GitHub Actions

**用途**: 自动构建和发布

**触发条件**:
- push 到 develop/main/master 分支
- Pull Request

**构建产物**:
- **临时构建**: develop 分支，保留 7 天
- **正式发布**: main/master 分支，创建 Release

## 🔧 常用操作

### 下载最新构建
```bash
.\download.bat ghp_your_token
```

### 清理旧文件
```bash
.\cleanup-build-output.bat
```

### 构建项目
```bash
npm run build
```

## 📝 Git 分支策略

- `main` - 生产分支（稳定版本）
- `develop` - 开发分支（日常开发）
- `feature/*` - 功能分支

## ⚠️ 注意事项

1. **builds/ 目录**:
   - 不在 Git 管理中
   - 不受分支切换影响
   - 定期自动清理

2. **build-output/ 目录**:
   - 旧的本地构建目录
   - 可以安全删除
   - 运行 `cleanup-build-output.bat` 清理

3. **GitHub Token**:
   - 不要提交到 Git
   - 在 https://github.com/settings/tokens 生成
   - 需要 `repo` 权限

---

**最后更新**: 2026-03-10
