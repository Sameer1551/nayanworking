# =========================================================
# ADVANCED GITHUB CONTRIBUTION GENERATOR
# =========================================================

$remoteUrl = "https://github.com/Sameer1551/nayanworking.git"

$sourceDir = Join-Path $PSScriptRoot ".update_source"
$memoryFile = Join-Path $PSScriptRoot ".upload_memory.json"

# =========================================================
# SETTINGS
# =========================================================

$filesPerDay = 10
$chunksPerFile = 5

# Random delay range between commits
$minDelay = 20
$maxDelay = 90

# =========================================================
# RANDOM COMMIT MESSAGES
# =========================================================

$commitMessages = @(
    "Refactor module",
    "Improve structure",
    "Update logic",
    "Add functionality",
    "Fix issue",
    "Enhance component",
    "Cleanup code",
    "Optimize implementation",
    "Update feature",
    "Improve readability",
    "Minor improvements",
    "Code adjustments",
    "Refine implementation",
    "Progress update",
    "Feature enhancement"
)

# =========================================================
# CLONE / UPDATE SOURCE
# =========================================================

if (-not (Test-Path $sourceDir)) {

    Write-Host "Cloning source repository..." -ForegroundColor Cyan

    git clone $remoteUrl $sourceDir

} else {

    Write-Host "Updating source repository..." -ForegroundColor Cyan

    Push-Location $sourceDir
    git pull
    Pop-Location
}

# =========================================================
# SAFETY CHECK
# =========================================================

if (-not (Test-Path (Join-Path $PSScriptRoot ".git"))) {

    Write-Host ""
    Write-Host "ERROR: Current folder is not a Git repository." -ForegroundColor Red
    Write-Host ""

    exit
}
# =========================================================
# REMOTE CONFIGURATION
# =========================================================

if (-not (git remote)) {
    Write-Host "Configuring remote 'origin'..." -ForegroundColor Cyan
    git remote add origin $remoteUrl
}

# Ensure upstream is set for the current branch
$currentBranch = git branch --show-current
git push --set-upstream origin $currentBranch --quiet

# =========================================================
# CREATE MEMORY FILE IF NOT EXISTS
# =========================================================

if (-not (Test-Path $memoryFile)) {

    $initialMemory = @{
        nextFileIndex = 0
        completedFiles = @()
        lastRunDate = ""
    }

    $initialMemory | ConvertTo-Json -Depth 10 | Set-Content $memoryFile
}

# =========================================================
# LOAD MEMORY
# =========================================================

$memory = Get-Content $memoryFile -Raw | ConvertFrom-Json

# =========================================================
# GET SOURCE FILES
# =========================================================

$allFiles = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object {

    $_.FullName -notmatch "\\\.git\\"
}

# Sort for stable ordering
$allFiles = $allFiles | Sort-Object FullName

# =========================================================
# DETERMINE TODAY'S FILES
# =========================================================

$startIndex = $memory.nextFileIndex

if ($startIndex -ge $allFiles.Count) {

    Write-Host ""
    Write-Host "All files already uploaded!" -ForegroundColor Green
    Write-Host ""

    exit
}

$endIndex = [Math]::Min(
    $startIndex + $filesPerDay - 1,
    $allFiles.Count - 1
)

$todayFiles = $allFiles[$startIndex..$endIndex]

Write-Host ""
Write-Host "===================================" -ForegroundColor Yellow
Write-Host "TODAY'S UPLOAD SESSION"
Write-Host "===================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Files Today : $($todayFiles.Count)"
Write-Host "Start Index : $startIndex"
Write-Host "End Index   : $endIndex"
Write-Host ""

# =========================================================
# PROCESS FILES
# =========================================================

foreach ($file in $todayFiles) {

    $relativePath = $file.FullName.Substring($sourceDir.Length + 1)

    Write-Host ""
    Write-Host "Processing File: $relativePath" -ForegroundColor Cyan

    $content = Get-Content $file.FullName

    if ($content.Count -eq 0) {

        Write-Host "Skipping Empty File"
        continue
    }

    # =====================================================
    # SPLIT FILE INTO CHUNKS
    # =====================================================

    $totalLines = $content.Count

    $chunkSize = [Math]::Ceiling($totalLines / $chunksPerFile)

    for ($chunk = 1; $chunk -le $chunksPerFile; $chunk++) {

        $endLine = [Math]::Min(
            $chunk * $chunkSize,
            $totalLines
        )

        $partialContent = $content[0..($endLine - 1)]

        # =================================================
        # DESTINATION
        # =================================================

        $destPath = Join-Path $PSScriptRoot $relativePath

        $destFolder = Split-Path $destPath

        if (-not (Test-Path $destFolder)) {

            New-Item -Path $destFolder `
                     -ItemType Directory `
                     -Force | Out-Null
        }

        # =================================================
        # WRITE PARTIAL FILE
        # =================================================

        Set-Content $destPath $partialContent

        # =================================================
        # GIT OPERATIONS
        # =================================================

        git add "$relativePath"

        $randomMessage = $commitMessages | Get-Random

        git commit -m "$randomMessage ($chunk/$chunksPerFile)" --quiet

        $currentBranch = git branch --show-current
        git push origin $currentBranch --quiet

        Write-Host "Commit $chunk/$chunksPerFile completed." `
                   -ForegroundColor Green

        # =================================================
        # RANDOM DELAY
        # =================================================

        if ($chunk -lt $chunksPerFile) {

            $delay = Get-Random `
                        -Minimum $minDelay `
                        -Maximum $maxDelay

            Write-Host "Waiting $delay seconds..." `
                       -ForegroundColor DarkYellow

            Start-Sleep -Seconds $delay
        }
    }

    # =====================================================
    # UPDATE MEMORY
    # =====================================================

    $memory.completedFiles += $relativePath
}

# =========================================================
# UPDATE NEXT FILE INDEX
# =========================================================

$memory.nextFileIndex = $endIndex + 1

$memory.lastRunDate = (Get-Date).ToString("yyyy-MM-dd")

# =========================================================
# SAVE MEMORY
# =========================================================

$memory | ConvertTo-Json -Depth 10 | Set-Content $memoryFile

# =========================================================
# DONE
# =========================================================

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "UPLOAD SESSION COMPLETE"
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

Write-Host "Files Uploaded Today : $($todayFiles.Count)"
Write-Host "Approx Contributions : $($todayFiles.Count * $chunksPerFile)"
Write-Host "Next File Index      : $($memory.nextFileIndex)"
Write-Host ""

Write-Host "Run again tomorrow for next batch." `
           -ForegroundColor Yellow

Write-Host ""