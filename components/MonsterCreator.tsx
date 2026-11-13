import { createTemplateDraft, MONSTER_PRESETS } from '../services/monsterTemplates';
import { TemplatePicker } from './TemplatePicker';
import { ConfirmDialog } from './ConfirmDialog';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { notify } from '../services/notifications';
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { MonsterTemplate, Monster, MonsterAbility } from '../types';
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


const initialMonster: MonsterTemplate = createTemplateDraft(MONSTER_PRESETS[0]);

const monsterToTemplate = (monster: Monster): MonsterTemplate => ({
  id: monster.id,
  templateId: monster.templateId,
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
  powers: monster.powers || '',
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
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const savePending = useRef(false);
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

  const [showTemplates, setShowTemplates] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const applyPreset = (id: string) => {
    const preset = MONSTER_PRESETS.find(p => p.id === id);
    if (!preset) return;
    setMonster(prev => createTemplateDraft(preset, prev));
    setPendingTemplateId(null);
    setShowTemplates(false);
    setError(null);
    notify(`Modelo “${preset.name}” aplicado. Você pode editar todos os campos.`);
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
    if (!monster.name.trim() || savePending.current) return;
    savePending.current = true;
    setIsSaving(true);
    setError(null);
    try {
      await addCustomMonster(monster, imageFile ?? undefined);
      notify(monsterToEdit ? 'Ficha atualizada neste aparelho.' : 'Criatura salva neste aparelho.');
      onSaveSuccess();
    } catch {
      setError('Não foi possível salvar. O armazenamento pode estar cheio. Exporte um backup e tente novamente.');
    } finally {
      savePending.current = false;
      setIsSaving(false);
    }
  };

  const canSave = monster.name.trim() !== '';
  const original = monsterToEdit ? monsterToTemplate(monsterToEdit) : initialMonster;
  const hasChanges = JSON.stringify(monster) !== JSON.stringify(original) || Boolean(imageFile) || Boolean(newAbilityName.trim() || newAbilityDesc.trim()) || imageUrlInput !== (monsterToEdit?.imageUrl || '');
  const requestCancel = () => {
    if (savePending.current) return;
    if (hasChanges) setShowDiscardConfirmation(true);
    else onCancel?.();
  };
  useBackNavigation(true, requestCancel, 20);


  return (
    <div className="max-w-5xl mx-auto bg-stone-950 border border-amber-900/50 rounded-xl shadow-2xl p-3.5 sm:p-6 md:p-8 text-stone-200 ring-1 ring-amber-500/20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-800 mb-5 sm:mb-6">
        <div className="min-w-0">
          {onCancel && (
            <button
              onClick={requestCancel}
              type="button"
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-cinzel mb-2 min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancelar e Voltar
            </button>
          )}
          <h2 className="font-cinzel text-xl sm:text-3xl font-extrabold text-amber-200 tracking-wide">
            {monsterToEdit ? 'Editar Monstro' : 'Forja de Lendas (Criador SWADE)'}
          </h2>
          <p className="text-xs text-stone-400 font-crimson italic">
            Crie sua criatura no padrão Savage Worlds com cálculo de traços, perícias e suporte a IA.
          </p>
        </div>

        {/* Wild Card Switch Toggle */}
        <div className="flex items-center gap-2 bg-stone-900 px-3 py-2.5 rounded-lg border border-stone-800 self-start sm:self-auto shrink-0 min-h-[42px]">
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

      <form id="monster-editor-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="creator-form space-y-6">
        
        {/* Top Grid: Portrait + Basic Identity */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Identity Fields */}
          <div className="md:col-span-8 space-y-4 ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
                  Nome do Monstro *
                </label>
                <input
                  required
                  type="text"
                  aria-label="Nome do monstro" name="name"
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
                  aria-label="Raça ou natureza" name="race"
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
                <button type="button" onClick={() => setShowTemplates(true)} className="w-full min-h-12 border border-amber-700 rounded-lg px-3 py-2 text-left font-semibold">
                  Explorar {MONSTER_PRESETS.length} modelos de criatura →
                </button>
                <p className="text-xs text-stone-400 mt-2">Escolha família e patamar, confira a ficha e aplique quando quiser.</p>
              </div>

              <div>
                <label className="block text-xs font-cinzel font-bold text-stone-300 mb-1">
                  Título / Arquétipo Exibido
                </label>
                <input
                  type="text"
                  aria-label="Título ou arquétipo" name="archetype"
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
                    aria-label="Movimentação" name="movement"
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
                    aria-label="Aparar" name="parry"
                    value={monster.parry}
                    onChange={handleValueChange}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 text-center text-sm font-mono-dice"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block">Resistência</label>
                  <input
                    type="text"
                    aria-label="Resistência" name="toughness"
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
                    aria-label="Tamanho" name="size"
                    value={monster.size}
                    onChange={handleValueChange}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 text-center text-sm font-mono-dice"
                  />
                </div>
              </div>
            </div>

          </div>
          {/* Portrait and Image Upload */}
          <details className="portrait-panel md:col-span-4 space-y-3 ">
            <summary className="min-h-12 cursor-pointer text-sm font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4" />Imagem da criatura (opcional)</summary>
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
                <img loading="lazy" onError={event => { if (!event.currentTarget.src.endsWith('/book-creature.svg')) event.currentTarget.src = '/book-creature.svg'; }}
                  src={imagePreview}
                  alt="Pré-visualização"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="p-3 bg-stone-800 rounded-full w-fit mx-auto text-amber-400 group-hover:text-amber-300 mb-2">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-cinzel font-bold text-stone-300">Carregar Imagem / Arte</p>
                  <p className="text-[11px] text-stone-500 mt-1">Toque para escolher da galeria ou arquivo</p>
                </div>
              )}
            </div>

            {/* URL Input alternative */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ou cole a URL da imagem..."
                aria-label="URL da imagem" value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 min-h-[40px] bg-stone-900 border border-stone-700 rounded-lg py-2 px-3 text-xs text-stone-200 placeholder-stone-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleApplyUrlImage}
                className="min-h-[40px] bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs px-3.5 py-2 rounded-lg border border-stone-700 font-cinzel shrink-0"
              >
                Aplicar
              </button>
            </div>

            {/* Presets Gallery */}
            <details className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
              <summary className="min-h-11 text-sm cursor-pointer">Retratos sugeridos (requer internet)</summary>
              <div className="text-[11px] font-cinzel font-bold text-amber-300/80 mb-1.5 flex items-center justify-between">
                <span>Retratos Sugeridos (1 Clique):</span>
                <span className="text-[10px] text-stone-500">{PRESET_PORTRAITS.length} opções</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                {PRESET_PORTRAITS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setImagePreview(preset.url);
                      setImageFile(null);
                      setMonster(prev => ({ ...prev, imageUrl: preset.url }));
                    }}
                    className="relative group rounded overflow-hidden border border-stone-700 hover:border-amber-500 transition-all h-12 sm:h-10 w-full"
                    title={preset.name}
                  >
                    <img loading="lazy" onError={event => { if (!event.currentTarget.src.endsWith('/book-creature.svg')) event.currentTarget.src = '/book-creature.svg'; }}
                      src={preset.url}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-stone-300 text-center truncate px-0.5 font-cinzel">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </details>
          </details>

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
              { key: 'cunning', label: 'Astúcia' },
              { key: 'spirit', label: 'Espírito' },
              { key: 'strength', label: 'Força' },
              { key: 'vigor', label: 'Vigor' },
            ].map(attr => (
              <div key={attr.key} className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                <label className="text-xs font-cinzel font-bold text-stone-300 block mb-1">
                  {attr.label}
                </label>
                <select
                  aria-label={attr.label} name={attr.key}
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
              aria-label="Perícias" name="skills"
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
              aria-label="Armas e ataques" name="weapons"
              rows={3}
              value={monster.weapons}
              onChange={handleValueChange}
              placeholder="Ex: Mordida (For+d6), Garras Afiadas (For+d4), Arco Longo (2d6)"
              className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-sm text-stone-200 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="creature-powers">Poderes e Pontos de Poder</label>
          <textarea id="creature-powers" name="powers" rows={3} value={monster.powers || ''} onChange={handleValueChange}
            placeholder="Opcional: poderes disponíveis, Pontos de Poder e tradição arcana."
            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200" />
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
              {isGeneratingAbilities ? 'Gerando...' : 'Sugerir habilidades'}
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
                  aria-label={`Remover habilidade ${ability.name}`} onClick={() => handleRemoveAbility(idx)}
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
              aria-label="Nome da nova habilidade" value={newAbilityName}
              onChange={(e) => setNewAbilityName(e.target.value)}
              className="sm:col-span-4 bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
            />
            <input
              type="text"
              placeholder="Descrição com regras (ex: Vítima testa Vigor ou fica Abalada)"
              aria-label="Descrição da nova habilidade" value={newAbilityDesc}
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
                {isGeneratingStory ? 'Escrevendo lenda...' : 'Sugerir descrição'}
              </button>
            </div>
          </div>
          <textarea
            aria-label="História e descrição" name="history"
            rows={5}
            value={monster.history}
            onChange={handleValueChange}
            placeholder="Descreva a origem lendária da criatura ou clique no botão acima para a IA redigir..."
            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 font-crimson text-base focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {error && <p role="alert" className="save-error text-sm text-red-400 rounded-lg border border-red-700 p-3">{error}</p>}
        {/* Submit & Actions */}
        <div className="editor-savebar border-t border-stone-800 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={requestCancel}
              className="w-full sm:w-auto min-h-[44px] bg-stone-900 hover:bg-stone-800 text-stone-300 font-cinzel text-sm py-2.5 px-5 rounded-lg border border-stone-700"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!canSave || isGeneratingStory || isSaving}
            className="w-full sm:w-auto min-h-[44px] bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-sm py-2.5 px-8 rounded-lg shadow-xl shadow-red-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : monsterToEdit ? 'Salvar alterações' : 'Salvar criatura'}
          </button>
        </div>

      </form>
      <TemplatePicker open={showTemplates} onClose={() => setShowTemplates(false)} onSelect={id => { setShowTemplates(false); setPendingTemplateId(id); }} />
      <ConfirmDialog open={pendingTemplateId !== null} title="Aplicar modelo de criatura?"
        message="Atributos, perícias, ataques, habilidades, natureza e condição de Carta Selvagem serão substituídos. Nome, história e retrato serão preservados."
        confirmLabel="Aplicar modelo" onCancel={() => setPendingTemplateId(null)} onConfirm={() => { if (pendingTemplateId) applyPreset(pendingTemplateId); }} />
      <ConfirmDialog open={showDiscardConfirmation} title="Descartar alterações?" message="Há alterações que ainda não foram salvas nesta ficha. Deseja sair sem salvar?" confirmLabel="Descartar alterações" onCancel={() => setShowDiscardConfirmation(false)} onConfirm={() => onCancel?.()} />
    </div>
  );
};

export default MonsterCreator;
