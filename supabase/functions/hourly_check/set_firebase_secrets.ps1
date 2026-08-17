# Uses a Firebase service-account JSON file to update Supabase Edge Function secrets.
# Run (after `supabase login`):
# powershell -ExecutionPolicy Bypass -File .\supabase\functions\hourly_check\set_firebase_secrets.ps1 -JsonPath "C:\path\service-account.json"

param(
  [Parameter(Mandatory = $true)]
  [string]$JsonPath,
  [string]$ProjectRef = "flpmqhditzfosvdtbqlw"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $JsonPath)) { throw "JSON file topilmadi: $JsonPath" }

$account = Get-Content -Raw $JsonPath | ConvertFrom-Json
if (-not $account.project_id -or -not $account.client_email -or -not $account.private_key) {
  throw "JSON service account formatida project_id, client_email yoki private_key yo'q"
}

$temp = Join-Path $env:TEMP "carelink-firebase-secrets.env"
@"
FIREBASE_PROJECT_ID=$($account.project_id)
FIREBASE_CLIENT_EMAIL=$($account.client_email)
FIREBASE_PRIVATE_KEY=$($account.private_key -replace "(`r`n|`n|`r)", "\n")
"@ | Set-Content -Path $temp -Encoding UTF8 -NoNewline

try {
  supabase secrets set --project-ref $ProjectRef --env-file $temp
  Write-Host "Firebase Edge Function secrets updated." -ForegroundColor Green
  Write-Host "Now deploy: supabase functions deploy hourly_check" -ForegroundColor Cyan
} finally {
  Remove-Item $temp -ErrorAction SilentlyContinue
}
