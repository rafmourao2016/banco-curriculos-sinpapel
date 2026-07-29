param(
  [string]$DatabaseUrl = $env:DIRECT_URL,
  [string]$OutputDir = ".\backups",
  [string]$Passphrase = $env:BACKUP_PASSPHRASE
)

if (-not $DatabaseUrl) {
  throw "Defina DIRECT_URL com a conexao do banco."
}

if (-not $Passphrase) {
  throw "Defina BACKUP_PASSPHRASE para criptografar o backup."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw "pg_dump nao encontrado. Instale PostgreSQL client tools no ambiente do backup."
}

$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $openssl) {
  throw "openssl nao encontrado. Instale OpenSSL no ambiente do backup."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$plain = Join-Path $OutputDir "sinpapel-$timestamp.dump"
$encrypted = "$plain.enc"

& $pgDump.Source $DatabaseUrl --format=custom --file=$plain
& $openssl.Source enc -aes-256-cbc -salt -pbkdf2 -in $plain -out $encrypted -pass "pass:$Passphrase"
Remove-Item $plain -Force

Write-Output $encrypted
