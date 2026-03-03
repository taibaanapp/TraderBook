import React, { useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';
import { StockData } from '../types';
import { cn } from '../utils/cn';
import { Download, Play, Pause, TrendingUp, HelpCircle } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { SRZone } from '../services/smartSRService';

interface ChartProps {
  symbol: string;
  data: StockData[];
  showVWAP: boolean;
  showOBV: boolean;
  showVolume: boolean;
  showEMAX: boolean;
  chartType: 'line' | 'candlestick';
  onHover: (data: StockData | null) => void;
  onRightClick: (data: StockData, x: number, y: number) => void;
  resetTrigger: number;
  isSimulationMode?: boolean;
  isSmartSRMode?: boolean;
  selectedSRDate?: string | null;
  onSelectSRDate?: (date: string) => void;
  srZones?: SRZone[];
  srGuidance?: string;
  revealIndex?: number;
  isRevealing?: boolean;
  onToggleReveal?: () => void;
  theme?: 'light' | 'dark';
  isLogScale?: boolean;
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
  chartType,
  onHover,
  onRightClick,
  resetTrigger,
  isSimulationMode,
  isSmartSRMode,
  selectedSRDate,
  onSelectSRDate,
  srZones,
  srGuidance,
  revealIndex = 0,
  isRevealing,
  onToggleReveal,
  theme,
  isLogScale
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDark = theme === 'dark';
  const stateRef = useRef({
    zoom: d3.zoomIdentity,
    isYAuto: true,
    yDomain: [0, 0] as [number, number],
    xDomain: [0, 0] as [number, number],
    lastTransform: d3.zoomIdentity,
    lastDataLength: 0
  });

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
    const subPaneHeight = 80;
    const gap = 20;
    
    let mainAreaHeight = height - margin.top - margin.bottom;
    if (showOBV) mainAreaHeight -= (subPaneHeight + gap);
    if (showVolume) mainAreaHeight -= (subPaneHeight + gap);

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Scales
    const x = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right]);

    const y = isLogScale 
      ? d3.scaleLog().clamp(true)
      : d3.scaleLinear();
    
    y.range([mainAreaHeight + margin.top, margin.top]);

    // Initial domains and zoom
    const pointsToShow = 100;
    const initialK = Math.min(5000, Math.max(1, data.length / pointsToShow));
    
    if (stateRef.current.xDomain[0] === 0) {
      // Set initial zoom to show the last 100 points
      const k = initialK;
      const tx = (width - margin.right) * (1 - k);
      stateRef.current.lastTransform = d3.zoomIdentity.translate(tx, 0).scale(k);
      
      // Reset Y domain for the visible range
      const currentX = stateRef.current.lastTransform.rescaleX(x);
      const [xStart, xEnd] = currentX.domain();
      stateRef.current.xDomain = [xStart, xEnd];
      
      const visible = data.filter((_, i) => i >= xStart && i <= xEnd);
      if (visible.length > 0) {
        const min = d3.min(visible, (d: StockData) => d.low) ?? 0;
        const max = d3.max(visible, (d: StockData) => d.high) ?? 0;
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
    g.append('text')
      .attr('x', width / 2)
      .attr('y', mainAreaHeight / 2 + margin.top)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('class', cn(
        "text-[120px] font-black uppercase tracking-tighter select-none pointer-events-none opacity-[0.03]",
        isDark ? "fill-white" : "fill-black"
      ))
      .text(symbol);

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
      
      const [xStart, xEnd] = xScale.domain();
      const selectedIdx = isSmartSRMode && selectedSRDate ? data.findIndex(d => d.date === selectedSRDate) : -1;
      const maxIdx = selectedIdx !== -1 ? selectedIdx + revealIndex : data.length - 1;

      const visibleData: StockData[] = data.filter((d, i) => {
        if (i < xStart - 5 || i > xEnd + 5) return false;
        if (isSmartSRMode && selectedSRDate && i > maxIdx) return false;
        return true;
      });

      if (chartType === 'line') {
        // Multi-colored line segments
        for (let i = 1; i < data.length; i++) {
          const d1 = data[i - 1];
          const d2 = data[i];
          if (i < xStart - 1 || i > xEnd + 1) continue;
          if (isSmartSRMode && selectedSRDate && i > maxIdx) continue;

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
          const idx = data.indexOf(d);
          const color = d.close >= d.open ? '#10b981' : '#ef4444';
          
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
        });
      }

      if (showVWAP) {
        const vwapLine = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => yScale(d.vwap || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(data.filter((_, i) => i <= maxIdx))
          .attr('fill', 'none')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '6,3')
          .attr('d', vwapLine);
      }

      if (showEMAX) {
        // EMA 50
        const ema50Line = d3.line<StockData>()
          .x((d, i) => xScale(data.indexOf(d)))
          .y(d => yScale(d.ema50 || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(data.filter((_, i) => i <= maxIdx && d3.min(data, d => d.ema50) !== 0))
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
          .datum(data.filter((_, i) => i <= maxIdx && d3.min(data, d => d.ema135) !== 0))
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

      // Sub-panes
      g.selectAll('.sub-pane').remove();
      let currentY = mainAreaHeight + margin.top + gap + margin.bottom;
      
      if (showOBV) {
        const obvPane = g.append('g').attr('class', 'sub-pane').attr('transform', `translate(0, ${currentY})`);
        const obvMin = d3.min(visibleData, (d: StockData) => d.obv ?? 0) ?? 0;
        const obvMax = d3.max(visibleData, (d: StockData) => d.obv ?? 0) ?? 0;
        
        const obvY = d3.scaleLinear()
          .domain([obvMin, obvMax])
          .range([subPaneHeight, 0]);

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

        currentY += subPaneHeight + gap;
      }

      if (showVolume) {
        const volPane = g.append('g').attr('class', 'sub-pane').attr('transform', `translate(0, ${currentY})`);
        const maxVol = d3.max(visibleData, (d: StockData) => d.volume) ?? 0;
        const volY = d3.scaleLinear()
          .domain([0, maxVol])
          .range([subPaneHeight, 0]);

        const barWidth = Math.max(1, (width / (xEnd - xStart)) * 0.8);
        visibleData.forEach(d => {
          const idx = data.indexOf(d);
          volPane.append('rect')
            .attr('x', xScale(idx) - barWidth / 2)
            .attr('y', volY(d.volume))
            .attr('width', barWidth)
            .attr('height', subPaneHeight - volY(d.volume))
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
          if (visible.length > 0) {
            let min = d3.min(visible, (d: StockData) => d.low) ?? 0;
            let max = d3.max(visible, (d: StockData) => d.high) ?? 0;
            
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

    // Initial draw is handled by zoom.transform call above
    // but we ensure axis is correct
    const initialX = stateRef.current.lastTransform.rescaleX(x);
    gx.call(xAxis.scale(initialX));
    draw(initialX, y);

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

  }, [data, showVWAP, showOBV, showVolume, showEMAX, chartType, resetTrigger, theme, isSmartSRMode, selectedSRDate, srZones, revealIndex, isLogScale]);

  return (
    <div ref={containerRef} className="w-full h-full relative trading-chart-container">
      {!isSmartSRMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
          <button 
            onClick={saveAsImage}
            className={cn(
              "px-6 py-2 rounded-full border shadow-sm transition-all font-black text-[10px] uppercase tracking-widest pointer-events-auto",
              isDark ? "bg-zinc-800/80 backdrop-blur-md border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700" : "bg-white/80 backdrop-blur-md border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            SAVE IMAGE
          </button>
          {isSimulationMode && (
            <div className="bg-rose-600 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-rose-900/50 flex items-center gap-3 animate-pulse border-2 border-white/20">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              Simulation Active: Predicting Death Cross
            </div>
          )}
        </div>
      )}

      {isSmartSRMode && (
        <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1 pointer-events-none">
          {srGuidance ? (
            <div className="bg-zinc-900/90 text-white p-4 rounded-xl text-[10px] shadow-2xl border border-zinc-700 backdrop-blur-md w-64 pointer-events-auto">
              <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>คำแนะนำระบบ</span>
              </div>
              <div className="whitespace-pre-line leading-relaxed opacity-90">
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
                  <span>{srZones?.[0]?.type === 'support' ? 'Support' : 'Resistance'}: {selectedSRDate ? 'Backtest' : 'Select Start'}</span>
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
                  {isRevealing ? 'Pause' : 'Start'}
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

      <svg ref={svgRef} className={cn(
        "w-full h-full cursor-crosshair overflow-visible transition-all duration-700",
        isSimulationMode && (isDark ? "bg-rose-950/20" : "bg-rose-100/40")
      )} />
    </div>
  );
});
