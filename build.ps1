Write-Host "--- Iniciando limpeza do projeto ---" -ForegroundColor Cyan

# 1. Remove a pasta .next (onde o cache de build corrompido geralmente reside)
if (Test-Path ".next") {
    Write-Host "Removendo pasta .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next"
}

# 2. Opcional: Remove a pasta de cache do turbopack/webpack se existir
if (Test-Path ".turbo") {
    Write-Host "Removendo pasta .turbo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".turbo"
}

Write-Host "Limpeza concluída." -ForegroundColor Green

# 3. Verifica espaço em disco antes de rodar (opcional)
$drive = Get-PSDrive C
$freeSpaceGB = $drive.Free / 1GB
Write-Host "Espaço livre no C: $freeSpaceGB GB" -ForegroundColor Cyan

if ($freeSpaceGB -lt 2) {
    Write-Host "ALERTA: Espaço em disco muito baixo! O build pode falhar novamente." -ForegroundColor Red
}

# 4. Executa o build
Write-Host "Iniciando build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build realizado com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "O build falhou novamente. Verifique seu espaço em disco." -ForegroundColor Red
}