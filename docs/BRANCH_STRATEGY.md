# 公式可视化 - 分支管理策略

## 概述

采用**单仓库多分支**策略，基于功能分支模型（Git Flow简化版）进行开发。

---

## 分支结构

```
main                    # 主分支 - 稳定版本
├── develop             # 开发分支 - 日常开发
├── feature/*           # 功能分支 - 新功能开发
├── electron            # Electron桌面版
├── cordova             # Cordova移动版
├── pwa                 # PWA版本
├── hotfix/*            # 热修复分支
└── release/*           # 发布分支
```

---

## 分支说明

### 1. 主分支 (main)

**用途**: 生产环境代码，始终保持稳定

**规则**:
- 只能从 `release/*` 或 `hotfix/*` 分支合并
- 禁止直接提交
- 每次合并必须打标签

**保护设置**:
```bash
# 禁止强制推送
git config --local receive.denyNonFastForwards true

# 禁止直接删除
git config --local receive.denyDeletes true
```

### 2. 开发分支 (develop)

**用途**: 日常开发集成

**规则**:
- 从 `main` 分支创建
- 合并各 `feature/*` 分支
- 定期同步到 `main`

### 3. 功能分支 (feature/*)

**用途**: 开发新功能

**命名规范**:
```
feature/3d-performance      # 3D性能优化
feature/param-animation     # 参数动画
feature/webgl-support       # WebGL支持
feature/data-import         # 数据导入
```

**规则**:
- 从 `develop` 分支创建
- 完成后合并回 `develop`
- 合并后删除

### 4. 平台分支

#### electron
**用途**: Electron桌面版开发

**规则**:
- 从 `main` 分支创建
- 定期从 `main` 同步更新
- 桌面版特有功能在此分支开发

#### cordova
**用途**: Cordova移动版开发

**规则**:
- 从 `main` 分支创建
- 定期从 `main` 同步更新
- 移动端特有功能在此分支开发

#### pwa
**用途**: PWA版本开发

**规则**:
- 从 `main` 分支创建
- 定期从 `main` 同步更新
- PWA特有功能在此分支开发

### 5. 热修复分支 (hotfix/*)

**用途**: 紧急修复生产环境问题

**命名规范**:
```
hotfix/fix-memory-leak      # 修复内存泄漏
hotfix/fix-export-bug       # 修复导出bug
```

**规则**:
- 从 `main` 分支创建
- 修复后合并到 `main` 和 `develop`
- 必须打标签

### 6. 发布分支 (release/*)

**用途**: 版本发布准备

**命名规范**:
```
release/v1.2.0              # 1.2.0版本发布
release/v1.1.1              # 1.1.1补丁发布
```

**规则**:
- 从 `develop` 分支创建
- 只进行bug修复和文档更新
- 完成后合并到 `main` 和 `develop`

---

## 开发工作流

### 新功能开发流程

```bash
# 1. 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/xxx

# 2. 开发功能
# ... 编码 ...

# 3. 提交更改
git add .
git commit -m "feat: 添加xxx功能"

# 4. 推送到远程
git push origin feature/xxx

# 5. 创建 Pull Request 合并到 develop
# ... 代码审查 ...

# 6. 合并后删除分支
git checkout develop
git pull origin develop
git branch -d feature/xxx
git push origin --delete feature/xxx
```

### 平台分支同步流程

```bash
# 1. 切换到平台分支
git checkout electron

# 2. 从 main 同步更新
git pull origin main

# 3. 解决冲突（如有）
# ... 解决冲突 ...

# 4. 提交同步
git add .
git commit -m "sync: 从main同步更新"
git push origin electron
```

### 紧急修复流程

```bash
# 1. 从 main 创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/fix-xxx

# 2. 修复问题
# ... 修复 ...

# 3. 提交修复
git add .
git commit -m "hotfix: 修复xxx问题"

# 4. 合并到 main
git checkout main
git merge hotfix/fix-xxx
git tag -a v1.1.1 -m "Version 1.1.1"
git push origin main --tags

# 5. 合并到 develop
git checkout develop
git merge hotfix/fix-xxx
git push origin develop

# 6. 删除分支
git branch -d hotfix/fix-xxx
git push origin --delete hotfix/fix-xxx
```

---

