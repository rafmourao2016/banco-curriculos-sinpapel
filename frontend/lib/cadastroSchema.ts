import { z } from 'zod';

export const escolaridadeOptions = [
  { value: 'FUNDAMENTAL_INCOMPLETO', label: 'Fundamental incompleto' },
  { value: 'FUNDAMENTAL_COMPLETO', label: 'Fundamental completo' },
  { value: 'MEDIO_INCOMPLETO', label: 'Médio incompleto' },
  { value: 'MEDIO_COMPLETO', label: 'Médio completo' },
  { value: 'SUPERIOR_INCOMPLETO', label: 'Superior incompleto' },
  { value: 'SUPERIOR_COMPLETO', label: 'Superior completo' },
  { value: 'POS_GRADUACAO', label: 'Pós-graduação' },
] as const;

export const areaPretendidaOptions = [
  { value: 'producao', label: 'Produção' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'logistica', label: 'Logística' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'ti', label: 'TI' },
  { value: 'engenharia', label: 'Engenharia' },
  { value: 'outra', label: 'Outra' },
] as const;

export const pretensaoSalarialOptions = [
  { value: 'ate_1500', label: 'Até R$ 1.500' },
  { value: '1501_2500', label: 'R$ 1.501 a R$ 2.500' },
  { value: '2501_3500', label: 'R$ 2.501 a R$ 3.500' },
  { value: '3501_5000', label: 'R$ 3.501 a R$ 5.000' },
  { value: 'acima_5000', label: 'Acima de R$ 5.000' },
  { value: 'a_combinar', label: 'A combinar' },
] as const;

export const anosExperienciaOptions = [
  { value: 'sem_experiencia', label: 'Sem experiência' },
  { value: 'ate_1_ano', label: 'Até 1 ano' },
  { value: '1_3_anos', label: '1 a 3 anos' },
  { value: '3_5_anos', label: '3 a 5 anos' },
  { value: 'mais_5_anos', label: 'Mais de 5 anos' },
] as const;

export const turnoOptions = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'revezamento', label: 'Revezamento' },
] as const;

export const formacaoStatusOptions = [
  { value: 'cursando', label: 'Cursando' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'trancado', label: 'Trancado' },
] as const;

export const cadastroSchema = z.object({
  nome: z.string().min(3, 'Informe seu nome completo'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  dataNascimento: z.string().min(1, 'Informe sua data de nascimento'),
  regiao: z.string().min(2, 'Informe sua cidade/região'),
  uf: z.string().min(2, 'Informe a UF').max(2, 'Use a sigla da UF'),
  escolaridade: z.enum([
    'FUNDAMENTAL_INCOMPLETO',
    'FUNDAMENTAL_COMPLETO',
    'MEDIO_INCOMPLETO',
    'MEDIO_COMPLETO',
    'SUPERIOR_INCOMPLETO',
    'SUPERIOR_COMPLETO',
    'POS_GRADUACAO',
  ]),
  possuiCnh: z.boolean(),
  categoriaCnh: z.string().optional(),
  areaPretendida: z.enum(['producao', 'manutencao', 'administrativo', 'logistica', 'qualidade', 'comercial', 'ti', 'engenharia', 'outra']),
  cargoPretendido: z.string().min(2, 'Informe o cargo pretendido'),
  pretensaoSalarial: z.enum(['ate_1500', '1501_2500', '2501_3500', '3501_5000', 'acima_5000', 'a_combinar']),
  experienciaSetorPapel: z.boolean(),
  anosExperienciaTotal: z.enum(['sem_experiencia', 'ate_1_ano', '1_3_anos', '3_5_anos', 'mais_5_anos']),
  turnos: z.array(z.enum(['manha', 'tarde', 'noite', 'revezamento'])).min(1, 'Selecione ao menos um turno'),
  inicioImediato: z.boolean(),
  disponibilidadeMudanca: z.boolean(),
  cursoFormacao: z.string().min(2, 'Informe o curso ou formação'),
  instituicaoFormacao: z.string().min(2, 'Informe a instituição'),
  statusFormacao: z.enum(['cursando', 'concluido', 'trancado']),
  anoFormacao: z.coerce.number().int().min(1950, 'Ano inválido').max(2100, 'Ano inválido'),
  cursosCertificacoes: z.string().optional(),
  idiomas: z.string().optional(),
  pcd: z.boolean(),
  pcdObservacao: z.string().max(200, 'Use no máximo 200 caracteres').optional(),
  senha: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
  empresaExperiencia: z.string().max(120, 'Use no máximo 120 caracteres').optional(),
  cargoAtual: z.string().min(2, 'Informe seu cargo ou último cargo'),
  areaAtual: z.string().min(2, 'Informe sua área de atuação'),
  dataInicioExperiencia: z.string().min(1, 'Informe quando iniciou neste cargo'),
  dataFimExperiencia: z.string().optional(),
  descricaoExperiencia: z.string().max(300, 'Use no máximo 300 caracteres').optional(),
  habilidades: z.string().min(2, 'Liste ao menos uma habilidade'),
  aceiteTermoLgpd: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar o termo para continuar' }),
  }),
}).refine(
  (dados) => !dados.dataFimExperiencia || dados.dataFimExperiencia >= dados.dataInicioExperiencia,
  {
    path: ['dataFimExperiencia'],
    message: 'A data final não pode ser anterior à data inicial',
  },
);

export type CadastroFormValues = z.infer<typeof cadastroSchema>;
