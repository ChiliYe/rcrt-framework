#!/usr/bin/bash

# 用于更改项目名称、版本号等信息

# 更改rcrt-framework为传入的参数

if [ $# -lt 1 ]; then
    echo "Usage: $0 <new_project_name>"
    exit 1
fi

new_project_name=$1

project_name_file_ist=("./package.json" "./package-lock.json" "./src-tauri/Cargo.toml" "./src-tauri/tauri.conf.json") # 定义需要更改的文件列表

for file in ${project_name_file_ist[@]}; do
    if [ -f "$file" ]; then
        sed -i "s/rcrt-framework/$new_project_name/g" "$file"
        echo "Updated project name in $file"
    else
        echo "File $file does not exist.Skip."
    fi
done

project_version_file_ist=("./package.json" "./src-tauri/Cargo.toml" "./src-tauri/tauri.conf.json") # 定义需要更改的文件列表

for file in ${project_version_file_ist[@]}; do
    if [ -f "$file" ]; then
    # 找到位于文件根部的版本号并更改为0.1.0
        sed -i 's/"version": "[^"]*"/"version": "0.1.0"/' "$file"
        echo "Updated project version in $file"
    else
        echo "File $file does not exist.Skip."
    fi
done

echo "Modify your identity information in ./src-tauri/tauri.conf.json."