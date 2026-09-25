import { Injectable, Logger } from '@nestjs/common';

export type JevMatchResult = {
  scoreGeral: number; // 0 a 100%
  nivelAderencia: string; // 'Excelente' | 'Alta' | 'Média' | 'Baixa'
  requisitosTecnicosNoul: number; // 0.0 a 1.0
  atendeRequisitosTecnicos: boolean;
  senioridade: 'junior' | 'pleno' | 'senior';
  senioridadeRotulo: string;
  recomendacao: 'entrevistar' | 'avaliar_com_ressalvas' | 'banco_de_talentos' | 'desqualificado';
  recomendacaoRotulo: string;
  resumoDecisao: string;
  detalhes?: any;
};

@Injectable()
export class JevService {
  private readonly logger = new Logger(JevService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/alpha/decisions';
  private readonly model = 'typesafe/jev-1.13';

  async avaliarMatch(candidatoTexto: string, vagaTexto: string): Promise<JevMatchResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY não configurada. Usando fallback heurístico.');
      return this.fallbackHeuristico(candidatoTexto, vagaTexto);
    }

    const state = `[PERFIL DO CANDIDATO]:\n${candidatoTexto}\n\n[REQUISITOS DA VAGA / OPORTUNIDADE]:\n${vagaTexto}`;

    const payload = {
      model: this.model,
      state,
      questions: {
        aderencia_geral: {
          type: 'score',
          instructions: 'Qual o nível de aderência geral deste candidato para a vaga industrial anunciada?',
          criteria: ['Baixa aderência', 'Média aderência', 'Alta aderência', 'Excelente aderência'],
        },
        requisitos_tecnicos: {
          type: 'noul',
          instructions: 'O candidato atende aos requisitos técnicos essenciais, formação ou vivência exigida?',
          criteria: {
            true: 'Atende aos requisitos essenciais ou possui sólida base transferível',
            false: 'Não atende aos requisitos essenciais da vaga',
          },
        },
        senioridade: {
          type: 'choice',
          instructions: 'Qual a senioridade estimada do candidato para esta vaga?',
          criteria: {
            junior: 'Iniciante, jovem aprendiz ou primeiro emprego',
            pleno: 'Profissional com experiência prática e autonomia',
            senior: 'Especialista, liderança técnica, coordenação ou vasta experiência',
          },
        },
        recomendacao: {
          type: 'choice',
          instructions: 'Qual a recomendação de triagem para o RH da indústria?',
          criteria: {
            entrevistar: 'Prioridade alta: convocar para entrevista imediatamente',
            avaliar_com_ressalvas: 'Compatível: avaliar detalhes na entrevista',
            banco_de_talentos: 'Manter no banco para outras posições futuras',
            desqualificado: 'Incompatível com os requisitos mínimos desta vaga',
          },
        },
      },
    };

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sinpapel.vercel.app',
          'X-OpenRouter-Title': 'SINPAPEL - Banco de Curriculos',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        this.logger.error(`Erro ao consultar Jev OpenRouter (${res.status}): ${errorText}`);
        return this.fallbackHeuristico(candidatoTexto, vagaTexto);
      }

      const data = await res.json();
      const answers = data.answers;

      if (!answers) {
        return this.fallbackHeuristico(candidatoTexto, vagaTexto);
      }

      const scoreRaw = typeof answers.aderencia_geral?.score === 'number' ? answers.aderencia_geral.score : 2;
      const noulTecnico = typeof answers.requisitos_tecnicos?.noul === 'number' ? answers.requisitos_tecnicos.noul : 0.7;
      const scorePercentual = Math.min(100, Math.max(10, Math.round((scoreRaw / 3) * 75 + noulTecnico * 25)));

      const niveis = ['Baixa', 'Média', 'Alta', 'Excelente'];
      const nivelAderencia = niveis[Math.min(Math.max(0, Math.round(scoreRaw)), 3)] || 'Média';

      const senioridade = (answers.senioridade?.choice || 'pleno') as 'junior' | 'pleno' | 'senior';
      const senioridadeRotulos: Record<string, string> = {
        junior: 'Júnior / Iniciante',
        pleno: 'Pleno / Operacional',
        senior: 'Sênior / Especialista',
      };

      const recomendacao = (answers.recomendacao?.choice || 'avaliar_com_ressalvas') as JevMatchResult['recomendacao'];
      const recomendacaoRotulos: Record<string, string> = {
        entrevistar: '✅ Convocação Imediata para Entrevista',
        avaliar_com_ressalvas: '⚠️ Compatível - Avaliar na Entrevista',
        banco_de_talentos: '📁 Guardar no Banco de Talentos',
        desqualificado: '❌ Não compatível com esta vaga',
      };

      const resumo = `${scorePercentual}% de aderência (${nivelAderencia}). Senioridade: ${senioridadeRotulos[senioridade] || senioridade}. Recomendação: ${recomendacaoRotulos[recomendacao] || recomendacao}.`;

      return {
        scoreGeral: scorePercentual,
        nivelAderencia,
        requisitosTecnicosNoul: Math.round(noulTecnico * 100) / 100,
        atendeRequisitosTecnicos: noulTecnico >= 0.5,
        senioridade,
        senioridadeRotulo: senioridadeRotulos[senioridade] || senioridade,
        recomendacao,
        recomendacaoRotulo: recomendacaoRotulos[recomendacao] || recomendacao,
        resumoDecisao: resumo,
        detalhes: answers,
      };
    } catch (err: any) {
      this.logger.error(`Falha na requisição ao Jev Decisions: ${err.message}`);
      return this.fallbackHeuristico(candidatoTexto, vagaTexto);
    }
  }

  private fallbackHeuristico(candidatoTexto: string, vagaTexto: string): JevMatchResult {
    const candNorm = candidatoTexto.toLowerCase();
    const vagaNorm = vagaTexto.toLowerCase();
    const palavrasVaga = vagaNorm.split(/[\s,;./-]+/).filter((p) => p.length >= 4);
    let matches = 0;
    for (const p of palavrasVaga) {
      if (candNorm.includes(p)) matches++;
    }
    const ratio = palavrasVaga.length > 0 ? matches / palavrasVaga.length : 0.5;
    const score = Math.min(95, Math.max(30, Math.round(ratio * 70 + 30)));
    const nivel = score >= 80 ? 'Excelente' : score >= 65 ? 'Alta' : score >= 45 ? 'Média' : 'Baixa';

    return {
      scoreGeral: score,
      nivelAderencia: nivel,
      requisitosTecnicosNoul: Math.round(ratio * 100) / 100,
      atendeRequisitosTecnicos: score >= 50,
      senioridade: 'pleno',
      senioridadeRotulo: 'Pleno / Operacional',
      recomendacao: score >= 75 ? 'entrevistar' : 'avaliar_com_ressalvas',
      recomendacaoRotulo: score >= 75 ? '✅ Convocação Imediata para Entrevista' : '⚠️ Compatível - Avaliar na Entrevista',
      resumoDecisao: `${score}% de aderência estimada (${nivel}).`,
    };
  }
}
