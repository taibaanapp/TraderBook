import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, RefreshCcw, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import * as d3 from 'd3';
import { cn } from '../utils/cn';

interface RRGChartProps {
  theme: 'light' | 'dark';
}

const TH_SECTORS = [
  { symbol: '^AGRO.BK', name: 'Agro & Food' },
  { symbol: '^CONSUMP.BK', name: 'Consumer Products' },
  { symbol: '^FINCIAL.BK', name: 'Financials' },
  { symbol: '^INDUS.BK', name: 'Industrials' },
  { symbol: '^PROPCON.BK', name: 'Property & Construction' },
  { symbol: '^RESOURC.BK', name: 'Resources' },
  { symbol: '^SERVICE.BK', name: 'Services' },
  { symbol: '^TECH.BK', name: 'Technology' },
];

const US_SECTORS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLV', name: 'Health Care' },
  { symbol: 'XLF', name: 'Financials' },
  { symbol: 'XLY', name: 'Consumer Discretionary' },
  { symbol: 'XLC', name: 'Communication' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLP', name: 'Consumer Staples' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLU', name: 'Utilities' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLB', name: 'Materials' },
];

const BENCHMARKS = {
  TH: '^SET.BK',
  US: '^GSPC',
};

// RRG Calculation Parameters
const RS_PERIOD = 14; // Typical period for RS-Ratio
const MOMENTUM_PERIOD = 14; // Typical period for RS-Momentum

