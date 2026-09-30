import React, { useState, useEffect } from 'react';
import { ShieldAlert, Globe, AlertOctagon, Lock } from 'lucide-react';

interface JurisdictionGuardProps {
  children: React.ReactNode;
}

// List of ISO 3166 restricted region codes / timezones
const RESTRICTED_TIMEZONES = [
  'America/Havana',
  'Asia/Tehran',
  'Asia/Pyongyang',
  'Asia/Damascus',
  'Europe/Simferopol',
];

export const JurisdictionGuard: React.FC<JurisdictionGuardProps> = ({ children }) => {
  const [isRestricted, setIsRestricted] = useState(false);
  const [userRegion, setUserRegion] = useState<string>('Detecting...');
  const [overrideAllowed, setOverrideAllowed] = useState<boolean>(() => {
    // Check developer override in localStorage if set
    return localStorage.getItem('solstice_geo_override') === 'true';
  });

  useEffect(() => {
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      setUserRegion(userTz);

      // Check timezone compliance
      const matchesRestrictedTz = RESTRICTED_TIMEZONES.some((tz) =>
        userTz.toLowerCase().includes(tz.toLowerCase())
      );

      if (matchesRestrictedTz && !overrideAllowed) {
        setIsRestricted(true);
      }
    } catch {
      setUserRegion('Standard Region');
    }
  }, [overrideAllowed]);

  const toggleDevOverride = () => {
    const next = !overrideAllowed;
    setOverrideAllowed(next);
    localStorage.setItem('solstice_geo_override', String(next));
    if (next) {
      setIsRestricted(false);
    }
  };

  if (isRestricted && !overrideAllowed) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#060813] flex items-center justify-center p-6 text-slate-100 font-mono">
        <div className="w-full max-w-lg rounded-3xl bg-slate-900/95 border-2 border-red-500/80 p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950 border border-red-500 flex items-center justify-center text-red-500 shadow-xl shadow-red-950">
            <AlertOctagon className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black font-display text-white tracking-wide uppercase">
              Service Unavailable in Your Jurisdiction
            </h1>
            <p className="text-xs text-red-300 font-mono leading-relaxed">
              Solstice Roulette access is restricted in your geographic region due to international compliance, gaming regulations, and sanctions policies.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-2 text-slate-400">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span>Detected Timezone / Metadata:</span>
              <span className="text-red-400 font-bold">{userRegion}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span>Compliance Status:</span>
              <span className="text-red-400 font-bold uppercase">Restricted Region</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Policy Reference:</span>
              <span className="text-slate-300">AML/CFT Geo-Fencing V5.0</span>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 flex flex-col gap-2">
            <span>If you believe this restriction is an error or are a compliance auditor:</span>
            <button
              onClick={toggleDevOverride}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-colors mx-auto inline-flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enable Developer Compliance Bypass</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
