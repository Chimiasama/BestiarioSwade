import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { MonsterArchetype, MonsterTemplate, Monster, MonsterAbility } from '../types';
import { generateMonsterStory, generateMonsterAbilities } from '../services/geminiService';
import { addCustomMonster } from '../services/customMonsterService';
import {
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  Skull,
  ArrowLeft,
  Save,
  Wand2,
  Shield,
  Footprints,
  Dices,
  Swords,
  Info
} from 'lucide-react';

const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd12+1', 'd12+2', 'd12+3', 'd12+4', 'd12+5', 'd12+6'];

const PRESET_PORTRAITS = [
  { name: 'Espectro', url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Guerreiro', url: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80' },
  { name: 'Fera / Lobo', url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef6?auto=format&fit=crop&w=800&q=80' },
  { name: 'Dragão / Alado', url: 'https://images.unsplash.com/photo-1577493340887-b7bfff550145?auto=format&fit=crop&w=800&q=80' },
  { name: 'Zumbi / Cadáver', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80' },
  { name: 'Esqueleto', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80' },
  { name: 'Golem / Titã', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80' },
  { name: 'Bruxa / Feitiço', url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80' },
  { name: 'Criptídeo', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80' },
  { name: 'Goblin / Ladino', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80' },
  { name: 'Elemental Fogo', url: 'https://images.unsplash.com/photo-1517594422361-5eeb8ae275a9?auto=format&fit=crop&w=800&q=80' },
  { name: 'Serpente', url: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=800&q=80' },
];

const MONSTER_TEMPLATES: Record<MonsterArchetype, Omit<MonsterTemplate, 'name' | 'history'>> = {
  Soldier: {
    race: 'Humano',
    archetype: 'Soldado Assombrado',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd8', cunning: 'd6', spirit: 'd6', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Intimidar d6, Atirar d8, Perceber d6, Atletismo d6',
    movement: '6',
    parry: 6,
    toughness: '8 (2)',
    abilities: [
      { name: 'Destemido', description: 'Imune a testes de Medo e Intimidação.' },
      { name: 'Formação de Batalha', description: 'Recebe +1 em Aparar quando estiver adjacente a pelo menos um aliado.' }
    ],
    weapons: 'Espada Longa (For+d8), Armadura de Malha (+2)',
    advantages: 'Reflexos em Combate',
    complications: 'Leal (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Brute: {
    race: 'Monstruosidade',
    archetype: 'Besta Brutal',
    isWildCard: true,
    size: 2,
    attributes: { agility: 'd6', cunning: 'd4', spirit: 'd6', strength: 'd12', vigor: 'd10' },
    skills: 'Lutar d10, Intimidar d10, Perceber d6, Atletismo d8',
    movement: '7',
    parry: 7,
    toughness: '11 (2)',
    abilities: [
      { name: 'Couraça Espessa', description: 'Armadura natural +2.' },
      { name: 'Frenesi Selvagem', description: 'Pode realizar um ataque adicional de Lutar por turno com -2 na rolagem.' },
      { name: 'Tamanho +2', description: 'Criatura volumosa; recebe +2 em Resistência.' }
    ],
    weapons: 'Garras Devastadoras (For+d8)',
    advantages: 'Brutamontes, Varredura',
    complications: 'Sanguinário (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Sharpshooter: {
    race: 'Elfo Espectral',
    archetype: 'Atirador Furtivo',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd10', cunning: 'd8', spirit: 'd6', strength: 'd6', vigor: 'd6' },
    skills: 'Atirar d10, Furtividade d10, Perceber d8, Sobrevivência d6',
    movement: '6',
    parry: 5,
    toughness: '5',
    abilities: [
      { name: 'Visão Noturna', description: 'Ignora penalidades por Penumbra e Escuridão parcial.' },
      { name: 'Disparo Silencioso', description: 'Se atacar furtivo e acertar com ampliação, adiciona +4 de dano.' }
    ],
    weapons: 'Arco Fantasmagórico (2d6, Alcance 12/24/48)',
    advantages: 'Atirador, Olhos de Águia',
    complications: 'Cauteloso (Maior)',
    sourcebook: 'Criações Próprias',
  },
  'Shadow Mage': {
    race: 'Espectro',
    archetype: 'Conjurador das Trevas',
    isWildCard: true,
    size: 0,
    attributes: { agility: 'd6', cunning: 'd8', spirit: 'd10', strength: 'd4', vigor: 'd6' },
    skills: 'Conjurar d10, Ocultismo d10, Intimidar d8, Perceber d8',
    movement: '6',
    parry: 4,
    toughness: '5',
    abilities: [
      { name: 'Etéreo', description: 'Pode atravessar paredes e só é ferido por ataques mágicos ou energia pura.' },
      { name: 'Dreno Sinistro', description: 'Ataque de toque força o alvo a testar Vigor ou sofrer 1 nível de Fadiga.' }
    ],
    weapons: 'Feitiços Arcanos (Projétil 2d6, Pavor, Escuridão)',
    advantages: 'Antecedente Arcano (Magia)',
    complications: 'Vulnerabilidade a Luz Solar (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Beast: {
    race: 'Besta Mítica',
    archetype: 'Predador Alfa',
    isWildCard: false,
    size: 1,
    attributes: { agility: 'd8', cunning: 'd6', spirit: 'd6', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Perceber d8, Furtividade d8, Atletismo d8, Rastrear d8',
    movement: '8',
    parry: 6,
    toughness: '7 (1)',
    abilities: [
      { name: 'Sentidos Apurados', description: '+2 em testes de Perceber baseados em olfato ou audição.' },
      { name: 'Bote Furioso', description: 'Se mover pelo menos 3 quadros antes de atacar com Lutar, ganha +2 de dano.' }
    ],
    weapons: 'Mordida & Garras (For+d6)',
    advantages: 'Prontidão',
    complications: 'Sem Fala',
    sourcebook: 'Criações Próprias',
  },
  Elemental: {
    race: 'Elemental',
    archetype: 'Manifestação Primitiva',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd8', cunning: 'd6', spirit: 'd8', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Atirar d8, Intimidar d8, Atletismo d6',
    movement: '6',
    parry: 6,
    toughness: '6',
    abilities: [
      { name: 'Natureza Elemental', description: 'Não respira, imune a venenos, doenças e sono. Ignora penalidades de ferimento.' },
      { name: 'Aura Danosa', description: 'Inimigos adjacentes sofrem 2d4 de dano no final do seu turno.' }
    ],
    weapons: 'Pancada Elemental (For+d6)',
    advantages: '',
    complications: 'Vulnerabilidade a Elemento Oposto (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Undead: {
    race: 'Morto-Vivo',
    archetype: 'Cavaleiro Macabro',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd6', cunning: 'd4', spirit: 'd6', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Intimidar d8, Perceber d4',
    movement: '5',
    parry: 6,
    toughness: '8 (2)',
    abilities: [
      { name: 'Morto-Vivo', description: '+2 Resistência; +2 para recuperar de Abalado; ignora 1 ponto de penalidade de Ferimento; Imune a doenças e venenos.' },
      { name: 'Destemido', description: 'Imune a testes de Medo e Intimidação.' }
    ],
    weapons: 'Machado Enferrujado (For+d8)',
    advantages: '',
    complications: '',
    sourcebook: 'Criações Próprias',
  }
};

const initialMonster: MonsterTemplate = {
  name: '',
  history: '',
  sourcebook: 'Criações Próprias',
  ...MONSTER_TEMPLATES.Soldier,
};

const monsterToTemplate = (monster: Monster): MonsterTemplate => ({
  id: monster.id,
  name: monster.name,
  race: monster.race,
  archetype: monster.archetype,
  isWildCard: monster.isWildCard ?? false,
  attributes: monster.attributes,
  skills: monster.skills?.join(', ') || '',
  movement: monster.movement,
  parry: monster.parry,
  toughness: monster.toughness,
  size: monster.size ?? 0,
  abilities: monster.abilities || [],
  advantages: monster.advantages?.join(', ') || '',
  complications: monster.complications?.join(', ') || '',
  weapons: monster.weapons || '',
  history: monster.history,
  imageUrl: monster.imageUrl,
  sourcebook: monster.sourcebook || 'Criações Próprias',
});

const MonsterCreator: React.FC<{
  monsterToEdit: Monster | null;
  onSaveSuccess: () => void;
  onCancel?: () => void;
}> = ({ monsterToEdit, onSaveSuccess, onCancel }) => {
  const [monster, setMonster] = useState<MonsterTemplate>(initialMonster);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingAbilities, setIsGeneratingAbilities] = useState(false);
  const [newAbilityName, setNewAbilityName] = useState('');
  const [newAbilityDesc, setNewAbilityDesc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (monsterToEdit) {
      setMonster(monsterToTemplate(monsterToEdit));
      setImagePreview(monsterToEdit.imageUrl);
      setImageUrlInput(monsterToEdit.imageUrl || '');
      setImageFile(null);
    } else {
      setMonster(initialMonster);
      setImagePreview(null);
      setImageUrlInput('');
      setImageFile(null);
    }
    setError(null);
  }, [monsterToEdit]);

  const handleArchetypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newArchetype = e.target.value as MonsterArchetype;
    const template = MONSTER_TEMPLATES[newArchetype];
    setMonster(prev => ({
      ...prev,
      ...template,
      name: prev.name,
      history: prev.history,
      imageUrl: prev.imageUrl,
      isWildCard: prev.isWildCard,
    }));
  };

  const handleValueChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMonster(prev => ({
      ...prev,
      [name]: name === 'parry' || name === 'size' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleAttributeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMonster(prev => ({ ...prev, attributes: { ...prev.attributes, [name]: value } }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrlInput('');
    }
  };

  const handleApplyUrlImage = () => {
    if (imageUrlInput.trim()) {
      setImagePreview(imageUrlInput.trim());
      setMonster(prev => ({ ...prev, imageUrl: imageUrlInput.trim() }));
      setImageFile(null);
    }
  };

  // Add custom ability
  const handleAddAbility = () => {
    if (!newAbilityName.trim()) return;
    setMonster(prev => ({
      ...prev,
      abilities: [
        ...prev.abilities,
        { name: newAbilityName.trim(), description: newAbilityDesc.trim() || 'Habilidade especial.' }
      ]
    }));
    setNewAbilityName('');
    setNewAbilityDesc('');
  };

  // Remove ability
  const handleRemoveAbility = (index: number) => {
    setMonster(prev => ({
      ...prev,
      abilities: prev.abilities.filter((_, idx) => idx !== index)
    }));
  };

  // Generate AI Story / Lore
  const handleGenerateStory = async () => {
    setError(null);
    if (!monster.name.trim()) {
      setError("Dê um nome ao seu monstro antes de gerar a história!");
      return;
    }
    setIsGeneratingStory(true);
    try {
      const abilitiesText = monster.abilities.map(a => `${a.name}: ${a.description}`).join('; ');
      const generatedHistory = await generateMonsterStory({
        name: monster.name,
        archetype: monster.archetype,
        race: monster.race,
        abilities: abilitiesText,
        skills: monster.skills,
        weapons: monster.weapons,
        toughness: monster.toughness,
        attributes: monster.attributes,
      });
      setMonster(prev => ({ ...prev, history: generatedHistory }));
    } catch (err: any) {
      setError(err.message || "Erro ao gerar lenda.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Generate AI Abilities
  const handleGenerateAbilities = async () => {
    setIsGeneratingAbilities(true);
    try {
      const generated = await generateMonsterAbilities(
        monster.name || 'Criatura Misteriosa',
        monster.archetype,
        monster.race
      );
      if (generated && generated.length > 0) {
        setMonster(prev => ({
          ...prev,
          abilities: [...prev.abilities, ...generated]
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAbilities(false);
    }
  };

  const handleSave = async () => {
    if (!monster.name.trim()) return;
    await addCustomMonster(monster, imageFile ?? undefined);
    onSaveSuccess();
  };

  const canSave = monster.name.trim() !== '';

  return (
    <div className="max-w-5xl mx-auto bg-stone-950 border border-amber-900/50 rounded-xl shadow-2xl p-6 sm:p-8 text-stone-200 ring-1 ring-amber-500/20">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
        <div>
          {onCancel && (
            <button
              onClick={onCancel}
              type="button"
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-cinzel mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancelar e Voltar
            </button>
          )}
          <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-wide">
            {monsterToEdit ? 'Editar Monstro' : 'Forja de Lendas (Criador SWADE)'}
          </h2>
          <p className="text-xs text-stone-400 font-crimson italic">
            Crie sua criatura no padrão Savage Worlds com cálculo de traços, perícias e suporte a IA.
          </p>
        </div>

        {/* Wild Card Switch Toggle */}
        <div className="flex items-center gap-2 bg-stone-900 p-2.5 rounded-lg border border-stone-800">
          <input
            type="checkbox"
            id="wildCardToggle"
            checked={!!monster.isWildCard}
            onChange={(e) => setMonster(prev => ({ ...prev, isWildCard: e.target.checked }))}
            className="w-4 h-4 rounded border-stone-700 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="wildCardToggle" className="font-cinzel text-xs font-bold text-amber-300 flex items-center gap-1 cursor-pointer">
            <Skull className="w-3.5 h-3.5 text-amber-400" />
            Carta Selvagem (Wild Card)
          </label>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        
        {/* Top Grid: Portrait + Basic Identity */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Portrait and Image Upload */}
          <div className="md:col-span-4 space-y-3">
            <div
              className="w-full h-64 bg-stone-900 rounded-xl flex items-center justify-center border-2 border-dashed border-stone-700 hover:border-amber-600/80 cursor-pointer overflow-hidden transition-all group relative shadow-inner"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="p-3 bg-stone-800 rounded-full w-fit mx-auto text-amber-400 group-hover:text-amber-300 mb-2">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-cinzel font-bold text-stone-300">Carregar Imagem / Arte</p>
                  <p className="text-[11px] text-stone-500 mt-1">Clique para selecionar do computador</p>
                </div>
              )}
            </div>

            {/* URL Input alternative */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ou cole a URL da imagem..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 bg-stone-900 border border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-200 placeholder-stone-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleApplyUrlImage}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs px-3 py-1.5 rounded-lg border border-stone-700 font-cinzel"
              >
                Aplicar
              </button>
            </div>

            {/* Presets Gallery */}
            <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
              <div className="text-[11px] font-cinzel font-bold text-amber-300/80 mb-1.5 flex items-center justify-between">
                <span>Retratos Sugeridos (1 Clique):</span>
                <span className="text-[10px] text-stone-500">{PRESET_PORTRAITS.length} opções</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-1">
                {PRESET_PORTRAITS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setImagePreview(preset.url);
                      setImageFile(null);
                      setMonster(prev => ({ ...prev, imageUrl: preset.url }));
                    }}
                    className="relative group rounded overflow-hidden border border-stone-700 hover:border-amber-500 transition-all h-10 w-full"
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-stone-300 text-center truncate px-0.5 font-cinzel">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Identity Fields */}
          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
                  Nome do Monstro *
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={monster.name}
                  onChange={handleValueChange}
                  placeholder="Ex: Curupira, Mula sem Cabeça, Quimera..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-stone-200 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
                  Raça ou Natureza
                </label>
                <input
                  type="text"
                  name="race"
                  value={monster.race}
                  onChange={handleValueChange}
                  placeholder="Ex: Humano, Morto-Vivo, Fera, Aparição..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-stone-200 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
                  Carregar Modelo de Arquétipo
                </label>
                <select
                  value={
                    Object.keys(MONSTER_TEMPLATES).find(
                      key => MONSTER_TEMPLATES[key as MonsterArchetype].archetype === monster.archetype
                    ) || 'Soldier'
                  }
                  onChange={handleArchetypeChange}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-stone-200 text-sm focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Soldier">Soldado Assombrado (Equilibrado)</option>
                  <option value="Brute">Besta Brutal (Força d12 / Resistente)</option>
                  <option value="Sharpshooter">Atirador Furtivo (Agilidade d10)</option>
                  <option value="Shadow Mage">Conjurador das Trevas (Magias)</option>
                  <option value="Beast">Predador Alfa (Rápido / Garras)</option>
                  <option value="Elemental">Manifestação Elemental (Invulnerável)</option>
                  <option value="Undead">Morto-Vivo (Destemido / Resistência)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
                  Título / Arquétipo Exibido
                </label>
                <input
                  type="text"
                  name="archetype"
                  value={monster.archetype}
                  onChange={handleValueChange}
                  placeholder="Ex: Terror das Matas, Guardião Ancestral..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-stone-200 text-sm focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Combat Vitals (Pace, Parry, Toughness, Size) */}
            <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-2">
              <span className="font-cinzel text-xs font-bold text-amber-400 block uppercase tracking-wider">
                Estatísticas Vitais de Combate
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 block">Movimentação</label>
                  <input
                    type="text"
                    name="movement"
                    value={monster.movement}
                    onChange={handleValueChange}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 text-center text-sm font-mono-dice"
                    placeholder="6"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block">Aparar (Parry)</label>
                  <input
                    type="number"
                    name="parry"
                    value={monster.parry}
                    onChange={handleValueChange}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 text-center text-sm font-mono-dice"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block">Resistência</label>
                  <input
                    type="text"
                    name="toughness"
                    value={monster.toughness}
                    onChange={handleValueChange}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 text-center text-sm font-mono-dice"
                    placeholder="8 (2)"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block">Tamanho (Size)</label>
                  <input
                    type="number"
                    name="size"
                    value={monster.size}
                    onChange={handleValueChange}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 text-center text-sm font-mono-dice"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SWADE Attributes Selection */}
        <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800 space-y-3">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-amber-500" />
            <h3 className="font-cinzel text-base font-bold text-amber-300">
              Atributos Principais (Dados SWADE)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'agility', label: 'Agilidade' },
              { key: 'cunning', label: 'Esperteza' },
              { key: 'spirit', label: 'Espírito' },
              { key: 'strength', label: 'Força' },
              { key: 'vigor', label: 'Vigor' },
            ].map(attr => (
              <div key={attr.key} className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                <label className="text-xs font-cinzel font-bold text-stone-300 block mb-1">
                  {attr.label}
                </label>
                <select
                  name={attr.key}
                  value={monster.attributes[attr.key as keyof typeof monster.attributes]}
                  onChange={handleAttributeChange}
                  className="w-full bg-stone-900 border border-stone-700 rounded-md p-1.5 text-sm font-mono-dice text-amber-400 focus:ring-1 focus:ring-amber-500"
                >
                  {DICE_TYPES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Skills and Weapons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
              Perícias (separadas por vírgula)
            </label>
            <textarea
              name="skills"
              rows={3}
              value={monster.skills}
              onChange={handleValueChange}
              placeholder="Ex: Lutar d8, Atirar d6, Intimidar d8, Perceber d6, Furtividade d8"
              className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
              Armas, Ataques & Equipamentos
            </label>
            <textarea
              name="weapons"
              rows={3}
              value={monster.weapons}
              onChange={handleValueChange}
              placeholder="Ex: Mordida (For+d6), Garras Afiadas (For+d4), Arco Longo (2d6)"
              className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Special Abilities Manager */}
        <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-cinzel text-base font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Habilidades Especiais
            </h3>

            <button
              type="button"
              onClick={handleGenerateAbilities}
              disabled={isGeneratingAbilities}
              className="text-xs bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-cinzel"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isGeneratingAbilities ? 'Gerando...' : 'Sugerir Habilidades com IA'}
            </button>
          </div>

          {/* Existing Abilities List */}
          <div className="space-y-2">
            {monster.abilities.map((ability, idx) => (
              <div
                key={idx}
                className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-cinzel font-bold text-amber-300">{ability.name}: </span>
                  <span className="text-stone-300">{ability.description}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAbility(idx)}
                  className="text-stone-500 hover:text-red-400 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Ability Form */}
          <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800/90 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              placeholder="Nome da Habilidade (ex: Toque Venenoso)"
              value={newAbilityName}
              onChange={(e) => setNewAbilityName(e.target.value)}
              className="sm:col-span-4 bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
            />
            <input
              type="text"
              placeholder="Descrição com regras (ex: Vítima testa Vigor ou fica Abalada)"
              value={newAbilityDesc}
              onChange={(e) => setNewAbilityDesc(e.target.value)}
              className="sm:col-span-6 bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
            />
            <button
              type="button"
              onClick={handleAddAbility}
              className="sm:col-span-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-cinzel text-xs py-2 px-3 rounded-lg border border-stone-700 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        </div>

        {/* Backstory & AI Generator */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-cinzel text-sm font-bold text-amber-300">
              História, Lenda & Origem
            </label>
            <div className="flex items-center gap-3">
              {error && <span className="text-red-400 text-xs animate-pulse">{error}</span>}
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGeneratingStory}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-cinzel font-bold px-3 py-1.5 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGeneratingStory ? 'Escrevendo lenda...' : 'Gerar História com IA'}
              </button>
            </div>
          </div>
          <textarea
            name="history"
            rows={5}
            value={monster.history}
            onChange={handleValueChange}
            placeholder="Descreva a origem lendária da criatura ou clique no botão acima para a IA redigir..."
            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 font-crimson text-base focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Submit & Actions */}
        <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-stone-900 hover:bg-stone-800 text-stone-300 font-cinzel text-sm py-2.5 px-5 rounded-lg border border-stone-700"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!canSave || isGeneratingStory}
            className="bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-cinzel font-bold text-sm py-2.5 px-8 rounded-lg shadow-xl shadow-red-950/50 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {monsterToEdit ? 'Atualizar Monstro' : 'Gravar Monstro no Bestiário'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default MonsterCreator;
