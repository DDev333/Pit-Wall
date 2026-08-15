import React, { useState } from 'react';

const COMPOUND_LIMITS = { Soft: 15, Medium: 25, Hard: 40, Intermediate: 30, Wet: 35 };
const COMPOUND_COLORS = {
  Soft: 'border-red-500 text-red-400',
  Medium: 'border-yellow-400 text-yellow-300',
  Hard: 'border-slate-200 text-slate-100',
  Intermediate: 'border-emerald-500 text-emerald-400',
  Wet: 'border-blue-500 text-blue-400',
};

export default function App() {
  const [telemetry, setTelemetry] = useState({
    currentLap: 35,
    tireAge: 16,
    safetyCarDeployed: false,
    tireCompound: 'Medium',
    weatherCondition: 'Dry',
    gapToCarBehind: 1.8,
    projectedPitExitTraffic: 'Clean Air',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const maxLaps = COMPOUND_LIMITS[telemetry.tireCompound] || 25;
  const wearPercentage = Math.max(0, Math.min(100, Math.round(((maxLaps - telemetry.tireAge) / maxLaps) * 100)));

  const getTireHealthColor = () => {
    if (wearPercentage > 50) return 'bg-emerald-500';
    if (wearPercentage > 20) return 'bg-amber-500';
    return 'bg-red-600 animate-pulse';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTelemetry((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCalculateStrategy = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      currentLap: parseInt(telemetry.currentLap, 10),
      tireAge: parseInt(telemetry.tireAge, 10),
      safetyCarDeployed: telemetry.safetyCarDeployed,
      tireCompound: telemetry.tireCompound,
      weatherCondition: telemetry.weatherCondition,
      gapToCarBehind: parseFloat(telemetry.gapToCarBehind),
      projectedPitExitTraffic: telemetry.projectedPitExitTraffic,
    };

    try {
      const response = await fetch('http://localhost:8080/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Strategy backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 px-4 py-6 md:py-8 lg:px-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <header className="flex flex-col items-center mb-6 md:mb-10 border-b border-slate-800 pb-4 md:pb-6 text-center">
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
          <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-600 animate-ping shrink-0"></span>
          <h1 className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
            PIT WALL INTELLIGENCE
          </h1>
        </div>
        <p className="text-[10px] md:text-xs text-slate-400 font-mono tracking-wider mt-2 uppercase">
          Gemini 2.5 Strategic Telemetry Engine
        </p>
      </header>

      {/* MAIN GRID */}
      {/* Mobile: 1 column. Desktop: 12 columns (7 for inputs, 5 for outputs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* TELEMETRY INPUT PANEL */}
        <div className="lg:col-span-7 bg-[#161b22] border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-5">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wider uppercase border-b border-slate-800 pb-2">
            Live Telemetry Adjustments
          </h2>

          {/* Inner Form Grid: 1 column on mobile, 2 on sm screens and up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] sm:text-xs font-mono text-slate-400 block mb-1">CURRENT LAP</label>
              <input
                type="number"
                name="currentLap"
                value={telemetry.currentLap}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-mono text-slate-400 block mb-1">TIRE AGE (LAPS)</label>
              <input
                type="number"
                name="tireAge"
                value={telemetry.tireAge}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] sm:text-xs font-mono text-slate-400 block mb-1">COMPOUND</label>
              <select
                name="tireCompound"
                value={telemetry.tireCompound}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              >
                <option value="Soft">Soft (C3/C4)</option>
                <option value="Medium">Medium (C2/C3)</option>
                <option value="Hard">Hard (C1/C2)</option>
                <option value="Intermediate">Intermediate (Crest)</option>
                <option value="Wet">Full Wet (Grooved)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-mono text-slate-400 block mb-1">WEATHER CONDITION</label>
              <select
                name="weatherCondition"
                value={telemetry.weatherCondition}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              >
                <option value="Dry">Dry (Track Temp 38°C)</option>
                <option value="Light Rain">Light Rain (Damp Track)</option>
                <option value="Heavy Rain">Heavy Rain (Standing Water)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] sm:text-xs font-mono text-slate-400 block mb-1">GAP TO BEHIND (SEC)</label>
              <input
                type="number"
                step="0.1"
                name="gapToCarBehind"
                value={telemetry.gapToCarBehind}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-mono text-slate-400 block mb-1">PROJECTED PIT EXIT</label>
              <select
                name="projectedPitExitTraffic"
                value={telemetry.projectedPitExitTraffic}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              >
                <option value="Clean Air">Clean Air (+2.5s window)</option>
                <option value="DRS Train">DRS Train (Heavy Traffic)</option>
              </select>
            </div>
          </div>

          {/* TOGGLE FOR SAFETY CAR */}
          <label className="flex items-center gap-3 bg-[#0d1117] border border-slate-800 p-3 sm:p-4 rounded-lg cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              name="safetyCarDeployed"
              checked={telemetry.safetyCarDeployed}
              onChange={handleChange}
              className="w-5 h-5 accent-amber-500 shrink-0"
            />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-amber-400 uppercase leading-snug">
              Safety Car Deployed (SC / VSC)
            </span>
          </label>

          <button
            onClick={handleCalculateStrategy}
            disabled={loading}
            className="mt-2 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold text-sm sm:text-base tracking-wider uppercase rounded-lg shadow-lg transition duration-150 cursor-pointer"
          >
            {loading ? 'Processing...' : 'Calculate Pit Strategy'}
          </button>
        </div>

        {/* VISUAL GAUGES & STRATEGY OUTPUT */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* TIRE WEAR GAUGE CARD */}
          <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl">
            <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase">Compound Degradation</span>
              <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded border ${COMPOUND_COLORS[telemetry.tireCompound]}`}>
                {telemetry.tireCompound}
              </span>
            </div>

            <div className="w-full bg-[#0d1117] h-3 rounded-full overflow-hidden mb-2 border border-slate-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${getTireHealthColor()}`}
                style={{ width: `${wearPercentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[10px] sm:text-xs font-mono text-slate-400">
              <span>Health: {wearPercentage}%</span>
              <span>{telemetry.tireAge} / {maxLaps} Laps</span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-[10px] sm:text-xs gap-2">
              <span className="text-slate-400">Undercut Threat:</span>
              <span
                className={`font-mono font-bold ${
                  telemetry.gapToCarBehind < 2.0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {telemetry.gapToCarBehind < 2.0 ? 'CRITICAL (< 2.0s)' : 'SAFE (> 2.0s)'}
              </span>
            </div>
          </div>

          {/* AI OUTPUT CONTAINER */}
          <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl flex-1 flex flex-col justify-center">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg text-red-300 text-[10px] sm:text-xs font-mono break-words">
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="text-center text-slate-500 py-6 sm:py-8">
                <div className="text-2xl sm:text-3xl mb-2">⚡</div>
                <p className="text-[10px] sm:text-xs font-mono px-4">
                  Awaiting telemetry inputs to compute strategic call.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div
                  className={`text-center py-3 sm:py-4 rounded-lg font-black text-lg sm:text-xl tracking-widest border uppercase shadow-lg ${
                    result.decision === 'Box'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {result.decision === 'Box' ? 'BOX BOX THIS LAP' : 'STAY OUT — MAINTAIN PACE'}
                </div>

                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase block mb-1">Tactical Rationale</span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#0d1117] p-3 sm:p-4 rounded-lg border border-slate-800">
                    {result.reasoning}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase block mb-1">Telemetry Reference</span>
                  <p className="text-[10px] sm:text-xs font-mono text-sky-400 bg-[#0d1117] p-3 rounded-lg border border-slate-800 break-words">
                    {result.foundryCitation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}