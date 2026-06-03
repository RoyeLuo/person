#!/usr/bin/env python3
"""
检查HTML文件中的资源引用并验证文件是否存在
"""

import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

def find_html_files(directory):
    """查找所有HTML文件"""
    html_files = []
    for root, dirs, files in os.walk(directory):
        # 跳过.git和.vs目录
        dirs[:] = [d for d in dirs if d not in ['.git', '.vs', 'node_modules']]
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    return html_files

def extract_resources(html_content, base_dir):
    """从HTML内容中提取资源引用"""
    resources = []
    
    # CSS链接
    css_pattern = r'href=["\']([^"\']+\.css)["\']'
    for match in re.finditer(css_pattern, html_content, re.IGNORECASE):
        href = match.group(1)
        if not href.startswith(('http://', 'https://', '//')):
            resources.append(('css', href))
    
    # JS脚本
    js_pattern = r'src=["\']([^"\']+\.js)["\']'
    for match in re.finditer(js_pattern, html_content, re.IGNORECASE):
        src = match.group(1)
        if not src.startswith(('http://', 'https://', '//')):
            resources.append(('js', src))
    
    # 图片
    img_pattern = r'src=["\']([^"\']+\.(?:jpg|jpeg|png|gif|svg|webp))["\']'
    for match in re.finditer(img_pattern, html_content, re.IGNORECASE):
        src = match.group(1)
        if not src.startswith(('http://', 'https://', '//')):
            resources.append(('image', src))
    
    return resources

def check_resource_exists(resource_path, html_file_path):
    """检查资源文件是否存在"""
    html_dir = os.path.dirname(html_file_path)
    
    # 处理相对路径
    if resource_path.startswith('./'):
        resource_path = resource_path[2:]
    elif resource_path.startswith('../'):
        # 相对路径，需要计算绝对路径
        abs_path = os.path.normpath(os.path.join(html_dir, resource_path))
    else:
        # 可能是相对于html文件的路径
        abs_path = os.path.join(html_dir, resource_path)
    
    # 尝试几种可能的路径
    possible_paths = [
        os.path.join(html_dir, resource_path),
        os.path.join(html_dir, '.' + resource_path if not resource_path.startswith('.') else resource_path),
        os.path.join(html_dir, '..', resource_path),
        os.path.join(os.getcwd(), resource_path)
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return True, os.path.relpath(path, os.getcwd())
    
    return False, None

def main():
    project_dir = os.getcwd()
    print(f"扫描目录: {project_dir}")
    print("=" * 80)
    
    html_files = find_html_files(project_dir)
    print(f"找到 {len(html_files)} 个HTML文件")
    
    all_issues = []
    
    for html_file in html_files:
        print(f"\n检查文件: {os.path.relpath(html_file, project_dir)}")
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"  错误: 无法读取文件 - {e}")
            continue
        
        resources = extract_resources(content, os.path.dirname(html_file))
        
        for resource_type, resource_path in resources:
            exists, found_path = check_resource_exists(resource_path, html_file)
            
            if not exists:
                print(f"  ❌ {resource_type.upper()} 404: {resource_path}")
                all_issues.append({
                    'file': os.path.relpath(html_file, project_dir),
                    'type': resource_type,
                    'path': resource_path,
                    'status': 'missing'
                })
            else:
                print(f"  ✓ {resource_type.upper()} OK: {resource_path} -> {found_path}")
                all_issues.append({
                    'file': os.path.relpath(html_file, project_dir),
                    'type': resource_type,
                    'path': resource_path,
                    'status': 'found',
                    'found_path': found_path
                })
    
    print("\n" + "=" * 80)
    print("总结:")
    
    missing_count = sum(1 for issue in all_issues if issue['status'] == 'missing')
    found_count = sum(1 for issue in all_issues if issue['status'] == 'found')
    
    print(f"总资源数: {len(all_issues)}")
    print(f"找到的资源: {found_count}")
    print(f"缺失的资源: {missing_count}")
    
    if missing_count > 0:
        print("\n缺失的资源列表:")
        for issue in all_issues:
            if issue['status'] == 'missing':
                print(f"  - {issue['file']}: {issue['type']} - {issue['path']}")
        
        print("\n建议:")
        print("1. 检查文件路径是否正确")
        print("2. 确保文件存在于指定位置")
        print("3. 使用相对路径时注意目录层级")
        print("4. 可以为图片标签添加 onerror 属性: onerror=\"this.style.display='none'\"")
    
    return missing_count

if __name__ == "__main__":
    exit_code = main()
    sys.exit(0 if exit_code == 0 else 1)