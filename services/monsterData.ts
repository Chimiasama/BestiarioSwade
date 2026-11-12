import { Monster } from '../types';

export const monsters: Monster[] = [
  // ==========================================
  // 🇧🇷 LENDAS BRASILEIRAS & FOLCLORE
  // ==========================================
  {
    id: "1",
    name: "Loira do Banheiro",
    race: "Humano",
    archetype: "Fantasma do Banheiro",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80",
    attributes: {
      agility: "d6",
      cunning: "d6",
      spirit: "d12",
      strength: "d4",
      vigor: "d12",
    },
    skills: [
      "Atletismo d12", "Furtividade d12+4", "Intimidar d12+2", "Ladinagem d4",
      "Lutar d8", "Ocultismo d6", "Perceber d12+2", "Performance d4", "Provocar d12",
    ],
    movement: "8",
    parry: 6,
    toughness: "8",
    abilities: [
      { name: "Destemida", description: "Imune a Medo e Intimidação." },
      { name: "Etéreo", description: "Fantasmas são imateriais e só podem ser feridos por ataques mágicos." },
      { name: "Invisível", description: "Normalmente fica invisível (até ser convocada)." },
      { name: "Medo -3", description: "Provoca testes de Medo com -3 quando deixam alguém vê-la." },
      { name: "Convocada", description: "Aparece após ser chamada três vezes em frente a um espelho de escola." }
    ],
    advantages: ["Rápida", "Prontidão", "Noção do Perigo"],
    complications: ["Sensível (menor)", "Feia (maior)"],
    history: "A lenda urbana mais famosa do Brasil. Uma jovem forçada a um casamento infeliz que morreu misteriosamente em Paris. Seu espírito agora assombra os espelhos dos banheiros escolares com lamentos gélidos.",
    sourcebook: "Lendas Brasileiras"
  },
  {
    id: "2",
    name: "Chupacabra Brasileiro",
    race: "Criptídeo",
    archetype: "Criatura misteriosa",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    attributes: {
      agility: "d12",
      cunning: "d8",
      spirit: "d8",
      strength: "d6",
      vigor: "d12",
    },
    skills: ["Atletismo d12+1", "Ciências d8", "Furtividade d12+3", "Lutar d8", "Perceber d12+2", "Psiônico d12+2", "Sobrevivência d12+2"],
    movement: "10",
    parry: 6,
    toughness: "7",
    size: -1,
    abilities: [
      { name: "Garras/Mordida", description: "For+d4." },
      { name: "Visão no Escuro", description: "Sem penalidades por penumbra ou escuridão." },
      { name: "Saltador", description: "Dobra as distâncias feitas com salto." },
      { name: "Andar nas Paredes", description: "Movimentação normal em escaladas." },
      { name: "Irrastreável", description: "Aqueles que tentam rastreá-lo recebem -2 no teste." }
    ],
    advantages: ["AA Psiônico", "Corredor", "Acrobata", "Frenesi Aprimorado", "Reflexos em Combate"],
    complications: ["Canibal compulsivo: adora sangue (maior)"],
    powers: "Invisibilidade (borrão), Deflexão (borrão), Silêncio, Visão Distante.",
    history: "Uma criatura enigmática de olhos vermelhos flamejantes responsável por ataques a animais rurais. Deixa carcaças drenadas com perfurações cirúrgicas e desaparece nas matas sem deixar pegadas.",
    sourcebook: "Lendas Brasileiras"
  },
  {
    id: "3",
    name: "Boneco Maldito do Fofão",
    race: "Constructo",
    archetype: "Boneco Possuído",
    isWildCard: true,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
    attributes: {
      agility: "d8",
      cunning: "d6",
      spirit: "d8",
      strength: "d4",
      vigor: "d8",
    },
    skills: ["Atletismo d8", "Furtividade d12", "Intimidar d12", "Lutar d8", "Ocultismo d8", "Perceber d8", "Provocar d10"],
    movement: "8",
    parry: 6,
    toughness: "4",
    size: -2,
    abilities: [
      { name: "Visão no Escuro", description: "Sem penalidades por penumbra ou escuridão." },
      { name: "Destemido", description: "Imune a Medo e Intimidação." },
      { name: "Medo -1", description: "Provoca testes de Medo com -1 quando alguém vê-lo se movendo." },
      { name: "Constructo", description: "+2 para se recuperar de Abalado; Sem dano adicional por Ataques Precisos; Imune a venenos e doenças." }
    ],
    advantages: ["Corredor", "Rápido"],
    complications: ["Sanguinário (maior)", "Incapaz de sentir cheiros", "Fraqueza: Fogo (+2 de Dano por Fogo)"],
    weapons: "Punhal negro de plástico rígido (For+d4)",
    history: "Uma lenda urbana que aterrorizou os anos 80. O boneco de bochechas volumosas escondia uma adaga pontiaguda de plástico em seu peito, ganhando vida quando as luzes dos quartos se apagavam.",
    sourcebook: "Lendas Brasileiras"
  },
  {
    id: "4",
    name: "Pisadeira",
    race: "Criatura sobrenatural",
    archetype: "Personificação de Pesadelos",
    isWildCard: true,
    rank: "Heroico",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    attributes: {
      agility: "d10",
      cunning: "d12",
      spirit: "d12",
      strength: "d12",
      vigor: "d8",
    },
    skills: ["Atletismo d10", "Furtividade d12+4", "Intimidar d12+2", "Lutar d8", "Conjurar d12+1", "Ocultismo d10", "Perceber d12"],
    movement: "8",
    parry: 6,
    toughness: "6",
    abilities: [
      { name: "Invasora de Sonhos", description: "Pisa no peito de quem dorme de estômago cheio, causando paralisia do sono e asfixia sobrenatural." },
      { name: "Aparência Medonha", description: "Velha esquelética de unhas aduncas, gargalhada estridente e olhos que reluzem na penumbra." },
      { name: "Peso Descomunal", description: "Apesar do aspecto frágil, seu peso se multiplica tornando impossível empurrá-la sem teste oposto de Força." }
    ],
    advantages: ["AA Magia", "Concentração", "Recarga Rápida", "Corredor", "Acrobata", "Ladrão"],
    complications: ["Hábito: se alimenta do medo e pesadelos (maior)", "Feia (maior)"],
    powers: "Invisibilidade, Silêncio, Som, Atordoar, Sono, Ocultar Arcano, Andar nas Paredes, Medo, Obscurecer.",
    weapons: "Unhas grandes e curvas (For+d4)",
    history: "A personificação do terror noturno. Ronda telhados de vilarejos e cidades durante a madrugada, espreitando pelas frestas para esmagar o fôlego dos desavisados.",
    sourcebook: "Lendas Brasileiras"
  },
  {
    id: "fol-br-5",
    name: "Curupira",
    race: "Espírito da Mata",
    archetype: "Guardião da Floresta",
    isWildCard: true,
    rank: "Heroico",
    imageUrl: "https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d12", cunning: "d10", spirit: "d10", strength: "d10", vigor: "d10" },
    skills: ["Atletismo d12", "Furtividade d12+2", "Lutar d10", "Perceber d12", "Sobrevivência d12+2", "Provocar d10"],
    movement: "8",
    parry: 7,
    toughness: "7",
    size: -1,
    abilities: [
      { name: "Pés Virados", description: "Suas pegadas apontam no sentido oposto ao seu movimento; rastreá-lo impõe penalidade de -4 no teste de Sobrevivência." },
      { name: "Ilusão das Matas", description: "Cria assobios e ventania para desnortear caçadores gananciosos, fazendo-os se perderem para sempre." },
      { name: "Comunicação com Feras", description: "Comanda animais e insetos da mata nativa para atacar invasores." }
    ],
    advantages: ["Ligeiro", "Terreno Predileto (Mata)", "Prontidão", "Reflexos de Combate"],
    complications: ["Código de Honra (Defender a Natureza e Criaturas Pequenas)"],
    weapons: "Montado em um Caititu ou Queixada selvagem, Golpe Físico (For+d6)",
    history: "Entidade protetora das florestas brasileiras. Um anão de cabelos de fogo e pés virados para trás que pune impiedosamente caçadores que destroem as matas ou matam por ganância.",
    sourcebook: "Lendas Brasileiras"
  },
  {
    id: "fol-br-6",
    name: "Saci-Pererê",
    race: "Entidade Feérica",
    archetype: "Espírito Travesso",
    isWildCard: true,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d12+1", cunning: "d8", spirit: "d10", strength: "d4", vigor: "d8" },
    skills: ["Atletismo d12", "Furtividade d12+2", "Ladinagem d10", "Perceber d10", "Provocar d12", "Atirar d8"],
    movement: "8",
    parry: 6,
    toughness: "5",
    size: -1,
    abilities: [
      { name: "Redemoinho de Vento", description: "Desloca-se dentro de um redemoinho de poeira e folhas. Pode se teletransportar até 12 quadros." },
      { name: "Gorro Vermelho Mágico", description: "Seu gorro concede poderes sobrenaturais. Se removido, o Saci perde sua magia até recuperá-lo." },
      { name: "Travessuras Profanas", description: "Trança crinas de cavalos, azeda o leite e esconde pertences causando Estado Distraído a todos ao redor." }
    ],
    advantages: ["Rápido", "Acrobata", "Esquiva Aprimorada"],
    complications: ["Hábito (Fazer travessuras constantes)", "Perna Única (Compensada pela Magia)"],
    weapons: "Cachimbo de barro com brasas arremessáveis (For+d4)",
    history: "Menino negro de uma perna só que usa um gorro vermelho mágico e fuma cachimbo. Mestre dos ventos e das peças pregadas em viajantes nas fazendas do interior.",
    sourcebook: "Lendas Brasileiras"
  },

  // ==========================================
  // ⚔️ LIVRO BÁSICO (SWADE CORE RULES)
  // ==========================================
  {
    id: "sw-1",
    name: "Soldado",
    race: "Humano",
    archetype: "Combatente de Linha",
    isWildCard: false,
    rank: "Novato",
    imageUrl: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d4", spirit: "d6", strength: "d6", vigor: "d6" },
    skills: ["Atirar d6", "Atletismo d6", "Conhecimento Geral d6", "Furtividade d4", "Intimidar d6", "Lutar d6", "Perceber d6", "Persuadir d6"],
    movement: "6",
    parry: 5,
    toughness: "6 (1)",
    abilities: [],
    advantages: ["Soldado"],
    weapons: "Espada Curta (For+d6) ou Mosquete (2d8, Alcance 10/20/40), Armadura de Couro (+1)",
    history: "Milicianos, guardas da guarnição ou mercenários de infantaria treinados em táticas de esquadrão. Atuam como capangas coordenados sob ordens de capitães.",
    sourcebook: "Core Rules"
  },
  {
    id: "sw-2",
    name: "Zumbi",
    race: "Morto-Vivo",
    archetype: "Cadáver Ambulante",
    isWildCard: false,
    rank: "Novato",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d4", spirit: "d4", strength: "d6", vigor: "d6" },
    skills: ["Atirar d6", "Atletismo d4", "Intimidar d6", "Lutar d6", "Perceber d4"],
    movement: "4",
    parry: 5,
    toughness: "7",
    abilities: [
      { name: "Destemido", description: "Imune a Medo e Intimidação." },
      { name: "Mordida/Garras", description: "For." },
      { name: "Morto-Vivo", description: "+2 Resistência; +2 para se recuperar de Abalado; ignora 1 ponto de penalidades por Ferimentos; não respira; imune a doenças e veneno." },
      { name: "Fraqueza (Cabeça)", description: "Ataques Localizados na cabeça causam +4 de dano." }
    ],
    weapons: "Unhas podres e dentes (For)",
    history: "Cadáveres reanimados por necromancia ou pragas profanas. Lentos e cambaleantes, tornam-se avassaladores quando cercam alvos em hordas famintas.",
    sourcebook: "Core Rules"
  },
  {
    id: "sw-3",
    name: "Esqueleto",
    race: "Morto-Vivo",
    archetype: "Guerreiro Ósseo",
    isWildCard: false,
    rank: "Novato",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d4", spirit: "d4", strength: "d6", vigor: "d6" },
    skills: ["Atirar d6", "Atletismo d6", "Intimidar d6", "Lutar d6", "Perceber d4"],
    movement: "7",
    parry: 5,
    toughness: "7",
    abilities: [
      { name: "Destemido", description: "Imune a Medo e Intimidação." },
      { name: "Garras", description: "For+d4." },
      { name: "Morto-Vivo", description: "+2 Resistência; +2 para se recuperar de Abalado; ignora 1 ponto de penalidades por Ferimentos; imune a doenças e veneno." },
      { name: "Ossos Rígidos", description: "Armas perfurantes causam metade do dano normal." }
    ],
    weapons: "Espada enferrujada (For+d6) ou Arco Curto (2d6)",
    history: "Restos mortais desprovidos de carne erguidos das catacumbas. Mais ágeis que zumbis comuns, marcham sem descanso em estrita obediência ao seu mestre.",
    sourcebook: "Core Rules"
  },
  {
    id: "sw-4",
    name: "Vampiro",
    race: "Morto-Vivo",
    archetype: "Cria da Noite",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d8", spirit: "d8", strength: "d12+1", vigor: "d10" },
    skills: ["Atirar d6", "Atletismo d8", "Conhecimento Geral d8", "Furtividade d10", "Intimidar d8", "Lutar d8", "Perceber d6", "Persuadir d8"],
    movement: "6",
    parry: 6,
    toughness: "9",
    abilities: [
      { name: "Invulnerabilidade", description: "Só pode ser destruído por luz solar ou estaca no coração. Sofre Abalado normalmente, mas não sofre Ferimentos por armas comuns." },
      { name: "Morto-Vivo", description: "+2 Resistência; +2 para recuperar de Abalado; ignora 1 ponto de Ferimento." },
      { name: "Dreno de Sangue", description: "Ao imobilizar uma presa, drena Vigor causando Fadiga acumulativa." },
      { name: "Fraquezas Sagradas", description: "Água benta, alho, símbolos sagrados e convite formal para entrar em lares." }
    ],
    advantages: ["Frenesi", "Focado"],
    weapons: "Presas & Garras Vampíricas (For+d4)",
    history: "Aristocratas da noite que se alimentam do sangue dos vivos. Sedutores e implacáveis caçadores, combinam inteligência milenar e força predatória sobre-humana.",
    sourcebook: "Core Rules"
  },
  {
    id: "sw-5",
    name: "Lobisomem",
    race: "Metamorfo",
    archetype: "Fera Amaldiçoada",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef6?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d6", spirit: "d6", strength: "d12+2", vigor: "d10" },
    skills: ["Atletismo d8", "Conhecimento Geral d8", "Furtividade d10", "Intimidar d10", "Lutar d12+2", "Perceber d12", "Sobrevivência d10"],
    movement: "8",
    parry: 9,
    toughness: "8",
    size: 1,
    abilities: [
      { name: "Infecção Licantrópica", description: "Vítimas derrotadas têm 50% de chance de contrair a maldição." },
      { name: "Infravisão", description: "Reduz pela metade as penalidades por penumbra contra alvos de sangue quente." },
      { name: "Medo (-2)", description: "Gela a espinha dos aventureiros com seu uivo sobrenatural." },
      { name: "Mordida/Garras", description: "For+d8." },
      { name: "Regeneração Rápida", description: "Faz teste de cura natural a cada rodada, a menos que ferido por Prata." }
    ],
    weapons: "Mandíbulas poderosas e garras rasgadoras (For+d8)",
    history: "Humanos afligidos pela maldição lunar. Sob a lua cheia, sua carne se rasga e se reconstrói em um predador ápice bípede tomado por fúria incontrolável.",
    sourcebook: "Core Rules"
  },
  {
    id: "sw-6",
    name: "Dragão",
    race: "Dragão",
    archetype: "Grande Serpente Alada",
    isWildCard: true,
    rank: "Lendário",
    imageUrl: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d8", spirit: "d10", strength: "d12+8", vigor: "d12" },
    skills: ["Atletismo d10", "Conhecimento Geral d6", "Furtividade d8", "Intimidar d12", "Lutar d10", "Perceber d12", "Persuadir d10"],
    movement: "8",
    parry: 7,
    toughness: "20 (4)",
    size: 8,
    abilities: [
      { name: "Armadura Natural +4", description: "Escamas impenetráveis como ferro forjado." },
      { name: "Esmagar", description: "Ignora até 4 pontos de penalidades por escala de tamanho ao golpear com as patas." },
      { name: "Golpe de Cauda", description: "For+d4; varre até dois inimigos em flancos traseiros." },
      { name: "Medo (-2)", description: "A imponência da criatura paralisa homens de armas." },
      { name: "Sopro Flamejante", description: "3d6 de dano de fogo em Modelo de Cone; alvos podem Evadir." },
      { name: "Robusto", description: "Não sofre Ferimento por sofrer Abalado duas vezes." },
      { name: "Voo", description: "Movimentação aérea de 24 quadros." }
    ],
    advantages: ["Frenesi Aprimorado", "Focado"],
    weapons: "Mordida devastadora (For+d8), Garras (For+d6), Cauda (For+d4)",
    history: "Monarcas ancestrais dos céus. Senhores de tesouros milenares, dotados de intelecto astuto e chamas capazes de derreter fortalezas inteiras.",
    sourcebook: "Core Rules"
  },
  {
    id: "sw-7",
    name: "Troll",
    race: "Gigante",
    archetype: "Monstro Regenerador",
    isWildCard: false,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d4", spirit: "d6", strength: "d12+2", vigor: "d10" },
    skills: ["Atletismo d6", "Conhecimento Geral d8", "Furtividade d4", "Intimidar d10", "Lutar d8", "Perceber d6"],
    movement: "7",
    parry: 6,
    toughness: "9 (1)",
    size: 1,
    abilities: [
      { name: "Armadura +1", description: "Pele grossa e verrugosa como casca de árvore." },
      { name: "Regeneração Rápida", description: "Cura ferimentos a cada rodada, exceto dano causado por fogo ou ácido." },
      { name: "Resiliente", description: "Pode receber um Ferimento antes de ser Incapacitado." }
    ],
    advantages: ["Brutamontes", "Varredura Aprimorada"],
    weapons: "Clava rústica com espinhos de osso (For+d8)",
    history: "Monstruosidades carnívoras que espreitam sob pontes abandonadas e cavernas musgosas. Seus músculos se fecham instantaneamente sobre cortes e flechas.",
    sourcebook: "Core Rules"
  },

  // ==========================================
  // 🏰 COMPÊNDIO DE FANTASIA (FANTASY COMPANION)
  // ==========================================
  {
    id: "ext-1",
    name: "Goblin",
    race: "Goblinóide",
    archetype: "Saqueador Pequeno",
    isWildCard: false,
    rank: "Novato",
    imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d6", spirit: "d4", strength: "d4", vigor: "d6" },
    skills: ["Atletismo d6", "Furtividade d10", "Intimidar d4", "Lutar d6", "Perceber d6", "Atirar d8", "Ladinagem d6"],
    movement: "6",
    parry: 5,
    toughness: "4",
    size: -1,
    abilities: [
      { name: "Infravisão", description: "Enxerga no escuro com precisão térmica." },
      { name: "Tamanho -1", description: "-1 em Resistência (já computado)." },
      { name: "Táticas de Bando", description: "Recebe +1 no ataque para cada aliado engajado no mesmo alvo." }
    ],
    weapons: "Lança curta dentada (For+d4), Arco curto (2d6, Alcance 12/24/48)",
    history: "Criaturas vis e ardilosas que habitam minas abandonadas. Covardes no mano a mano, compensam fraquezas físicas com emboscadas venenosas e superioridade numérica.",
    sourcebook: "Compêndio de Fantasia"
  },
  {
    id: "ext-2",
    name: "Ogro",
    race: "Gigante",
    archetype: "Brutamontes",
    isWildCard: false,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d4", spirit: "d6", strength: "d12+3", vigor: "d12" },
    skills: ["Atletismo d4", "Intimidar d10", "Lutar d8", "Perceber d4"],
    movement: "7",
    parry: 6,
    toughness: "11 (1)",
    size: 3,
    abilities: [
      { name: "Armadura Natural +1", description: "Couro encardido e musculatura maciça." },
      { name: "Tamanho +3", description: "Alvo grande (+2 em ataques direcionados a ele)." }
    ],
    advantages: ["Varredura"],
    weapons: "Tronco / Clava Gigante (For+d8)",
    history: "Humanoides imensos de temperamento violento e pouca inteligência. Atuam como aríetes vivos em exércitos de invasão, devorando qualquer um que fique pelo caminho.",
    sourcebook: "Compêndio de Fantasia"
  },
  {
    id: "ext-3",
    name: "Espectro (Wraith)",
    race: "Morto-Vivo",
    archetype: "Espírito Vingativo",
    isWildCard: false,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d10", cunning: "d6", spirit: "d8", strength: "d6", vigor: "d6" },
    skills: ["Furtividade d12", "Intimidar d10", "Lutar d8", "Perceber d8"],
    movement: "6",
    parry: 6,
    toughness: "5",
    abilities: [
      { name: "Etéreo", description: "Atravessa barreiras sólidas. Imune a dano não-mágico." },
      { name: "Toque Gélido", description: "For+d4; drena calor forçando teste de Vigor contra Fadiga." },
      { name: "Medo (-1)", description: "Sua aparição gélida aterroriza mortais." }
    ],
    weapons: "Toque drenador de almas (For+d4)",
    history: "Emanação sombria de alguém que morreu traído ou assassinado com rancor inextinguível. Desliza em silêncio absoluto para sugar o sopro de vida dos vivos.",
    sourcebook: "Compêndio de Fantasia"
  },
  {
    id: "ext-8",
    name: "Lich Ancestral",
    race: "Morto-Vivo",
    archetype: "Necromante Supremo",
    isWildCard: true,
    rank: "Lendário",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d12+2", spirit: "d10", strength: "d6", vigor: "d10" },
    skills: ["Conjurar d12+2", "Ocultismo d12+2", "Intimidar d12", "Lutar d8", "Perceber d10"],
    movement: "6",
    parry: 6,
    toughness: "13 (4)",
    abilities: [
      { name: "Morto-Vivo", description: "Imunidades clássicas de não-morto." },
      { name: "Armadura Mágica +4", description: "Campos de força necromânticos permanentes." },
      { name: "Toque Necrótico", description: "3d6 de dano necrótico ao toque." },
      { name: "Filactéria Imortal", description: "Se destruído, regenera um novo corpo junto ao seu relicário em 1d10 dias." }
    ],
    advantages: ["Mestre da Magia", "Alma Drenada"],
    powers: "Raio Necrótico, Barreira Espiritual, Voo, Reanimar Mortos, Dissipar, Teleporte.",
    weapons: "Cajado de Ébano (For+d4), Toque da Morte (3d6)",
    history: "Feiticeiros que trocaram sua humanidade pela imortalidade profana. Comandam legiões de mortos a partir de seus tronos em criptas milenares.",
    sourcebook: "Compêndio de Fantasia"
  },
  {
    id: "fan-11",
    name: "Quimera Mitológica",
    race: "Besta Mágica",
    archetype: "Monstro Tricefálico",
    isWildCard: true,
    rank: "Heroico",
    imageUrl: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d6", spirit: "d8", strength: "d12+4", vigor: "d10" },
    skills: ["Atletismo d8", "Intimidar d12", "Lutar d10", "Perceber d10"],
    movement: "8",
    parry: 7,
    toughness: "11 (2)",
    size: 2,
    abilities: [
      { name: "Três Cabeças", description: "Realiza três ações independentes de ataque por turno sem penalidade de ações múltiplas." },
      { name: "Sopro de Fogo", description: "A cabeça de bode expele chama concentrada em Modelo de Cone (3d6 de dano)." },
      { name: "Cauda de Serpente", description: "Garras do leão (For+d6), Chifres do bode (For+d6) e Veneno Paralisante da cauda de víbora." }
    ],
    weapons: "Patas de Leão (For+d6), Chifres de Bode (For+d6), Cauda de Serpente (For+d4)",
    history: "Abominação mítica composta por corpo e cabeça de leão, cabeça de bode brotando do dorso e cauda em forma de serpente peçonhenta.",
    sourcebook: "Compêndio de Fantasia"
  },

  // ==========================================
  // 👁️ COMPÊNDIO DE HORROR (HORROR COMPANION)
  // ==========================================
  {
    id: "fol-1",
    name: "Banshee",
    race: "Morto-Vivo",
    archetype: "Espírito Lamentoso",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d6", spirit: "d12", strength: "d6", vigor: "d8" },
    skills: ["Furtividade d10", "Intimidar d12", "Perceber d8", "Lutar d6"],
    movement: "6",
    parry: 5,
    toughness: "8",
    abilities: [
      { name: "Etéreo", description: "Imaterial; imune a armas físicas comuns." },
      { name: "Grito Fatídico", description: "Modelo de Cone. Vítimas fazem teste de Vigor ou sofrem 2d6 de dano e ficam Abaladas." },
      { name: "Presságio de Morte", description: "Seu lamento anuncia tragédia inescapável." }
    ],
    weapons: "Grito Sônico Sobrenatural (2d6 em Cone)",
    history: "Alma de mulher que encontrou um fim trágico nas colinas enevoadas. Seu lamento dilacera a mente dos que o escutam, anunciando a chegada da morte.",
    sourcebook: "Compêndio de Horror"
  },
  {
    id: "horr-6",
    name: "Monstro de Frankenstein",
    race: "Constructo Aberração",
    archetype: "Criatura de Retalhos",
    isWildCard: true,
    rank: "Heroico",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d6", spirit: "d8", strength: "d12+3", vigor: "d12" },
    skills: ["Atletismo d6", "Intimidar d12", "Lutar d10", "Perceber d6"],
    movement: "6",
    parry: 7,
    toughness: "12 (2)",
    size: 2,
    abilities: [
      { name: "Pele Reconstituída +2", description: "Carne morta de múltiplos cadáveres suturados." },
      { name: "Fúria do Elemento Elétrico", description: "Energizado por raios; ataques elétricos regeneram seus ferimentos." },
      { name: "Medo (-2)", description: "Seu porte de 2,40m e suturas grotescas aterrorizam quem se aproxima." }
    ],
    advantages: ["Brutamontes", "Queixo de Ferro", "Vontade de Ferro"],
    complications: ["Fraqueza: Fogo", "Feio (Maior)"],
    weapons: "Punhos Devastadores de Aço (For+d6)",
    history: "Criado em laboratório a partir de retalhos de defuntos e animado por descargas elétricas tempestuosas. Uma alma atormentada em busca de sentido e vingança.",
    sourcebook: "Compêndio de Horror"
  },
  {
    id: "horr-7",
    name: "Poltergeist",
    race: "Espírito",
    archetype: "Entidade Oculta",
    isWildCard: false,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d6", spirit: "d10", strength: "d4", vigor: "d8" },
    skills: ["Furtividade d12", "Intimidar d10", "Atirar d10", "Perceber d8"],
    movement: "6",
    parry: 5,
    toughness: "6",
    abilities: [
      { name: "Invisibilidade Permanente", description: "Não pode ser visto a olho nu; detectável apenas por magia ou oscilações térmicas." },
      { name: "Telecinese Violenta", description: "Arremessa móveis, facas e louças contra invasores (dano 2d6, Alcance 6/12/24)." },
      { name: "Manifestação Poltergeist", description: "Bate portas, apaga luzes e gela o ambiente gerando pânico constante." }
    ],
    weapons: "Projéteis Telecinéticos (2d6)",
    history: "Um espírito zombeteiro e enfurecido preso a uma construção ou família. Manifesta sua presença arremessando móveis pesados e manipulando objetos com força invisível.",
    sourcebook: "Compêndio de Horror"
  },

  // ==========================================
  // 🤠 DEADLANDS: O OESTE ESTRANHO
  // ==========================================
  {
    id: "dl-1",
    name: "Pistoleiro Retornado (Harrowed)",
    race: "Morto-Vivo",
    archetype: "Caçador do Oeste",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d10", cunning: "d8", spirit: "d8", strength: "d8", vigor: "d10" },
    skills: ["Atirar d12", "Atletismo d8", "Furtividade d8", "Intimidar d10", "Lutar d8", "Perceber d8", "Ladinagem d8"],
    movement: "6",
    parry: 6,
    toughness: "9 (2)",
    abilities: [
      { name: "Morto-Vivo (Harrowed)", description: "+2 Resistência; não respira; imune a veneno/doenças. O Manitou interno pode tentar assumir o controle sob grande estresse." },
      { name: "Olhor de Águia do Além", description: "Ignora 2 pontos de penalidade por distância ao disparar revólveres." }
    ],
    advantages: ["Saque Rápido", "Tiro Mortal", "Atirador de Elite", "Nervos de Aço"],
    weapons: "Colt Peacemaker Duplo (2d6+1, Alcance 12/24/48, AP 1), Faca de Caça (For+d4)",
    history: "Um fora-da-lei ou xerife que morreu no Deserto do Mojave mas retornou da sepultura habitado por um demônio manitou. Ele mantém sua mente humana, mas luta diariamente contra o demônio em seu peito.",
    sourcebook: "Deadlands: O Oeste Estranho"
  },
  {
    id: "dl-2",
    name: "Cascavel do Deserto (Desert Rattler)",
    race: "Besta Gigante",
    archetype: "Verme dos Ermos",
    isWildCard: true,
    rank: "Lendário",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d6", spirit: "d10", strength: "d12+8", vigor: "d12" },
    skills: ["Lutar d8", "Furtividade d10", "Perceber d10", "Intimidar d12"],
    movement: "6",
    parry: 6,
    toughness: "18 (4)",
    size: 8,
    abilities: [
      { name: "Cavar 18 quadros", description: "Desloca-se sob as dunas e emerge sob diligências de mineração." },
      { name: "Tentáculos de Fauce", description: "Possui 4 tentáculos tentaculares para agarrar presas antes de engoli-las." },
      { name: "Armadura de Placas +4", description: "Pele queratinizada impenetrável por projéteis comuns." }
    ],
    weapons: "Mordida Colossal de Dentes Serrilhados (For+d8), Tentáculos Agarradores",
    history: "Verme colossal de cem metros de comprimento que habita o subsolo do deserto de Utah e Nevada. Atraído pela vibração de locomotivas e passos de cavalos.",
    sourcebook: "Deadlands: O Oeste Estranho"
  },

  // ==========================================
  // 🧙‍♂️ PATHFINDER PARA SAVAGE WORLDS
  // ==========================================
  {
    id: "pf-1",
    name: "Rei Goblin de Brinestorm",
    race: "Goblinóide",
    archetype: "Chefe de Bando",
    isWildCard: true,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d10", cunning: "d8", spirit: "d6", strength: "d6", vigor: "d8" },
    skills: ["Atirar d8", "Atletismo d8", "Furtividade d10", "Intimidar d8", "Lutar d8", "Perceber d8", "Provocar d10"],
    movement: "6",
    parry: 7 (1),
    toughness: "7 (2)",
    size: -1,
    abilities: [
      { name: "Liderança Covarde", description: "Pode redirecionar ataques físicos contra ele para um capanga goblin adjacente." },
      { name: "Ódio a Escrita", description: "Goblins de Golarion acreditam que a escrita rouba palavras da mente. Fica furioso com livros." }
    ],
    advantages: ["Comando", "Comando de Fogo", "Ligeiro"],
    weapons: "Lâmina Corta-Cão (For+d6), Escudo Pequeno (+1 Aparar), Armadura de Couro Batido (+2)",
    history: "Líder de tribo goblin nas terras de Varisia. Usa uma coroa feita de sucata e cães empalhados, governando através da esperteza e da tirania sobre seus capangas.",
    sourcebook: "Pathfinder para Savage Worlds"
  },
  {
    id: "pf-2",
    name: "Diabo das Correntes (Kyton)",
    race: "Demônio Planar",
    archetype: "Torturador de Sombras",
    isWildCard: true,
    rank: "Heroico",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d10", cunning: "d8", spirit: "d10", strength: "d10", vigor: "d10" },
    skills: ["Atletismo d10", "Furtividade d8", "Intimidar d12", "Lutar d12", "Perceber d10"],
    movement: "6",
    parry: 8,
    toughness: "11 (4)",
    abilities: [
      { name: "Dança das Correntes", description: "Controla correntes animadas em um raio de 6 quadros; ataca com Alcance 3 (dano For+d8, AP 2)." },
      { name: "Olhar aterrorizante", description: "Faz a vítima ver os rostos de seus entes queridos torturados nas correntes." },
      { name: "Regeneração Planar", description: "Cura ferimentos se estiver em locais de penumbra ou escuridão." }
    ],
    advantages: ["Ataque Marcial", "Varredura Aprimorada"],
    weapons: "Correntes Farpadas Animadas (For+d8, AP 2, Alcance 3)",
    history: "Sádico habitante do plano de trevas. Coberto de suturas e correntes de ferro que se movem como serpentes sob seu comando telepático.",
    sourcebook: "Pathfinder para Savage Worlds"
  },

  // ==========================================
  // ⚔️ ARTE DA GUERRA (ADG)
  // ==========================================
  {
    id: "adg-1",
    name: "Ronin Sem Mestre",
    race: "Humano",
    archetype: "Espadachim Vagabundo",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d10", cunning: "d6", spirit: "d8", strength: "d8", vigor: "d8" },
    skills: ["Atletismo d8", "Furtividade d8", "Intimidar d8", "Lutar d12", "Perceber d8", "Persuadir d4"],
    movement: "6",
    parry: 9 (1),
    toughness: "7 (1)",
    abilities: [
      { name: "Técnica Iaijutsu", description: "Desenha a katana e ataca no mesmo movimento instantâneo com +2 de dano no primeiro turno." }
    ],
    advantages: ["Arma Predileta (Katana)", "Atacar Primeiro", "Contra-Ataque Aprimorado", "Nervos de Aço"],
    weapons: "Katana de Aço dobrado (For+d8+1, AP 2), Wakizashi (For+d6), Quimono Reforçado (+1)",
    history: "Um samurai desonrado após a queda de seu senhor feudal. Vaga pelas províncias vendendo sua lâmina por moedas ou um prato de arroz, mantendo um estrito código pessoal.",
    sourcebook: "Arte da Guerra (ADG)"
  },
  {
    id: "adg-2",
    name: "Ninja Assassino das Sombras",
    race: "Humano",
    archetype: "Agente Furtivo",
    isWildCard: false,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d10", cunning: "d8", spirit: "d6", strength: "d6", vigor: "d6" },
    skills: ["Atirar d8", "Atletismo d10", "Furtividade d12", "Ladinagem d10", "Lutar d10", "Perceber d8"],
    movement: "7",
    parry: 7,
    toughness: "5",
    abilities: [
      { name: "Bomba de Fumaça", description: "Cria cortina de fumaça preta Instantânea de Modelo Médio permitindo teste de Furtividade imediato." },
      { name: "Veneno de Escorpião", description: "Sua kunai carrega toxina paralítica (teste de Vigor -2)." }
    ],
    advantages: ["Assassino", "Ligeiro", "Acrobata"],
    weapons: "Ninjato (For+d6), Kunai Venenosa (For+d4, Alcance 3/6/12), Shurikens (2d4)",
    history: "Guerreiro invisível treinado nas artes proibidas do ninjutsu. Move-se pelas vigas de madeira e telhados sem fazer um único ruído antes de desferir o golpe fatal.",
    sourcebook: "Arte da Guerra (ADG)"
  },

  // ==========================================
  // 🚀 COMPÊNDIO DE SCI-FI (SCI-FI COMPANION)
  // ==========================================
  {
    id: "scifi-1",
    name: "Xenomorfo Caçador",
    race: "Predador Alienígena",
    archetype: "Organismo Perfeito",
    isWildCard: true,
    rank: "Heroico",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d12", cunning: "d8 (A)", spirit: "d10", strength: "d12+2", vigor: "d10" },
    skills: ["Atletismo d12", "Furtividade d12+2", "Lutar d12", "Perceber d10", "Intimidar d10"],
    movement: "10",
    parry: 8,
    toughness: "11 (4)",
    size: 1,
    abilities: [
      { name: "Sangue Ácido", description: "Dano de corte ou perfuração faz espirrar ácido nos atacantes adjacentes (2d6 de dano contínuo)." },
      { name: "Andar no Teto", description: "Desloca-se em tubulações e tetos sem penalidades de velocidade." },
      { name: "Exoesqueleto Quiitinoso +4", description: "Carapaça negra absorvedora de impactos." }
    ],
    weapons: "Fauce Interna retrátil (For+d8, AP 4), Garras Quitinosa (For+d6), Cauda Espinhosa (For+d6, Alcance 2)",
    history: "Organismo predador perfeito guiado por instinto de colmeia. Caça nas sombras de naves espaciais abandonadas e estações em quarentena.",
    sourcebook: "Compêndio de Sci-Fi"
  },
  {
    id: "scifi-2",
    name: "Ciborgue de Combate Heavy",
    race: "Humano Cyber-Aprimorado",
    archetype: "Soldado Pesado",
    isWildCard: false,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d6", spirit: "d6", strength: "d12", vigor: "d10" },
    skills: ["Atirar d10", "Atletismo d6", "Conhecimento Batalha d6", "Lutar d8", "Perceber d8"],
    movement: "6",
    parry: 6,
    toughness: "12 (5)",
    abilities: [
      { name: "Placas de Plasteel +5", description: "Blindagem subcutânea integrada militar." },
      { name: "Mira Óptica Tática", description: "Ignora penalidades por penumbra e fumaça." }
    ],
    advantages: ["Rock and Roll!", "Queixo de Ferro"],
    weapons: "Fuzil de Plasma Pesado (3d8, AP 4, Alcance 24/48/96), Lança-Mísseis de Pulso (4d6 em Modelo de Explosão)",
    history: "Veterano de guerras corporativas que teve 70% do corpo substituído por servo-motores e placas de blindagem pesada para combate espacial.",
    sourcebook: "Compêndio de Sci-Fi"
  },

  // ==========================================
  // 🌿 HAVENWOOD
  // ==========================================
  {
    id: "hw-1",
    name: "Guardião Povo-Fera (Leão)",
    race: "Povo-Fera",
    archetype: "Guerreiro Tribal",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef6?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d6", spirit: "d8", strength: "d10", vigor: "d10" },
    skills: ["Atletismo d8", "Furtividade d6", "Intimidar d10", "Lutar d10", "Perceber d10", "Sobrevivência d8"],
    movement: "8",
    parry: 7,
    toughness: "8 (1)",
    size: 1,
    abilities: [
      { name: "Rugido Majestoso", description: "Test de Intimidar em Cone contra todos os inimigos." },
      { name: "Fúria do Bando", description: "Recebe +1 no ataque para cada parceiro felino na cena." }
    ],
    advantages: ["Brutamontes", "Varredura", "Nervos de Aço"],
    weapons: "Machado de Batalha Tribal (For+d8), Garras Retráteis (For+d4)",
    history: "Nobre defensor do santuário felino nas terras de Havenwood. Comanda clãs de caçadores que protegem as árvores sagradas contra a contaminação externa.",
    sourcebook: "Havenwood"
  },

  // ==========================================
  // 💎 CRYSTAL HEART
  // ==========================================
  {
    id: "ch-1",
    name: "Agente com Coração de Cristal",
    race: "Humanoide Modificado",
    archetype: "Guardião de Cristal",
    isWildCard: true,
    rank: "Veterano",
    imageUrl: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d8", cunning: "d8", spirit: "d10", strength: "d8", vigor: "d8" },
    skills: ["Atirar d8", "Atletismo d8", "Foco d10", "Lutar d8", "Ocultismo d8", "Perceber d8"],
    movement: "6",
    parry: 6,
    toughness: "8 (2)",
    abilities: [
      { name: "Ressoar Prismático", description: "Seu coração de cristal canaliza projéteis de energia colorida (dano 2d8, AP 2)." },
      { name: "Barreira de Quartzo", description: "Projeta escudo de força translúcida concedendo +2 de Resistência a aliados." }
    ],
    advantages: ["AA Dom", "Sintonização de Cristal", "Focado"],
    powers: "Raio de Luz, Barreira de Cristal, Curar, Velocidade.",
    weapons: "Lâmina Prismática (For+d8, AP 2), Rajada de Cristal (2d8)",
    history: "Agente da Organização Syn que substituiu seu coração biológico por um artefato de cristal ancestral, ganhando controle sobre magias prismáticas.",
    sourcebook: "Crystal Heart"
  },

  // ==========================================
  // ⚙️ CIDADE DO SOL & VAPOR (STEAMPUNK)
  // ==========================================
  {
    id: "csv-1",
    name: "Autômaton a Vapor de Combate",
    race: "Constructo Steampunk",
    archetype: "Sentinela Mecânica",
    isWildCard: false,
    rank: "Experiente",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d4", cunning: "d4", spirit: "d6", strength: "d12+2", vigor: "d12" },
    skills: ["Atirar d8", "Intimidar d10", "Lutar d8", "Perceber d6"],
    movement: "4",
    parry: 6,
    toughness: "13 (5)",
    size: 2,
    abilities: [
      { name: "Caldeira de Alta Pressão", description: "Se severamente danificado, expele vapor escaldante em todos ao redor (2d6 de dano de calor)." },
      { name: "Blindagem de Latão Rivotado +5", description: "Impenetrável a pistolas de pequeno calibre." },
      { name: "Constructo a Vapor", description: "+2 para recuperar de Abalado; imune a veneno e doenças." }
    ],
    weapons: "Metralhadora Gatling a Vapor (2d8, Alcance 16/32/64), Punho Hidráulico (For+d8)",
    history: "Colosso de bronze e latão movido a pistões e caldeira de carvão. Patrulha os distritos industriais da Cidade do Sol & Vapor sob ordens dos barões das máquinas.",
    sourcebook: "Cidade do Sol & Vapor"
  },

  // ==========================================
  // 🍸 WISEGUYS
  // ==========================================
  {
    id: "wg-1",
    name: "Capanga da Máfia de Las Vegas",
    race: "Humano",
    archetype: "Gângster Urbano",
    isWildCard: false,
    rank: "Novato",
    imageUrl: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d6", spirit: "d6", strength: "d6", vigor: "d6" },
    skills: ["Atirar d8", "Atletismo d6", "Dirigir d6", "Intimidar d6", "Lutar d6", "Perceber d6", "Ladinagem d6"],
    movement: "6",
    parry: 5,
    toughness: "6 (1)",
    advantages: ["Conexões (Família Mafiosa)"],
    weapons: "Submetralhadora Thompson (2d6+1, Alcance 12/24/48, CdT 3), Soco Inglês (For+d4), Sobretudo Reforçado (+1)",
    history: "Capanga leal da Família Mafiosa que opera nos cassinos e becos escuros de Las Vegas. Especialista em cobrança de dívidas e tiroteios de passagem.",
    sourcebook: "Wiseguys"
  },

  // ==========================================
  // ⚡ COMPÊNDIO DE SUPERPODERES
  // ==========================================
  {
    id: "sp-1",
    name: "Supervilão Telecinético",
    race: "Meta-Humano",
    archetype: "Conjurador de Força",
    isWildCard: true,
    rank: "Heroico",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    attributes: { agility: "d6", cunning: "d10", spirit: "d12", strength: "d4", vigor: "d8" },
    skills: ["Foco d12+1", "Intimidar d10", "Perceber d8", "Persuadir d8"],
    movement: "6",
    parry: 5,
    toughness: "11 (5)",
    abilities: [
      { name: "Campo Telecinético Defensivo +5", description: "Projeta armadura invisível de força mental." },
      { name: "Arremesso Telecinético Colossal", description: "Ergue veículos e contêineres e arremessa com Força d12+4 equivalente (3d8 de dano)." },
      { name: "Voo Mental", description: "Levita a si mesmo com Movimentação 12 no ar." }
    ],
    advantages: ["Superpoderes (Nível 4)", "Mestre da Mente"],
    powers: "Telecinese, Campo de Força, Voo, Explosão Mental.",
    weapons: "Impacto Telecinético Concentrado (3d6), Arremesso de Veículos (3d8)",
    history: "Meta-humano cuja mente desperta consegue erguer toneladas sem desferir um único soco. Busca dominar a cidade subjugando heróis com escudos impenetráveis.",
    sourcebook: "Compêndio de Superpoderes"
  }
];