export function RRGChart({ theme }: RRGChartProps) {
  const [market, setMarket] = useState<'TH' | 'US'>('TH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tailLength, setTailLength] = useState(10);
  const [visibleSectors, setVisibleSectors] = useState<Set<string>>(new Set());
  const [selectedSector, setSelectedSector] = useState<any>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sectors = market === 'TH' ? TH_SECTORS : US_SECTORS;
  const benchmarkSymbol = BENCHMARKS[market];

  // Initialize visible sectors when market changes
  useEffect(() => {
    setVisibleSectors(new Set(sectors.map(s => s.symbol)));
  }, [market, sectors]);

  const toggleSector = (symbol: string) => {
    const newVisible = new Set(visibleSectors);
    if (newVisible.has(symbol)) {
      newVisible.delete(symbol);
    } else {
      newVisible.add(symbol);
    }
    setVisibleSectors(newVisible);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch benchmark
      const benchRes = await fetch(`/api/stock/${benchmarkSymbol}?interval=1d&from=2023-01-01`);
      if (!benchRes.ok) throw new Error('Failed to fetch benchmark');
      const benchData = await benchRes.json();

      // Fetch sectors
      const sectorPromises = sectors.map(s => 
        fetch(`/api/stock/${s.symbol}?interval=1d&from=2023-01-01`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );
      
      const sectorResults = await Promise.all(sectorPromises);
      
      // Process Data
      const processed = processRRGData(benchData.data, sectorResults, sectors);
      setData(processed);
      setCurrentDateIndex(processed.dates.length - 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [market]);

  // Animation Loop
  useEffect(() => {
    let interval: any;
    if (isPlaying && data && currentDateIndex < data.dates.length - 1) {
      interval = setInterval(() => {
        setCurrentDateIndex(prev => {
          if (prev >= data.dates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100); // 100ms per frame
    } else if (currentDateIndex >= (data?.dates.length || 0) - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, data, currentDateIndex]);

  // D3 Rendering
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 600;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    // Find min and max values across all sectors and dates
    let minVal = 95;
    let maxVal = 105;
    
    data.sectors.forEach((sector: any) => {
      sector.data.forEach((d: any) => {
        if (d.rsRatio < minVal) minVal = d.rsRatio;
        if (d.rsRatio > maxVal) maxVal = d.rsRatio;
        if (d.rsMomentum < minVal) minVal = d.rsMomentum;
        if (d.rsMomentum > maxVal) maxVal = d.rsMomentum;
      });
    });

    // Add some padding
    const padding = (maxVal - minVal) * 0.1;
    minVal -= padding;
    maxVal += padding;

    // Ensure it's centered around 100
    const maxDist = Math.max(Math.abs(100 - minVal), Math.abs(maxVal - 100));
    minVal = 100 - maxDist;
    maxVal = 100 + maxDist;

    const xScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([innerHeight, 0]);

    // Draw Quadrants
    // Improving (Top Left), Leading (Top Right)
    // Lagging (Bottom Left), Weakening (Bottom Right)
    
    // Background colors for quadrants
    const quadOpacity = theme === 'dark' ? 0.1 : 0.05;
    
    // Leading (Top Right) - Green
    g.append("rect")
      .attr("x", xScale(100))
      .attr("y", 0)
      .attr("width", innerWidth - xScale(100))
      .attr("height", yScale(100))
      .attr("fill", "#10b981")
      .attr("opacity", quadOpacity);
      
    // Weakening (Bottom Right) - Yellow
    g.append("rect")
      .attr("x", xScale(100))
      .attr("y", yScale(100))
      .attr("width", innerWidth - xScale(100))
      .attr("height", innerHeight - yScale(100))
      .attr("fill", "#f59e0b")
      .attr("opacity", quadOpacity);
      
    // Lagging (Bottom Left) - Red
    g.append("rect")
      .attr("x", 0)
      .attr("y", yScale(100))
      .attr("width", xScale(100))
      .attr("height", innerHeight - yScale(100))
      .attr("fill", "#ef4444")
      .attr("opacity", quadOpacity);
      
    // Improving (Top Left) - Blue
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xScale(100))
      .attr("height", yScale(100))
      .attr("fill", "#3b82f6")
      .attr("opacity", quadOpacity);

    // Axes
    const axisColor = theme === 'dark' ? '#3f3f46' : '#e4e4e7';
    const textColor = theme === 'dark' ? '#a1a1aa' : '#71717a';

    g.append("line")
      .attr("x1", 0).attr("x2", innerWidth)
      .attr("y1", yScale(100)).attr("y2", yScale(100))
      .attr("stroke", axisColor)
      .attr("stroke-width", 2);

    g.append("line")
      .attr("x1", xScale(100)).attr("x2", xScale(100))
      .attr("y1", 0).attr("y2", innerHeight)
      .attr("stroke", axisColor)
      .attr("stroke-width", 2);

    // Quadrant Labels & Atmosphere
    const labelStyle = `font-size: 14px; font-weight: bold; fill: ${textColor}; opacity: 0.5; font-family: sans-serif;`;
    const emojiStyle = `font-size: 48px; opacity: 0.1;`;
    
    // Leading
    g.append("text").attr("x", innerWidth - 20).attr("y", 30).attr("text-anchor", "end").attr("style", labelStyle).text("LEADING");
    g.append("text").attr("x", innerWidth - 20).attr("y", 80).attr("text-anchor", "end").attr("style", emojiStyle).text("🌿");
    
    // Weakening
    g.append("text").attr("x", innerWidth - 20).attr("y", innerHeight - 20).attr("text-anchor", "end").attr("style", labelStyle).text("WEAKENING");
    g.append("text").attr("x", innerWidth - 20).attr("y", innerHeight - 50).attr("text-anchor", "end").attr("style", emojiStyle).text("🍂");
    
    // Lagging
    g.append("text").attr("x", 20).attr("y", innerHeight - 20).attr("text-anchor", "start").attr("style", labelStyle).text("LAGGING");
    g.append("text").attr("x", 20).attr("y", innerHeight - 50).attr("text-anchor", "start").attr("style", emojiStyle).text("❄️");
    
    // Improving
    g.append("text").attr("x", 20).attr("y", 30).attr("text-anchor", "start").attr("style", labelStyle).text("IMPROVING");
    g.append("text").attr("x", 20).attr("y", 80).attr("text-anchor", "start").attr("style", emojiStyle).text("💧");

    // Draw Snakes
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    data.sectors.forEach((sector: any, i: number) => {
      if (!visibleSectors.has(sector.symbol)) return;

      // Get data up to current date index
      const endIdx = currentDateIndex;
      const startIdx = Math.max(0, endIdx - tailLength);
      
      const pathData = sector.data.slice(startIdx, endIdx + 1);
      if (pathData.length === 0) return;

      const color = colorScale(i.toString());

      // Draw Tail segments with varying thickness
      for (let j = 0; j < pathData.length - 1; j++) {
        const d1 = pathData[j];
        const d2 = pathData[j + 1];
        
        // Tapering factor: 0 at tail start, 1 at head
        const taper1 = (j + 1) / pathData.length;
        const taper2 = (j + 2) / pathData.length;
        
        const r1 = (d1.radius || 4) * taper1;
        const r2 = (d2.radius || 4) * taper2;

        g.append("line")
          .attr("x1", xScale(d1.rsRatio))
          .attr("y1", yScale(d1.rsMomentum))
          .attr("x2", xScale(d2.rsRatio))
          .attr("y2", yScale(d2.rsMomentum))
          .attr("stroke", color)
          .attr("stroke-width", (r1 + r2))
          .attr("stroke-linecap", "round")
          .attr("opacity", 0.4 + (0.4 * taper2)); // Fade out towards tail
      }

      // Draw Head
      const head = pathData[pathData.length - 1];
      const headRadius = head.radius || 6;
      
      const headGroup = g.append("g")
        .style("cursor", "pointer")
        .on("click", () => {
          // Calculate change over the tail period
          const start = pathData[0];
          const mfChange = head.rawMoneyFlow - start.rawMoneyFlow;
          const mfPercent = start.rawMoneyFlow > 0 ? (mfChange / start.rawMoneyFlow) * 100 : 0;
          
          const analysis = analyzeSnakeMovement(sector.data, currentDateIndex);

          setSelectedSector({
            ...sector,
            current: head,
            mfChangePercent: mfPercent,
            analysis
          });
        });

      headGroup.append("circle")
        .attr("cx", xScale(head.rsRatio))
        .attr("cy", yScale(head.rsMomentum))
        .attr("r", headRadius * 1.5) // Make head slightly larger
        .attr("fill", color)
        .attr("stroke", theme === 'dark' ? '#fff' : '#000')
        .attr("stroke-width", 2)
        .attr("opacity", 1);

      // Add face (eyes and tongue)
      const prevPoint = pathData.length > 1 ? pathData[pathData.length - 2] : head;
      const dx = xScale(head.rsRatio) - xScale(prevPoint.rsRatio);
      const dy = yScale(head.rsMomentum) - yScale(prevPoint.rsMomentum);
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (dx === 0 && dy === 0) angle = 0;
      const visualSpeed = Math.sqrt(dx*dx + dy*dy);

      const faceGroup = headGroup.append("g")
        .attr("transform", `translate(${xScale(head.rsRatio)}, ${yScale(head.rsMomentum)}) rotate(${angle})`);

      // Tongue (length based on speed)
      const tongueLength = Math.min(25, Math.max(5, visualSpeed * 1.5));
      faceGroup.append("path")
        .attr("d", `M ${headRadius * 1.5},0 L ${headRadius * 1.5 + tongueLength},0 L ${headRadius * 1.5 + tongueLength + 3},-3 M ${headRadius * 1.5 + tongueLength},0 L ${headRadius * 1.5 + tongueLength + 3},3`)
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 1.5)
        .attr("fill", "none");

      // Eyes
      const eyeOffset = headRadius * 0.6;
      // Left eye
      faceGroup.append("circle").attr("cx", eyeOffset).attr("cy", -eyeOffset).attr("r", 2.5).attr("fill", "white");
      faceGroup.append("circle").attr("cx", eyeOffset + 0.5).attr("cy", -eyeOffset).attr("r", 1).attr("fill", "black");
      // Right eye
      faceGroup.append("circle").attr("cx", eyeOffset).attr("cy", eyeOffset).attr("r", 2.5).attr("fill", "white");
      faceGroup.append("circle").attr("cx", eyeOffset + 0.5).attr("cy", eyeOffset).attr("r", 1).attr("fill", "black");

      // Label at Head
      headGroup.append("text")
        .attr("x", xScale(head.rsRatio) + headRadius * 1.5 + 10)
        .attr("y", yScale(head.rsMomentum) + 4)
        .attr("fill", theme === 'dark' ? '#fff' : '#000')
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(sector.name);
    });

  }, [data, currentDateIndex, theme, tailLength, visibleSectors]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className={cn(
        "p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4",
        theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMarket('TH')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              market === 'TH' 
                ? (theme === 'dark' ? "bg-zinc-700 text-white" : "bg-zinc-900 text-white")
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            Thai Stocks (SET)
          </button>
          <button
            onClick={() => setMarket('US')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              market === 'US' 
                ? (theme === 'dark' ? "bg-zinc-700 text-white" : "bg-zinc-900 text-white")
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            US Stocks (S&P 500)
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Tail:</span>
            <input 
              type="range" 
              min="1" 
              max="30" 
              value={tailLength}
              onChange={(e) => setTailLength(parseInt(e.target.value))}
              className="w-24 accent-rose-500"
            />
            <span className="w-4">{tailLength}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDateIndex(0)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => setCurrentDateIndex(data?.dates.length - 1 || 0)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div 
            ref={containerRef}
            className={cn(
              "w-full rounded-2xl border relative overflow-hidden",
              theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                <RefreshCcw className="w-8 h-8 animate-spin text-rose-500" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm text-red-500 font-bold">
                {error}
              </div>
            )}
            <svg ref={svgRef} className="w-full h-[600px]" />
            
            {/* Date Display */}
            {data && data.dates[currentDateIndex] && (
              <div className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-black/50 text-white font-mono text-xl font-bold backdrop-blur-md">
                {new Date(data.dates[currentDateIndex]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}

            {/* Sector Detail Popup */}
            {selectedSector && (
              <div className="absolute top-4 right-4 w-80 p-4 rounded-xl bg-black/80 text-white backdrop-blur-md border border-white/10 shadow-2xl z-20">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{selectedSector.name}</h3>
                  <button onClick={() => setSelectedSector(null)} className="text-zinc-400 hover:text-white">✕</button>
                </div>
                <p className="text-xs text-zinc-300 mb-4">{selectedSector.symbol}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">RS-Ratio:</span>
                    <span className="font-mono">{selectedSector.current.rsRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">RS-Momentum:</span>
                    <span className="font-mono">{selectedSector.current.rsMomentum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Money Flow Change:</span>
                    <span className={cn("font-mono", selectedSector.mfChangePercent >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {selectedSector.mfChangePercent > 0 ? '+' : ''}{selectedSector.mfChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {selectedSector.analysis && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-xs font-bold text-zinc-400 mb-2">Analysis (15 Days)</h4>
                    <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {selectedSector.analysis.text}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/10">
                  <a 
                    href={market === 'TH' 
                      ? `https://www.set.or.th/en/market/index/set/${selectedSector.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`
                      : `https://finance.yahoo.com/quote/${selectedSector.symbol}/components`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    View Components ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Slider */}
          {data && (
            <div className={cn(
              "p-4 rounded-2xl border",
              theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <input 
                type="range" 
                min="0" 
                max={data.dates.length - 1} 
                value={currentDateIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentDateIndex(parseInt(e.target.value));
                }}
                className="w-full accent-rose-500"
              />
            </div>
          )}
        </div>

        {/* Sector Toggles Sidebar */}
        <div className={cn(
          "p-6 rounded-2xl border h-fit",
          theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
        )}>
          <h3 className={cn("text-sm font-bold uppercase tracking-widest mb-4", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
            Sectors
          </h3>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setVisibleSectors(new Set(sectors.map(s => s.symbol)))}
              className="text-xs text-left text-blue-500 hover:text-blue-600 mb-2"
            >
              Select All
            </button>
            <button 
              onClick={() => setVisibleSectors(new Set())}
              className="text-xs text-left text-rose-500 hover:text-rose-600 mb-4"
            >
              Deselect All
            </button>
            {sectors.map((sector, i) => {
              const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
              const color = colorScale(i.toString());
              const isVisible = visibleSectors.has(sector.symbol);
              
              return (
                <button
                  key={sector.symbol}
                  onClick={() => toggleSector(sector.symbol)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                    theme === 'dark' ? "hover:bg-zinc-800" : "hover:bg-zinc-100",
                    !isVisible && "opacity-50"
                  )}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: isVisible ? color : 'transparent', border: `2px solid ${color}` }}
                  />
                  <span className={cn("text-sm font-medium", theme === 'dark' ? "text-zinc-200" : "text-zinc-800")}>
                    {sector.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- RRG Math Helper ---
function analyzeSnakeMovement(sectorData: any[], currentIndex: number) {
  const lookback = 15;
  const startIdx = Math.max(0, currentIndex - lookback + 1);
  const points = sectorData.slice(startIdx, currentIndex + 1);
  
  if (points.length < 2) return { text: "ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์" };

  const start = points[0];
  const end = points[points.length - 1];
  
  const dx = end.rsRatio - start.rsRatio;
  const dy = end.rsMomentum - start.rsMomentum;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Speed
  let speedText = "ช้า (กำลังสะสมพลังหรือพักตัว)";
  if (distance > 8) speedText = "เร็วมาก (มีแรงเหวี่ยงสูง คึกคัก)";
  else if (distance > 4) speedText = "ปานกลาง";
  
  // Direction & Outlook
  let directionText = "";
  let outlookText = "";
  
  if (dx > 0 && dy > 0) {
    directionText = "มุ่งหน้าไปทางขวาบน (Leading)";
    outlookText = "ผลดีมาก (Positive) อุตสาหกรรมนี้กำลังแข็งแกร่งขึ้นและมีโมเมนตัมเชิงบวกชัดเจน";
  } else if (dx > 0 && dy < 0) {
    directionText = "มุ่งหน้าไปทางขวาล่าง (Weakening)";
    outlookText = "เริ่มอ่อนแรง (Mixed) ยังคงแข็งแกร่งกว่าตลาดแต่โมเมนตัมการขึ้นกำลังลดลง ควรระวังการพักตัว";
  } else if (dx < 0 && dy < 0) {
    directionText = "มุ่งหน้าไปทางซ้ายล่าง (Lagging)";
    outlookText = "ผลแย่ (Negative) อุตสาหกรรมนี้กำลังอ่อนแอกว่าตลาดและสูญเสียโมเมนตัมอย่างต่อเนื่อง";
  } else {
    directionText = "มุ่งหน้าไปทางซ้ายบน (Improving)";
    outlookText = "กำลังฟื้นตัว (Improving) โมเมนตัมเริ่มกลับมาเป็นบวก เป็นสัญญาณที่ดีแม้จะยังอ่อนแอกว่าตลาดรวม";
  }
  
  const getQuadrant = (r: number, m: number) => {
    if (r >= 100 && m >= 100) return "Leading (ผู้นำ)";
    if (r >= 100 && m < 100) return "Weakening (อ่อนแรง)";
    if (r < 100 && m < 100) return "Lagging (ตามหลัง)";
    return "Improving (ฟื้นตัว)";
  };
  
  const startQuad = getQuadrant(start.rsRatio, start.rsMomentum);
  const endQuad = getQuadrant(end.rsRatio, end.rsMomentum);
  
  let quadText = startQuad === endQuad 
    ? `วนเวียนอยู่ในโซน ${endQuad}` 
    : `เคลื่อนที่จากโซน ${startQuad} ไปยัง ${endQuad}`;

  return {
    text: `ในช่วง ${points.length} วันที่ผ่านมา งูตัวนี้${quadText} ${directionText} ด้วยความเร็ว${speedText}\n\nคาดการณ์: ${outlookText}`
  };
}

function processRRGData(benchData: any[], sectorResults: any[], sectors: any[]) {
  // 1. Align dates
  // Find common dates
  const dateMap = new Map<string, number>();
  benchData.forEach(d => dateMap.set(d.date.split('T')[0], d.close));

  const validSectors = sectorResults.map((res, i) => ({
    ...sectors[i],
    data: res?.data || []
  })).filter(s => s.data.length > 0);

  // Get last 6 months of trading days (approx 126 days)
  // Actually, we need more data for the moving averages (at least 14 days before the 6 months)
  // Let's just use all available aligned data and slice the last 130 days for the animation
  
  const alignedDates = benchData.map(d => d.date.split('T')[0]).slice(-150); // Take last 150 days

  const resultSectors = validSectors.map(sector => {
    // Map sector prices to aligned dates
    const prices = alignedDates.map(date => {
      const point = sector.data.find((d: any) => d.date.split('T')[0] === date);
      return point ? { close: point.close, volume: point.volume || 0 } : null;
    });

    // Fill missing prices with previous
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] === null && prices[i-1] !== null) {
        prices[i] = { ...prices[i-1]!, volume: 0 };
      }
    }

    // Calculate Relative Strength (RS) = Sector Price / Benchmark Price
    const rs = prices.map((p, i) => {
      const bPrice = dateMap.get(alignedDates[i]);
      if (p !== null && bPrice) return p.close / bPrice;
      return null;
    });

    // Calculate Money Flow (Price * Volume)
    const moneyFlows = prices.map(p => p !== null ? p.close * p.volume : 0);
    
    // Normalize Money Flow (e.g. 14-day SMA of Money Flow to smooth it out)
    const smoothedMoneyFlow = [];
    for (let i = 0; i < moneyFlows.length; i++) {
      if (i < RS_PERIOD - 1) {
        smoothedMoneyFlow.push(0);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < RS_PERIOD; j++) {
        sum += moneyFlows[i - j];
      }
      smoothedMoneyFlow.push(sum / RS_PERIOD);
    }

    // Find min/max of smoothed money flow for this sector to normalize radius
    let minMf = Infinity;
    let maxMf = -Infinity;
    smoothedMoneyFlow.forEach(mf => {
      if (mf > 0 && mf < minMf) minMf = mf;
      if (mf > maxMf) maxMf = mf;
    });

    // Calculate RS-Ratio (Normalized RS)
    // RS-Ratio = 100 + ((RS - SMA(RS, 14)) / StdDev(RS, 14)) + some scaling
    // A simpler approximation: RS-Ratio = 100 * (RS / SMA(RS, 14))
    const rsRatio = [];
    for (let i = 0; i < rs.length; i++) {
      if (i < RS_PERIOD - 1 || rs[i] === null) {
        rsRatio.push(null);
        continue;
      }
      let sum = 0;
      let valid = true;
      for (let j = 0; j < RS_PERIOD; j++) {
        if (rs[i - j] === null) {
          valid = false;
          break;
        }
        sum += rs[i - j]!;
      }
      if (!valid) {
        rsRatio.push(null);
        continue;
      }
      const sma = sum / RS_PERIOD;
      rsRatio.push(100 * (rs[i]! / sma));
    }

    // Calculate RS-Momentum = Rate of change of RS-Ratio
    // RS-Momentum = 100 * (RS-Ratio / SMA(RS-Ratio, 14))
    const rsMomentum = [];
    for (let i = 0; i < rsRatio.length; i++) {
      if (i < RS_PERIOD - 1 + MOMENTUM_PERIOD - 1 || rsRatio[i] === null) {
        rsMomentum.push(null);
        continue;
      }
      let sum = 0;
      let valid = true;
      for (let j = 0; j < MOMENTUM_PERIOD; j++) {
        if (rsRatio[i - j] === null) {
          valid = false;
          break;
        }
        sum += rsRatio[i - j]!;
      }
      if (!valid) {
        rsMomentum.push(null);
        continue;
      }
      const sma = sum / MOMENTUM_PERIOD;
      rsMomentum.push(100 * (rsRatio[i]! / sma));
    }

    // Combine
    const finalData = alignedDates.map((date, i) => {
      // Normalize radius between 3 and 12 based on money flow
      let normalizedRadius = 6;
      if (maxMf > minMf && smoothedMoneyFlow[i] > 0) {
        normalizedRadius = 3 + ((smoothedMoneyFlow[i] - minMf) / (maxMf - minMf)) * 9;
      }
      return {
        date,
        rsRatio: rsRatio[i],
        rsMomentum: rsMomentum[i],
        radius: normalizedRadius,
        rawMoneyFlow: smoothedMoneyFlow[i]
      };
    }).filter(d => d.rsRatio !== null && d.rsMomentum !== null);

    return {
      name: sector.name,
      symbol: sector.symbol,
      data: finalData
    };
  });

  // Find the common dates after filtering nulls
  const finalDates = resultSectors[0]?.data.map((d: any) => d.date) || [];

  return {
    dates: finalDates,
    sectors: resultSectors
  };
}
