import { sourcebookLabel } from '../services/scenarioService';
import React from 'react';
import { Monster } from '../types';

export type PdfTheme = 'parchment' | 'grimorio';

interface Palette {
  pageBg: string;
  surfaceBg: string;
  subtleBg: string;
  border: string;
  accentBorder: string;
  titleText: string;
  accentText: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  wildcardBg: string;
  wildcardText: string;
  wildcardBorder: string;
}

const PALETTES: Record<PdfTheme, Palette> = {
  parchment: {
    pageBg: '#f7f0e2',
    surfaceBg: '#fffaf0',
    subtleBg: '#efe4ce',
    border: '#d3bc96',
    accentBorder: '#8c5828',
    titleText: '#6b1d12',
    accentText: '#92400e',
    primaryText: '#1f140c',
    secondaryText: '#3b2616',
    mutedText: '#664933',
    badgeBg: '#f2e2c4',
    badgeText: '#6b1d12',
    badgeBorder: '#b58d52',
    wildcardBg: '#7f1d1d',
    wildcardText: '#fef3c7',
    wildcardBorder: '#b45309',
  },
  grimorio: {
    pageBg: '#0c0a09',
    surfaceBg: '#141210',
    subtleBg: '#1c1917',
    border: '#332b24',
    accentBorder: '#92400e',
    titleText: '#fde68a',
    accentText: '#f59e0b',
    primaryText: '#f5f5f4',
    secondaryText: '#d6d3d1',
    mutedText: '#a8a29e',
    badgeBg: '#451a03',
    badgeText: '#fef08a',
    badgeBorder: '#b45309',
    wildcardBg: '#d97706',
    wildcardText: '#0c0a09',
    wildcardBorder: '#fcd34d',
  },
};

export const FALLBACK_PDF_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231c1917'/%3E%3Cpath d='M200 60 L240 120 L310 130 L260 180 L270 250 L200 210 L130 250 L140 180 L90 130 L160 120 Z' fill='%23d97706' fill-opacity='0.25' stroke='%23d97706' stroke-width='3'/%3E%3Ccircle cx='200' cy='155' r='45' fill='%23292524' stroke='%23f59e0b' stroke-width='2'/%3E%3Cpath d='M185 150 Q200 130 215 150 Q200 185 185 150' fill='%23f59e0b'/%3E%3Ctext x='200' y='275' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23a8a29e' text-anchor='middle'%3ESWADE BESTIARY%3C/text%3E%3C/svg%3E";

const StatBlock: React.FC<{
  title: string;
  palette: Palette;
  children: React.ReactNode;
}> = ({ title, palette, children }) => (
  <div style={{ marginBottom: '12px' }}>
    <h4
      className="font-cinzel"
      style={{
        fontSize: '12px',
        fontWeight: 700,
        color: palette.titleText,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderBottom: `1.5px solid ${palette.accentBorder}`,
        paddingBottom: '3px',
        marginBottom: '6px',
      }}
    >
      {title}
    </h4>
    <div style={{ color: palette.secondaryText, fontSize: '11.5px', lineHeight: 1.45 }}>
      {children}
    </div>
  </div>
);

export const SimpleListItem: React.FC<{
  monster: Monster;
  pdfTheme?: PdfTheme;
}> = ({ monster, pdfTheme = 'parchment' }) => {
  const palette = PALETTES[pdfTheme];
  return (
    <div
      style={{
        padding: '10px 12px',
        marginBottom: '8px',
        breakInside: 'avoid',
        backgroundColor: palette.surfaceBg,
        border: `1px solid ${palette.border}`,
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
          gap: '6px',
        }}
      >
        <h3
          className="font-cinzel"
          style={{
            fontWeight: 700,
            color: palette.titleText,
            fontSize: '13px',
            margin: 0,
          }}
        >
          {monster.name}
        </h3>
        <span
          className="font-cinzel"
          style={{
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: monster.isWildCard ? palette.wildcardBg : palette.subtleBg,
            color: monster.isWildCard ? palette.wildcardText : palette.mutedText,
            border: `1px solid ${monster.isWildCard ? palette.wildcardBorder : palette.border}`,
            whiteSpace: 'nowrap',
          }}
        >
          {monster.isWildCard ? 'CARTA SELVAGEM' : 'EXTRA'}
        </span>
      </div>
      <p
        className="font-mono-dice"
        style={{
          fontSize: '11px',
          color: palette.primaryText,
          margin: '0 0 3px 0',
        }}
      >
        <strong>Aparar:</strong> {monster.parry} | <strong>Resistência:</strong> {monster.toughness} |{' '}
        <strong>Mov.:</strong> {monster.movement}
      </p>
      <p style={{ fontSize: '10.5px', color: palette.mutedText, margin: 0 }}>
        <strong>Perícias:</strong> {(monster.skills || []).slice(0, 5).join(', ') || '—'}
      </p>
    </div>
  );
};

