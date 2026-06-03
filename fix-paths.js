// 修复HTML文件中的路径问题脚本
const fs = require('fs');
const path = require('path');

// 要检查的常见资源路径模式
const resourcePatterns = [
    { pattern: /src=["']([^"']*\.(jpg|jpeg|png|gif|svg|webp))["']/gi, type: 'image' },
    { pattern: /href=["']([^"']*\.css)["']/gi, type: 'css' },
    { pattern: /src=["']([^"']*\.js)["']/gi, type: 'js' },
    { pattern: /href=["']([^"']*\.html?)["']/gi, type: 'html' }
];

// 检查文件是否存在
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

// 修复相对路径
function fixRelativePath(relativePath, baseDir) {
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('//')) {
        return relativePath; // 外部URL，不处理
    }
    
    if (relativePath.startsWith('/')) {
        return relativePath; // 绝对路径，不处理
    }
    
    // 检查文件是否存在
    const fullPath = path.join(baseDir, relativePath);
    if (fileExists(fullPath)) {
        return relativePath; // 文件存在，路径正确
    }
    
    // 尝试查找文件
    const possiblePaths = [
        relativePath,
        './' + relativePath,
        '../' + relativePath,
        relativePath.replace(/^\.\//, ''),
        relativePath.replace(/^\.\.\//, '')
    ];
    
    for (const possiblePath of possiblePaths) {
        const testPath = path.join(baseDir, possiblePath);
        if (fileExists(testPath)) {
            console.log(`找到文件: ${relativePath} -> ${possiblePath}`);
            return possiblePath;
        }
    }
    
    console.log(`文件未找到: ${relativePath}`);
    return relativePath; // 返回原始路径
}

// 处理HTML文件
function processHtmlFile(filePath) {
    console.log(`处理文件: ${filePath}`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const dir = path.dirname(filePath);
        let modified = false;
        let newContent = content;
        
        // 修复CSS引用
        newContent = newContent.replace(/href=["']([^"']*\.css)["']/gi, (match, href) => {
            const fixedHref = fixRelativePath(href, dir);
            if (fixedHref !== href) {
                modified = true;
                console.log(`修复CSS引用: ${href} -> ${fixedHref}`);
            }
            return `href="${fixedHref}"`;
        });
        
        // 修复JS引用
        newContent = newContent.replace(/src=["']([^"']*\.js)["']/gi, (match, src) => {
            const fixedSrc = fixRelativePath(src, dir);
            if (fixedSrc !== src) {
                modified = true;
                console.log(`修复JS引用: ${src} -> ${fixedSrc}`);
            }
            return `src="${fixedSrc}"`;
        });
        
        // 修复图片引用
        newContent = newContent.replace(/src=["']([^"']*\.(jpg|jpeg|png|gif|svg|webp))["']/gi, (match, src) => {
            const fixedSrc = fixRelativePath(src, dir);
            if (fixedSrc !== src) {
                modified = true;
                console.log(`修复图片引用: ${src} -> ${fixedSrc}`);
            }
            return `src="${fixedSrc}"`;
        });
        
        // 添加onerror处理，防止图片加载失败显示错误
        newContent = newContent.replace(/<img([^>]*?)src=["']([^"']+)["']([^>]*)>/gi, (match, before, src, after) => {
            if (!match.includes('onerror=')) {
                modified = true;
                return `<img${before}src="${src}"${after} onerror="this.style.display='none'">`;
            }
            return match;
        });
        
        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`已更新文件: ${filePath}`);
        } else {
            console.log(`无需修改: ${filePath}`);
        }
        
    } catch (error) {
        console.error(`处理文件失败: ${filePath}`, error.message);
    }
}

// 扫描并处理所有HTML文件
function scanAndFix(directory) {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(directory, file.name);
        
        if (file.isDirectory()) {
            // 跳过特殊目录
            if (file.name === '.git' || file.name === '.vs' || file.name === 'node_modules') {
                continue;
            }
            scanAndFix(fullPath);
        } else if (file.name.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    }
}

// 执行修复
const projectDir = __dirname;
console.log('开始扫描并修复HTML文件路径...');
console.log('项目目录:', projectDir);
console.log('='.repeat(50));

scanAndFix(projectDir);

console.log('='.repeat(50));
console.log('修复完成！');