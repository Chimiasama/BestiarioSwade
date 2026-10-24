import { GoogleGenAI } from "@google/genai";
import { MonsterAbility } from "../types";

const getApiKey = (): string | undefined => {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    (typeof window !== "undefined" && (window as any).__GEMINI_API_KEY__) ||
    ""
  );
};

export const isAiConfigured = (): boolean => {
  return Boolean(getApiKey());
};

const getAiClient = () => {
  const key = getApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

// Evocative generator for offline use or when no API key is set
const generateOfflineLore = (details: { name: string; race: string; archetype: string; abilities: string }): string => {
  const intros = [
    `Das lendas mais obscuras e sussurradas ao redor das fogueiras de aventureiros, ${details.name} surge como um verdadeiro pesadelo vivo.`,
    `Relatos antigos em tomos esquecidos descrevem ${details.name} como uma anomalia forjada nas fronteiras entre a realidade e o sobrenatural.`,
    `Poucos sobreviveram para contar a história de um encontro com ${details.name}; os que escaparam carregam cicatrizes na mente e na carne.`,
    `Nascido da tragédia, maldição ou rituais proibidos, ${details.name} vaga pelas terras desoladas caçando aqueles tolos o bastante para cruzar seu caminho.`
  ];
  const mid = [
    `Portando a essência de um ${details.archetype} da raça ${details.race || 'desconhecida'}, ele domina o campo de batalha com astúcia selvagem e violência calculada.`,
    `Seus movimentos desafiam a lógica e sua presença congela a coragem dos guerreiros mais experientes.`,
    `Marcado por poderes como ${details.abilities || 'garras e ferocidade'}, transforma qualquer expedição incauta em um massacre sanguinário.`
  ];
  const conclusions = [
    `Em Savage Worlds, enfrentá-lo exige mais do que meras lâminas: exige coragem inabalável, planejamento tático e talvez uma boa dose de Benesses para escapar da cova.`,
    `Guerreiros prudentes evitam seu covil a qualquer custo; os imprudentes servem de adubo para sua lenda.`,
    `Diz-se que a única fraqueza dessa monstruosidade reside naquilo que causou sua própria ruína séculos atrás.`
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(intros)} ${pick(mid)} ${pick(conclusions)}`;
};

export const generateMonsterStory = async (monsterDetails: {
  name: string;
  archetype: string;
  race: string;
  abilities: string;
  skills: string;
  weapons?: string;
  toughness: string;
  attributes: { agility: string; strength: string; vigor: string };
}): Promise<string> => {
  const ai = getAiClient();

  if (!ai) {
    // Generate an authentic thematic SWADE lore offline
    return generateOfflineLore({
      name: monsterDetails.name,
      race: monsterDetails.race,
      archetype: monsterDetails.archetype,
      abilities: monsterDetails.abilities,
    });
  }

  const prompt = `
    Você é um escritor sênior de RPG para o sistema Savage Worlds Edição Aventura (SWADE).
    Crie uma história/origem atmosférica, envolvente e compacta para um monstro de RPG.
    O tom deve ser pulp, fantástico, sombrio e emocionante no lema de Savage Worlds: "Rápido! Furioso! Divertido!".
    Retorne apenas 1 ou 2 parágrafos de alta qualidade em português do Brasil, prontos para a leitura do Mestre de Jogo.
    Sem títulos, sem markdown de cabeçalho, apenas o texto do bestiário.

    Nome do Monstro: ${monsterDetails.name}
    Raça: ${monsterDetails.race}
    Arquétipo: ${monsterDetails.archetype}
    Habilidades Notáveis: ${monsterDetails.abilities}
    Perícias Chave: ${monsterDetails.skills}
    Resistência: ${monsterDetails.toughness}
    Atributos: Agilidade ${monsterDetails.attributes.agility}, Força ${monsterDetails.attributes.strength}, Vigor ${monsterDetails.attributes.vigor}
    Armas/Ataques: ${monsterDetails.weapons || 'Armas naturais'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      return generateOfflineLore(monsterDetails);
    }

    return text.trim();
  } catch (error) {
    console.warn("AI generation failed, using thematic fallback lore:", error);
    return generateOfflineLore(monsterDetails);
  }
};

export const generateMonsterAbilities = async (
  name: string,
  archetype: string,
  race: string
): Promise<MonsterAbility[]> => {
  const ai = getAiClient();

  // Fallbacks if AI is not available
  const defaultAbilities: Record<string, MonsterAbility[]> = {
    Soldier: [
      { name: "Disciplina de Ferro", description: "+2 para resistir a Intimidação e Provocação." },
      { name: "Ataque Coordenado", description: "Ganha +1 em rolagens de Lutar quando adjacente a um aliado." }
    ],
    Brute: [
      { name: "Fúria Primitiva", description: "Ignora 1 ponto de penalidade de Ferimento quando enfurecido." },
      { name: "Pancada Brutal", description: "Com uma ampliação na rolagem de Lutar, o alvo deve fazer teste de Força ou é derrubado." }
    ],
    Sharpshooter: [
      { name: "Disparo Mortal", description: "Se mirar por 1 rodada, adiciona +4 de dano no próximo ataque à distância." },
      { name: "Furtividade das Sombras", description: "Recebe +2 em testes de Furtividade em cobertura leve." }
    ],
    "Shadow Mage": [
      { name: "Passo Sombrio", description: "Pode se teleportar até 6 quadros entre duas sombras como ação livre." },
      { name: "Toque Enervante", description: "Ataque de toque força o alvo a testar Vigor ou sofrer 1 nível de Fadiga." }
    ],
    Beast: [
      { name: "Instinto Predatório", description: "Rola d10 para correr em vez do dado comum e ganha +2 para rastrear cheiros." },
      { name: "Bote", description: "Pode se mover sua Movimentação total e ainda atacar com garras com +2 no dano." }
    ],
    Elemental: [
      { name: "Corpo Energético", description: "Imune a venenos, doenças e sono. Dano normal apenas por elementos opostos." },
      { name: "Aura Perigosa", description: "Inimigos adjacentes sofrem 2d4 de dano no início de cada turno." }
    ],
    Undead: [
      { name: "Destemido", description: "Imune a Medo e Intimidação." },
      { name: "Morto-Vivo", description: "+2 Resistência; +2 para recuperar de Abalado; ignora 1 ponto de penalidade por Ferimentos; não respira." }
    ]
  };

  if (!ai) {
    return defaultAbilities[archetype] || [
      { name: "Aparência Aterrorizante", description: "Gera um teste de Medo (-2) ao ser avistado pela primeira vez." },
      { name: "Ataque Feroz", description: "Causa dano adicional ao atingir com uma ampliação." }
    ];
  }

  const prompt = `
    Você é um designer de regras para Savage Worlds Edição Aventura (SWADE).
    Crie 2 habilidades especiais únicas e equilibradas em português para o seguinte monstro:
    Nome: ${name}
    Raça: ${race}
    Arquétipo: ${archetype}

    Responda em formato estritamente JSON como uma lista de objetos:
    [
      { "name": "Nome da Habilidade", "description": "Descrição com regras no estilo SWADE." },
      { "name": "Nome da Habilidade 2", "description": "Descrição com regras no estilo SWADE." }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || "";
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return defaultAbilities[archetype] || [
      { name: "Aparência Aterrorizante", description: "Gera um teste de Medo (-2) ao ser avistado pela primeira vez." }
    ];
  }
};
