import React, { useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';
import { StockData } from '../types';
import { detectDivergences, detectMACDDivergences, Divergence } from '../services/divergenceService';
import { detectElliottWaves } from '../services/elliottWaveService';
import { detectVolumeSpikes } from '../services/volumeService';
import { cn } from '../utils/cn';
import { Download, Play, Pause, TrendingUp, HelpCircle, Ghost, AlertTriangle, Target, X } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { SRZone } from '../services/smartSRService';
import { ScenarioResult } from '../services/scenarioService';

interface ChartProps {
  symbol: string;
  data: StockData[];
  showVWAP: boolean;
  showOBV: boolean;
  showVolume: boolean;
  showEMAX: boolean;
  showEMA20?: boolean;
  showEMA50?: boolean;
  showRSI?: boolean;
  showMACD?: boolean;
  showElliottWaves?: boolean;
  showVolumeSpikes?: boolean;
  showIchimoku?: boolean;
  showMoneyFlow?: boolean;
  isInvertedY?: boolean;
  chartType: 'line' | 'candlestick';
  onHover: (data: StockData | null) => void;
  onRightClick: (data: StockData, x: number, y: number) => void;
  onElliottWaveClick?: (data: StockData, label: string) => void;
  resetTrigger: number;
  isSimulationMode?: boolean;
  isSmartSRMode?: boolean;
  isScenarioMode?: boolean;
  scenarioResult?: ScenarioResult | null;
  selectedSRDate?: string | null;
  onSelectSRDate?: (date: string) => void;
  srZones?: SRZone[];
  srGuidance?: string;
  revealIndex?: number;
  isRevealing?: boolean;
  onToggleReveal?: () => void;
  theme?: 'light' | 'dark';
  isLogScale?: boolean;
  showSaveImage?: boolean;
  isFullscreen?: boolean;
}

export interface TradingChartHandle {
  saveAsImage: () => void;
}

export const TradingChart = forwardRef<TradingChartHandle, ChartProps>(({
  symbol,
  data,
  showVWAP,
  showOBV,
  showVolume,
  showEMAX,
  showEMA20,
  showEMA50,
  showRSI,
  showMACD,
  showElliottWaves,
  showVolumeSpikes,
  showIchimoku,
  showMoneyFlow,
  isInvertedY,
  chartType,
  onHover,
  onRightClick,
  onElliottWaveClick,
  resetTrigger,
  isSimulationMode,
  isSmartSRMode,
  isScenarioMode,
  scenarioResult,
  selectedSRDate,
  onSelectSRDate,
  srZones,
  srGuidance,
  revealIndex = 0,
  isRevealing,
  onToggleReveal,
  theme,
  isLogScale,
  showSaveImage = true,
  isFullscreen
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDark = theme === 'dark';
  
  const [activeDivergence, setActiveDivergence] = React.useState<{
    div: Divergence;
    x: number;
    y: number;
    containerWidth: number;
  } | null>(null);

  const rsiDivergences = useMemo(() => detectDivergences(data, 60), [data]);
  const macdDivergences = useMemo(() => detectMACDDivergences(data, 60), [data]);
  
  const elliottWaveData = useMemo(() => {
    if (!showElliottWaves) return data;
    return detectElliottWaves(data);
  }, [data, showElliottWaves]);

  const volumeSpikeData = useMemo(() => {
    if (!showVolumeSpikes) return data;
    return detectVolumeSpikes(data);
  }, [data, showVolumeSpikes]);

  // Merge data with indicators
  const processedData = useMemo(() => {
    let d = [...data];
    if (showElliottWaves) {
      d = detectElliottWaves(d);
    }
    if (showVolumeSpikes) {
      d = detectVolumeSpikes(d);
    }
    return d;
  }, [data, showElliottWaves, showVolumeSpikes]);

  // Draggable Tooltip State
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Center tooltip when it opens
  useEffect(() => {
    if (activeDivergence) {
      const centerX = window.innerWidth / 2 - 150; 
      const centerY = window.innerHeight / 2 - 100;
      setTooltipPos({ x: centerX, y: centerY });
    }
  }, [activeDivergence]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - tooltipPos.x,
      y: e.clientY - tooltipPos.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTooltipPos({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse up listener to stop dragging even if mouse leaves tooltip
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove as any);
    } else {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove as any);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove as any);
    };
  }, [isDragging]);

  const stateRef = useRef({
    zoom: d3.zoomIdentity,
    isYAuto: true,
    yDomain: [0, 0] as [number, number],
    xDomain: [0, 0] as [number, number],
    lastTransform: d3.zoomIdentity,
    lastDataLength: 0
  });

  const [paneHeights, setPaneHeights] = React.useState({
    volume: 80,
    rsi: 80,
    macd: 80,
    obv: 80,
    moneyFlow: 100
  });

  // Reset pane heights when fullscreen changes
  useEffect(() => {
    const defaultHeight = isFullscreen ? 150 : 80;
    setPaneHeights({
      volume: defaultHeight,
      rsi: defaultHeight,
      macd: defaultHeight,
      obv: defaultHeight,
      moneyFlow: isFullscreen ? 180 : 100
    });
  }, [isFullscreen]);

  const lastResetRef = useRef(0);

  const saveAsImage = async () => {
    if (!containerRef.current) return;
    
    try {
      // Add branding and info overlay directly to the container temporarily
      const overlay = document.createElement('div');
      overlay.id = 'temp-export-overlay';
      overlay.style.position = 'absolute';
      overlay.style.bottom = '10px';
      overlay.style.right = '20px';
      overlay.style.textAlign = 'right';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '100';
      
      const brand = document.createElement('div');
      brand.innerText = 'CrossVision';
      brand.style.fontSize = '24px';
      brand.style.fontWeight = '900';
      brand.style.color = isDark ? '#fff' : '#000';
      brand.style.opacity = '0.8';
      brand.style.letterSpacing = '-1px';
      
      const subBrand = document.createElement('div');
      subBrand.innerText = 'See the Cross before it happens.';
      subBrand.style.fontSize = '10px';
      subBrand.style.fontWeight = '700';
      subBrand.style.color = '#f43f5e';
      subBrand.style.textTransform = 'uppercase';
      subBrand.style.letterSpacing = '1px';

      overlay.appendChild(brand);
      overlay.appendChild(subBrand);
      containerRef.current.appendChild(overlay);

      // Add Stock Info
      const info = document.createElement('div');
      info.id = 'temp-export-info';
      info.style.position = 'absolute';
      info.style.top = '20px';
      info.style.left = '20px';
      info.style.zIndex = '100';
      
      const stockName = document.createElement('div');
      stockName.innerText = symbol;
      stockName.style.fontSize = '32px';
      stockName.style.fontWeight = '900';
      stockName.style.color = isDark ? '#fff' : '#000';
      
      const timestamp = document.createElement('div');
      timestamp.innerText = format(new Date(), 'dd MMM yyyy HH:mm:ss');
      timestamp.style.fontSize = '12px';
      timestamp.style.fontWeight = '700';
      timestamp.style.color = '#94a3b8';
      timestamp.style.marginTop = '4px';

      const indicators = document.createElement('div');
      const activeIndicators = [];
      if (showVWAP) activeIndicators.push('VWAP');
      if (showEMAX) activeIndicators.push('EMA 50/135');
      if (showOBV) activeIndicators.push('OBV');
      if (showVolume) activeIndicators.push('Volume');
      indicators.innerText = 'Indicators: ' + (activeIndicators.length > 0 ? activeIndicators.join(', ') : 'None');
      indicators.style.fontSize = '10px';
      indicators.style.fontWeight = '700';
      indicators.style.color = '#94a3b8';
      indicators.style.textTransform = 'uppercase';
      indicators.style.marginTop = '4px';

      info.appendChild(stockName);
      info.appendChild(timestamp);
      info.appendChild(indicators);
      containerRef.current.appendChild(info);

      // Hide floating UI temporarily
      const floatingUIs = containerRef.current.querySelectorAll('.absolute.z-30');
      floatingUIs.forEach((el: any) => el.style.display = 'none');

      const dataUrl = await domToPng(containerRef.current, {
        backgroundColor: isDark ? '#09090b' : '#ffffff',
        scale: 2 // Higher quality
      });

      // Restore UI
      floatingUIs.forEach((el: any) => el.style.display = '');
      containerRef.current.removeChild(overlay);
      containerRef.current.removeChild(info);

      const link = document.createElement('a');
      link.download = `CrossVision_${symbol}_${format(new Date(), 'yyyyMMdd_HHmmss')}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (err) {
      console.error('Failed to save chart:', err);
      // Ensure cleanup on error
      const overlay = document.getElementById('temp-export-overlay');
      const info = document.getElementById('temp-export-info');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (info && info.parentNode) info.parentNode.removeChild(info);
      const saveBtn = containerRef.current?.querySelector('button');
      if (saveBtn) saveBtn.style.display = '';
    }
  };

  useImperativeHandle(ref, () => ({
    saveAsImage
  }));

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;

    // Reset if data length changed significantly or reset triggered
    if (Math.abs(data.length - stateRef.current.lastDataLength) > 10 || resetTrigger !== lastResetRef.current) {
      stateRef.current.yDomain = [0, 0];
      stateRef.current.xDomain = [0, 0];
      stateRef.current.lastDataLength = data.length;
      lastResetRef.current = resetTrigger;
    }

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Layout configuration
    const margin = { top: 20, right: 60, bottom: 30, left: 10 };
    
    // Sub-panes height
    const gap = 20;
    
    let mainAreaHeight = height - margin.top - margin.bottom;
    if (showOBV) mainAreaHeight -= (paneHeights.obv + gap);
    if (showVolume) mainAreaHeight -= (paneHeights.volume + gap);
    if (showRSI) mainAreaHeight -= (paneHeights.rsi + gap);
    if (showMACD) mainAreaHeight -= (paneHeights.macd + gap);
    if (showMoneyFlow) mainAreaHeight -= (paneHeights.moneyFlow + gap);

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // RSI Gradient
    const defs = svg.append('defs');
    const rsiGradient = defs.append('linearGradient')
      .attr('id', 'rsi-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', paneHeights.rsi);

    rsiGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444'); // Overbought (Top)
    rsiGradient.append('stop').attr('offset', '30%').attr('stop-color', '#ef4444');
    rsiGradient.append('stop').attr('offset', '30%').attr('stop-color', '#f59e0b'); // Neutral
    rsiGradient.append('stop').attr('offset', '70%').attr('stop-color', '#f59e0b');
    rsiGradient.append('stop').attr('offset', '70%').attr('stop-color', '#10b981'); // Oversold (Bottom)
    rsiGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

    // Spike Glow Gradient
    const spikeGlow = defs.append('radialGradient')
      .attr('id', 'spike-glow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    
    spikeGlow.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.6);
    spikeGlow.append('stop').attr('offset', '100%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0);

    // Scales
    const xMax = isScenarioMode && scenarioResult ? data.length + scenarioResult.candles.length + 5 : data.length - 1;
    const x = d3.scaleLinear()
      .domain([0, xMax])
      .range([margin.left, width - margin.right]);

    const y = isLogScale 
      ? d3.scaleLog().clamp(true)
      : d3.scaleLinear();
    
    y.range(isInvertedY ? [margin.top, mainAreaHeight + margin.top] : [mainAreaHeight + margin.top, margin.top]);

    // Initial domains and zoom
    const pointsToShow = 100;
    const totalPoints = isScenarioMode && scenarioResult ? data.length + scenarioResult.candles.length : data.length;
    const initialK = Math.min(5000, Math.max(1, totalPoints / pointsToShow));
    
    if (stateRef.current.xDomain[0] === 0 || (isScenarioMode && stateRef.current.xDomain[1] < data.length)) {
      // Set initial zoom to show the last part including ghost candles
      const k = initialK;
      const tx = (width - margin.right) * (1 - k);
      stateRef.current.lastTransform = d3.zoomIdentity.translate(tx, 0).scale(k);
      
      const currentX = stateRef.current.lastTransform.rescaleX(x);
      const [xStart, xEnd] = currentX.domain();
      stateRef.current.xDomain = [xStart, xEnd];
      
      const visible = data.filter((_, i) => i >= xStart && i <= xEnd);
      if (visible.length > 0) {
        let min = d3.min(visible, (d: StockData) => d.low) ?? 0;
        let max = d3.max(visible, (d: StockData) => d.high) ?? 0;

        // Include Ichimoku values in domain if enabled
        if (showIchimoku) {
          const ichimokuValues = visible.flatMap(d => [
            d.tenkanSen, 
            d.kijunSen, 
            d.senkouSpanA, 
            d.senkouSpanB, 
            d.chikouSpan
          ].filter(v => v !== undefined && !isNaN(v)) as number[]);
          
          if (ichimokuValues.length > 0) {
            min = Math.min(min, ...ichimokuValues);
            max = Math.max(max, ...ichimokuValues);
          }
        }

        const padding = Math.max((max - min) * 0.15, min * 0.001);
        let finalMin = min - padding;
        let finalMax = max + padding;
        if (isLogScale) {
          finalMin = Math.max(0.01, finalMin);
          finalMax = Math.max(0.02, finalMax);
        }
        stateRef.current.yDomain = [finalMin, finalMax];
      }
    }

    y.domain(stateRef.current.yDomain);

    // Clip path for main chart
    svg.append('defs').append('clipPath')
      .attr('id', 'main-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', mainAreaHeight);

    const g = svg.append('g');
    
    // Watermark
    const latestData = data[data.length - 1];
    const latestDate = latestData ? new Date(latestData.date) : new Date();
    const formattedDate = format(latestDate, "d MMMM yyyy 'Time' HH.mm");

    g.append('text')
      .attr('x', width / 2)
      .attr('y', mainAreaHeight / 2 + margin.top - 20)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('class', cn(
        "text-[120px] font-black uppercase tracking-tighter select-none pointer-events-none opacity-[0.03]",
        isDark ? "fill-white" : "fill-black"
      ))
      .text(symbol);

    g.append('text')
      .attr('x', width / 2)
      .attr('y', mainAreaHeight / 2 + margin.top + 60)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('class', cn(
        "text-[24px] font-bold uppercase tracking-widest select-none pointer-events-none opacity-[0.05]",
        isDark ? "fill-white" : "fill-black"
      ))
      .text(formattedDate);

    const chartContent = g.append('g').attr('clip-path', 'url(#main-clip)');

    // Grid lines
    const makeYGridlines = () => d3.axisLeft(y).ticks(10);
    g.append('g')
      .attr('class', `grid ${isDark ? 'text-zinc-800' : 'text-zinc-100'} opacity-20`)
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(makeYGridlines().tickSize(-(width - margin.left - margin.right)).tickFormat(() => ''));

    // Axes
    const xAxis = d3.axisBottom(x)
      .ticks(width / 100)
      .tickFormat(i => {
        const d = data[i as number];
        return d ? format(new Date(d.date), 'MMM dd') : '';
      });

    const yAxis = d3.axisRight(y)
      .ticks(10, isLogScale ? "~g" : ".2f");

    const gx = svg.append('g')
      .attr('transform', `translate(0, ${mainAreaHeight + margin.top})`)
      .attr('class', 'text-zinc-400 font-bold text-[10px]')
      .call(xAxis);

    const gy = svg.append('g')
      .attr('transform', `translate(${width - margin.right}, 0)`)
      .attr('class', 'text-zinc-400 font-bold text-[10px]')
      .call(yAxis);

    const draw = (xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) => {
      chartContent.selectAll('*').remove();
      
      // Use processedData for drawing
      const drawData = processedData;

      const [xStart, xEnd] = xScale.domain();
      const selectedIdx = isSmartSRMode && selectedSRDate ? drawData.findIndex(d => d.date === selectedSRDate) : -1;
      const maxIdx = selectedIdx !== -1 ? selectedIdx + revealIndex : drawData.length - 1;

      const visibleData: StockData[] = drawData.filter((d, i) => {
        if (i < xStart - 5 || i > xEnd + 5) return false;
        if (isSmartSRMode && selectedSRDate && i > maxIdx) return false;
        return true;
      });

      const indicatorData = drawData.filter((d, i) => {
        if (i < xStart - 50 || i > xEnd + 50) return false;
        if (i > maxIdx) return false;
        return true;
      });

      // Elliott Wave Lines
      if (showElliottWaves) {
        const waveGroups = new Map<string, { index: number, data: StockData }[]>();
        drawData.forEach((d, i) => {
          if (d.elliottWaveId) {
            if (!waveGroups.has(d.elliottWaveId)) {
              waveGroups.set(d.elliottWaveId, []);
            }
            waveGroups.get(d.elliottWaveId)!.push({ index: i, data: d });
          }
        });

        waveGroups.forEach((points) => {
           points.sort((a, b) => a.index - b.index);
           
           const getPrice = (d: StockData) => {
              const label = d.elliottWaveLabel || '';
              if (['1', '3', '5', '5?', 'B'].includes(label)) return d.high;
              if (['(0)', '2', '4', 'A', 'C'].includes(label)) return d.low;
              return d.close;
           };

           const lineGenerator = d3.line<{ index: number, data: StockData }>()
             .x(p => xScale(p.index))
             .y(p => yScale(getPrice(p.data)));
             
           const type = points[0].data.elliottWaveType;
           const isImpulse = type === 'impulse';
           const color = isImpulse ? '#10b981' : '#ef4444';
           
           chartContent.append('path')
             .datum(points)
             .attr('d', lineGenerator)
             .attr('fill', 'none')
             .attr('stroke', color)
             .attr('stroke-width', 2)
             .attr('stroke-dasharray', isImpulse ? 'none' : '4,4')
             .attr('opacity', 0.6);
        });
      }

      if (chartType === 'line') {
        // Multi-colored line segments
        for (let i = 1; i < drawData.length; i++) {
          const d1 = drawData[i - 1];
          const d2 = drawData[i];
          if (i < xStart - 1 || i > xEnd + 1) continue;
          if (isSmartSRMode && selectedSRDate && i > maxIdx) continue;
          if (isNaN(d1.close) || isNaN(d2.close)) continue;

          chartContent.append('line')
            .attr('x1', xScale(i - 1))
            .attr('y1', yScale(d1.close))
            .attr('x2', xScale(i))
            .attr('y2', yScale(d2.close))
            .attr('stroke', d2.isSimulated ? '#f43f5e' : (d2.color || '#94a3b8'))
            .attr('stroke-width', 2.5)
            .attr('stroke-linecap', 'round')
            .attr('stroke-dasharray', d2.isSimulated ? '4,4' : 'none');
        }
      } else {
        // Candlesticks
        const candleWidth = Math.max(1, (width / (xEnd - xStart)) * 0.7);
        visibleData.forEach(d => {
          if (isNaN(d.open) || isNaN(d.close)) return;
          const idx = drawData.indexOf(d);
          const color = d.close >= d.open ? '#10b981' : '#ef4444';
          
          // Volume Spike Effect (Old Money Tracker)
          if (showVolumeSpikes && d.isVolumeSpike) {
             // Glow effect
             chartContent.append('rect')
               .attr('x', xScale(idx) - candleWidth)
               .attr('y', yScale(d.high) - 10)
               .attr('width', candleWidth * 2)
               .attr('height', Math.abs(yScale(d.low) - yScale(d.high)) + 20)
               .attr('fill', 'url(#spike-glow)') // We need to define this gradient
               .attr('opacity', 0.5)
               .attr('filter', 'blur(4px)');
             
             // Sparkle/Star icon above high
             chartContent.append('text')
               .attr('x', xScale(idx))
               .attr('y', yScale(d.high) - 15)
               .attr('text-anchor', 'middle')
               .attr('class', 'text-[10px] fill-amber-400 animate-pulse')
               .text('✨');
          }

          // Order Block Visualization
          if (showVolumeSpikes && d.isOrderBlock) {
             const obColor = d.close > d.open ? '#10b981' : '#ef4444'; // Bullish or Bearish OB
             // Extend rectangle to the right
             chartContent.append('rect')
               .attr('x', xScale(idx))
               .attr('y', yScale(d.high))
               .attr('width', width - xScale(idx)) // Extend to end of chart
               .attr('height', Math.abs(yScale(d.high) - yScale(d.low)))
               .attr('fill', obColor)
               .attr('opacity', 0.1)
               .attr('stroke', obColor)
               .attr('stroke-width', 0.5)
               .attr('stroke-dasharray', '2,2');
             
             chartContent.append('text')
               .attr('x', xScale(idx) + 5)
               .attr('y', yScale(d.high) - 5)
               .attr('class', 'text-[8px] font-bold fill-zinc-500 opacity-50')
               .text('OB');
          }

          chartContent.append('line')
            .attr('x1', xScale(idx))
            .attr('x2', xScale(idx))
            .attr('y1', yScale(d.low))
            .attr('y2', yScale(d.high))
            .attr('stroke', color)
            .attr('stroke-width', 1);

          chartContent.append('rect')
            .attr('x', xScale(idx) - candleWidth / 2)
            .attr('y', yScale(Math.max(d.open, d.close)))
            .attr('width', candleWidth)
            .attr('height', Math.abs(yScale(d.open) - yScale(d.close)) || 1)
            .attr('fill', color)
            .attr('opacity', d.isSimulated ? 0.5 : 1)
            .attr('stroke', d.isSimulated ? '#f43f5e' : 'none')
            .attr('stroke-width', d.isSimulated ? 1 : 0);
            
          // Elliott Wave Labels
          if (showElliottWaves && d.elliottWaveLabel) {
            const isTop = d.elliottWaveLabel.match(/[135B]/) || (d.elliottWaveLabel === 'C' && d.close > d.open); // Heuristic for placement
            const yPos = isTop ? yScale(d.high) - 15 : yScale(d.low) + 25;
            
            const isImpulse = d.elliottWaveType === 'impulse';
            const strokeColor = isDark 
              ? (isImpulse ? '#10b981' : '#ef4444') 
              : (isImpulse ? '#059669' : '#dc2626');
            const fillColor = isDark 
              ? (isImpulse ? '#064e3b' : '#7f1d1d') 
              : (isImpulse ? '#d1fae5' : '#fee2e2');
            const textColor = isDark 
              ? (isImpulse ? '#34d399' : '#f87171') 
              : (isImpulse ? '#059669' : '#dc2626');

            const group = chartContent.append('g')
              .attr('class', 'cursor-pointer hover:opacity-80 transition-opacity')
              .on('click', (event) => {
                event.stopPropagation();
                if (onElliottWaveClick && d.elliottWaveLabel) {
                  onElliottWaveClick(d, d.elliottWaveLabel);
                }
              });

             // Circle background for label
             group.append('circle')
               .attr('cx', xScale(idx))
               .attr('cy', yPos - 4)
               .attr('r', 8)
               .attr('fill', fillColor)
               .attr('opacity', 0.9)
               .attr('stroke', strokeColor)
               .attr('stroke-width', 1);

            group.append('text')
              .attr('x', xScale(idx))
              .attr('y', yPos)
              .attr('text-anchor', 'middle')
              .attr('class', 'text-[10px] font-black font-mono select-none')
              .attr('fill', textColor)
              .text(d.elliottWaveLabel);

            if (d.elliottWaveConfidence !== undefined) {
               const confY = isTop ? yPos - 12 : yPos + 12;
               group.append('text')
                 .attr('x', xScale(idx))
                 .attr('y', confY)
                 .attr('text-anchor', 'middle')
                 .attr('class', 'text-[6px] font-mono select-none opacity-70')
                 .attr('fill', textColor)
                 .text(`${d.elliottWaveConfidence}%`);
            }
          }

          // Projection Line
          if (showElliottWaves && d.elliottWaveProjection) {
            const proj = d.elliottWaveProjection;
            const startX = xScale(idx);
            const startY = yScale(d.close);
            const endX = xScale(idx + 20); // Project 20 bars ahead
            const endY = yScale(proj.targetPrice);

            // Dashed Projection Line
            chartContent.append('line')
              .attr('x1', startX)
              .attr('y1', startY)
              .attr('x2', endX)
              .attr('y2', endY)
              .attr('stroke', isDark ? '#a855f7' : '#9333ea') // Purple for projection
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '4,4')
              .attr('opacity', 0.8);

            // Target Label
            chartContent.append('text')
              .attr('x', endX + 5)
              .attr('y', endY)
              .attr('dominant-baseline', 'middle')
              .attr('class', 'text-[10px] font-bold font-mono fill-purple-500')
              .text(`${proj.waveLabel}: ${proj.targetPrice.toFixed(2)}`);
          }
        });
      }

      if (showVWAP) {
        const vwapLine = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => yScale(d.vwap || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(indicatorData)
          .attr('fill', 'none')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '6,3')
          .attr('d', vwapLine);
      }

      if (showEMA20) {
        const ema20Line = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => yScale(d.ema20 || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(indicatorData.filter(d => d.ema20))
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 1.5)
          .attr('d', ema20Line);
      }

      if (showEMA50) {
        const ema50Line = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => yScale(d.ema50 || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(indicatorData.filter(d => d.ema50))
          .attr('fill', 'none')
          .attr('stroke', '#f472b6')
          .attr('stroke-width', 1.5)
          .attr('d', ema50Line);
      }

      if (showEMAX) {
        // EMA 50
        const ema50Line = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => yScale(d.ema50 || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(indicatorData.filter(d => d3.min(data, d => d.ema50) !== 0))
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 1.5)
          .attr('d', ema50Line);

        // EMA 135
        const ema135Line = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => yScale(d.ema135 || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(indicatorData.filter(d => d3.min(data, d => d.ema135) !== 0))
          .attr('fill', 'none')
          .attr('stroke', '#f472b6')
          .attr('stroke-width', 1.5)
          .attr('d', ema135Line);

        // Death Cross Detection in Simulated Data
        if (isSimulationMode) {
          for (let i = 1; i < data.length; i++) {
            const prev = data[i - 1];
            const curr = data[i];
            
            if (curr.isSimulated && prev.ema50 && prev.ema135 && curr.ema50 && curr.ema135) {
              // Death Cross: EMA 50 crosses below EMA 135
              if (prev.ema50 >= prev.ema135 && curr.ema50 < curr.ema135) {
                // Mark Death Cross
                chartContent.append('circle')
                  .attr('cx', xScale(i))
                  .attr('cy', yScale(curr.ema50))
                  .attr('r', 6)
                  .attr('fill', '#ef4444')
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 2);

                chartContent.append('text')
                  .attr('x', xScale(i))
                  .attr('y', yScale(curr.ema50) - 15)
                  .attr('text-anchor', 'middle')
                  .attr('class', 'text-[10px] font-black fill-rose-500 uppercase')
                  .text('Death Cross!');
              }
            }
          }
        }
      }

      // Ichimoku Cloud
      if (showIchimoku) {
        // Green Cloud (Span A > Span B)
        chartContent.append('path')
          .datum(data)
          .attr('fill', 'rgba(34, 197, 94, 0.15)')
          .attr('d', d3.area<StockData>()
            .defined(d => d.senkouSpanA !== undefined && d.senkouSpanB !== undefined && d.senkouSpanA >= d.senkouSpanB)
            .x((d, i) => xScale(i))
            .y0(d => yScale(d.senkouSpanA!))
            .y1(d => yScale(d.senkouSpanB!))
            .curve(d3.curveLinear)
          );

        // Red Cloud (Span A < Span B)
        chartContent.append('path')
          .datum(data)
          .attr('fill', 'rgba(239, 68, 68, 0.15)')
          .attr('d', d3.area<StockData>()
            .defined(d => d.senkouSpanA !== undefined && d.senkouSpanB !== undefined && d.senkouSpanA < d.senkouSpanB)
            .x((d, i) => xScale(i))
            .y0(d => yScale(d.senkouSpanA!))
            .y1(d => yScale(d.senkouSpanB!))
            .curve(d3.curveLinear)
          );
          
        // Tenkan-sen (Red)
        chartContent.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1.5)
          .attr('d', d3.line<StockData>()
            .defined(d => d.tenkanSen !== undefined)
            .x((d, i) => xScale(i))
            .y(d => yScale(d.tenkanSen!))
          );

        // Kijun-sen (Blue)
        chartContent.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 1.5)
          .attr('d', d3.line<StockData>()
            .defined(d => d.kijunSen !== undefined)
            .x((d, i) => xScale(i))
            .y(d => yScale(d.kijunSen!))
          );

        // Chikou Span (Green)
        chartContent.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 1.5)
          .attr('d', d3.line<StockData>()
            .defined(d => d.chikouSpan !== undefined)
            .x((d, i) => xScale(i))
            .y(d => yScale(d.chikouSpan!))
          );
          
        // Span A (Greenish dashed)
        chartContent.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#22c55e')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.5)
          .attr('d', d3.line<StockData>()
            .defined(d => d.senkouSpanA !== undefined)
            .x((d, i) => xScale(i))
            .y(d => yScale(d.senkouSpanA!))
          );

        // Span B (Reddish dashed)
        chartContent.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.5)
          .attr('d', d3.line<StockData>()
            .defined(d => d.senkouSpanB !== undefined)
            .x((d, i) => xScale(i))
            .y(d => yScale(d.senkouSpanB!))
          );
      }

      // Sub-panes
      g.selectAll('.sub-pane').remove();
      let currentY = mainAreaHeight + margin.top + gap + margin.bottom;
      
      if (showOBV) {
        const obvPane = g.append('g').attr('class', 'sub-pane').attr('transform', `translate(0, ${currentY})`);
        const obvMin = d3.min(visibleData, (d: StockData) => d.obv ?? 0) ?? 0;
        const obvMax = d3.max(visibleData, (d: StockData) => d.obv ?? 0) ?? 0;
        
        const obvY = d3.scaleLinear()
          .domain([obvMin, obvMax])
          .range([paneHeights.obv, 0]);

        const obvLine = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => obvY(d.obv || 0));

        obvPane.append('path')
          .datum(data.filter((_, i) => i <= maxIdx))
          .attr('fill', 'none')
          .attr('stroke', '#9333ea')
          .attr('stroke-width', 1.5)
          .attr('d', obvLine);

        obvPane.append('g')
          .attr('transform', `translate(${width - margin.right}, 0)`)
          .attr('class', 'text-zinc-400 font-bold text-[10px]')
          .call(d3.axisRight(obvY).ticks(3));
          
        obvPane.append('text')
          .attr('x', margin.left)
          .attr('y', -5)
          .attr('class', 'text-[10px] font-bold fill-zinc-400')
          .text('OBV');

        currentY += paneHeights.obv + gap;
      }

      if (showVolume) {
        const volPane = g.append('g').attr('class', 'sub-pane').attr('transform', `translate(0, ${currentY})`);
        const maxVol = d3.max(visibleData, (d: StockData) => d.volume) ?? 0;
        const volY = d3.scaleLinear()
          .domain([0, maxVol])
          .range([paneHeights.volume, 0]);

        const barWidth = Math.max(1, (width / (xEnd - xStart)) * 0.8);
        visibleData.forEach(d => {
          const idx = data.indexOf(d);
          volPane.append('rect')
            .attr('x', xScale(idx) - barWidth / 2)
            .attr('y', volY(d.volume))
            .attr('width', barWidth)
            .attr('height', paneHeights.volume - volY(d.volume))
            .attr('fill', d.volumeColor || 'rgba(148, 163, 184, 0.3)');
        });

        volPane.append('g')
          .attr('transform', `translate(${width - margin.right}, 0)`)
          .attr('class', 'text-zinc-400 font-bold text-[10px]')
          .call(d3.axisRight(volY).ticks(3));

        volPane.append('text')
          .attr('x', margin.left)
          .attr('y', -5)
          .attr('class', 'text-[10px] font-bold fill-zinc-400')
          .text('VOLUME');

        currentY += paneHeights.volume + gap;
      }

      if (showRSI) {
        const rsiPane = g.append('g').attr('class', 'sub-pane').attr('transform', `translate(0, ${currentY})`);
        const rsiY = d3.scaleLinear().domain([0, 100]).range([paneHeights.rsi, 0]);

        // RSI Shaded Zone (30-70)
        rsiPane.append('rect')
          .attr('x', margin.left)
          .attr('y', rsiY(70))
          .attr('width', width - margin.left - margin.right)
          .attr('height', rsiY(30) - rsiY(70))
          .attr('fill', isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.03)')
          .attr('stroke', 'none');

        // RSI 70/30 lines
        [30, 70].forEach(level => {
          rsiPane.append('line')
            .attr('x1', margin.left)
            .attr('x2', width - margin.right)
            .attr('y1', rsiY(level))
            .attr('y2', rsiY(level))
            .attr('stroke', level === 70 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4');
          
          rsiPane.append('text')
            .attr('x', width - margin.right + 5)
            .attr('y', rsiY(level))
            .attr('dominant-baseline', 'central')
            .attr('class', 'text-[8px] font-bold fill-zinc-500')
            .text(level);
        });

        const rsiLine = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => rsiY(d.rsi || 50))
          .curve(d3.curveMonotoneX);

        rsiPane.append('path')
          .datum(indicatorData)
          .attr('fill', 'none')
          .attr('stroke', 'url(#rsi-gradient)')
          .attr('stroke-width', 1.5)
          .attr('d', rsiLine);

        // Divergence Detection (Version 3)
        // const divergences = detectDivergences(data, 60); // Moved to useMemo
        
        // Filter divergences to only show those within the visible range (plus some buffer)
        const visibleRSIDivergences = rsiDivergences.filter(div => 
          (div.start.index >= xStart - 10 && div.start.index <= xEnd + 10) || 
          (div.end.index >= xStart - 10 && div.end.index <= xEnd + 10)
        );

        visibleRSIDivergences.forEach(div => {
          const isBullish = div.type.includes('Bullish');
          const color = isBullish ? '#10b981' : '#f43f5e';
          const isHidden = div.type.includes('Hidden');
          const dashArray = isHidden ? '2,2' : '4,2'; // Distinguish hidden vs regular
          
          // Draw on RSI Pane
          rsiPane.append('line')
            .attr('x1', xScale(div.start.index))
            .attr('y1', rsiY(div.start.value))
            .attr('x2', xScale(div.end.index))
            .attr('y2', rsiY(div.end.value))
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', dashArray)
            .attr('opacity', 0.8);

          // Draw on Main Chart
          const line = chartContent.append('line')
            .attr('x1', xScale(div.start.index))
            .attr('y1', yScale(div.start.price))
            .attr('x2', xScale(div.end.index))
            .attr('y2', yScale(div.end.price))
            .attr('stroke', color)
            .attr('stroke-width', 3) // Thicker for easier clicking
            .attr('stroke-dasharray', dashArray)
            .attr('opacity', 0.8)
            .attr('cursor', 'pointer')
            .on('click', (event) => {
              event.stopPropagation();
              const [mx, my] = d3.pointer(event, containerRef.current);
              const containerWidth = containerRef.current?.clientWidth || 800;
              setActiveDivergence({ div, x: mx, y: my, containerWidth });
            });

          // Label
          const label = chartContent.append('text')
            .attr('x', (xScale(div.start.index) + xScale(div.end.index)) / 2)
            .attr('y', yScale(Math.min(div.start.price, div.end.price)) + (isBullish ? 20 : -20))
            .attr('text-anchor', 'middle')
            .attr('class', `text-[9px] font-black uppercase ${isBullish ? 'fill-emerald-500' : 'fill-rose-500'} cursor-pointer select-none`)
            .text(div.type.replace('Bullish', 'BULL').replace('Bearish', 'BEAR'))
            .on('click', (event) => {
              event.stopPropagation();
              const [mx, my] = d3.pointer(event, containerRef.current);
              const containerWidth = containerRef.current?.clientWidth || 800;
              setActiveDivergence({ div, x: mx, y: my, containerWidth });
            });
            
          // Add a transparent hit area for easier clicking
          chartContent.append('line')
            .attr('x1', xScale(div.start.index))
            .attr('y1', yScale(div.start.price))
            .attr('x2', xScale(div.end.index))
            .attr('y2', yScale(div.end.price))
            .attr('stroke', 'transparent')
            .attr('stroke-width', 10)
            .attr('cursor', 'pointer')
            .on('click', (event) => {
              event.stopPropagation();
              const [mx, my] = d3.pointer(event, containerRef.current);
              const containerWidth = containerRef.current?.clientWidth || 800;
              setActiveDivergence({ div, x: mx, y: my, containerWidth });
            });
        });

        // Close tooltip on background click
        svg.on('click', () => setActiveDivergence(null));

        rsiPane.append('g')
          .attr('transform', `translate(${width - margin.right}, 0)`)
          .attr('class', 'text-zinc-400 font-bold text-[10px]')
          .call(d3.axisRight(rsiY).ticks(2));

        rsiPane.append('text')
          .attr('x', margin.left)
          .attr('y', -5)
          .attr('class', 'text-[10px] font-bold fill-zinc-400')
          .text('RSI (14)');

        currentY += paneHeights.rsi + gap;
      }

      if (showMACD) {
        const macdPane = g.append('g').attr('class', 'sub-pane').attr('transform', `translate(0, ${currentY})`);
        
        const macdMin = d3.min(visibleData, (d: any) => Math.min(d.macd || 0, d.macdSignal || 0, d.macdHistogram || 0)) ?? -1;
        const macdMax = d3.max(visibleData, (d: any) => Math.max(d.macd || 0, d.macdSignal || 0, d.macdHistogram || 0)) ?? 1;
        const macdY = d3.scaleLinear().domain([macdMin, macdMax]).range([paneHeights.macd, 0]);

        // Histogram
        const barWidth = Math.max(1, (width / (xEnd - xStart)) * 0.8);
        visibleData.forEach(d => {
          const idx = data.indexOf(d);
          const hist = (d as any).macdHistogram || 0;
          macdPane.append('rect')
            .attr('x', xScale(idx) - barWidth / 2)
            .attr('y', hist >= 0 ? macdY(hist) : macdY(0))
            .attr('width', barWidth)
            .attr('height', Math.abs(macdY(hist) - macdY(0)))
            .attr('fill', hist >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)');
        });

        // MACD Line
        const macdLine = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => macdY((d as any).macd || 0))
          .curve(d3.curveMonotoneX);

        macdPane.append('path')
          .datum(indicatorData)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 1.5)
          .attr('d', macdLine);

        // Signal Line
        const signalLine = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => macdY((d as any).macdSignal || 0))
          .curve(d3.curveMonotoneX);

        macdPane.append('path')
          .datum(indicatorData)
          .attr('fill', 'none')
          .attr('stroke', '#f472b6')
          .attr('stroke-width', 1.5)
          .attr('d', signalLine);

        macdPane.append('g')
          .attr('transform', `translate(${width - margin.right}, 0)`)
          .attr('class', 'text-zinc-400 font-bold text-[10px]')
          .call(d3.axisRight(macdY).ticks(3));

        macdPane.append('text')
          .attr('x', margin.left)
          .attr('y', -5)
          .attr('class', 'text-[10px] font-bold fill-zinc-400')
          .text('MACD (12, 26, 9)');

        // MACD Divergences
        const visibleMACDDivergences = macdDivergences.filter(div => 
          (div.start.index >= xStart - 10 && div.start.index <= xEnd + 10) || 
          (div.end.index >= xStart - 10 && div.end.index <= xEnd + 10)
        );

        visibleMACDDivergences.forEach(div => {
          const isBullish = div.type.includes('Bullish');
          const color = isBullish ? '#10b981' : '#f43f5e';
          const isHidden = div.type.includes('Hidden');
          const dashArray = isHidden ? '2,2' : '4,2';
          
          // Draw on MACD Pane
          macdPane.append('line')
            .attr('x1', xScale(div.start.index))
            .attr('y1', macdY(div.start.value))
            .attr('x2', xScale(div.end.index))
            .attr('y2', macdY(div.end.value))
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', dashArray)
            .attr('opacity', 0.8);

          // Draw on Main Chart
          chartContent.append('line')
            .attr('x1', xScale(div.start.index))
            .attr('y1', yScale(div.start.price))
            .attr('x2', xScale(div.end.index))
            .attr('y2', yScale(div.end.price))
            .attr('stroke', color)
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', dashArray)
            .attr('opacity', 0.8)
            .attr('cursor', 'pointer')
            .on('click', (event) => {
              event.stopPropagation();
              const [mx, my] = d3.pointer(event, containerRef.current);
              const containerWidth = containerRef.current?.clientWidth || 800;
              setActiveDivergence({ div, x: mx, y: my, containerWidth });
            });

          // Label on Main Chart
          chartContent.append('text')
            .attr('x', (xScale(div.start.index) + xScale(div.end.index)) / 2)
            .attr('y', (yScale(div.start.price) + yScale(div.end.price)) / 2 + (isBullish ? 15 : -10))
            .attr('text-anchor', 'middle')
            .attr('class', `text-[9px] font-bold ${isBullish ? 'fill-emerald-500' : 'fill-rose-500'}`)
            .style('pointer-events', 'none')
            .text(`MACD ${div.type.replace(' Divergence', '')}`);
        });

        currentY += paneHeights.macd + gap;
      }

      if (showMoneyFlow) {
        const mfPane = g.append('g')
          .attr('class', 'sub-pane')
          .attr('transform', `translate(0, ${currentY})`);

        // Background
        mfPane.append('rect')
          .attr('x', margin.left)
          .attr('width', width - margin.left - margin.right)
          .attr('height', paneHeights.moneyFlow)
          .attr('fill', isDark ? '#18181b' : '#f4f4f5')
          .attr('opacity', 0.5);

        // Scales
        const maxVol = d3.max(visibleData, d => d.totalDollarVolume || 0) || 0;
        const mfY = d3.scaleLinear()
          .domain([0, maxVol])
          .range([paneHeights.moneyFlow, 0]);

        // Draw Bars
        visibleData.forEach(d => {
          const idx = drawData.indexOf(d);
          const xPos = xScale(idx);
          const barWidth = Math.max(1, (width / (xEnd - xStart)) * 0.7);
          
          if (d.buyDollarVolume !== undefined && d.sellDollarVolume !== undefined && d.totalDollarVolume !== undefined) {
             const buyHeight = paneHeights.moneyFlow - mfY(d.buyDollarVolume);
             const sellHeight = mfY(d.buyDollarVolume) - mfY(d.totalDollarVolume);
             
             // Buy Bar
             mfPane.append('rect')
               .attr('x', xPos - barWidth / 2)
               .attr('y', mfY(d.buyDollarVolume))
               .attr('width', barWidth)
               .attr('height', buyHeight)
               .attr('fill', '#10b981')
               .attr('opacity', 0.8);

             // Sell Bar
             mfPane.append('rect')
               .attr('x', xPos - barWidth / 2)
               .attr('y', mfY(d.totalDollarVolume))
               .attr('width', barWidth)
               .attr('height', sellHeight)
               .attr('fill', '#ef4444')
               .attr('opacity', 0.8);
          }
          
          // Climax Markers
          if (d.isSellingClimax) {
             mfPane.append('text')
               .attr('x', xPos)
               .attr('y', mfY(d.totalDollarVolume || 0) - 5)
               .attr('text-anchor', 'middle')
               .attr('class', 'text-[8px] font-black fill-rose-500 animate-pulse')
               .text('CLIMAX');
          }
          
          if (d.isAbsorption) {
             mfPane.append('text')
               .attr('x', xPos)
               .attr('y', mfY(d.totalDollarVolume || 0) - 5)
               .attr('text-anchor', 'middle')
               .attr('class', 'text-[8px] font-black fill-emerald-500 animate-pulse')
               .text('ABSORB');
          }

          if (d.isPanic) {
             mfPane.append('text')
               .attr('x', xPos)
               .attr('y', mfY(d.totalDollarVolume || 0) - 5)
               .attr('text-anchor', 'middle')
               .attr('class', 'text-[8px] font-black fill-rose-600 animate-bounce')
               .text('PANIC');
          }

          if (d.isExhaustion) {
             mfPane.append('text')
               .attr('x', xPos)
               .attr('y', mfY(d.totalDollarVolume || 0) - 5)
               .attr('text-anchor', 'middle')
               .attr('class', 'text-[8px] font-black fill-amber-500 animate-pulse')
               .text('EXHAUST');
          }
        });

        // Drawdown Scale (Secondary)
        const ddY = d3.scaleLinear()
          .domain([-100, 0])
          .range([paneHeights.moneyFlow, 0]);

        // Calculate Historical Average Drawdown for the visible data
        const allDrawdowns = drawData.map(d => d.drawdownPct || 0).filter(d => d < 0);
        const avgDD = allDrawdowns.length > 0 ? d3.mean(allDrawdowns) || -15 : -15;

        // Golden Discount Line (Dashed)
        mfPane.append('line')
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', ddY(avgDD))
          .attr('y2', ddY(avgDD))
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.4);

        mfPane.append('text')
          .attr('x', width - margin.right - 5)
          .attr('y', ddY(avgDD) - 5)
          .attr('text-anchor', 'end')
          .attr('class', 'text-[7px] fill-blue-400/50 font-bold')
          .text(`AVG DD: ${avgDD.toFixed(1)}%`);

        // Drawdown Line
        const ddLine = d3.line<StockData>()
          .defined(d => d.drawdownPct !== undefined)
          .x((d) => xScale(drawData.indexOf(d)))
          .y(d => ddY(d.drawdownPct || 0))
          .curve(d3.curveMonotoneX);

        mfPane.append('path')
          .datum(visibleData)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.8)
          .attr('d', ddLine);

        // Drawdown Axis (Left side of pane)
        mfPane.append('g')
          .attr('transform', `translate(${margin.left}, 0)`)
          .attr('class', 'text-blue-400 font-bold text-[9px]')
          .call(d3.axisLeft(ddY).ticks(2).tickFormat(d => `${d}%`));

        // SMA Line
        const smaLine = d3.line<StockData>()
          .defined(d => d.avgTotalDollarVolume !== undefined)
          .x((d) => xScale(drawData.indexOf(d)))
          .y(d => mfY(d.avgTotalDollarVolume || 0))
          .curve(d3.curveMonotoneX);

        mfPane.append('path')
          .datum(visibleData)
          .attr('fill', 'none')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('d', smaLine);

        // Axis
        mfPane.append('g')
          .attr('transform', `translate(${width - margin.right}, 0)`)
          .attr('class', 'text-zinc-400 font-bold text-[10px]')
          .call(d3.axisRight(mfY).ticks(3, ".2s"));

        // Label
        mfPane.append('text')
          .attr('x', margin.left)
          .attr('y', -8)
          .attr('class', 'text-[11px] font-black fill-zinc-400 uppercase tracking-widest')
          .text('Money Flow & Drawdown');
          
        currentY += paneHeights.moneyFlow + gap;
      }

      // Smart S/R Zones and Masking
      if (isSmartSRMode && selectedSRDate) {
        const selectedIdx = data.findIndex(d => d.date === selectedSRDate);
        if (selectedIdx !== -1) {
          const startX = xScale(selectedIdx);
          const revealX = xScale(selectedIdx + revealIndex);
          const endX = xScale(data.length - 1);

          // Start Point Indicator (Arrow)
          chartContent.append('path')
            .attr('d', d3.symbol().type(d3.symbolTriangle).size(100)())
            .attr('transform', `translate(${startX}, ${margin.top + 20}) rotate(180)`)
            .attr('fill', '#10b981');
          
          chartContent.append('text')
            .attr('x', startX)
            .attr('y', margin.top + 10)
            .attr('text-anchor', 'middle')
            .attr('class', 'text-[9px] font-bold fill-emerald-500')
            .text('START');

          // S/R Zones
          if (srZones) {
            srZones.forEach(zone => {
              const py = yScale(zone.price);
              
              // Background Zone
              chartContent.append('rect')
                .attr('x', startX)
                .attr('y', py - 5)
                .attr('width', endX - startX)
                .attr('height', 10)
                .attr('fill', zone.color)
                .attr('opacity', 0.3);

              // Main Line
              chartContent.append('line')
                .attr('x1', startX)
                .attr('x2', endX)
                .attr('y1', py)
                .attr('y2', py)
                .attr('stroke', zone.color.replace('0.2', '0.8').replace('0.3', '0.8'))
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', zone.name.includes('Golden') ? 'none' : '4,2');

              // Label
              chartContent.append('text')
                .attr('x', startX + 5)
                .attr('y', py - 8)
                .attr('fill', isDark ? '#fff' : '#000')
                .attr('font-size', '9px')
                .attr('font-weight', 'bold')
                .attr('class', 'select-none pointer-events-none')
                .text(`${zone.name}: ${zone.price.toFixed(2)}`);
            });
          }

          // Masking (Blur/Opacity) - More dramatic for backtest
          if (revealX < endX) {
            chartContent.append('rect')
              .attr('x', revealX)
              .attr('y', margin.top)
              .attr('width', endX - revealX)
              .attr('height', mainAreaHeight)
              .attr('fill', isDark ? '#09090b' : '#fff')
              .attr('opacity', 0.85)
              .attr('style', 'backdrop-filter: blur(12px)');
            
            // Scanning Line Effect
            chartContent.append('line')
              .attr('x1', revealX)
              .attr('x2', revealX)
              .attr('y1', margin.top)
              .attr('y2', height - margin.bottom)
              .attr('stroke', '#10b981')
              .attr('stroke-width', 2)
              .attr('class', 'animate-pulse');
          }

          // Hit Notification
          const currentRevealData = data[selectedIdx + revealIndex];
          if (currentRevealData && srZones) {
            srZones.forEach(zone => {
              if (currentRevealData.low <= zone.price && currentRevealData.high >= zone.price) {
                const hitColor = zone.type === 'support' ? '#10b981' : '#f43f5e';
                
                chartContent.append('circle')
                  .attr('cx', revealX)
                  .attr('cy', yScale(zone.price))
                  .attr('r', 15)
                  .attr('fill', 'none')
                  .attr('stroke', hitColor)
                  .attr('stroke-width', 2)
                  .attr('class', 'animate-ping');

                chartContent.append('text')
                  .attr('x', revealX)
                  .attr('y', yScale(zone.price) - 20)
                  .attr('text-anchor', 'middle')
                  .attr('class', `text-[12px] font-black ${zone.type === 'support' ? 'fill-emerald-500' : 'fill-rose-500'}`)
                  .text('HIT!');
              }
            });
          }
        }
      }

      // Ghost Candles Rendering
      if (isScenarioMode && scenarioResult && chartType === 'candlestick') {
        const ghostData = scenarioResult.candles;
        const candleWidth = Math.max(1, (width / (xEnd - xStart)) * 0.7);
        
        ghostData.forEach((d, i) => {
          const idx = data.length + i;
          const color = d.close >= d.open ? '#10b981' : '#ef4444';
          
          const gCandle = chartContent.append('g')
            .attr('class', 'ghost-candle-group')
            .style('animation', 'pulse-ghost 2s infinite ease-in-out');

          // Wick
          gCandle.append('line')
            .attr('x1', xScale(idx))
            .attr('x2', xScale(idx))
            .attr('y1', yScale(d.low))
            .attr('y2', yScale(d.high))
            .attr('stroke', color)
            .attr('stroke-width', 1.5);

          // Body
          gCandle.append('rect')
            .attr('x', xScale(idx) - candleWidth / 2)
            .attr('y', yScale(Math.max(d.open, d.close)))
            .attr('width', candleWidth)
            .attr('height', Math.abs(yScale(d.open) - yScale(d.close)) || 1)
            .attr('fill', color)
            .attr('stroke', color)
            .attr('stroke-width', 1);
            
          // Pattern Name Label
          if (d.patternName) {
            gCandle.append('text')
              .attr('x', xScale(idx))
              .attr('y', yScale(d.high) - 25)
              .attr('text-anchor', 'middle')
              .attr('class', 'text-[9px] font-black fill-indigo-500 uppercase tracking-tighter')
              .text(d.patternName);
          }

          // Price Labels
          gCandle.append('text')
            .attr('x', xScale(idx))
            .attr('y', yScale(d.close) + (d.close > d.open ? -12 : 22))
            .attr('text-anchor', 'middle')
            .attr('class', 'text-[9px] font-mono font-black fill-zinc-500')
            .text(d.close.toFixed(2));

          if (i === 0) {
            gCandle.append('text')
              .attr('x', xScale(idx))
              .attr('y', yScale(d.high) - 10)
              .attr('text-anchor', 'middle')
              .attr('class', 'text-[8px] font-black fill-indigo-400 uppercase')
              .text('แท่งถัดไป');
          }
        });

        // Invalidation Line
        const invY = yScale(scenarioResult.invalidation);
        chartContent.append('line')
          .attr('x1', xScale(data.length - 1))
          .attr('x2', xScale(data.length + ghostData.length + 2))
          .attr('y1', invY)
          .attr('y2', invY)
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4');

        chartContent.append('text')
          .attr('x', xScale(data.length + ghostData.length + 2))
          .attr('y', invY)
          .attr('dx', 5)
          .attr('dominant-baseline', 'central')
          .attr('class', 'text-[9px] font-black fill-rose-500 uppercase tracking-widest')
          .text(`จุดตัดขาดทุน: ${scenarioResult.invalidation.toFixed(2)}`);
      }
    };

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5000])
      .on('zoom', (event) => {
        stateRef.current.lastTransform = event.transform;
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);
        
        gx.call(xAxis.scale(newX));
        
        if (stateRef.current.isYAuto) {
          const [xStart, xEnd] = newX.domain();
          const visible = data.filter((_, i) => i >= xStart && i <= xEnd);
          const visibleGhosts = isScenarioMode && scenarioResult 
            ? scenarioResult.candles.filter((_, i) => (data.length + i) >= xStart && (data.length + i) <= xEnd)
            : [];

          if (visible.length > 0 || visibleGhosts.length > 0) {
            let minH = d3.min(visible, (d: StockData) => d.low) ?? Infinity;
            let maxH = d3.max(visible, (d: StockData) => d.high) ?? -Infinity;
            let minG = d3.min(visibleGhosts, d => d.low) ?? Infinity;
            let maxG = d3.max(visibleGhosts, d => d.high) ?? -Infinity;
            
            let min = Math.min(minH, minG);
            let max = Math.max(maxH, maxG);

            // Include invalidation point if scenario mode is active
            if (isScenarioMode && scenarioResult) {
              min = Math.min(min, scenarioResult.invalidation);
              max = Math.max(max, scenarioResult.invalidation);
            }
            
            // Include S/R zones in Y domain if they exist
            if (isSmartSRMode && srZones && srZones.length > 0) {
              const zoneMin = d3.min(srZones, z => z.price) ?? min;
              const zoneMax = d3.max(srZones, z => z.price) ?? max;
              min = Math.min(min, zoneMin);
              max = Math.max(max, zoneMax);
            }

            const padding = Math.max((max - min) * 0.15, min * 0.001); // Minimum 0.1% of price as padding
            let finalMin = min - padding;
            let finalMax = max + padding;
            
            if (isLogScale) {
              finalMin = Math.max(0.01, finalMin);
              finalMax = Math.max(0.02, finalMax);
            }

            y.domain([finalMin, finalMax]);
            gy.call(yAxis);
            draw(newX, y);
          }
        } else {
          gy.call(yAxis.scale(newY));
          draw(newX, newY);
        }
      });

    svg.call(zoom);
    
    // Initial draw
    const t = stateRef.current.lastTransform;
    const initialX = t.rescaleX(x);
    const initialY = stateRef.current.isYAuto ? y.domain(stateRef.current.yDomain) : t.rescaleY(y);
    
    // Use processedData instead of raw data for drawing to ensure indicators are present
    // However, the draw function uses 'data' from props. 
    // We need to pass the processed data to the draw function or update the data reference.
    // Since 'data' is in the dependency array of useEffect, we can just use processedData inside draw if we update the reference.
    // But 'draw' is defined inside useEffect which closes over 'data'.
    // Let's modify 'draw' to use 'processedData' which we will calculate inside useEffect or pass to it.
    
    // Actually, let's just recalculate inside useEffect for simplicity as we did with useMemo but inside the effect
    // or better, use the memoized processedData in the dependency array.
    
    gx.call(xAxis.scale(initialX));
    gy.call(yAxis.scale(initialY));
    draw(initialX, initialY);
    
    // Double click to reset Y auto
    svg.on('dblclick', () => {
      stateRef.current.isYAuto = true;
      const t = stateRef.current.lastTransform;
      const newX = t.rescaleX(x);
      const [xStart, xEnd] = newX.domain();
      const visible = data.filter((_, i) => i >= xStart && i <= xEnd);
      if (visible.length > 0) {
        let min = d3.min(visible, (d: StockData) => d.low) ?? 0;
        let max = d3.max(visible, (d: StockData) => d.high) ?? 0;
        const padding = Math.max((max - min) * 0.15, min * 0.001);
        let finalMin = min - padding;
        let finalMax = max + padding;
        if (isLogScale) {
          finalMin = Math.max(0.01, finalMin);
          finalMax = Math.max(0.02, finalMax);
        }
        y.domain([finalMin, finalMax]);
        gy.call(yAxis);
        draw(newX, y);
      }
    });

    // Detect Y axis pan (Shift + Wheel or just vertical drag)
    // For simplicity, we'll say if the user drags the Y axis area, but here we'll just use a toggle
    // Let's add a listener to the SVG to disable isYAuto if the user drags vertically
    svg.on('mousedown', (event) => {
      if (event.shiftKey) {
        stateRef.current.isYAuto = false;
      }
    });
    svg.call(zoom.transform, stateRef.current.lastTransform);

    // Smart S/R Selection Mode Guide
    const srGuide = svg.append('g').attr('class', 'sr-guide').style('display', 'none').style('pointer-events', 'none');
    srGuide.append('line')
      .attr('class', 'sr-guide-line')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
    
    srGuide.append('text')
      .attr('class', 'sr-guide-text')
      .attr('fill', '#10b981')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle');

    // Crosshair
    const crosshair = svg.append('g').attr('class', 'crosshair').style('display', 'none').style('pointer-events', 'none');
    crosshair.append('line').attr('class', 'x-line').attr('stroke', isDark ? '#3f3f46' : '#94a3b8').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');
    crosshair.append('line').attr('class', 'y-line').attr('stroke', isDark ? '#3f3f46' : '#94a3b8').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');

    // Crosshair labels
    const xLabel = crosshair.append('g').attr('class', 'x-label');
    xLabel.append('rect').attr('fill', isDark ? '#f4f4f5' : '#27272a').attr('rx', 4).attr('height', 20);
    xLabel.append('text').attr('fill', isDark ? '#18181b' : '#fff').attr('font-size', '10px').attr('font-weight', 'bold').attr('text-anchor', 'middle').attr('dominant-baseline', 'central');

    const yLabel = crosshair.append('g').attr('class', 'y-label');
    yLabel.append('rect').attr('fill', isDark ? '#f4f4f5' : '#27272a').attr('rx', 4).attr('height', 20);
    yLabel.append('text').attr('fill', isDark ? '#18181b' : '#fff').attr('font-size', '10px').attr('font-weight', 'bold').attr('text-anchor', 'start').attr('dx', '5').attr('dominant-baseline', 'central');

    svg.on('mousemove', (event) => {
      const [mx, my] = d3.pointer(event);
      const currentX = stateRef.current.lastTransform.rescaleX(x);
      const idx = Math.round(currentX.invert(mx));
      const d = data[idx];
      
      if (isSmartSRMode && !selectedSRDate) {
        srGuide.style('display', null);
        const cx = currentX(idx);
        srGuide.select('.sr-guide-line').attr('x1', cx).attr('x2', cx).attr('y1', margin.top).attr('y2', height - margin.bottom);
        srGuide.select('.sr-guide-text')
          .attr('x', cx)
          .attr('y', margin.top - 5)
          .text('Click to select start point');
        crosshair.style('display', 'none');
        return;
      } else {
        srGuide.style('display', 'none');
      }

      if (d) {
        crosshair.style('display', null);
        const cx = currentX(idx);
        
        crosshair.select('.x-line').attr('x1', cx).attr('x2', cx).attr('y1', margin.top).attr('y2', height - margin.bottom);
        crosshair.select('.y-line').attr('y1', my).attr('y2', my).attr('x1', margin.left).attr('x2', width - margin.right);

        // Update labels
        const dateStr = format(new Date(d.date), 'dd MMM yyyy');
        const priceStr = y.invert(my).toFixed(2);

        const xText = xLabel.select('text').text(dateStr);
        const xTextWidth = (xText.node() as SVGTextElement).getComputedTextLength();
        const rectX = cx - (xTextWidth + 10) / 2;
        const rectY = height - margin.bottom - 22;
        xLabel.select('rect').attr('width', xTextWidth + 10).attr('x', rectX).attr('y', rectY);
        xLabel.select('text').attr('x', cx).attr('y', rectY + 10);

        const yText = yLabel.select('text').text(priceStr);
        const yTextWidth = (yText.node() as SVGTextElement).getComputedTextLength();
        const yRectX = width - margin.right - yTextWidth - 10;
        const yRectY = my - 10;
        yLabel.select('rect').attr('width', yTextWidth + 10).attr('x', yRectX).attr('y', yRectY);
        yLabel.select('text').attr('x', yRectX + 5).attr('y', yRectY + 10);

        onHover(d);
      }
    }).on('mouseleave', () => {
      crosshair.style('display', 'none');
      srGuide.style('display', 'none');
      onHover(null);
    }).on('click', (event) => {
      if (isSmartSRMode && !selectedSRDate) {
        const [mx] = d3.pointer(event);
        const currentX = stateRef.current.lastTransform.rescaleX(x);
        const idx = Math.round(currentX.invert(mx));
        const d = data[idx];
        if (d && onSelectSRDate) {
          onSelectSRDate(d.date);
        }
      }
    }).on('contextmenu', (event) => {
      if (isSmartSRMode) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const [mx, my] = d3.pointer(event);
      const currentX = stateRef.current.lastTransform.rescaleX(x);
      const idx = Math.round(currentX.invert(mx));
      const d = data[idx];
      if (d) {
        onRightClick(d, event.pageX, event.pageY);
      }
    });

  }, [
    data,
    symbol,
    showVWAP,
    showOBV,
    showVolume,
    showEMAX,
    showEMA20,
    showEMA50,
    showRSI,
    showMACD,
    isInvertedY,
    chartType,
    resetTrigger,
    theme,
    isSmartSRMode,
    isScenarioMode,
    scenarioResult,
    selectedSRDate,
    srZones,
    revealIndex,
    isLogScale,
    rsiDivergences,
    macdDivergences,
    showElliottWaves,
    showVolumeSpikes,
    processedData
  ]);

  return (
    <div ref={containerRef} className="w-full h-full relative trading-chart-container">
      {!isSmartSRMode && showSaveImage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
          <button 
            onClick={saveAsImage}
            className={cn(
              "px-6 py-2 rounded-full border shadow-sm transition-all font-black text-[10px] uppercase tracking-widest pointer-events-auto",
              isDark ? "bg-zinc-800/80 backdrop-blur-md border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700" : "bg-white/80 backdrop-blur-md border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            บันทึกภาพ (SAVE IMAGE)
          </button>
          {isSimulationMode && (
            <div className="bg-rose-600 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-rose-900/50 flex items-center gap-3 animate-pulse border-2 border-white/20">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              กำลังจำลอง: ทำนายจุดตัด Death Cross
            </div>
          )}
        </div>
      )}

      {isSmartSRMode && (
        <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1 pointer-events-none">
          {srGuidance ? (
            <div className="bg-zinc-900/95 text-white p-6 rounded-2xl text-sm shadow-2xl border border-zinc-700 backdrop-blur-xl w-80 pointer-events-auto animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 mb-4 text-emerald-400 font-bold">
                <TrendingUp className="w-5 h-5" />
                <span className="text-base tracking-tight">คำแนะนำจากระบบ</span>
              </div>
              <div className="whitespace-pre-line leading-relaxed opacity-90 font-medium">
                {srGuidance}
              </div>
            </div>
          ) : (
            <>
              <div className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-lg flex flex-col items-end gap-0.5 border border-white/20 backdrop-blur-md text-white",
                srZones?.[0]?.type === 'support' ? "bg-emerald-600/90" : "bg-rose-600/90"
              )}>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>{srZones?.[0]?.type === 'support' ? 'แนวรับ (Support)' : 'แนวต้าน (Resistance)'}: {selectedSRDate ? 'ทดสอบย้อนหลัง' : 'เลือกจุดเริ่มต้น'}</span>
                </div>
                {selectedSRDate && (
                  <div className="px-1.5 py-0 bg-white/20 rounded text-[8px] font-medium">
                    {revealIndex} / {data.length - 1 - data.findIndex(d => d.date === selectedSRDate)}
                  </div>
                )}
              </div>
              
              {selectedSRDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReveal?.();
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg border shadow-lg transition-all font-black text-[9px] uppercase tracking-tighter pointer-events-auto flex items-center gap-1.5",
                    isRevealing 
                      ? "bg-rose-600 border-rose-500 text-white hover:bg-rose-700 animate-pulse" 
                      : (srZones?.[0]?.type === 'support' ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700" : "bg-rose-600 border-rose-500 text-white hover:bg-rose-700")
                  )}
                >
                  {isRevealing ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                  {isRevealing ? 'หยุด (Pause)' : 'เริ่ม (Start)'}
                </button>
              )}
            </>
          )}

          {!stateRef.current.isYAuto && (
            <div className="px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-[8px] font-bold rounded-md border border-zinc-700 backdrop-blur-sm">
              Y: Manual (Double Click)
            </div>
          )}
        </div>
      )}

      {isScenarioMode && scenarioResult && (
        <div className="absolute top-6 right-6 z-40 w-80 pointer-events-auto">
          <div className={cn(
            "p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-right-6",
            isDark ? "bg-zinc-900/95 border-zinc-800 text-zinc-100" : "bg-white/95 border-zinc-200 text-zinc-900"
          )}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  scenarioResult.type === 'BULLISH' ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-rose-500 shadow-lg shadow-rose-500/20"
                )}>
                  <Ghost className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50">จำลองสถานการณ์ (Future Test)</h4>
                  <p className="text-lg font-black text-zinc-100 leading-tight tracking-tight">{scenarioResult.patternName}</p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-lg text-xs font-black",
                scenarioResult.confidence > 75 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                โอกาส {scenarioResult.confidence}%
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <Target className="w-4 h-4" />
                  <span>สถานะปัจจุบัน</span>
                </div>
                <p className="text-sm font-bold leading-relaxed">{scenarioResult.setup}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <Play className="w-4 h-4" />
                  <span>เงื่อนไขการเข้าซื้อ (Trigger)</span>
                </div>
                <p className="text-sm font-medium opacity-80 leading-relaxed italic">{scenarioResult.trigger}</p>
              </div>

              <div className="pt-4 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>จุดตัดขาดทุน (Stop Loss)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono tracking-tighter text-rose-500">
                    {scenarioResult.invalidation.toFixed(2)}
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">ความเสี่ยง</p>
                    <p className="text-xs font-black text-rose-400">สูง (HIGH)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/30">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] leading-relaxed">
                * การจำลองทางสถิติเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน
              </p>
            </div>
          </div>
        </div>
      )}

      <svg ref={svgRef} className={cn(
        "w-full h-full cursor-crosshair overflow-visible transition-all duration-700",
        isSimulationMode && (isDark ? "bg-rose-950/20" : "bg-rose-100/40")
      )} />
      {/* Divergence Tooltip */}
      {activeDivergence && (
        <div
          className="absolute z-50 rounded-lg shadow-xl border backdrop-blur-md text-xs overflow-hidden"
          style={{
            top: tooltipPos.y,
            left: tooltipPos.x,
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            color: isDark ? '#fff' : '#000',
            minWidth: '240px',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Header - Draggable Area */}
          <div 
            className="p-2 border-b flex justify-between items-center cursor-grab active:cursor-grabbing bg-opacity-10 bg-gray-500"
            onMouseDown={handleMouseDown}
          >
            <span className={`font-bold uppercase ${activeDivergence.div.type.includes('Bullish') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {activeDivergence.div.indicator} {activeDivergence.div.type}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveDivergence(null); }}
              className="hover:bg-gray-500/20 rounded p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              <span className="opacity-60">Entry:</span>
              <span className="font-mono text-right">{activeDivergence.div.targets.entry.toFixed(2)}</span>
              
              <span className="opacity-60">Stop Loss:</span>
              <span className="font-mono text-right text-rose-500">{activeDivergence.div.targets.stopLoss.toFixed(2)}</span>
            </div>

            <div className="h-px bg-gray-500/20 my-1" />
            
            <div className="space-y-1">
              <div className="text-[10px] font-semibold opacity-70 mb-1">Targets</div>
              
              {/* Target 1: Neckline */}
              <div className="flex justify-between items-center text-[10px]">
                <span className="opacity-60">1. Neckline:</span>
                <span className="font-mono text-emerald-500">{activeDivergence.div.targets.neckline.toFixed(2)}</span>
              </div>

              {/* Target 2: Measured Move */}
              <div className="flex justify-between items-center text-[10px]">
                <span className="opacity-60">2. 100% Move:</span>
                <span className="font-mono text-emerald-500">{activeDivergence.div.targets.measuredMove.toFixed(2)}</span>
              </div>

              {/* Target 3: Fibo 161.8% */}
              <div className="flex justify-between items-center text-[10px]">
                <span className="opacity-60">3. Fibo 161.8%:</span>
                <span className="font-mono text-emerald-500">{activeDivergence.div.targets.fibo161.toFixed(2)}</span>
              </div>

              {/* Target 4: Fibo 261.8% */}
              <div className="flex justify-between items-center text-[10px]">
                <span className="opacity-60">4. Fibo 261.8%:</span>
                <span className="font-mono text-emerald-500">{activeDivergence.div.targets.fibo261.toFixed(2)}</span>
              </div>
            </div>

            {/* Volume Confirmation */}
            <div className="mt-2 pt-2 border-t border-gray-500/20">
               <div className="flex items-center gap-2 text-[10px]">
                  <span className="opacity-60">Volume Conf:</span>
                  {activeDivergence.div.volumeConfirmation ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      YES <span className="text-[8px]">(Lower Vol)</span>
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      NO <span className="text-[8px]">(Higher Vol)</span>
                    </span>
                  )}
               </div>
            </div>

            <div className="text-[9px] opacity-40 italic mt-1 text-center">
              Drag header to move • Click X to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