## 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加参数动画功能 |
| `fix` | 修复bug | fix: 修复3D渲染闪烁问题 |
| `docs` | 文档更新 | docs: 更新API文档 |
| `style` | 代码格式 | style: 格式化代码 |
| `refactor` | 重构 | refactor: 优化渲染逻辑 |
| `perf` | 性能优化 | perf: 优化3D曲面渲染 |
| `test` | 测试 | test: 添加单元测试 |
| `chore` | 构建/工具 | chore: 更新构建配置 |
| `sync` | 同步分支 | sync: 从main同步更新 |

### 范围说明

```
feat(3d): 添加WebGL支持
fix(ui): 修复按钮样式问题
docs(api): 更新API文档
perf(rendering): 优化渲染性能
```

---

## 代码审查规范

### Pull Request 模板

```markdown
## 描述
简要描述本次更改的内容

## 类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构

## 测试
- [ ] 本地测试通过
- [ ] 已添加单元测试
- [ ] 已更新文档

## 影响范围
- [ ] 2D功能
- [ ] 3D功能
- [ ] UI界面
- [ ] 数据导入/导出

## 关联Issue
Fixes #123
```

### 审查 checklist

- [ ] 代码符合项目规范
- [ ] 功能测试通过
- [ ] 无console.log调试代码
- [ ] 无未使用的变量/函数
- [ ] 文档已更新（如需要）
- [ ] 性能影响已评估

---

## 版本发布流程

### 版本号规范（语义化版本）

```
主版本号.次版本号.修订号
1.2.3
```

- **主版本号**: 不兼容的API更改
- **次版本号**: 向下兼容的功能添加
- **修订号**: 向下兼容的问题修复

### 发布步骤

```bash
# 1. 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. 更新版本号
# 更新 package.json
# 更新 script.js 中的 APP_VERSION
# 更新 CHANGELOG.md

# 3. 提交版本更新
git add .
git commit -m "chore(release): 准备v1.2.0发布"

# 4. 合并到 main
git checkout main
git merge release/v1.2.0
git tag -a v1.2.0 -m "Version 1.2.0"
git push origin main --tags

# 5. 合并到 develop
git checkout develop
git merge release/v1.2.0
git push origin develop

# 6. 删除发布分支
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0

# 7. 同步到平台分支
git checkout electron
git pull origin main
git push origin electron

git checkout cordova
git pull origin main
git push origin cordova
```

---

## 冲突解决策略

### 常见冲突场景

1. **功能分支合并到develop**
   - 先更新本地develop分支
   - 在功能分支上执行 `git rebase develop`
   - 解决冲突后强制推送

2. **平台分支同步**
   - 使用 `git merge main` 而非 rebase
   - 保留平台特有更改
   - 冲突标记清晰注释

### 冲突解决步骤

```bash
# 1. 获取最新代码
git fetch origin

# 2. 尝试合并
git merge origin/develop

# 3. 解决冲突（编辑冲突文件）
# ... 解决冲突 ...

# 4. 标记已解决
git add <冲突文件>

# 5. 完成合并
git commit -m "merge: 解决合并冲突"

# 6. 推送
git push origin <分支名>
```

---

## 分支保护规则

### main分支
- [x] 禁止强制推送
- [x] 禁止直接删除
- [x] 需要Pull Request审查
- [x] 需要至少1人批准
- [x] 需要通过CI检查

### develop分支
- [x] 禁止强制推送
- [x] 需要Pull Request审查
- [x] 需要通过CI检查

### 平台分支（electron/cordova/pwa）
- [x] 禁止强制推送
- [x] 建议Pull Request审查

---

## 工具配置

### Git别名配置

```bash
# 快捷命令
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --decorate"

# 功能分支快捷创建
git config --global alias.feat "!git checkout develop && git pull && git checkout -b feature/$1"

# 同步主分支
git config --global alias.sync "!git checkout $1 && git pull origin main && git push origin $1"
```

### 提交模板配置

```bash
# 设置提交模板
git config --local commit.template .gitmessage
```

创建 `.gitmessage` 文件：
```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## 附录

### 常用命令速查

```bash
# 查看分支状态
git branch -a

# 查看提交历史
git log --oneline --graph --all

# 清理已合并分支
git branch --merged | grep -v "\\*" | xargs -n 1 git branch -d

# 强制更新分支
git fetch --all
git reset --hard origin/main

# 变基操作
git rebase -i HEAD~3
```

---

*文档版本: v1.0*  
*最后更新: 2026-03-04*
