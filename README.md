<!-- @format -->

# rcrt-framework

一个通用的2D游戏框架，使用React+tauri构建  
rcrt的含义是React+Canvas+Rust+tauri

## 制作目的

我们发现，tauri2作为rust的新兴框架，在和Web+React+Canvas技术栈配合时，尤其是制作循环逻辑（如游戏，生成动画），没有合适的框架，所以我们制作了这个可以同时跨多平台+双端（Web，桌面）部署的框架

过去想要达成这一点：

**Canvas：使用pixjs等库**

优点在于

- 成熟
- 简单环境下容易使用

缺点在于

- 不适用于循环逻辑，可能导致封装逻辑复杂

**双端部署：手写逻辑**

优点在于

- 可以进行较灵活的定制化

缺点在于

- 逻辑复杂
- 在大部分时候，定制化会造成更大负担

## 部署方式

1. 克隆本仓库来获得框架本体

```bash
git clone https://github.com//ChiliYe/rcrt-framework.git
```

2. 切换到框架目录

```bash
cd rcrt-framework
```

3. 运行项目化脚本

```bash
chmod +x ./bashscript/makeproj.sh #可能需要添加执行权限
./bashscript/makeproj.sh
```

4. 编辑或更管您的许可证：值得注意的是，本项目采用MIT许可证，所以您可以将您的项目用于商业应用
5. 开始您的开发吧！

## 多语言

界面使用 `i18next` 和 `react-i18next`。当前支持英语和简体中文，默认根据系统语言选择，也可以在界面切换，选择结果保存在本地。

语言资源目录结构、翻译键维护及新增语言步骤，参见[开发参考文档中的 i18n 多语言规范](src/lib/development.md#i18n-多语言规范)。

## 开发文档

开发和扩展规范见[开发参考文档](src/lib/development.md)，内容包括跨环境平台函数、i18n、生成器及图形种类。
