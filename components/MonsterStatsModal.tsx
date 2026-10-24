import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Monster } from '../types';
import { 
  PieChart, 
  X, 
  Sparkles, 
  Filter, 
  Layers, 
  ShieldAlert, 
  Skull, 
  Flame,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface MonsterStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monsters: Monster[];
  onApplyRaceFilter?: (race: string) => void;
}

interface StatSlice {
  id: string;
  label: string;
  count: number;
  percentage: number;
  monsters: Monster[];
  wildCardCount: number;
  avgToughness: number;
  color: string;
}

type GroupingMode = 'race' | 'archetype' | 'sourcebook' | 'rank';

// Palette of thematic fantasy hues
const FANTASY_PALETTE = [
  '#f59e0b', // Amber
  '#ef4444', // Crimson / Blood
  '#10b981', // Emerald / Nature
  '#8b5cf6', // Violet / Arcane
  '#06b6d4', // Cyan / Spirit
  '#f97316', // Fiery Orange
  '#ec4899', // Mystic Pink
  '#3b82f6', // Sapphire Blue
  '#84cc16', // Acid Green
  '#14b8a6', // Teal
  '#a855f7', // Deep Amethyst
  '#eab308', // Gold
  '#64748b', // Iron Gray
  '#d97706', // Ochre
  '#9333ea', // Shadow Purple
  '#059669', // Deep Forest
];

