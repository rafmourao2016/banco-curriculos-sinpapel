# Checklist LGPD - Banco de Curriculos SINPAPEL

Este checklist nao substitui revisao juridica. Ele organiza os pontos para validacao final com o responsavel legal.

## Base legal e transparencia

- [ ] Termo de consentimento revisado pelo juridico.
- [ ] Finalidade clara: banco de curriculos e contato por empresas associadas.
- [ ] Candidato informado sobre compartilhamento com empresas aprovadas.
- [ ] Politica de retencao documentada.
- [ ] Canal de atendimento ao titular definido.

## Direitos do titular

- [x] Candidato consegue excluir conta pela area do candidato.
- [x] Admin consegue excluir dados por solicitacao LGPD.
- [ ] Processo interno para confirmar identidade antes de atendimento LGPD.
- [ ] Prazo de atendimento documentado.

## Seguranca e acesso

- [x] Senhas com hash Argon2.
- [x] Empresas precisam ser aprovadas para acessar candidatos.
- [x] Logs de visualizacao por empresa.
- [x] API ATS usa chave dedicada.
- [x] 2FA para empresa.
- [ ] Rotina de revisao periodica de acessos.

## Ciclo de vida dos dados

- [x] Revalidacao automatica apos 90 dias.
- [x] Inativacao automatica apos 120 dias sem resposta.
- [x] Backup criptografado automatizavel.
- [ ] Teste periodico de restauracao de backup.

## Integracoes e operadores

- [ ] Contratos/DPA com provedor de e-mail.
- [ ] Contratos/DPA com WhatsApp Business API.
- [ ] Contratos/DPA com Vercel/Supabase revisados.
- [ ] Registro de operadores e subprocessadores atualizado.

## Go-live

- [ ] Pentest revisado.
- [ ] Auditoria WCAG revisada.
- [ ] Teste de carga revisado.
- [ ] Plano de resposta a incidente definido.
- [x] Dominio proprio publicado.
- [ ] Politica de privacidade aprovada pelo juridico.
- [ ] Termo de consentimento aprovado pelo juridico.
- [ ] Canal oficial do titular publicado.
- [ ] Prazo de atendimento aprovado e treinado com a equipe.