export const CompleteSheet: React.FC<{
  monster: Monster;
  pdfTheme?: PdfTheme;
  hideSecrets?: boolean;
}> = ({ monster, pdfTheme = 'parchment', hideSecrets = false }) => {
  const palette = PALETTES[pdfTheme];
  const exportDate = new Date().toLocaleDateString('pt-BR');

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        backgroundColor: palette.pageBg,
        color: palette.primaryText,
        padding: '12mm',
        position: 'relative',
      }}
    >
      {/* Double-framed outer border */}
      <div
        style={{
          border: `2px solid ${palette.accentBorder}`,
          borderRadius: '10px',
          padding: '10mm',
          minHeight: '273mm',
          boxSizing: 'border-box',
          backgroundColor: palette.pageBg,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: `2px solid ${palette.accentBorder}`,
              paddingBottom: '12px',
              marginBottom: '16px',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1 }}>
              <h2
                className="font-cinzel"
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: palette.titleText,
                  letterSpacing: '0.03em',
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {monster.name}
              </h2>
              <p
                className="font-crimson"
                style={{
                  color: palette.mutedText,
                  fontSize: '15px',
                  fontStyle: 'italic',
                  margin: '4px 0 0 0',
                }}
              >
                {monster.archetype} • {monster.race}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                {monster.rank && (
                  <span
                    className="font-cinzel"
                    style={{
                      display: 'inline-block',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      backgroundColor: palette.badgeBg,
                      color: palette.badgeText,
                      border: `1px solid ${palette.badgeBorder}`,
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {monster.rank}
                  </span>
                )}
                <span
                  className="font-cinzel"
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: monster.isWildCard ? palette.wildcardBg : palette.subtleBg,
                    color: monster.isWildCard ? palette.wildcardText : palette.secondaryText,
                    border: `1px solid ${monster.isWildCard ? palette.wildcardBorder : palette.border}`,
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {monster.isWildCard ? '★ CARTA SELVAGEM' : 'EXTRA'}
                </span>
              </div>
              <div
                className="font-cinzel"
                style={{
                  fontSize: '10.5px',
                  color: palette.mutedText,
                  marginTop: '5px',
                }}
              >
                {sourcebookLabel(monster.sourcebook)}
              </div>
            </div>
          </div>

          {/* Portrait & Vitals + History */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '16px',
              marginBottom: '18px',
            }}
          >
            <div>
              <div
                style={{
                  width: '100%',
                  height: '205px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `2px solid ${palette.accentBorder}`,
                  backgroundColor: palette.subtleBg,
                }}
              >
                <img
                  src={monster.imageUrl || FALLBACK_PDF_IMAGE}
                  alt={monster.name}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
              {/* Vitals */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  backgroundColor: palette.surfaceBg,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                  textAlign: 'center',
                }}
              >
                <div>
                  <div className="font-cinzel" style={{ fontSize: '9.5px', color: palette.mutedText, textTransform: 'uppercase' }}>
                    Aparar
                  </div>
                  <div className="font-mono-dice" style={{ fontSize: '18px', fontWeight: 700, color: palette.accentText }}>
                    {monster.parry}
                  </div>
                </div>
                <div>
                  <div className="font-cinzel" style={{ fontSize: '9.5px', color: palette.mutedText, textTransform: 'uppercase' }}>
                    Resistência
                  </div>
                  <div className="font-mono-dice" style={{ fontSize: '18px', fontWeight: 700, color: palette.accentText }}>
                    {monster.toughness}
                  </div>
                </div>
                <div>
                  <div className="font-cinzel" style={{ fontSize: '9.5px', color: palette.mutedText, textTransform: 'uppercase' }}>
                    Mov.
                  </div>
                  <div className="font-mono-dice" style={{ fontSize: '16px', fontWeight: 700, color: palette.accentText }}>
                    {monster.movement}
                  </div>
                </div>
                <div>
                  <div className="font-cinzel" style={{ fontSize: '9.5px', color: palette.mutedText, textTransform: 'uppercase' }}>
                    Tamanho
                  </div>
                  <div className="font-mono-dice" style={{ fontSize: '18px', fontWeight: 700, color: palette.accentText }}>
                    {monster.size ?? 0}
                  </div>
                </div>
              </div>

              {/* History Box */}
              <div
                className="font-crimson"
                style={{
                  backgroundColor: palette.surfaceBg,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                  flexGrow: 1,
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: palette.secondaryText,
                  lineHeight: 1.45,
                }}
              >
                {hideSecrets
                  ? 'História e segredos ocultos na edição para jogadores.'
                  : `"${monster.history || 'Sem registros históricos adicionais.'}"`}
              </div>
            </div>
          </div>

          {/* Attributes, Skills and Abilities Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <StatBlock title="Atributos SWADE" palette={palette}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '6px',
                    backgroundColor: palette.surfaceBg,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  {[
                    { label: 'Agilidade', val: monster.attributes.agility },
                    { label: 'Astúcia', val: monster.attributes.cunning },
                    { label: 'Espírito', val: monster.attributes.spirit },
                    { label: 'Força', val: monster.attributes.strength },
                    { label: 'Vigor', val: monster.attributes.vigor },
                  ].map((attr) => (
                    <div
                      key={attr.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 6px',
                        backgroundColor: palette.subtleBg,
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: palette.mutedText, fontSize: '11px' }}>
                        {attr.label}:
                      </span>
                      <span className="font-mono-dice" style={{ fontWeight: 700, color: palette.accentText, fontSize: '12px' }}>
                        {attr.val}
                      </span>
                    </div>
                  ))}
                </div>
              </StatBlock>

              <StatBlock title="Perícias" palette={palette}>
                <div
                  className="font-mono-dice"
                  style={{
                    backgroundColor: palette.surfaceBg,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                    fontSize: '11px',
                    lineHeight: 1.5,
                    color: palette.primaryText,
                  }}
                >
                  {(monster.skills || []).join(', ') || 'Nenhuma perícia listada.'}
                </div>
              </StatBlock>

              {monster.weapons && (
                <StatBlock title="Armas & Ataques" palette={palette}>
                  <div
                    style={{
                      backgroundColor: palette.surfaceBg,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    {monster.weapons}
                  </div>
                </StatBlock>
              )}

              {monster.equipment && (
                <StatBlock title="Equipamentos" palette={palette}>
                  <div
                    style={{
                      backgroundColor: palette.surfaceBg,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    {monster.equipment}
                  </div>
                </StatBlock>
              )}
            </div>

            <div>
              <StatBlock title="Habilidades Especiais" palette={palette}>
                {(monster.abilities || []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {monster.abilities.map((ability) => (
                      <div
                        key={ability.name}
                        style={{
                          borderLeft: `3px solid ${palette.accentBorder}`,
                          backgroundColor: palette.surfaceBg,
                          padding: '6px 9px',
                          borderRadius: '0 6px 6px 0',
                        }}
                      >
                        <strong className="font-cinzel" style={{ color: palette.titleText }}>
                          {ability.name}:{' '}
                        </strong>
                        <span style={{ color: palette.secondaryText }}>{ability.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: palette.mutedText, fontStyle: 'italic' }}>Nenhuma habilidade especial.</p>
                )}
              </StatBlock>

              {monster.advantages && monster.advantages.length > 0 && (
                <StatBlock title="Vantagens" palette={palette}>
                  <div
                    style={{
                      backgroundColor: palette.surfaceBg,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    {monster.advantages.join(', ')}
                  </div>
                </StatBlock>
              )}

              {monster.complications && monster.complications.length > 0 && (
                <StatBlock title="Complicações" palette={palette}>
                  <div
                    style={{
                      backgroundColor: palette.surfaceBg,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    {monster.complications.join(', ')}
                  </div>
                </StatBlock>
              )}

              {monster.powers && (
                <StatBlock title="Poderes Arcanos" palette={palette}>
                  <div
                    style={{
                      backgroundColor: palette.surfaceBg,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    {monster.powers}
                  </div>
                </StatBlock>
              )}
            </div>
          </div>
        </div>

        {/* Footer watermark */}
        <div
          className="font-cinzel"
          style={{
            marginTop: '16px',
            paddingTop: '10px',
            borderTop: `1px solid ${palette.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9.5px',
            color: palette.mutedText,
          }}
        >
          <span>Bestiário de Lendas • Savage Worlds Edição Aventura (SWADE)</span>
          <span>Exportado em {exportDate}</span>
        </div>
      </div>
    </div>
  );
};

export const MonsterCardFront: React.FC<{
  monster: Monster;
  pdfTheme?: PdfTheme;
  hideSecrets?: boolean;
}> = ({ monster, pdfTheme = 'parchment', hideSecrets = false }) => {
  const palette = PALETTES[pdfTheme];
  return (
    <div
      className="card-front"
      style={{
        width: '70mm',
        height: '120mm',
        boxSizing: 'border-box',
        backgroundColor: palette.pageBg,
        color: palette.primaryText,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: `2px solid ${palette.accentBorder}`,
        borderRadius: '8px',
      }}
    >
      <div style={{ height: '60%', width: '100%', overflow: 'hidden', backgroundColor: palette.subtleBg }}>
        <img
          src={monster.imageUrl || FALLBACK_PDF_IMAGE}
          alt={monster.name}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <div
        style={{
          padding: '10px',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: palette.surfaceBg,
          borderTop: `1.5px solid ${palette.accentBorder}`,
        }}
      >
        <div>
          <h2
            className="font-cinzel"
            style={{
              fontWeight: 700,
              fontSize: '14px',
              color: palette.titleText,
              letterSpacing: '0.03em',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {monster.name}
          </h2>
          <p
            className="font-crimson"
            style={{
              color: palette.mutedText,
              fontSize: '11px',
              textAlign: 'center',
              fontStyle: 'italic',
              margin: '2px 0 0 0',
            }}
          >
            {monster.archetype} • {monster.race}
          </p>
        </div>
        <p
          className="font-crimson"
          style={{
            color: palette.secondaryText,
            fontSize: '10px',
            lineHeight: 1.3,
            fontStyle: 'italic',
            margin: '4px 0',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {hideSecrets ? 'Segredos e histórico ocultos para jogadores.' : monster.history}
        </p>
        <div
          className="font-cinzel"
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: palette.accentText,
            textAlign: 'center',
            paddingTop: '4px',
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          {monster.isWildCard ? '★ CARTA SELVAGEM' : 'EXTRA'}
        </div>
      </div>
    </div>
  );
};

export const MonsterCardBack: React.FC<{
  monster: Monster;
  pdfTheme?: PdfTheme;
}> = ({ monster, pdfTheme = 'parchment' }) => {
  const palette = PALETTES[pdfTheme];
  return (
    <div
      className="card-back"
      style={{
        width: '70mm',
        height: '120mm',
        boxSizing: 'border-box',
        backgroundColor: palette.pageBg,
        color: palette.primaryText,
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${palette.accentBorder}`,
        borderRadius: '8px',
        fontSize: '11px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1.5px solid ${palette.accentBorder}`,
          paddingBottom: '5px',
          marginBottom: '8px',
          gap: '6px',
        }}
      >
        <h2
          className="font-cinzel"
          style={{
            fontWeight: 700,
            color: palette.titleText,
            fontSize: '12.5px',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {monster.name}
        </h2>
        <span
          className="font-mono-dice"
          style={{ fontSize: '9.5px', fontWeight: 700, color: palette.accentText, whiteSpace: 'nowrap' }}
        >
          Ap {monster.parry} | Res {monster.toughness}
        </span>
      </div>

      <div
        className="font-mono-dice"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          marginBottom: '8px',
          fontSize: '10px',
          backgroundColor: palette.surfaceBg,
          border: `1px solid ${palette.border}`,
          padding: '6px',
          borderRadius: '6px',
        }}
      >
        <div>Agi: <strong>{monster.attributes.agility}</strong></div>
        <div>Esp: <strong>{monster.attributes.cunning}</strong></div>
        <div>Espír: <strong>{monster.attributes.spirit}</strong></div>
        <div>For: <strong>{monster.attributes.strength}</strong></div>
        <div>Vig: <strong>{monster.attributes.vigor}</strong></div>
        <div>Mov: <strong>{monster.movement}</strong></div>
      </div>

      <div style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          className="font-mono-dice"
          style={{
            fontSize: '9.5px',
            color: palette.secondaryText,
            backgroundColor: palette.surfaceBg,
            border: `1px solid ${palette.border}`,
            padding: '5px 6px',
            borderRadius: '5px',
          }}
        >
          <strong>Perícias:</strong> {(monster.skills || []).slice(0, 5).join(', ')}
        </div>

        {monster.weapons && (
          <div
            style={{
              fontSize: '9.5px',
              color: palette.secondaryText,
              backgroundColor: palette.surfaceBg,
              border: `1px solid ${palette.border}`,
              padding: '5px 6px',
              borderRadius: '5px',
            }}
          >
            <strong className="font-cinzel" style={{ color: palette.titleText }}>Armas: </strong>
            {monster.weapons}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '9.5px',
            paddingTop: '5px',
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          {(monster.abilities || []).slice(0, 4).map((ability) => (
            <div key={ability.name} style={{ lineHeight: 1.3 }}>
              <strong className="font-cinzel" style={{ color: palette.titleText }}>
                {ability.name}:{' '}
              </strong>
              <span style={{ color: palette.mutedText }}>{ability.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
