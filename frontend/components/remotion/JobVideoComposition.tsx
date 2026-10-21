'use client';

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img,
} from 'remotion';

export type JobVideoProps = {
  titulo: string;
  empresaNome?: string;
  cidade?: string;
  modalidade?: string;
  setor?: string;
  requisitos?: string[];
  beneficios?: string[];
  salario?: string;
  qrCodeUrl?: string;
  bannerUrl?: string | null;
  formato?: 'stories' | 'feed';
  exibirEmpresa?: boolean;
};

export const JobVideoComposition: React.FC<JobVideoProps> = ({
  titulo = 'Operador de Produção',
  empresaNome = 'Indústria Filiada SINPAPEL',
  cidade = 'Minas Gerais',
  modalidade = 'Presencial • CLT',
  setor = 'Papel, Papelão e Embalagens',
  requisitos = ['Ensino Médio', 'Disponibilidade de horário', 'Trabalho em equipe'],
  beneficios = ['Salário compatível', 'Plano de Saúde', 'Transporte / Fretado', 'Oportunidade de crescimento'],
  salario = 'A combinar',
  qrCodeUrl = '/qr-cadastro-sinpapel.svg',
  bannerUrl = null,
  formato = 'stories',
  exibirEmpresa = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isStories = formato === 'stories';

  // Animações globais de fundo
  const bgScale = interpolate(frame, [0, 240], [1, 1.08], { extrapolateRight: 'clamp' });
  const glowPulse = Math.sin(frame / 15) * 0.15 + 0.85;

  // Entrada do Cabeçalho / Selo SINPAPEL
  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Transições de Cenas (3 Cenas em 8 segundos = 240 frames a 30fps)
  // Cena 1 (0-75 frames / 0-2.5s): Apresentação da Vaga + Cargo
  // Cena 2 (70-160 frames / 2.3-5.3s): Detalhes + Benefícios + Requisitos
  // Cena 3 (150-240 frames / 5.0-8.0s): Chamada para Ação + QR Code + Cadastro

  const cena1Opacity = interpolate(frame, [0, 15, 65, 75], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const cena1Translate = interpolate(frame, [0, 15, 65, 75], [40, 0, 0, -30], { extrapolateRight: 'clamp' });

  const cena2Opacity = interpolate(frame, [72, 85, 150, 160], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cena2Translate = interpolate(frame, [72, 85, 150, 160], [40, 0, 0, -30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cena3Opacity = interpolate(frame, [155, 170, 240], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cena3Scale = spring({
    frame: Math.max(0, frame - 155),
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#041d13',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background Dinâmico com Gradientes e Efeito Papel / Luz */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 25%, #0A5C36 0%, #032b1a 45%, #02120a 100%)',
          transform: `scale(${bgScale})`,
          zIndex: 0,
        }}
      />

      {/* Círculo luminoso decorativo */}
      <div
        style={{
          position: 'absolute',
          top: isStories ? '20%' : '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isStories ? '750px' : '650px',
          height: isStories ? '750px' : '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0) 70%)',
          opacity: glowPulse,
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Grid sutil decorativo estilo blueprint técnico */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 1,
          opacity: 0.6,
        }}
      />

      {/* Conteúdo Principal */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: isStories ? '80px 60px' : '60px 50px',
          justifyContent: 'space-between',
        }}
      >
        {/* CABEÇALHO FIXO: Marca SINPAPEL + Selo Oportunidade */}
        <div
          style={{
            opacity: headerSpring,
            transform: `translateY(${(1 - headerSpring) * -30}px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            paddingBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Img
              src="/logo-sinpapel.png"
              style={{
                height: isStories ? '58px' : '48px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}
            />
            <div style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '14px' }}>
              <div style={{ fontSize: isStories ? '22px' : '18px', fontWeight: 800, letterSpacing: '1px', color: '#ffffff' }}>
                SINPAPEL
              </div>
              <div style={{ fontSize: isStories ? '13px' : '11px', color: '#86efac', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Banco de Talentos Oficial
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.6)',
              borderRadius: '9999px',
              padding: isStories ? '8px 20px' : '6px 14px',
              fontSize: isStories ? '15px' : '13px',
              fontWeight: 800,
              color: '#fef08a',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)',
            }}
          >
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span>Vaga Aberta</span>
          </div>
        </div>

        {/* ÁREA CENTRAL DINÂMICA (Alterna entre as 3 Cenas) */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* CENA 1: CARGO E IMPACTO (0s a 2.5s) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              opacity: cena1Opacity,
              transform: `translateY(${cena1Translate}px)`,
              pointerEvents: frame > 75 ? 'none' : 'auto',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#6ee7b7',
                padding: '8px 22px',
                borderRadius: '12px',
                fontSize: isStories ? '18px' : '15px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '24px',
              }}
            >
              {setor}
            </div>

            <h1
              style={{
                fontSize: isStories ? '58px' : '44px',
                fontWeight: 900,
                lineHeight: 1.15,
                margin: '0 0 24px 0',
                background: 'linear-gradient(180deg, #ffffff 0%, #d1fae5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                maxWidth: '920px',
                textShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            >
              {titulo}
            </h1>

            {exibirEmpresa && (
              <div
                style={{
                  fontSize: isStories ? '24px' : '19px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '20px',
                }}
              >
                🏢 {empresaNome}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: isStories ? '18px' : '15px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                }}
              >
                📍 {cidade}
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: isStories ? '18px' : '15px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                }}
              >
                💼 {modalidade}
              </div>
            </div>
          </div>

          {/* CENA 2: DIFERENCIAIS E BENEFÍCIOS (2.5s a 5.3s) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: cena2Opacity,
              transform: `translateY(${cena2Translate}px)`,
              pointerEvents: frame < 70 || frame > 160 ? 'none' : 'auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span
                style={{
                  fontSize: isStories ? '18px' : '14px',
                  color: '#fef08a',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                Oportunidade & Diferenciais
              </span>
              <h2
                style={{
                  fontSize: isStories ? '38px' : '30px',
                  fontWeight: 800,
                  margin: '8px 0 0 0',
                  color: '#ffffff',
                }}
              >
                O que esta oportunidade oferece:
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isStories ? '1fr' : '1fr 1fr',
                gap: '16px',
                maxWidth: '880px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              {beneficios.slice(0, 4).map((beneficio, i) => {
                const itemSpring = spring({
                  frame: Math.max(0, frame - (80 + i * 8)),
                  fps,
                  config: { damping: 14, stiffness: 150 },
                });
                return (
                  <div
                    key={i}
                    style={{
                      opacity: itemSpring,
                      transform: `scale(${interpolate(itemSpring, [0, 1], [0.85, 1])}) translateX(${(1 - itemSpring) * 30}px)`,
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '16px',
                      padding: isStories ? '18px 24px' : '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        color: '#064e3b',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <span style={{ fontSize: isStories ? '22px' : '17px', fontWeight: 600, color: '#f1f5f9' }}>
                      {beneficio}
                    </span>
                  </div>
                );
              })}
            </div>

            {salario && salario !== 'A combinar' && (
              <div
                style={{
                  marginTop: '24px',
                  textAlign: 'center',
                  fontSize: isStories ? '20px' : '16px',
                  color: '#a7f3d0',
                  fontWeight: 700,
                }}
              >
                💰 Remuneração: <span style={{ color: '#ffffff' }}>{salario}</span>
              </div>
            )}
          </div>

          {/* CENA 3: CALL TO ACTION + QR CODE (5.0s a 8.0s) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              opacity: cena3Opacity,
              transform: `scale(${cena3Scale})`,
              pointerEvents: frame < 150 ? 'none' : 'auto',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid #facc15',
                color: '#fef08a',
                padding: '6px 20px',
                borderRadius: '9999px',
                fontSize: isStories ? '16px' : '13px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '16px',
              }}
            >
              Envio Imediato de Currículo
            </div>

            <h2
              style={{
                fontSize: isStories ? '44px' : '32px',
                fontWeight: 900,
                margin: '0 0 12px 0',
                color: '#ffffff',
                maxWidth: '820px',
              }}
            >
              Gostou da vaga? Candidate-se agora!
            </h2>

            <p
              style={{
                fontSize: isStories ? '20px' : '16px',
                color: '#94a3b8',
                margin: '0 0 28px 0',
                maxWidth: '650px',
              }}
            >
              Aponte a câmera do seu celular para o QR Code abaixo e cadastre seu currículo gratuitamente:
            </p>

            {/* Cartão do QR Code com Glow */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: isStories ? '24px' : '18px',
                borderRadius: '24px',
                boxShadow: '0 0 50px rgba(16, 185, 129, 0.5), 0 20px 40px rgba(0,0,0,0.6)',
                position: 'relative',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Img
                src={qrCodeUrl}
                style={{
                  width: isStories ? '240px' : '180px',
                  height: isStories ? '240px' : '180px',
                  objectFit: 'contain',
                }}
              />
              <span
                style={{
                  marginTop: '10px',
                  fontSize: isStories ? '14px' : '12px',
                  fontWeight: 800,
                  color: '#0A5C36',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                bancodetalentos.sinpapel
              </span>
            </div>
          </div>
        </div>

        {/* RODAPÉ FIXO: Site oficial e apoio institucional */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: isStories ? '16px' : '13px',
            color: '#94a3b8',
          }}
        >
          <div>
            🌐 Acesse: <strong style={{ color: '#ffffff' }}>sinpapel.vercel.app</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Apoio:</span>
            <strong style={{ color: '#ffffff' }}>Sistema FIEMG</strong>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
