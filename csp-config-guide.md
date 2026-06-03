# Content Security Policy (CSP) 配置指南

## 问题描述
浏览器控制台出现错误："Content Security Policy of your site blocks the use of 'eval' in JavaScript"

## 解决方案

### 方案1：放宽CSP策略（不推荐）
```html
<!-- 在HTML头部添加 -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-eval';">
```

### 方案2：HTTP头配置
```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

### 方案3：推荐的替代方案

#### 1. 使用JSON.parse替代
```javascript
// 不要使用eval
const data = eval(jsonString);

// 使用JSON.parse
const data = JSON.parse(jsonString);
```

#### 2. 使用Function构造函数
```javascript
// 比eval更安全
const expression = 'return a + b';
const add = new Function('a', 'b', expression);
const result = add(1, 2);
```

#### 3. 安全计算函数
```javascript
function safeEval(expr, context = {}) {
    const allowed = ['Math', 'Date', 'Number', 'String', 'Array', 'Object'];
    const safeContext = Object.create(null);
    
    allowed.forEach(key => {
        if (window[key]) safeContext[key] = window[key];
    });
    
    Object.assign(safeContext, context);
    
    const keys = Object.keys(safeContext);
    const values = keys.map(key => safeContext[key]);
    
    try {
        const fn = new Function(...keys, `return (${expr})`);
        return fn(...values);
    } catch (error) {
        console.error('安全计算失败:', error);
        return null;
    }
}
```

#### 4. Web Workers（用于复杂计算）
```javascript
function executeInWorker(code) {
    const blob = new Blob([`
        self.onmessage = function(e) {
            try {
                const result = eval(e.data);
                self.postMessage({result: result});
            } catch (error) {
                self.postMessage({error: error.message});
            }
        };
    `], {type: 'application/javascript'});
    
    const worker = new Worker(URL.createObjectURL(blob));
    worker.postMessage(code);
    
    return new Promise((resolve, reject) => {
        worker.onmessage = function(e) {
            worker.terminate();
            if (e.data.error) {
                reject(new Error(e.data.error));
            } else {
                resolve(e.data.result);
            }
        };
        worker.onerror = reject;
    });
}
```

## 常见场景解决方案

### 场景1：动态加载脚本
```javascript
// 不要使用eval
const scriptCode = 'console.log("动态脚本")';
eval(scriptCode);

// 使用动态script标签
const script = document.createElement('script');
script.textContent = scriptCode;
document.head.appendChild(script);
document.head.removeChild(script);
```

### 场景2：模板字符串计算
```javascript
// 不要使用eval
const template = 'Hello ${name}';
const result = eval('`' + template + '`');

// 使用模板字符串函数
function renderTemplate(template, data) {
    return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
        return data[key.trim()] || '';
    });
}
```

### 场景3：数学表达式计算
```javascript
// 使用数学表达式解析库或自定义解析器
function calculate(expression) {
    // 简单的数学表达式解析
    const tokens = expression.match(/\d+|[+\-*/()]/g);
    // 实现解析逻辑...
    return eval(expression); // 最后的手段，但应该避免
}
```

## 最佳实践

1. **尽量避免使用eval** - 它存在安全风险
2. **使用严格的CSP策略** - 提高应用安全性
3. **审查第三方库** - 确保它们不使用eval
4. **使用TypeScript** - 提供更好的类型安全
5. **代码审查** - 定期检查代码中的eval使用

## 调试技巧

1. 检查浏览器控制台的完整错误信息
2. 查看当前页面的CSP策略
3. 使用CSP报告功能监控违规行为
4. 逐步替换eval调用为安全替代方案