export const MonsterStatsModal: React.FC<MonsterStatsModalProps> = ({
  isOpen,
  onClose,
  monsters,
  onApplyRaceFilter,
}) => {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('race');
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Helper to parse numeric toughness from strings like "8 (2)" or "11"
  const parseToughnessNumber = (tStr: string): number => {
    if (!tStr) return 4;
    const match = tStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 4;
  };

  // Group monsters into slices based on selected groupingMode
  const chartData: StatSlice[] = useMemo(() => {
    if (!monsters || monsters.length === 0) return [];

    const total = monsters.length;
    const groups: Record<string, Monster[]> = {};

    monsters.forEach((m) => {
      let key = 'Indefinido';
      if (groupingMode === 'race') {
        key = m.race ? m.race.trim() : 'Outros';
      } else if (groupingMode === 'archetype') {
        key = m.archetype ? m.archetype.trim() : 'Geral';
      } else if (groupingMode === 'sourcebook') {
        key = m.sourcebook ? m.sourcebook.trim() : 'Outros Suplementos';
      } else if (groupingMode === 'rank') {
        key = m.rank ? m.rank : 'Novato';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    const entries = Object.entries(groups).map(([label, list], index) => {
      const count = list.length;
      const percentage = (count / total) * 100;
      const wildCardCount = list.filter((m) => m.isWildCard).length;
      const sumToughness = list.reduce(
        (acc, cur) => acc + parseToughnessNumber(cur.toughness),
        0
      );
      const avgToughness = Math.round((sumToughness / count) * 10) / 10;
      const color = FANTASY_PALETTE[index % FANTASY_PALETTE.length];

      return {
        id: label,
        label,
        count,
        percentage,
        monsters: list,
        wildCardCount,
        avgToughness,
        color,
      };
    });

    // Sort descending by count
    return entries.sort((a, b) => b.count - a.count);
  }, [monsters, groupingMode]);

  // Active slice for detail card (either selected or first item by default)
  const activeSlice = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    if (hoveredSliceId) {
      const found = chartData.find((d) => d.id === hoveredSliceId);
      if (found) return found;
    }
    if (selectedSliceId) {
      const found = chartData.find((d) => d.id === selectedSliceId);
      if (found) return found;
    }
    return chartData[0];
  }, [chartData, hoveredSliceId, selectedSliceId]);

  // Overall statistics summary
  const summaryStats = useMemo(() => {
    const total = monsters.length;
    const wildCards = monsters.filter((m) => m.isWildCard).length;
    const extras = total - wildCards;
    const dominantType = chartData.length > 0 ? chartData[0] : null;
    return {
      total,
      wildCards,
      extras,
      wildCardsPercent: total > 0 ? Math.round((wildCards / total) * 100) : 0,
      dominantType,
    };
  }, [monsters, chartData]);

  // D3 Chart Render Effect
  useEffect(() => {
    if (!isOpen || !svgRef.current || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean previous render

    const width = 360;
    const height = 360;
    const margin = 16;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.56; // Donut style
    const hoverOuterRadius = radius + 8;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Add subtle ambient drop shadow / glow filter
    const defs = svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'pie-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // D3 Pie generator
    const pie = d3
      .pie<StatSlice>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.025);

    // D3 Arc generator
    const arc = d3
      .arc<d3.PieArcDatum<StatSlice>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<d3.PieArcDatum<StatSlice>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(hoverOuterRadius)
      .cornerRadius(6);

    const pieData = pie(chartData);

    // Render slices
    const slices = g
      .selectAll<SVGPathElement, d3.PieArcDatum<StatSlice>>('path')
      .data(pieData)
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'var(--bg-card, #0c0a09)')
      .attr('stroke-width', 2.5)
      .attr('class', 'transition-all duration-200 cursor-pointer')
      .style('opacity', (d) => {
        if (!selectedSliceId && !hoveredSliceId) return 0.92;
        const targetId = hoveredSliceId || selectedSliceId;
        return d.data.id === targetId ? 1 : 0.45;
      });

    // Tooltip and interactivity events
    slices
      .on('mouseover', function (event, d) {
        setHoveredSliceId(d.data.id);
        d3.select(this)
          .transition()
          .duration(180)
          .attr('d', arcHover as any)
          .style('opacity', 1)
          .attr('stroke', '#fef3c7')
          .attr('stroke-width', 3)
          .attr('filter', 'url(#pie-glow)');

        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.innerHTML = `
            <div class="font-cinzel font-bold text-amber-200 text-xs">${d.data.label}</div>
            <div class="text-[11px] text-stone-300 font-sans mt-0.5">
              <span class="font-bold text-white">${d.data.count}</span> monstros (${d.data.percentage.toFixed(1)}%)
            </div>
          `;
        }
      })
      .on('mousemove', function (event) {
        if (tooltipRef.current && svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          tooltipRef.current.style.left = `${x + 12}px`;
          tooltipRef.current.style.top = `${y - 28}px`;
        }
      })
      .on('mouseout', function (event, d) {
        setHoveredSliceId(null);
        d3.select(this)
          .transition()
          .duration(180)
          .attr('d', arc as any)
          .style('opacity', selectedSliceId && selectedSliceId !== d.data.id ? 0.45 : 0.92)
          .attr('stroke', 'var(--bg-card, #0c0a09)')
          .attr('stroke-width', 2.5)
          .attr('filter', null);

        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
      })
      .on('click', function (event, d) {
        setSelectedSliceId((prev) => (prev === d.data.id ? null : d.data.id));
      });

    // Center Donut Display
    const centerGroup = g.append('g').attr('class', 'pointer-events-none');

    // Display hovered or selected slice in center, or total count
    const centerSlice = chartData.find(
      (d) => d.id === (hoveredSliceId || selectedSliceId)
    );

    if (centerSlice) {
      centerGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-12')
        .attr('class', 'fill-stone-400 font-cinzel text-[11px] tracking-wider uppercase font-semibold')
        .text(centerSlice.label.length > 16 ? centerSlice.label.slice(0, 14) + '…' : centerSlice.label);

      centerGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '14')
        .attr('class', 'fill-amber-300 font-cinzel text-2xl font-bold')
        .text(`${centerSlice.count}`);

      centerGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '32')
        .attr('class', 'fill-stone-400 font-mono text-[11px]')
        .text(`${centerSlice.percentage.toFixed(1)}% do total`);
    } else {
      centerGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-12')
        .attr('class', 'fill-stone-400 font-cinzel text-[10px] tracking-widest uppercase')
        .text('Total de Criaturas');

      centerGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '14')
        .attr('class', 'fill-amber-300 font-cinzel text-3xl font-bold')
        .text(summaryStats.total);

      centerGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '32')
        .attr('class', 'fill-stone-400 font-cinzel text-[10px]')
        .text(`${chartData.length} categorias`);
    }
  }, [isOpen, chartData, selectedSliceId, hoveredSliceId, summaryStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-stone-950 border border-amber-600/50 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl shadow-amber-950/50 relative overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/80 border border-amber-600/60 rounded-xl text-amber-400 shadow-inner">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-amber-200">
                  Painel Estatístico do Bestiário
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300">
                  <Sparkles className="w-3 h-3" /> D3 Data Viz
                </span>
              </div>
              <p className="text-xs text-stone-400 font-crimson">
                Distribuição quantitativa e taxonômica das criaturas catalogadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded-lg transition-colors"
            title="Fechar Painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 pb-2 shrink-0">
          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-700/40">
              <Skull className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider">Criaturas</div>
              <div className="font-cinzel font-bold text-base text-amber-200">{summaryStats.total}</div>
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider">Tipos / Raças</div>
              <div className="font-cinzel font-bold text-base text-emerald-300">{chartData.length}</div>
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/60 text-red-400 border border-red-700/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider">Cartas Selvagens</div>
              <div className="font-cinzel font-bold text-base text-red-300">
                {summaryStats.wildCards} <span className="text-[11px] text-stone-400 font-normal">({summaryStats.wildCardsPercent}%)</span>
              </div>
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-700/40">
              <Award className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider truncate">Mais Comum</div>
              <div className="font-cinzel font-bold text-xs sm:text-sm text-purple-200 truncate">
                {summaryStats.dominantType ? summaryStats.dominantType.label : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* View Dimension Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-3 pt-1 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-cinzel text-stone-400 mr-1 hidden sm:inline">Dimensão:</span>
            <button
              onClick={() => {
                setGroupingMode('race');
                setSelectedSliceId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all flex items-center gap-1.5 ${
                groupingMode === 'race'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Por Tipo / Raça</span>
            </button>

            <button
              onClick={() => {
                setGroupingMode('archetype');
                setSelectedSliceId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all flex items-center gap-1.5 ${
                groupingMode === 'archetype'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Por Arquétipo</span>
            </button>

            <button
              onClick={() => {
                setGroupingMode('sourcebook');
                setSelectedSliceId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all flex items-center gap-1.5 ${
                groupingMode === 'sourcebook'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Por Suplemento</span>
            </button>

            <button
              onClick={() => {
                setGroupingMode('rank');
                setSelectedSliceId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all flex items-center gap-1.5 ${
                groupingMode === 'rank'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Por Rank</span>
            </button>
          </div>

          {selectedSliceId && (
            <button
              onClick={() => setSelectedSliceId(null)}
              className="text-amber-400 hover:text-amber-300 text-xs font-cinzel underline underline-offset-2"
            >
              Limpar seleção
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3 overflow-y-auto pr-1 flex-1">
          {/* Left Column: D3 Pie Chart Canvas */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-3 bg-stone-900/50 rounded-xl border border-stone-800/80 relative">
            <div className="w-full max-w-[340px] aspect-square relative flex items-center justify-center">
              <svg
                ref={svgRef}
                className="w-full h-full filter drop-shadow-md select-none"
              />
              {/* Dynamic Mouse Tooltip */}
              <div
                ref={tooltipRef}
                className="absolute pointer-events-none opacity-0 transition-opacity duration-150 bg-stone-950/95 border border-amber-600/70 p-2 rounded-lg shadow-xl shadow-black/80 z-20"
                style={{ top: 0, left: 0 }}
              />
            </div>
            <p className="text-[11px] text-stone-400 font-crimson text-center mt-2">
              Passe o mouse ou clique nas fatias para inspecionar os detalhes
            </p>
          </div>

          {/* Right Column: Legend List & Active Details */}
          <div className="md:col-span-6 flex flex-col space-y-4">
            {/* Active Slice Highlight Banner */}
            {activeSlice ? (
              <div className="bg-stone-900/90 border border-stone-700/80 rounded-xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-stone-950 shrink-0"
                      style={{ backgroundColor: activeSlice.color }}
                    />
                    <h3 className="font-cinzel font-bold text-sm text-stone-100">
                      {activeSlice.label}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/50">
                    {activeSlice.count} {activeSlice.count === 1 ? 'monstro' : 'monstros'} ({activeSlice.percentage.toFixed(1)}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-stone-950/70 p-2 rounded-lg border border-stone-800 text-stone-300">
                    <span className="text-[10px] text-stone-400 block font-cinzel">Cartas Selvagens</span>
                    <span className="font-bold text-red-300">{activeSlice.wildCardCount}</span>
                    <span className="text-stone-400 text-[10px] ml-1">
                      ({activeSlice.count > 0 ? Math.round((activeSlice.wildCardCount / activeSlice.count) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="bg-stone-950/70 p-2 rounded-lg border border-stone-800 text-stone-300">
                    <span className="text-[10px] text-stone-400 block font-cinzel">Resistência Média</span>
                    <span className="font-bold text-amber-200">{activeSlice.avgToughness}</span>
                  </div>
                </div>

                {/* Exemplars from this category */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider block">
                    Exemplos catalogados ({activeSlice.monsters.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {activeSlice.monsters.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-stone-300 hover:border-amber-600/50 hover:text-amber-200 transition-colors"
                      >
                        {m.isWildCard && <span className="text-red-400 font-bold" title="Carta Selvagem">★</span>}
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action button: filter by this race in the bestiary */}
                {groupingMode === 'race' && onApplyRaceFilter && (
                  <button
                    onClick={() => {
                      onApplyRaceFilter(activeSlice.label);
                      onClose();
                    }}
                    className="mt-3 w-full py-1.5 px-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 hover:border-amber-500 rounded-lg text-amber-200 text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    <span>Filtrar "{activeSlice.label}" no Bestiário</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
              </div>
            ) : null}

            {/* Interactive Legend Grid */}
            <div className="flex-1 flex flex-col space-y-2">
              <span className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider">
                Distribuição Completa ({chartData.length} categorias)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {chartData.map((slice) => {
                  const isSelected = selectedSliceId === slice.id || hoveredSliceId === slice.id;
                  return (
                    <button
                      key={slice.id}
                      onClick={() =>
                        setSelectedSliceId((prev) => (prev === slice.id ? null : slice.id))
                      }
                      onMouseEnter={() => setHoveredSliceId(slice.id)}
                      onMouseLeave={() => setHoveredSliceId(null)}
                      className={`p-2 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/80 shadow-sm'
                          : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-cinzel text-stone-200 truncate font-semibold">
                          {slice.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                        <span className="font-bold text-amber-300">{slice.count}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {slice.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500 font-crimson hidden sm:inline">
            Clique em qualquer categoria ou fatia para detalhar seus monstros
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-cinzel font-bold text-xs rounded-xl shadow-md shadow-amber-900/30 transition-all ml-auto"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
