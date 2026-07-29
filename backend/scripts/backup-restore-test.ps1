param(
  [string]$DatabaseUrl = $env:DIRECT_URL,
  [string]$RestoreDatabaseUrl = $env:RESTORE_DATABASE_URL,
  [string]$OutputDir = ".\backups",
  [string]$Passphrase = $env:BACKUP_PASSPHRASE,
  [switch]$AllowRestore
)

if (-not $DatabaseUrl) {
  throw "Defina DIRECT_URL com a conexao do banco de origem."
}

if (-not $Passphrase) {
  throw "Defina BACKUP_PASSPHRASE para criptografar e validar o backup."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw "pg_dump nao encontrado. Instale PostgreSQL client tools no ambiente do backup."
}

$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $pgRestore) {
  throw "pg_restore nao encontrado. Instale PostgreSQL client tools no ambiente do teste."
}

$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $openssl) {
  throw "openssl nao encontrado. Instale OpenSSL no ambiente do backup."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$plain = Join-Path $OutputDir "sinpapel-restore-test-$timestamp.dump"
$encrypted = "$plain.enc"
$decrypted = Join-Path $OutputDir "sinpapel-restore-test-$timestamp.decrypted.dump"
$report = Join-Path $OutputDir "sinpapel-restore-test-$timestamp.txt"

& $pgDump.Source $DatabaseUrl --format=custom --file=$plain
& $openssl.Source enc -aes-256-cbc -salt -pbkdf2 -in $plain -out $encrypted -pass "pass:$Passphrase"
Remove-Item -LiteralPath $plain -Force

& $openssl.Source enc -d -aes-256-cbc -pbkdf2 -in $encrypted -out $decrypted -pass "pass:$Passphrase"
& $pgRestore.Source --list $decrypted | Out-File -FilePath $report -Encoding utf8

$restoreStatus = "nao_executado"
if ($RestoreDatabaseUrl) {
  if (-not $AllowRestore) {
    throw "RESTORE_DATABASE_URL foi informado. Para restaurar, execute com -AllowRestore depois de confirmar que e um banco descartavel de teste."
  }

  if ($RestoreDatabaseUrl -notmatch "(?i)(test|teste|staging|homolog)") {
    throw "Por seguranca, RESTORE_DATABASE_URL precisa conter test, teste, staging ou homolog no nome/host."
  }

  & $pgRestore.Source $RestoreDatabaseUrl --clean --if-exists --no-owner --no-privileges $decrypted
  $restoreStatus = "restaurado_em_banco_de_teste"
}

Remove-Item -LiteralPath $decrypted -Force

[pscustomobject]@{
  backupCriptografado = Resolve-Path $encrypted
  relatorioPgRestore = Resolve-Path $report
  restore = $restoreStatus
} | ConvertTo-Json
