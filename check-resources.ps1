# 检查HTML文件中的资源引用并验证文件是否存在

param(
    [string]$Directory = "."
)

function Find-HtmlFiles {
    param([string]$Dir)
    
    $htmlFiles = @()
    Get-ChildItem -Path $Dir -Filter "*.html" -Recurse | ForEach-Object {
        if ($_.FullName -notmatch '\\.(git|vs|node_modules)\\') {
            $htmlFiles += $_.FullName
        }
    }
    return $htmlFiles
}

function Extract-Resources {
    param([string]$HtmlContent, [string]$BaseDir)
    
    $resources = @()
    
    # CSS链接
    $cssMatches = [regex]::Matches($HtmlContent, 'href=["'']([^"'']+\.css)["'']', 'IgnoreCase')
    foreach ($match in $cssMatches) {
        $href = $match.Groups[1].Value
        if (-not $href.StartsWith('http://') -and -not $href.StartsWith('https://') -and -not $href.StartsWith('//')) {
            $resources += @{ Type = 'css'; Path = $href }
        }
    }
    
    # JS脚本
    $jsMatches = [regex]::Matches($HtmlContent, 'src=["'']([^"'']+\.js)["'']', 'IgnoreCase')
    foreach ($match in $jsMatches) {
        $src = $match.Groups[1].Value
        if (-not $src.StartsWith('http://') -and -not $src.StartsWith('https://') -and -not $src.StartsWith('//')) {
            $resources += @{ Type = 'js'; Path = $src }
        }
    }
    
    # 图片
    $imgMatches = [regex]::Matches($HtmlContent, 'src=["'']([^"'']+\.(?:jpg|jpeg|png|gif|svg|webp))["'']', 'IgnoreCase')
    foreach ($match in $imgMatches) {
        $src = $match.Groups[1].Value
        if (-not $src.StartsWith('http://') -and -not $src.StartsWith('https://') -and -not $src.StartsWith('//')) {
            $resources += @{ Type = 'image'; Path = $src }
        }
    }
    
    return $resources
}

function Check-ResourceExists {
    param([string]$ResourcePath, [string]$HtmlFilePath)
    
    $htmlDir = Split-Path $HtmlFilePath
    
    # 处理相对路径
    if ($ResourcePath.StartsWith('./')) {
        $ResourcePath = $ResourcePath.Substring(2)
    }
    
    # 尝试几种可能的路径
    $possiblePaths = @(
        Join-Path $htmlDir $ResourcePath,
        Join-Path $htmlDir ("." + $ResourcePath),
        Join-Path (Split-Path $htmlDir) $ResourcePath,
        Join-Path (Get-Location).Path $ResourcePath
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            return $true, (Resolve-Path $path -Relative)
        }
    }
    
    return $false, $null
}

# 主程序
Write-Host "扫描目录: $Directory" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

$htmlFiles = Find-HtmlFiles -Dir $Directory
Write-Host "找到 $($htmlFiles.Count) 个HTML文件" -ForegroundColor Yellow

$allIssues = @()

foreach ($htmlFile in $htmlFiles) {
    Write-Host "`n检查文件: $(Split-Path $htmlFile -Leaf)" -ForegroundColor White
    
    try {
        $content = Get-Content $htmlFile -Encoding UTF8 -Raw
    } catch {
        Write-Host "  错误: 无法读取文件 - $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    $resources = Extract-Resources -HtmlContent $content -BaseDir (Split-Path $htmlFile)
    
    foreach ($resource in $resources) {
        $exists, $foundPath = Check-ResourceExists -ResourcePath $resource.Path -HtmlFilePath $htmlFile
        
        if (-not $exists) {
            Write-Host "  ❌ $($resource.Type.ToUpper()) 404: $($resource.Path)" -ForegroundColor Red
            $allIssues += @{
                File = Split-Path $htmlFile -Leaf
                Type = $resource.Type
                Path = $resource.Path
                Status = 'missing'
            }
        } else {
            Write-Host "  ✓ $($resource.Type.ToUpper()) OK: $($resource.Path) -> $foundPath" -ForegroundColor Green
            $allIssues += @{
                File = Split-Path $htmlFile -Leaf
                Type = $resource.Type
                Path = $resource.Path
                Status = 'found'
                FoundPath = $foundPath
            }
        }
    }
}

Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
Write-Host "总结:" -ForegroundColor Yellow

$missingCount = ($allIssues | Where-Object { $_.Status -eq 'missing' }).Count
$foundCount = ($allIssues | Where-Object { $_.Status -eq 'found' }).Count

Write-Host "总资源数: $($allIssues.Count)" -ForegroundColor White
Write-Host "找到的资源: $foundCount" -ForegroundColor Green
Write-Host "缺失的资源: $missingCount" -ForegroundColor $(if ($missingCount -gt 0) { 'Red' } else { 'Green' })

if ($missingCount -gt 0) {
    Write-Host "`n缺失的资源列表:" -ForegroundColor Red
    foreach ($issue in $allIssues | Where-Object { $_.Status -eq 'missing' }) {
        Write-Host "  - $($issue.File): $($issue.Type) - $($issue.Path)" -ForegroundColor Red
    }
    
    Write-Host "`n建议:" -ForegroundColor Yellow
    Write-Host "1. 检查文件路径是否正确"
    Write-Host "2. 确保文件存在于指定位置"
    Write-Host "3. 使用相对路径时注意目录层级"
    Write-Host "4. 可以为图片标签添加 onerror 属性: onerror=\"this.style.display='none'\""
}

if ($missingCount -eq 0) {
    Write-Host "`n✅ 所有资源文件都存在！" -ForegroundColor Green
}