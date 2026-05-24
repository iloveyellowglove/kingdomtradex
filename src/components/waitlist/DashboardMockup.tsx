export default function DashboardMockup() {
  return (
    <div className="card overflow-hidden" style={{
      border: '1px solid #352c4a',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(106,13,173,0.15)',
    }}>
      {/* Mock browser bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#0d0b18', borderBottom: '1px solid #261f3a' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ff5252' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#FFD700' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#00c853' }} />
        </div>
        <div className="flex-1 mx-4 rounded-lg px-3 py-1.5 text-xs text-text-muted" style={{ background: '#0e0b1a', border: '1px solid #261f3a' }}>
          app.kingdomtradex.com/dashboard
        </div>
      </div>

      {/* Mock dashboard content */}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-5 w-32 rounded" style={{ background: '#1c1635' }} />
            <div className="h-3 w-48 rounded mt-1" style={{ background: '#151025' }} />
          </div>
          <div className="h-8 w-20 rounded-lg" style={{ background: 'linear-gradient(135deg, #FFD700, #c9a800)' }} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: '#151025', border: '1px solid #261f3a' }}>
              <div className="h-3 w-16 rounded" style={{ background: '#1c1635' }} />
              <div className="h-7 w-24 rounded mt-2" style={{ background: 'linear-gradient(135deg, #FFD700, #c9a800)' }} />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="rounded-xl p-4" style={{ background: '#151025', border: '1px solid #261f3a' }}>
          <div className="h-4 w-24 rounded mb-3" style={{ background: '#1c1635' }} />
          <div className="h-40 rounded-lg flex items-end gap-2 px-2">
            {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 50, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  background: `linear-gradient(to top, rgba(255,215,0,0.5), rgba(255,215,0,0.15))`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Table rows */}
        <div className="rounded-xl" style={{ background: '#151025', border: '1px solid #261f3a' }}>
          <div className="flex p-3" style={{ borderBottom: '1px solid #261f3a' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 rounded flex-1 mx-1" style={{ background: '#1c1635' }} />
            ))}
          </div>
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex p-3" style={{ borderBottom: '1px solid #151025' }}>
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className="h-3 rounded flex-1 mx-1" style={{ background: '#0e0b1a' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
