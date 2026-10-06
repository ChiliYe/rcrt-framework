<!-- @format -->

# 开发参考文档

## 跨环境平台函数

业务代码通过 `src/platform.ts` 中的 `platform` 调用平台函数，不直接依赖 Tauri API。该模块使用 `isTauri()` 选择实现：Tauri 环境调用 Rust command，浏览器环境调用 TypeScript 实现。

新增平台函数时，在 `PlatformApi` 中声明签名，并分别补充 `browserImplementation` 与 `tauriImplementation`；Tauri 实现对应的 Rust 函数还需要通过 `tauri::generate_handler!` 注册。调用方始终只使用 `platform`，同一份前端代码即可运行在浏览器和 Tauri 中。
