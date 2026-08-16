$files = Get-ChildItem -Path src -Recurse -File -Include *.js,*.jsx
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $matches = [regex]::Matches($content, 'import\s+(?:[^''""]*from\s+)?[''"](\.[^''"]+)[''"]')
    foreach ($match in $matches) {
        $importPath = $match.Groups[1].Value
        if ($importPath -match '\.(css|svg|png|jpg)$') { continue }
        
        $baseDir = Split-Path $file.FullName
        $targetPath = Join-Path $baseDir $importPath
        
        # Check .jsx, .js, or exact
        $possiblePaths = @("$targetPath.jsx", "$targetPath.js", "$targetPath")
        $found = $false
        foreach ($p in $possiblePaths) {
            if (Test-Path $p) {
                $actualName = (Get-Item $p).Name
                $requestedName = Split-Path $p -Leaf
                if ($actualName -cne $requestedName) {
                    Write-Host "CASE MISMATCH: $($file.Name) imports '$importPath' (expects '$requestedName' but file is '$actualName')"
                }
                $found = $true
                break
            }
        }
        
        if (-not $found -and (Test-Path "$targetPath/index.jsx" -or Test-Path "$targetPath/index.js")) {
            $found = $true
        }
        
        if (-not $found) {
            Write-Host "MISSING OR NOT RESOLVED: $($file.Name) imports '$importPath'"
        }
    }
}
