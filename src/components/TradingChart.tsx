import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';
import { StockData } from '../types';
import { cn } from '../utils/cn';

interface ChartProps {
  data: StockData[];
  showVWAP: boolean;
  showOBV: boolean;
  showVolume: boolean;
  showEMAX: boolean;
  chartType: 'line' | 'candlestick';
  onHover: (data: StockData | null) => void;
  resetTrigger: number;
  isSimulationMode?: boolean;
  theme?: 'light' | 'dark';
}

export const TradingChart: React.FC<ChartProps> = ({
  data,
  showVWAP,
  showOBV,
  showVolume,
  showEMAX,
  chartType,
  onHover,
  resetTrigger,
  isSimulationMode,
  theme
}) => {
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

    const y = d3.scaleLinear()
      .range([mainAreaHeight + margin.top, margin.top]);

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
        const padding = (max - min) * 0.1;
        stateRef.current.yDomain = [min - padding, max + padding];
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

    const yAxis = d3.axisRight(y).ticks(10);

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
      const visibleData: StockData[] = data.filter((_, i) => i >= xStart - 5 && i <= xEnd + 5);

      if (chartType === 'line') {
        // Multi-colored line segments
        for (let i = 1; i < data.length; i++) {
          const d1 = data[i - 1];
          const d2 = data[i];
          if (i < xStart - 1 || i > xEnd + 1) continue;

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
          .x((_, i) => xScale(i))
          .y(d => yScale(d.vwap || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '6,3')
          .attr('d', vwapLine);
      }

      if (showEMAX) {
        // EMA 50
        const ema50Line = d3.line<StockData>()
          .x((_, i) => xScale(i))
          .y(d => yScale(d.ema50 || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 1.5)
          .attr('d', ema50Line);

        // EMA 135
        const ema135Line = d3.line<StockData>()
          .x((_, i) => xScale(i))
          .y(d => yScale(d.ema135 || 0))
          .curve(d3.curveMonotoneX);

        chartContent.append('path')
          .datum(data)
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
          .x((_, i) => xScale(i))
          .y(d => obvY(d.obv || 0));

        obvPane.append('path')
          .datum(data)
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
    };

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5000])
      .on('zoom', (event) => {
        stateRef.current.lastTransform = event.transform;
        const newX = event.transform.rescaleX(x);
        gx.call(xAxis.scale(newX));
        
        if (stateRef.current.isYAuto) {
          const [xStart, xEnd] = newX.domain();
          const visible = data.filter((_, i) => i >= xStart && i <= xEnd);
          if (visible.length > 0) {
            const min = d3.min(visible, (d: StockData) => d.low) ?? 0;
            const max = d3.max(visible, (d: StockData) => d.high) ?? 0;
            const padding = (max - min) * 0.1;
            y.domain([min - padding, max + padding]);
            gy.call(yAxis);
          }
        }
        draw(newX, y);
      });

    svg.call(zoom);
    svg.call(zoom.transform, stateRef.current.lastTransform);

    // Initial draw is handled by zoom.transform call above
    // but we ensure axis is correct
    const initialX = stateRef.current.lastTransform.rescaleX(x);
    gx.call(xAxis.scale(initialX));
    draw(initialX, y);

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
      onHover(null);
    });

  }, [data, showVWAP, showOBV, showVolume, showEMAX, chartType, resetTrigger, theme]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {isSimulationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-rose-600 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-rose-900/50 flex items-center gap-3 animate-pulse border-2 border-white/20">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            Simulation Active: Predicting Death Cross
          </div>
        </div>
      )}
      <svg ref={svgRef} className={cn(
        "w-full h-full cursor-crosshair overflow-visible transition-all duration-700",
        isSimulationMode && (isDark ? "bg-rose-950/20" : "bg-rose-100/40")
      )} />
    </div>
  );
};
