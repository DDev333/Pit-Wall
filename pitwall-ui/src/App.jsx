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
    // Location & Event
    country: 'Netherlands',
    trackName: 'Circuit Zandvoort',
    sessionType: 'Grand Prix',

    // Race & Track State
    currentLap: 35,
    totalLaps: 70,
    weatherCondition: 'Dry',
    trackTemperature: 38.0,
    trackOvertakingDifficulty: 'Medium',
    safetyCarDeployed: false,

    // Car & Tyre Telemetry
    tireCompound: 'Medium',
    tireAge: 16,
    tyreDegradationRate: 'Medium',
    tyreWarmUpLaps: 1,
    lapTimeDelta: 0.2,
    driverTireManagementSkill: 'Elite',
    mandatoryCompoundFulfilled: true,

    // Competitor & Traffic Analysis
    gapToCarAhead: 1.8,
    gapToCarBehind: 4.2,
    currentAirState: 'Clean Air',
    projectedPitExitTraffic: 'Clean Air',
    rivalTireCompound: 'Hard',
    rivalHasPitted: false,

    // Pit Stop Operations
    pitLaneTimeLoss: 22.0,
    pitStopExecutionRisk: 'Low',
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
      ...telemetry,
      currentLap: parseInt(telemetry.currentLap, 10),
      totalLaps: parseInt(telemetry.totalLaps, 10),
      tireAge: parseInt(telemetry.tireAge, 10),
      tyreWarmUpLaps: parseInt(telemetry.tyreWarmUpLaps, 10),
      trackTemperature: parseFloat(telemetry.trackTemperature),
      lapTimeDelta: parseFloat(telemetry.lapTimeDelta),
      gapToCarAhead: parseFloat(telemetry.gapToCarAhead),
      gapToCarBehind: parseFloat(telemetry.gapToCarBehind),
      pitLaneTimeLoss: parseFloat(telemetry.pitLaneTimeLoss),
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/strategy';
      const response = await fetch(apiUrl, {
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

  const remainingLaps = Math.max(0, telemetry.totalLaps - telemetry.currentLap);
  const inputClass = "w-full bg-black/40 border border-slate-700 rounded-lg px-3 h-[42px] text-sm focus:border-red-500 focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 px-4 py-6 md:py-8 lg:px-8 max-w-[1400px] mx-auto">
      {/* HEADER */}
      <header className="flex flex-col items-center mb-6 md:mb-8 border-b border-slate-800 pb-4 md:pb-6 text-center">
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
          <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-600 animate-ping shrink-0"></span>
          <h1 className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 text-2xl md:text-3xl">
            PIT WALL INTELLIGENCE
          </h1>
        </div>
        <p className="text-[10px] md:text-xs text-slate-400 font-mono tracking-wider mt-2 uppercase">
          Dynamic Undercut / Overcut & Pit Window Strategy Engine
        </p>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* TELEMETRY INPUT PANEL */}
        <div className="lg:col-span-8 bg-[#161b22] border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-6">
          
          {/* CATEGORY 1: RACE & TRACK STATE */}
          <div className="bg-[#0d1117] border border-slate-800 p-4 sm:p-5 rounded-xl shadow-inner">
            <h3 className="text-xs font-bold text-sky-400 mb-4 border-b border-slate-800 pb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="text-lg">🌍</span> Race & Track State
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              {/* NEW ROW: Location & Session */}
              <div className="sm:col-span-1">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">COUNTRY</label>
                <input type="text" name="country" value={telemetry.country} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">TRACK NAME</label>
                <input type="text" name="trackName" value={telemetry.trackName} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-1">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">SESSION</label>
                <select name="sessionType" value={telemetry.sessionType} onChange={handleChange} className={inputClass}>
                  <option value="Grand Prix">Grand Prix</option>
                  <option value="Sprint">Sprint</option>
                  <option value="Qualifying">Qualifying (Q1-Q3)</option>
                  <option value="Sprint Qualifying">Sprint Qualifying (SQ)</option>
                  <option value="FP1">Free Practice 1</option>
                  <option value="FP2">Free Practice 2</option>
                  <option value="FP3">Free Practice 3</option>
                </select>
              </div>

              {/* EXISTING ROW: Lap Data & Weather */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">CURRENT LAP</label>
                <input type="number" name="currentLap" value={telemetry.currentLap} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">TOTAL LAPS</label>
                <input type="number" name="totalLaps" value={telemetry.totalLaps} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">WEATHER</label>
                <select name="weatherCondition" value={telemetry.weatherCondition} onChange={handleChange} className={inputClass}>
                  <option value="Dry">Dry</option>
                  <option value="Light Rain">Light Rain</option>
                  <option value="Heavy Rain">Heavy Rain</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">TRACK TEMP (°C)</label>
                <input type="number" step="0.1" name="trackTemperature" value={telemetry.trackTemperature} onChange={handleChange} className={inputClass} />
              </div>

              {/* EXISTING ROW: Overtaking & SC */}
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">OVERTAKING DIFF</label>
                <select name="trackOvertakingDifficulty" value={telemetry.trackOvertakingDifficulty} onChange={handleChange} className={inputClass}>
                  <option value="Low">Low (Monza/Spa)</option>
                  <option value="Medium">Medium (Silverstone)</option>
                  <option value="High">High (Monaco)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1 opacity-0">TOGGLE</label>
                <label className="w-full flex items-center gap-3 bg-black/40 border border-slate-700 rounded-lg px-3 h-[42px] cursor-pointer hover:border-amber-500/50 transition-colors">
                  <input type="checkbox" name="safetyCarDeployed" checked={telemetry.safetyCarDeployed} onChange={handleChange} className="w-5 h-5 accent-amber-500 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase">Safety Car (SC/VSC)</span>
                </label>
              </div>
            </div>
          </div>

          {/* CATEGORY 2: CAR & TYRE TELEMETRY */}
          <div className="bg-[#0d1117] border border-slate-800 p-4 sm:p-5 rounded-xl shadow-inner">
            <h3 className="text-xs font-bold text-emerald-400 mb-4 border-b border-slate-800 pb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="text-lg">🏎️</span> Car & Tyre Telemetry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">COMPOUND</label>
                <select name="tireCompound" value={telemetry.tireCompound} onChange={handleChange} className={inputClass}>
                  <option value="Soft">Soft</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Intermediate">Inter</option>
                  <option value="Wet">Wet</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">TYRE AGE</label>
                <input type="number" name="tireAge" value={telemetry.tireAge} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">DEG RATE</label>
                <select name="tyreDegradationRate" value={telemetry.tyreDegradationRate} onChange={handleChange} className={inputClass}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">WARM-UP (LAPS)</label>
                <input type="number" name="tyreWarmUpLaps" value={telemetry.tyreWarmUpLaps} onChange={handleChange} className={inputClass} />
              </div>

              <div className="sm:col-span-1">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">LAP DELTA (S)</label>
                <input type="number" step="0.1" name="lapTimeDelta" value={telemetry.lapTimeDelta} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">DRIVER SKILL</label>
                <select name="driverTireManagementSkill" value={telemetry.driverTireManagementSkill} onChange={handleChange} className={inputClass}>
                  <option value="Elite">Elite (+ Life)</option>
                  <option value="Standard">Standard</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="text-[10px] font-mono text-slate-400 block mb-1 opacity-0">TOGGLE</label>
                <label className="w-full flex items-center gap-3 bg-black/40 border border-slate-700 rounded-lg px-3 h-[42px] cursor-pointer hover:border-emerald-500/50 transition-colors">
                  <input type="checkbox" name="mandatoryCompoundFulfilled" checked={telemetry.mandatoryCompoundFulfilled} onChange={handleChange} className="w-5 h-5 accent-emerald-500 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Mandatory</span>
                </label>
              </div>
            </div>
          </div>

          {/* CATEGORY 3: COMPETITOR & TRAFFIC ANALYSIS */}
          <div className="bg-[#0d1117] border border-slate-800 p-4 sm:p-5 rounded-xl shadow-inner">
            <h3 className="text-xs font-bold text-amber-400 mb-4 border-b border-slate-800 pb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="text-lg">🎯</span> Competitor & Traffic Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">GAP AHEAD (S)</label>
                <input type="number" step="0.1" name="gapToCarAhead" value={telemetry.gapToCarAhead} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">GAP BEHIND (S)</label>
                <input type="number" step="0.1" name="gapToCarBehind" value={telemetry.gapToCarBehind} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">RIVAL COMPOUND</label>
                <select name="rivalTireCompound" value={telemetry.rivalTireCompound} onChange={handleChange} className={inputClass}>
                  <option value="Soft">Soft</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1 opacity-0">TOGGLE</label>
                <label className="w-full flex items-center gap-3 bg-black/40 border border-slate-700 rounded-lg px-3 h-[42px] cursor-pointer hover:border-sky-500/50 transition-colors">
                  <input type="checkbox" name="rivalHasPitted" checked={telemetry.rivalHasPitted} onChange={handleChange} className="w-5 h-5 accent-sky-500 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">Rival Pitted</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">CURRENT AIR STATE</label>
                <select name="currentAirState" value={telemetry.currentAirState} onChange={handleChange} className={inputClass}>
                  <option value="Clean Air">Clean Air</option>
                  <option value="Dirty Air">Dirty Air</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">PROJECTED EXIT TRAFFIC</label>
                <select name="projectedPitExitTraffic" value={telemetry.projectedPitExitTraffic} onChange={handleChange} className={inputClass}>
                  <option value="Clean Air">Clean Air</option>
                  <option value="DRS Train">DRS Train</option>
                </select>
              </div>
            </div>
          </div>

          {/* CATEGORY 4: PIT STOP OPERATIONS */}
          <div className="bg-[#0d1117] border border-slate-800 p-4 sm:p-5 rounded-xl shadow-inner">
            <h3 className="text-xs font-bold text-purple-400 mb-4 border-b border-slate-800 pb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="text-lg">⏱️</span> Pit Stop Operations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">PIT LOSS DELTA (S)</label>
                <input type="number" step="0.1" name="pitLaneTimeLoss" value={telemetry.pitLaneTimeLoss} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">STATIONARY EXECUTION RISK</label>
                <select name="pitStopExecutionRisk" value={telemetry.pitStopExecutionRisk} onChange={handleChange} className={inputClass}>
                  <option value="Low">Low (Nominal 2.4s)</option>
                  <option value="Medium">Medium (Potential delay)</option>
                  <option value="High">High (High risk of slow stop)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleCalculateStrategy}
            disabled={loading}
            className="mt-2 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold text-sm sm:text-base tracking-wider uppercase rounded-lg shadow-lg py-4 transition duration-150 cursor-pointer"
          >
            {loading ? 'Evaluating Tactical Model...' : 'Calculate Pit Strategy'}
          </button>
        </div>

        {/* VISUAL GAUGES & STRATEGY OUTPUT */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* TIRE WEAR & TACTICAL GAUGES */}
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
              <span>{telemetry.tireAge} / {maxLaps} Laps ({remainingLaps} to go)</span>
            </div>

            {/* UNDERCUT / OVERCUT TACTICAL DELTAS */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-3 text-[10px] sm:text-xs">
              <div className="flex justify-between items-center bg-[#0d1117] p-2 rounded border border-slate-800">
                <span className="text-slate-400">Undercut Window:</span>
                <span className={`font-mono font-bold ${telemetry.gapToCarAhead <= 2.5 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
                  {telemetry.gapToCarAhead <= 2.5 ? 'VIABLE (< 2.5s)' : 'NO THREAT'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-[#0d1117] p-2 rounded border border-slate-800">
                <span className="text-slate-400">Overcut Potential:</span>
                <span className={`font-mono font-bold ${telemetry.rivalHasPitted && telemetry.currentAirState === 'Clean Air' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {telemetry.rivalHasPitted && telemetry.currentAirState === 'Clean Air' ? 'HIGH (Clean Air)' : 'LOW'}
                </span>
              </div>
            </div>
          </div>

          {/* AI DECISION & EXPLANATION CONTAINER */}
          <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl flex-1 flex flex-col justify-center">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg text-red-300 text-[10px] sm:text-xs font-mono break-words mb-4">
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="text-center text-slate-500 py-6 sm:py-8">
                <div className="text-2xl sm:text-3xl mb-2">⚡</div>
                <p className="text-[10px] sm:text-xs font-mono px-2">
                  Awaiting race parameters to compute optimal stop window.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div
                  className={`text-center py-4 rounded-lg font-black text-xl tracking-widest border uppercase shadow-lg ${
                    result.decision === 'Box'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {result.decision === 'Box' ? 'BOX BOX' : 'STAY OUT'}
                </div>

                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase block mb-1">
                    Tactical Reasoning
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-[#0d1117] p-4 rounded-lg border border-slate-800">
                    {result.reasoning}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase block mb-1">
                    Telemetry Reference
                  </span>
                  <p className="text-[10px] font-mono text-sky-400 bg-sky-950/20 p-3 rounded-lg border border-sky-900/50 break-words">
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