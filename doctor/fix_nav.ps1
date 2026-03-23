$files = @(
    'consultations.html',
    'reports.html',
    'profile.html',
    'settings.html',
    'recommendations.html',
    'patient-detail.html',
    'live-monitoring.html',
    'assessments.html'
)

$basePath = $PSScriptRoot

$replacement = @"
        /* -- Responsive bottom nav for small screens -- */
        @media (max-width: 480px) {
            .nav-btn, .bottom-nav .nav-btn, .bottom-nav a {
                font-size: 0.55rem;
                padding: 0.35rem 0.2rem;
                gap: 0.15rem;
            }
            .nav-btn i, .bottom-nav .nav-btn i, .bottom-nav a i {
                font-size: 1.05rem;
            }
        }
"@

foreach ($file in $files) {
    $path = Join-Path $basePath $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match 'Fix Bottom Nav Squishing') {
            $content = $content -replace '(?s)/\* .{1,5} Fix Bottom Nav Squishing .{1,5} \*/\s*\.bottom-nav \{\s*overflow-x: auto;\s*justify-content: flex-start !important;\s*padding-left: 1rem !important;\s*padding-right: 1rem !important;\s*\}\s*\.bottom-nav::-webkit-scrollbar \{ display: none; \}\s*\.nav-btn, \.bottom-nav a \{ flex-shrink: 0; \}', $replacement
            Set-Content -Path $path -Value $content -NoNewline
            Write-Host "Fixed: $file"
        } else {
            Write-Host "No match: $file"
        }
    } else {
        Write-Host "Not found: $file"
    }
}

# Also fix the nav-btn min-width and add flex properties in these files
foreach ($file in $files) {
    $path = Join-Path $basePath $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        # Replace min-width: 48px with flex layout in nav-btn styles
        $content = $content -replace 'min-width: 48px;(\s*transition: all 0\.18s;)', "min-width: 0;`n            flex: 1;`n            max-width: 80px;`$1"
        # Add text overflow handling after gap: 0.2rem
        if ($content -match 'gap: 0\.2rem;\s*\}' -and -not ($content -match 'text-overflow: ellipsis;')) {
            $content = $content -replace '(gap: 0\.2rem;)\s*(\})', "`$1`n            white-space: nowrap;`n            overflow: hidden;`n            text-overflow: ellipsis;`n        `$2"
        }
        Set-Content -Path $path -Value $content -NoNewline
        Write-Host "Updated nav styles: $file"
    }
}
