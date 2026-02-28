import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';
import { StockData } from '../types';

interface ChartProps {
  data: StockData[];
  showVWAP: boolean;
  showOBV: boolean;
  showVolume: boolean;
  chartType: 'line' | 'candlestick';
  onHover: (data: StockData | null) => void;
  resetTrigger: number;
}

export const TradingChart: React.FC<ChartProps> = ({
  data,
  showVWAP,
  showOBV,
  showVolume,
  chartType,
  onHover,
  resetTrigger
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stateRef = useRef({
    zoom: d3.zoomIdentity,
    isYAuto: true,
    yDomain: [0, 0] as [number, number],
    xDomain: [0, 0] as [number, number],
    lastTransform: d3.zoomIdentity,
  });

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;

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

    // Initial domains
    if (stateRef.current.yDomain[0] === 0) {
      const minPrice = d3.min(data, (d: StockData) => d.low) ?? 0;
      const maxPrice = d3.max(data, (d: StockData) => d.high) ?? 0;
      const padding = (maxPrice - minPrice) * 0.1;
      stateRef.current.yDomain = [minPrice - padding, maxPrice + padding];
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
      .attr('class', 'grid text-zinc-100 opacity-20')
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
            .attr('stroke', d2.color || '#94a3b8')
            .attr('stroke-width', 2.5)
            .attr('stroke-linecap', 'round');
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
            .attr('fill', color);
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
          .attr('class', 'text-zinc-400 font-bold text-[8px]')
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
          .attr('class', 'text-zinc-400 font-bold text-[8px]')
          .call(d3.axisRight(volY).ticks(3));

        volPane.append('text')
          .attr('x', margin.left)
          .attr('y', -5)
          .attr('class', 'text-[10px] font-bold fill-zinc-400')
          .text('VOLUME');
      }
    };

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 100])
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

    // Initial draw
    draw(x, y);

    // Crosshair
    const crosshair = svg.append('g').attr('class', 'crosshair').style('display', 'none').style('pointer-events', 'none');
    crosshair.append('line').attr('class', 'x-line').attr('stroke', '#94a3b8').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');
    crosshair.append('line').attr('class', 'y-line').attr('stroke', '#94a3b8').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');

    svg.on('mousemove', (event) => {
      const [mx, my] = d3.pointer(event);
      const currentX = stateRef.current.lastTransform.rescaleX(x);
      const idx = Math.round(currentX.invert(mx));
      const d = data[idx];
      
      if (d) {
        crosshair.style('display', null);
        crosshair.select('.x-line').attr('x1', currentX(idx)).attr('x2', currentX(idx)).attr('y1', margin.top).attr('y2', height - margin.bottom);
        crosshair.select('.y-line').attr('y1', my).attr('y2', my).attr('x1', margin.left).attr('x2', width - margin.right);
        onHover(d);
      }
    }).on('mouseleave', () => {
      crosshair.style('display', 'none');
      onHover(null);
    });

  }, [data, showVWAP, showOBV, showVolume, chartType, resetTrigger]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full cursor-crosshair overflow-visible" />
    </div>
  );
};
