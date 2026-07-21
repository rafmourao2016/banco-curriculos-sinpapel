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

export const cadastroSchema = z.object({
  nome: z.string().min(3, 'Informe seu nome completo'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  dataNascimento: z.string().min(1, 'Informe sua data de nascimento'),
  regiao: z.string().min(2, 'Informe sua cidade/região'),
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
  senha: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
  cargoAtual: z.string().min(2, 'Informe seu cargo ou último cargo'),
  areaAtual: z.string().min(2, 'Informe sua área de atuação'),
  habilidades: z.string().min(2, 'Liste ao menos uma habilidade'),
  aceiteTermoLgpd: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar o termo para continuar' }),
  }),
});

export type CadastroFormValues = z.infer<typeof cadastroSchema>;
