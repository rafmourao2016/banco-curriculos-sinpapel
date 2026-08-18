import { z } from 'zod';

export const escolaridadeOptions = [
  { value: 'FUNDAMENTAL_INCOMPLETO', label: 'Fundamental incompleto' },
  { value: 'FUNDAMENTAL_COMPLETO', label: 'Fundamental completo' },
  { value: 'MEDIO_INCOMPLETO', label: 'Medio incompleto' },
  { value: 'MEDIO_COMPLETO', label: 'Medio completo' },
  { value: 'SUPERIOR_INCOMPLETO', label: 'Superior incompleto' },
  { value: 'SUPERIOR_COMPLETO', label: 'Superior completo' },
  { value: 'POS_GRADUACAO', label: 'Pos-graduacao' },
] as const;

export const areaPretendidaOptions = [
  { value: 'producao', label: 'Producao' },
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'logistica', label: 'Logistica' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'ti', label: 'TI' },
  { value: 'engenharia', label: 'Engenharia' },
  { value: 'outra', label: 'Outra' },
] as const;

export const pretensaoSalarialOptions = [
  { value: 'ate_1500', label: 'Ate R$ 1.500' },
  { value: '1501_2500', label: 'R$ 1.501 a R$ 2.500' },
  { value: '2501_3500', label: 'R$ 2.501 a R$ 3.500' },
  { value: '3501_5000', label: 'R$ 3.501 a R$ 5.000' },
  { value: 'acima_5000', label: 'Acima de R$ 5.000' },
  { value: 'a_combinar', label: 'A combinar' },
] as const;

export const anosExperienciaOptions = [
  { value: 'sem_experiencia', label: 'Sem experiencia' },
  { value: 'ate_1_ano', label: 'Ate 1 ano' },
  { value: '1_3_anos', label: '1 a 3 anos' },
  { value: '3_5_anos', label: '3 a 5 anos' },
  { value: 'mais_5_anos', label: 'Mais de 5 anos' },
] as const;

export const turnoOptions = [
  { value: 'manha', label: 'Manha' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'revezamento', label: 'Revezamento' },
] as const;

export const formacaoStatusOptions = [
  { value: 'cursando', label: 'Cursando' },
  { value: 'concluido', label: 'Concluido' },
  { value: 'trancado', label: 'Trancado' },
] as const;

const experienciaSchema = z.object({
  empresa: z.string().max(120, 'Use no maximo 120 caracteres').optional(),
  cargo: z.string().min(2, 'Informe o cargo').max(120, 'Use no maximo 120 caracteres'),
  area: z.string().min(2, 'Informe a area de atuacao').max(120, 'Use no maximo 120 caracteres'),
  dataInicio: z.string().min(1, 'Informe quando iniciou neste cargo'),
  dataFim: z.string().optional(),
  descricao: z.string().max(300, 'Use no maximo 300 caracteres').optional(),
}).refine(
  (dados) => !dados.dataFim || dados.dataFim >= dados.dataInicio,
  {
    path: ['dataFim'],
    message: 'A data final nao pode ser anterior a data inicial',
  },
);

export const cadastroSchema = z.object({
  nome: z.string().min(3, 'Informe seu nome completo'),
  cpf: z.string().min(11, 'CPF invalido').max(14),
  email: z.string().email('E-mail invalido'),
  telefone: z.string().min(10, 'Telefone invalido'),
  dataNascimento: z.string().min(1, 'Informe sua data de nascimento'),
  regiao: z.string().min(2, 'Informe sua cidade/regiao'),
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
  cursoFormacao: z.string().min(2, 'Informe o curso ou formacao'),
  instituicaoFormacao: z.string().min(2, 'Informe a instituicao'),
  statusFormacao: z.enum(['cursando', 'concluido', 'trancado']),
  anoFormacao: z.coerce.number().int().min(1950, 'Ano invalido').max(2100, 'Ano invalido'),
  cursosCertificacoes: z.string().optional(),
  idiomas: z.string().optional(),
  pcd: z.boolean(),
  pcdObservacao: z.string().max(200, 'Use no maximo 200 caracteres').optional(),
  senha: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
  experiencias: z.array(experienciaSchema).min(1, 'Informe ao menos um cargo').max(5, 'Informe no maximo 5 cargos'),
  habilidades: z.string().min(2, 'Liste ao menos uma habilidade'),
  aceiteTermoLgpd: z.literal(true, {
    errorMap: () => ({ message: 'E necessario aceitar o termo para continuar' }),
  }),
});

export type CadastroFormValues = z.infer<typeof cadastroSchema>;
